// Targets routes
import express from 'express';
import { v4 as uuidv4 } from 'uuid';
import { db } from '../config/database.js';
import { validateRequired, validateNumeric } from '../middleware/validation.js';

const router = express.Router();

// Get all targets for user
router.get('/', (req, res) => {
  const userId = req.user.id;

  db.all(
    'SELECT * FROM targets WHERE user_id = ? ORDER BY created_at DESC',
    [userId],
    (err, targets) => {
      if (err) {
        console.error('Database error:', err);
        return res.status(500).json({ error: 'Failed to fetch targets' });
      }

      // Get action steps for each target
      const targetsWithSteps = targets.map(target => {
        return new Promise((resolve) => {
          db.all(
            'SELECT * FROM action_steps WHERE target_id = ? ORDER BY step_number',
            [target.id],
            (err, steps) => {
              if (err) {
                console.error('Error fetching action steps:', err);
                resolve({ ...target, actionSteps: [] });
              } else {
                resolve({ ...target, actionSteps: steps });
              }
            }
          );
        });
      });

      Promise.all(targetsWithSteps).then(targetsWithStepsData => {
        res.json(targetsWithStepsData);
      });
    }
  );
});

// Get single target
router.get('/:id', (req, res) => {
  const targetId = req.params.id;
  const userId = req.user.id;

  db.get(
    'SELECT * FROM targets WHERE id = ? AND user_id = ?',
    [targetId, userId],
    (err, target) => {
      if (err) {
        console.error('Database error:', err);
        return res.status(500).json({ error: 'Failed to fetch target' });
      }

      if (!target) {
        return res.status(404).json({ error: 'Target not found' });
      }

      // Get action steps
      db.all(
        'SELECT * FROM action_steps WHERE target_id = ? ORDER BY step_number',
        [targetId],
        (err, steps) => {
          if (err) {
            console.error('Error fetching action steps:', err);
            return res.status(500).json({ error: 'Failed to fetch action steps' });
          }

          res.json({ ...target, actionSteps: steps });
        }
      );
    }
  );
});

// Create new target
router.post('/',
  validateRequired(['title', 'target_amount']),
  validateNumeric(['target_amount']),
  (req, res) => {
    const { title, description, target_amount, target_date, actionSteps } = req.body;
    const userId = req.user.id;

    db.run(
      'INSERT INTO targets (user_id, title, description, target_amount, target_date) VALUES (?, ?, ?, ?, ?)',
      [userId, title, description || null, target_amount, target_date || null],
      function(err) {
        if (err) {
          console.error('Database error:', err);
          return res.status(500).json({ error: 'Failed to create target' });
        }

        const targetId = this.lastID;

        // Insert action steps if provided
        if (actionSteps && actionSteps.length > 0) {
          const stepPromises = actionSteps.map((step, index) => {
            return new Promise((resolve, reject) => {
              const stepId = uuidv4();
              db.run(
                'INSERT INTO action_steps (id, target_id, step_number, description, amount) VALUES (?, ?, ?, ?, ?)',
                [stepId, targetId, index + 1, step.description, step.amount || 0],
                (err) => {
                  if (err) {
                    console.error('Error inserting action step:', err);
                    reject(err);
                  } else {
                    resolve();
                  }
                }
              );
            });
          });

          Promise.all(stepPromises).then(() => {
            res.status(201).json({
              message: 'Target created successfully',
              target: { id: targetId, title, target_amount }
            });
          }).catch(err => {
            console.error('Error creating action steps:', err);
            res.status(500).json({ error: 'Target created but failed to create action steps' });
          });
        } else {
          res.status(201).json({
            message: 'Target created successfully',
            target: { id: targetId, title, target_amount }
          });
        }
      }
    );
  }
);

// Update target
router.put('/:id',
  validateNumeric(['target_amount', 'current_amount']),
  (req, res) => {
    const targetId = req.params.id;
    const userId = req.user.id;
    const { title, description, target_amount, current_amount, target_date } = req.body;

    db.run(
      'UPDATE targets SET title = COALESCE(?, title), description = COALESCE(?, description), target_amount = COALESCE(?, target_amount), current_amount = COALESCE(?, current_amount), target_date = COALESCE(?, target_date) WHERE id = ? AND user_id = ?',
      [title, description, target_amount, current_amount, target_date, targetId, userId],
      function(err) {
        if (err) {
          console.error('Database error:', err);
          return res.status(500).json({ error: 'Failed to update target' });
        }

        if (this.changes === 0) {
          return res.status(404).json({ error: 'Target not found' });
        }

        res.json({ message: 'Target updated successfully' });
      }
    );
  }
);

// Update target progress
router.put('/:id/progress', (req, res) => {
  const targetId = req.params.id;
  const userId = req.user.id;
  const { currentAmount } = req.body;

  if (currentAmount === undefined || isNaN(currentAmount)) {
    return res.status(400).json({ error: 'Invalid current amount' });
  }

  db.run(
    'UPDATE targets SET current_amount = ? WHERE id = ? AND user_id = ?',
    [currentAmount, targetId, userId],
    function(err) {
      if (err) {
        console.error('Database error:', err);
        return res.status(500).json({ error: 'Failed to update progress' });
      }

      if (this.changes === 0) {
        return res.status(404).json({ error: 'Target not found' });
      }

      res.json({ message: 'Progress updated successfully' });
    }
  );
});

// Update action step
router.put('/:id/steps/:stepId', (req, res) => {
  const { id: targetId, stepId } = req.params;
  const userId = req.user.id;
  const { completed, amount, description } = req.body;

  // Verify target belongs to user
  db.get(
    'SELECT id FROM targets WHERE id = ? AND user_id = ?',
    [targetId, userId],
    (err, target) => {
      if (err) {
        console.error('Database error:', err);
        return res.status(500).json({ error: 'Database error' });
      }

      if (!target) {
        return res.status(404).json({ error: 'Target not found' });
      }

      // Update action step
      const updateFields = [];
      const values = [];

      if (completed !== undefined) {
        updateFields.push('completed = ?');
        values.push(completed);
      }

      if (amount !== undefined) {
        updateFields.push('completed_amount = ?');
        values.push(amount);
      }

      if (description !== undefined) {
        updateFields.push('description = ?');
        values.push(description);
      }

      if (updateFields.length === 0) {
        return res.status(400).json({ error: 'No fields to update' });
      }

      values.push(stepId);

      db.run(
        `UPDATE action_steps SET ${updateFields.join(', ')} WHERE id = ?`,
        values,
        function(err) {
          if (err) {
            console.error('Database error:', err);
            return res.status(500).json({ error: 'Failed to update action step' });
          }

          if (this.changes === 0) {
            return res.status(404).json({ error: 'Action step not found' });
          }

          res.json({ message: 'Action step updated successfully' });
        }
      );
    }
  );
});

// Get target investments
router.get('/:id/investments', (req, res) => {
  const targetId = req.params.id;
  const userId = req.user.id;

  // Verify target belongs to user
  db.get(
    'SELECT id FROM targets WHERE id = ? AND user_id = ?',
    [targetId, userId],
    (err, target) => {
      if (err) {
        console.error('Database error:', err);
        return res.status(500).json({ error: 'Database error' });
      }

      if (!target) {
        return res.status(404).json({ error: 'Target not found' });
      }

      // Get investment transactions for this target
      db.all(
        'SELECT * FROM transactions WHERE target_id = ? AND type = "investment" ORDER BY date DESC',
        [targetId],
        (err, investments) => {
          if (err) {
            console.error('Database error:', err);
            return res.status(500).json({ error: 'Failed to fetch investments' });
          }

          res.json(investments);
        }
      );
    }
  );
});

// Delete target
router.delete('/:id', (req, res) => {
  const targetId = req.params.id;
  const userId = req.user.id;

  db.run(
    'DELETE FROM targets WHERE id = ? AND user_id = ?',
    [targetId, userId],
    function(err) {
      if (err) {
        console.error('Database error:', err);
        return res.status(500).json({ error: 'Failed to delete target' });
      }

      if (this.changes === 0) {
        return res.status(404).json({ error: 'Target not found' });
      }

      res.json({ message: 'Target deleted successfully' });
    }
  );
});

export default router;
