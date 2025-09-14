// Budgets routes
import express from 'express';
import { db } from '../config/database.js';
import { validateRequired, validateNumeric } from '../middleware/validation.js';

const router = express.Router();

// Get all budgets for user
router.get('/', (req, res) => {
  const userId = req.user.id;

  db.all(
    'SELECT b.*, c.name as category_name, c.type as category_type FROM budgets b JOIN categories c ON b.category_id = c.id WHERE b.user_id = ? ORDER BY b.year DESC, b.month DESC',
    [userId],
    (err, budgets) => {
      if (err) {
        console.error('Database error:', err);
        return res.status(500).json({ error: 'Failed to fetch budgets' });
      }

      res.json(budgets);
    }
  );
});

// Get budgets for specific month/year
router.get('/:year/:month', (req, res) => {
  const { year, month } = req.params;
  const userId = req.user.id;

  db.all(
    'SELECT b.*, c.name as category_name, c.type as category_type FROM budgets b JOIN categories c ON b.category_id = c.id WHERE b.user_id = ? AND b.year = ? AND b.month = ?',
    [userId, year, month],
    (err, budgets) => {
      if (err) {
        console.error('Database error:', err);
        return res.status(500).json({ error: 'Failed to fetch budgets' });
      }

      res.json(budgets);
    }
  );
});

// Get single budget
router.get('/:id', (req, res) => {
  const budgetId = req.params.id;
  const userId = req.user.id;

  db.get(
    'SELECT b.*, c.name as category_name, c.type as category_type FROM budgets b JOIN categories c ON b.category_id = c.id WHERE b.id = ? AND b.user_id = ?',
    [budgetId, userId],
    (err, budget) => {
      if (err) {
        console.error('Database error:', err);
        return res.status(500).json({ error: 'Failed to fetch budget' });
      }

      if (!budget) {
        return res.status(404).json({ error: 'Budget not found' });
      }

      res.json(budget);
    }
  );
});

// Create new budget
router.post('/',
  validateRequired(['category_id', 'amount', 'month', 'year']),
  validateNumeric(['amount', 'month', 'year']),
  (req, res) => {
    const { category_id, amount, month, year } = req.body;
    const userId = req.user.id;

    // Validate month and year
    if (month < 1 || month > 12) {
      return res.status(400).json({ error: 'Invalid month. Must be between 1 and 12' });
    }

    if (year < 2000 || year > 2100) {
      return res.status(400).json({ error: 'Invalid year' });
    }

    // Check if category belongs to user
    db.get(
      'SELECT id FROM categories WHERE id = ? AND user_id = ?',
      [category_id, userId],
      (err, category) => {
        if (err) {
          console.error('Database error:', err);
          return res.status(500).json({ error: 'Database error' });
        }

        if (!category) {
          return res.status(400).json({ error: 'Category not found' });
        }

        // Check if budget already exists for this category and month/year
        db.get(
          'SELECT id FROM budgets WHERE user_id = ? AND category_id = ? AND month = ? AND year = ?',
          [userId, category_id, month, year],
          (err, existingBudget) => {
            if (err) {
              console.error('Database error:', err);
              return res.status(500).json({ error: 'Database error' });
            }

            if (existingBudget) {
              return res.status(400).json({ error: 'Budget already exists for this category and month' });
            }

            // Insert new budget
            db.run(
              'INSERT INTO budgets (user_id, category_id, amount, month, year) VALUES (?, ?, ?, ?, ?)',
              [userId, category_id, amount, month, year],
              function(err) {
                if (err) {
                  console.error('Database error:', err);
                  return res.status(500).json({ error: 'Failed to create budget' });
                }

                res.status(201).json({
                  message: 'Budget created successfully',
                  budget: { id: this.lastID, category_id, amount, month, year }
                });
              }
            );
          }
        );
      }
    );
  }
);

// Update budget
router.put('/:id',
  validateNumeric(['amount', 'month', 'year']),
  (req, res) => {
    const budgetId = req.params.id;
    const userId = req.user.id;
    const { amount, month, year } = req.body;

    // Validate month and year if provided
    if (month && (month < 1 || month > 12)) {
      return res.status(400).json({ error: 'Invalid month. Must be between 1 and 12' });
    }

    if (year && (year < 2000 || year > 2100)) {
      return res.status(400).json({ error: 'Invalid year' });
    }

    db.run(
      'UPDATE budgets SET amount = COALESCE(?, amount), month = COALESCE(?, month), year = COALESCE(?, year) WHERE id = ? AND user_id = ?',
      [amount, month, year, budgetId, userId],
      function(err) {
        if (err) {
          console.error('Database error:', err);
          return res.status(500).json({ error: 'Failed to update budget' });
        }

        if (this.changes === 0) {
          return res.status(404).json({ error: 'Budget not found' });
        }

        res.json({ message: 'Budget updated successfully' });
      }
    );
  }
);

// Delete budget
router.delete('/:id', (req, res) => {
  const budgetId = req.params.id;
  const userId = req.user.id;

  db.run(
    'DELETE FROM budgets WHERE id = ? AND user_id = ?',
    [budgetId, userId],
    function(err) {
      if (err) {
        console.error('Database error:', err);
        return res.status(500).json({ error: 'Failed to delete budget' });
      }

      if (this.changes === 0) {
        return res.status(404).json({ error: 'Budget not found' });
      }

      res.json({ message: 'Budget deleted successfully' });
    }
  );
});

// Get budget vs actual spending
router.get('/:id/analysis', (req, res) => {
  const budgetId = req.params.id;
  const userId = req.user.id;

  // Get budget details
  db.get(
    'SELECT b.*, c.name as category_name FROM budgets b JOIN categories c ON b.category_id = c.id WHERE b.id = ? AND b.user_id = ?',
    [budgetId, userId],
    (err, budget) => {
      if (err) {
        console.error('Database error:', err);
        return res.status(500).json({ error: 'Database error' });
      }

      if (!budget) {
        return res.status(404).json({ error: 'Budget not found' });
      }

      // Get actual spending for the budget period
      const startDate = `${budget.year}-${budget.month.toString().padStart(2, '0')}-01`;
      const endDate = `${budget.year}-${budget.month.toString().padStart(2, '0')}-31`;

      db.get(
        'SELECT SUM(amount) as total_spent FROM transactions WHERE user_id = ? AND category = ? AND date BETWEEN ? AND ?',
        [userId, budget.category_name, startDate, endDate],
        (err, spending) => {
          if (err) {
            console.error('Database error:', err);
            return res.status(500).json({ error: 'Failed to fetch spending data' });
          }

          const totalSpent = spending.total_spent || 0;
          const budgetAmount = budget.amount;
          const difference = budgetAmount - totalSpent;
          const percentageUsed = budgetAmount > 0 ? (totalSpent / budgetAmount) * 100 : 0;

          res.json({
            budget: {
              id: budget.id,
              category: budget.category_name,
              amount: budgetAmount,
              month: budget.month,
              year: budget.year
            },
            actual: {
              spent: totalSpent,
              remaining: difference,
              percentageUsed: Math.round(percentageUsed * 100) / 100
            },
            status: difference >= 0 ? 'under_budget' : 'over_budget'
          });
        }
      );
    }
  );
});

export default router;
