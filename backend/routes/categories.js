// Categories routes
import express from 'express';
import { db } from '../config/database.js';
import { validateRequired } from '../middleware/validation.js';

const router = express.Router();

// Get all categories for user
router.get('/', (req, res) => {
  const userId = req.user.id;

  db.all(
    'SELECT * FROM categories WHERE user_id = ? ORDER BY name',
    [userId],
    (err, categories) => {
      if (err) {
        console.error('Database error:', err);
        return res.status(500).json({ error: 'Failed to fetch categories' });
      }

      res.json(categories);
    }
  );
});

// Get categories by type
router.get('/type/:type', (req, res) => {
  const { type } = req.params;
  const userId = req.user.id;

  if (!['income', 'expense'].includes(type)) {
    return res.status(400).json({ error: 'Invalid category type' });
  }

  db.all(
    'SELECT * FROM categories WHERE user_id = ? AND type = ? ORDER BY name',
    [userId, type],
    (err, categories) => {
      if (err) {
        console.error('Database error:', err);
        return res.status(500).json({ error: 'Failed to fetch categories' });
      }

      res.json(categories);
    }
  );
});

// Get single category
router.get('/:id', (req, res) => {
  const categoryId = req.params.id;
  const userId = req.user.id;

  db.get(
    'SELECT * FROM categories WHERE id = ? AND user_id = ?',
    [categoryId, userId],
    (err, category) => {
      if (err) {
        console.error('Database error:', err);
        return res.status(500).json({ error: 'Failed to fetch category' });
      }

      if (!category) {
        return res.status(404).json({ error: 'Category not found' });
      }

      res.json(category);
    }
  );
});

// Create new category
router.post('/',
  validateRequired(['name', 'type']),
  (req, res) => {
    const { name, type } = req.body;
    const userId = req.user.id;

    if (!['income', 'expense'].includes(type)) {
      return res.status(400).json({ error: 'Invalid category type. Must be "income" or "expense"' });
    }

    // Check if category already exists for this user
    db.get(
      'SELECT id FROM categories WHERE user_id = ? AND name = ? AND type = ?',
      [userId, name, type],
      (err, existingCategory) => {
        if (err) {
          console.error('Database error:', err);
          return res.status(500).json({ error: 'Database error' });
        }

        if (existingCategory) {
          return res.status(400).json({ error: 'Category already exists' });
        }

        // Insert new category
        db.run(
          'INSERT INTO categories (user_id, name, type) VALUES (?, ?, ?)',
          [userId, name, type],
          function(err) {
            if (err) {
              console.error('Database error:', err);
              return res.status(500).json({ error: 'Failed to create category' });
            }

            res.status(201).json({
              message: 'Category created successfully',
              category: { id: this.lastID, name, type }
            });
          }
        );
      }
    );
  }
);

// Update category
router.put('/:id', (req, res) => {
  const categoryId = req.params.id;
  const userId = req.user.id;
  const { name, type } = req.body;

  // Validate type if provided
  if (type && !['income', 'expense'].includes(type)) {
    return res.status(400).json({ error: 'Invalid category type. Must be "income" or "expense"' });
  }

  db.run(
    'UPDATE categories SET name = COALESCE(?, name), type = COALESCE(?, type) WHERE id = ? AND user_id = ?',
    [name, type, categoryId, userId],
    function(err) {
      if (err) {
        console.error('Database error:', err);
        return res.status(500).json({ error: 'Failed to update category' });
      }

      if (this.changes === 0) {
        return res.status(404).json({ error: 'Category not found' });
      }

      res.json({ message: 'Category updated successfully' });
    }
  );
});

// Delete category
router.delete('/:id', (req, res) => {
  const categoryId = req.params.id;
  const userId = req.user.id;

  // Check if category is being used in transactions
  db.get(
    'SELECT COUNT(*) as count FROM transactions WHERE user_id = ? AND category = (SELECT name FROM categories WHERE id = ? AND user_id = ?)',
    [userId, categoryId, userId],
    (err, result) => {
      if (err) {
        console.error('Database error:', err);
        return res.status(500).json({ error: 'Database error' });
      }

      if (result.count > 0) {
        return res.status(400).json({ 
          error: 'Cannot delete category. It is being used in transactions.' 
        });
      }

      // Delete category
      db.run(
        'DELETE FROM categories WHERE id = ? AND user_id = ?',
        [categoryId, userId],
        function(err) {
          if (err) {
            console.error('Database error:', err);
            return res.status(500).json({ error: 'Failed to delete category' });
          }

          if (this.changes === 0) {
            return res.status(404).json({ error: 'Category not found' });
          }

          res.json({ message: 'Category deleted successfully' });
        }
      );
    }
  );
});

// Get category usage statistics
router.get('/:id/usage', (req, res) => {
  const categoryId = req.params.id;
  const userId = req.user.id;

  // Get category name
  db.get(
    'SELECT name FROM categories WHERE id = ? AND user_id = ?',
    [categoryId, userId],
    (err, category) => {
      if (err) {
        console.error('Database error:', err);
        return res.status(500).json({ error: 'Database error' });
      }

      if (!category) {
        return res.status(404).json({ error: 'Category not found' });
      }

      // Get transaction statistics
      db.all(
        'SELECT COUNT(*) as transaction_count, SUM(amount) as total_amount, AVG(amount) as avg_amount FROM transactions WHERE user_id = ? AND category = ?',
        [userId, category.name],
        (err, stats) => {
          if (err) {
            console.error('Database error:', err);
            return res.status(500).json({ error: 'Failed to fetch usage statistics' });
          }

          const usageStats = stats[0];
          res.json({
            category: category.name,
            transactionCount: usageStats.transaction_count || 0,
            totalAmount: usageStats.total_amount || 0,
            averageAmount: usageStats.avg_amount || 0
          });
        }
      );
    }
  );
});

export default router;
