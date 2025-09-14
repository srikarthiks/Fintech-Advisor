// Transactions routes
import express from 'express';
import { db } from '../config/database.js';
import { validateRequired, validateNumeric, validateTransactionType } from '../middleware/validation.js';

const router = express.Router();

// Get all transactions for user
router.get('/', (req, res) => {
  const userId = req.user.id;

  db.all(
    'SELECT * FROM transactions WHERE user_id = ? ORDER BY date DESC',
    [userId],
    (err, transactions) => {
      if (err) {
        console.error('Database error:', err);
        return res.status(500).json({ error: 'Failed to fetch transactions' });
      }

      res.json(transactions);
    }
  );
});

// Get single transaction
router.get('/:id', (req, res) => {
  const transactionId = req.params.id;
  const userId = req.user.id;

  db.get(
    'SELECT * FROM transactions WHERE id = ? AND user_id = ?',
    [transactionId, userId],
    (err, transaction) => {
      if (err) {
        console.error('Database error:', err);
        return res.status(500).json({ error: 'Failed to fetch transaction' });
      }

      if (!transaction) {
        return res.status(404).json({ error: 'Transaction not found' });
      }

      res.json(transaction);
    }
  );
});

// Create new transaction
router.post('/',
  validateRequired(['date', 'description', 'amount', 'type']),
  validateNumeric(['amount']),
  validateTransactionType,
  (req, res) => {
    const { date, description, amount, type, category, targetId, actionStepId } = req.body;
    const userId = req.user.id;

    // Validate targetId and actionStepId for investment transactions
    if (type === 'investment' && targetId) {
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
            return res.status(400).json({ error: 'Invalid target for investment' });
          }

          // Insert transaction
          insertTransaction();
        }
      );
    } else {
      insertTransaction();
    }

    function insertTransaction() {
      db.run(
        'INSERT INTO transactions (user_id, date, description, amount, type, category, target_id, action_step_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
        [userId, date, description, amount, type, category || null, targetId || null, actionStepId || null],
        function(err) {
          if (err) {
            console.error('Database error:', err);
            return res.status(500).json({ error: 'Failed to create transaction' });
          }

          const transactionId = this.lastID;

          // If this is an investment transaction linked to a target, update target progress
          if (type === 'investment' && targetId) {
            updateTargetProgress(targetId, amount);
          }

          res.status(201).json({
            message: 'Transaction created successfully',
            transaction: { id: transactionId, date, description, amount, type }
          });
        }
      );
    }

    function updateTargetProgress(targetId, amount) {
      db.get(
        'SELECT current_amount FROM targets WHERE id = ?',
        [targetId],
        (err, target) => {
          if (err) {
            console.error('Error fetching target:', err);
            return;
          }

          if (target) {
            const newCurrentAmount = (target.current_amount || 0) + amount;
            db.run(
              'UPDATE targets SET current_amount = ? WHERE id = ?',
              [newCurrentAmount, targetId],
              (err) => {
                if (err) {
                  console.error('Error updating target progress:', err);
                }
              }
            );
          }
        }
      );
    }
  }
);

// Update transaction
router.put('/:id',
  validateNumeric(['amount']),
  validateTransactionType,
  (req, res) => {
    const transactionId = req.params.id;
    const userId = req.user.id;
    const { date, description, amount, type, category, targetId, actionStepId } = req.body;

    // Get current transaction to check if it's an investment
    db.get(
      'SELECT * FROM transactions WHERE id = ? AND user_id = ?',
      [transactionId, userId],
      (err, currentTransaction) => {
        if (err) {
          console.error('Database error:', err);
          return res.status(500).json({ error: 'Database error' });
        }

        if (!currentTransaction) {
          return res.status(404).json({ error: 'Transaction not found' });
        }

        // Update transaction
        db.run(
          'UPDATE transactions SET date = COALESCE(?, date), description = COALESCE(?, description), amount = COALESCE(?, amount), type = COALESCE(?, type), category = COALESCE(?, category), target_id = COALESCE(?, target_id), action_step_id = COALESCE(?, action_step_id) WHERE id = ? AND user_id = ?',
          [date, description, amount, type, category, targetId, actionStepId, transactionId, userId],
          function(err) {
            if (err) {
              console.error('Database error:', err);
              return res.status(500).json({ error: 'Failed to update transaction' });
            }

            if (this.changes === 0) {
              return res.status(404).json({ error: 'Transaction not found' });
            }

            // If amount or target changed for investment, update target progress
            if (type === 'investment' && targetId && 
                (amount !== currentTransaction.amount || targetId !== currentTransaction.target_id)) {
              updateTargetProgress(targetId, amount);
            }

            res.json({ message: 'Transaction updated successfully' });
          }
        );
      }
    );

    function updateTargetProgress(targetId, amount) {
      // Recalculate target progress based on all investment transactions
      db.all(
        'SELECT SUM(amount) as total_investments FROM transactions WHERE target_id = ? AND type = "investment"',
        [targetId],
        (err, result) => {
          if (err) {
            console.error('Error calculating target progress:', err);
            return;
          }

          const totalInvestments = result[0]?.total_investments || 0;
          
          db.run(
            'UPDATE targets SET current_amount = ? WHERE id = ?',
            [totalInvestments, targetId],
            (err) => {
              if (err) {
                console.error('Error updating target progress:', err);
              }
            }
          );
        }
      );
    }
  }
);

// Delete transaction
router.delete('/:id', (req, res) => {
  const transactionId = req.params.id;
  const userId = req.user.id;

  // Get transaction details before deletion
  db.get(
    'SELECT * FROM transactions WHERE id = ? AND user_id = ?',
    [transactionId, userId],
    (err, transaction) => {
      if (err) {
        console.error('Database error:', err);
        return res.status(500).json({ error: 'Database error' });
      }

      if (!transaction) {
        return res.status(404).json({ error: 'Transaction not found' });
      }

      // Delete transaction
      db.run(
        'DELETE FROM transactions WHERE id = ? AND user_id = ?',
        [transactionId, userId],
        function(err) {
          if (err) {
            console.error('Database error:', err);
            return res.status(500).json({ error: 'Failed to delete transaction' });
          }

          if (this.changes === 0) {
            return res.status(404).json({ error: 'Transaction not found' });
          }

          // If deleted transaction was an investment linked to a target, update target progress
          if (transaction.type === 'investment' && transaction.target_id) {
            updateTargetProgress(transaction.target_id);
          }

          res.json({ message: 'Transaction deleted successfully' });
        }
      );
    }
  );

  function updateTargetProgress(targetId) {
    // Recalculate target progress based on remaining investment transactions
    db.all(
      'SELECT SUM(amount) as total_investments FROM transactions WHERE target_id = ? AND type = "investment"',
      [targetId],
      (err, result) => {
        if (err) {
          console.error('Error calculating target progress:', err);
          return;
        }

        const totalInvestments = result[0]?.total_investments || 0;
        
        db.run(
          'UPDATE targets SET current_amount = ? WHERE id = ?',
          [totalInvestments, targetId],
          (err) => {
            if (err) {
              console.error('Error updating target progress:', err);
            }
          }
        );
      }
    );
  }
});

// Get transactions by type
router.get('/type/:type', (req, res) => {
  const { type } = req.params;
  const userId = req.user.id;

  if (!['income', 'expense', 'investment'].includes(type)) {
    return res.status(400).json({ error: 'Invalid transaction type' });
  }

  db.all(
    'SELECT * FROM transactions WHERE user_id = ? AND type = ? ORDER BY date DESC',
    [userId, type],
    (err, transactions) => {
      if (err) {
        console.error('Database error:', err);
        return res.status(500).json({ error: 'Failed to fetch transactions' });
      }

      res.json(transactions);
    }
  );
});

// Get transactions by date range
router.get('/date-range/:start/:end', (req, res) => {
  const { start, end } = req.params;
  const userId = req.user.id;

  db.all(
    'SELECT * FROM transactions WHERE user_id = ? AND date BETWEEN ? AND ? ORDER BY date DESC',
    [userId, start, end],
    (err, transactions) => {
      if (err) {
        console.error('Database error:', err);
        return res.status(500).json({ error: 'Failed to fetch transactions' });
      }

      res.json(transactions);
    }
  );
});

export default router;
