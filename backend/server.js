import express from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import sqlite3 from 'sqlite3';
import { v4 as uuidv4 } from 'uuid';

const app = express();
const PORT = 3010;
const JWT_SECRET = 'your-secret-key-change-in-production';

// Middleware
app.use(cors());
app.use(bodyParser.json());

// Initialize SQLite database
const db = new sqlite3.Database('./finance_manager.db');

// Create tables if they don't exist
db.serialize(() => {
  // Users table
  db.run(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      email TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Categories table
  db.run(`
    CREATE TABLE IF NOT EXISTS categories (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      type TEXT NOT NULL CHECK (type IN ('income', 'expense')),
      is_default BOOLEAN DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Transactions table
  db.run(`
    CREATE TABLE IF NOT EXISTS transactions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      date TEXT NOT NULL,
      description TEXT NOT NULL,
      amount REAL NOT NULL,
      type TEXT NOT NULL CHECK (type IN ('income', 'expense', 'investment')),
      category TEXT NOT NULL,
      user_id INTEGER,
      target_id INTEGER,
      action_step_id TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users (id),
      FOREIGN KEY (target_id) REFERENCES targets (id),
      FOREIGN KEY (action_step_id) REFERENCES action_steps (id)
    )
  `);

  // Budgets table
  db.run(`
    CREATE TABLE IF NOT EXISTS budgets (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      budget_data TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users (id)
    )
  `);

  // Targets table
  db.run(`
    CREATE TABLE IF NOT EXISTS targets (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      name TEXT NOT NULL,
      target_amount REAL NOT NULL,
      current_amount REAL DEFAULT 0,
      target_date TEXT NOT NULL,
      plan_details TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users (id)
    )
  `);

  // Action steps table
  db.run(`
    CREATE TABLE IF NOT EXISTS action_steps (
      id TEXT PRIMARY KEY,
      target_id INTEGER NOT NULL,
      month_range TEXT NOT NULL,
      description TEXT NOT NULL,
      completed BOOLEAN DEFAULT 0,
      amount REAL DEFAULT 0,
      target_amount REAL DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (target_id) REFERENCES targets (id)
    )
  `);
});

// Authentication middleware
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ error: 'Invalid or expired token' });
    }
    req.user = user;
    next();
  });
};

// Auth endpoints
app.post('/api/auth/login', (req, res) => {
  const { email, password } = req.body;
  
  db.get('SELECT * FROM users WHERE email = ?', [email], (err, user) => {
    if (err) {
      return res.status(500).json({ error: 'Database error' });
    }
    
    if (!user || !bcrypt.compareSync(password, user.password)) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    
    const token = jwt.sign({ id: user.id, email: user.email }, JWT_SECRET);
    res.json({ token, user: { id: user.id, email: user.email } });
  });
});

app.post('/api/auth/register', (req, res) => {
  const { email, password } = req.body;
  const hashedPassword = bcrypt.hashSync(password, 10);
  
  db.run('INSERT INTO users (email, password) VALUES (?, ?)', [email, hashedPassword], function(err) {
    if (err) {
      if (err.code === 'SQLITE_CONSTRAINT_UNIQUE') {
        return res.status(400).json({ error: 'Email already exists' });
      }
      return res.status(500).json({ error: 'Database error' });
    }
    
    const token = jwt.sign({ id: this.lastID, email }, JWT_SECRET);
    res.json({ token, user: { id: this.lastID, email } });
  });
});

// Categories endpoints
app.get('/api/categories', authenticateToken, (req, res) => {
  db.all('SELECT * FROM categories ORDER BY name', (err, rows) => {
    if (err) {
      return res.status(500).json({ error: 'Database error' });
    }
    res.json({ categories: rows });
  });
});

app.post('/api/categories', authenticateToken, (req, res) => {
  const { name, type, isDefault } = req.body;
  
  db.run('INSERT INTO categories (name, type, is_default) VALUES (?, ?, ?)', 
    [name, type, isDefault || 0], function(err) {
    if (err) {
      return res.status(500).json({ error: 'Database error' });
    }
    res.json({ id: this.lastID, name, type, isDefault: !!isDefault });
  });
});

// Transactions endpoints
app.get('/api/transactions', authenticateToken, (req, res) => {
  db.all('SELECT * FROM transactions WHERE user_id = ? ORDER BY date DESC', [req.user.id], (err, rows) => {
    if (err) {
      return res.status(500).json({ error: 'Database error' });
    }
    res.json({ transactions: rows });
  });
});

app.post('/api/transactions', authenticateToken, (req, res) => {
  const { date, description, amount, type, category, targetId, actionStepId } = req.body;
  
  // Validate investment transactions have targetId
  if (type === 'investment' && !targetId) {
    return res.status(400).json({ error: 'Investment transactions must be linked to a target' });
  }
  
  db.run('INSERT INTO transactions (date, description, amount, type, category, user_id, target_id, action_step_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?)', 
    [date, description, amount, type, category, req.user.id, targetId || null, actionStepId || null], function(err) {
    if (err) {
      return res.status(500).json({ error: 'Database error' });
    }
    
    // If this is an investment transaction, update target progress
    if (type === 'investment' && targetId) {
      // Update the target's current amount
      db.run('UPDATE targets SET current_amount = current_amount + ? WHERE id = ? AND user_id = ?', 
        [amount, targetId, req.user.id], (updateErr) => {
        if (updateErr) {
          console.error('Error updating target progress:', updateErr);
        }
      });
    }
    
    res.json({ 
      id: this.lastID, 
      date, 
      description, 
      amount, 
      type, 
      category,
      targetId: targetId || null,
      actionStepId: actionStepId || null
    });
  });
});

// Budgets endpoints
app.get('/api/budgets', authenticateToken, (req, res) => {
  db.get('SELECT * FROM budgets WHERE user_id = ? ORDER BY updated_at DESC LIMIT 1', [req.user.id], (err, row) => {
    if (err) {
      return res.status(500).json({ error: 'Database error' });
    }
    
    if (!row) {
      return res.json({ budgets: {} });
    }
    
    try {
      const budgets = JSON.parse(row.budget_data);
      res.json({ budgets });
    } catch (e) {
      res.json({ budgets: {} });
    }
  });
});

app.post('/api/budgets', authenticateToken, (req, res) => {
  const { budgets } = req.body;
  
  db.run('INSERT INTO budgets (user_id, budget_data) VALUES (?, ?)', 
    [req.user.id, JSON.stringify(budgets)], function(err) {
    if (err) {
      return res.status(500).json({ error: 'Database error' });
    }
    res.json({ budgets });
  });
});

// Analysis endpoint
app.post('/api/analyze', authenticateToken, (req, res) => {
  const { period, userId } = req.body;
  
  // Get transactions for analysis
  db.all('SELECT * FROM transactions WHERE user_id = ? ORDER BY date DESC', [req.user.id], (err, transactions) => {
    if (err) {
      return res.status(500).json({ error: 'Database error' });
    }
    
    // Simple analysis logic (you can enhance this)
    const totalIncome = transactions.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0);
    const totalExpenses = transactions.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0);
    const netIncome = totalIncome - totalExpenses;
    
    const categorySpending = {};
    transactions.filter(t => t.type === 'expense').forEach(t => {
      categorySpending[t.category] = (categorySpending[t.category] || 0) + t.amount;
    });
    
    const analysis = {
      overallSummary: `Your financial analysis shows a net income of ₹${netIncome.toLocaleString()}. You earned ₹${totalIncome.toLocaleString()} and spent ₹${totalExpenses.toLocaleString()} during this period.`,
      keyInsights: [
        `Net income: ₹${netIncome.toLocaleString()}`,
        `Total income: ₹${totalIncome.toLocaleString()}`,
        `Total expenses: ₹${totalExpenses.toLocaleString()}`,
        `Savings rate: ${totalIncome > 0 ? ((netIncome / totalIncome) * 100).toFixed(1) : 0}%`
      ],
      budgetAnalysis: Object.entries(categorySpending).map(([category, spent]) => ({
        category,
        spent,
        budget: 0 // You can add budget data here
      })),
      potentialSavings: [
        'Consider reducing discretionary spending',
        'Review subscription services',
        'Optimize utility bills',
        'Look for better deals on insurance'
      ],
      needsVsWants: {
        needs: totalExpenses * 0.7, // Estimate 70% needs
        wants: totalExpenses * 0.3, // Estimate 30% wants
        needsPercentage: 70,
        wantsPercentage: 30
      }
    };
    
    res.json(analysis);
  });
});

// TARGETS ENDPOINTS - NEW IMPLEMENTATION

// Get all targets for a user
app.get('/api/targets', authenticateToken, (req, res) => {
  db.all('SELECT * FROM targets WHERE user_id = ? ORDER BY created_at DESC', [req.user.id], (err, rows) => {
    if (err) {
      return res.status(500).json({ error: 'Database error' });
    }
    
    // Get action steps for each target
    const targetsWithSteps = rows.map(target => {
      return new Promise((resolve, reject) => {
        db.all('SELECT * FROM action_steps WHERE target_id = ?', [target.id], (err, steps) => {
          if (err) {
            reject(err);
            return;
          }
          
          try {
            const planDetails = JSON.parse(target.plan_details);
            planDetails.roadmap = steps.map(step => ({
              id: step.id,
              monthRange: step.month_range,
              description: step.description,
              completed: !!step.completed,
              amount: step.amount || 0,
              targetAmount: step.target_amount || 0
            }));
            
            resolve({
              id: target.id,
              name: target.name,
              targetAmount: target.target_amount,
              currentAmount: target.current_amount,
              targetDate: target.target_date,
              planDetails
            });
          } catch (e) {
            resolve({
              id: target.id,
              name: target.name,
              targetAmount: target.target_amount,
              currentAmount: target.current_amount,
              targetDate: target.target_date,
              planDetails: JSON.parse(target.plan_details)
            });
          }
        });
      });
    });
    
    Promise.all(targetsWithSteps).then(targets => {
      res.json({ targets });
    }).catch(err => {
      res.status(500).json({ error: 'Database error' });
    });
  });
});

// Create a new target
app.post('/api/targets', authenticateToken, (req, res) => {
  const { name, targetAmount, currentAmount, targetDate, planDetails, userId } = req.body;
  
  db.run('INSERT INTO targets (user_id, name, target_amount, current_amount, target_date, plan_details) VALUES (?, ?, ?, ?, ?, ?)', 
    [req.user.id, name, targetAmount, currentAmount || 0, targetDate, JSON.stringify(planDetails)], function(err) {
    if (err) {
      return res.status(500).json({ error: 'Database error' });
    }
    
    const targetId = this.lastID;
    
    // Save action steps
    if (planDetails.roadmap && planDetails.roadmap.length > 0) {
      const stepPromises = planDetails.roadmap.map(step => {
        const stepId = step.id || uuidv4();
        return new Promise((resolve, reject) => {
          db.run('INSERT INTO action_steps (id, target_id, month_range, description, completed, amount, target_amount) VALUES (?, ?, ?, ?, ?, ?, ?)', 
            [stepId, targetId, step.monthRange, step.description, step.completed || false, step.amount || 0, step.targetAmount || 0], 
            (err) => {
              if (err) reject(err);
              else resolve();
            });
        });
      });
      
      Promise.all(stepPromises).then(() => {
        res.json({
          id: targetId,
          name,
          targetAmount,
          currentAmount: currentAmount || 0,
          targetDate,
          planDetails
        });
      }).catch(err => {
        res.status(500).json({ error: 'Failed to save action steps' });
      });
    } else {
      res.json({
        id: targetId,
        name,
        targetAmount,
        currentAmount: currentAmount || 0,
        targetDate,
        planDetails
      });
    }
  });
});

// Update a target
app.put('/api/targets/:id', authenticateToken, (req, res) => {
  const targetId = req.params.id;
  const { name, targetAmount, currentAmount, targetDate, planDetails } = req.body;
  
  db.run('UPDATE targets SET name = ?, target_amount = ?, current_amount = ?, target_date = ?, plan_details = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ? AND user_id = ?', 
    [name, targetAmount, currentAmount, targetDate, JSON.stringify(planDetails), targetId, req.user.id], function(err) {
    if (err) {
      return res.status(500).json({ error: 'Database error' });
    }
    
    if (this.changes === 0) {
      return res.status(404).json({ error: 'Target not found' });
    }
    
    res.json({ success: true });
  });
});

// Delete a target
app.delete('/api/targets/:id', authenticateToken, (req, res) => {
  const targetId = req.params.id;
  
  // Delete action steps first
  db.run('DELETE FROM action_steps WHERE target_id = ?', [targetId], (err) => {
    if (err) {
      return res.status(500).json({ error: 'Database error' });
    }
    
    // Delete target
    db.run('DELETE FROM targets WHERE id = ? AND user_id = ?', [targetId, req.user.id], function(err) {
      if (err) {
        return res.status(500).json({ error: 'Database error' });
      }
      
      if (this.changes === 0) {
        return res.status(404).json({ error: 'Target not found' });
      }
      
      res.json({ success: true });
    });
  });
});

// Update action step
app.put('/api/targets/:targetId/steps/:stepId', authenticateToken, (req, res) => {
  const { targetId, stepId } = req.params;
  const { completed, amount, description } = req.body;
  
  // Verify target belongs to user
  db.get('SELECT id FROM targets WHERE id = ? AND user_id = ?', [targetId, req.user.id], (err, target) => {
    if (err) {
      return res.status(500).json({ error: 'Database error' });
    }
    
    if (!target) {
      return res.status(404).json({ error: 'Target not found' });
    }
    
    // Update action step
    const updates = [];
    const values = [];
    
    if (completed !== undefined) {
      updates.push('completed = ?');
      values.push(completed ? 1 : 0);
    }
    
    if (amount !== undefined) {
      updates.push('amount = ?');
      values.push(amount);
    }
    
    if (description !== undefined) {
      updates.push('description = ?');
      values.push(description);
    }
    
    if (updates.length === 0) {
      return res.status(400).json({ error: 'No updates provided' });
    }
    
    values.push(stepId);
    
    db.run(`UPDATE action_steps SET ${updates.join(', ')}, updated_at = CURRENT_TIMESTAMP WHERE id = ?`, 
      values, function(err) {
      if (err) {
        return res.status(500).json({ error: 'Database error' });
      }
      
      if (this.changes === 0) {
        return res.status(404).json({ error: 'Action step not found' });
      }
      
      res.json({ success: true });
    });
  });
});

// Update target progress
app.put('/api/targets/:id/progress', authenticateToken, (req, res) => {
  const targetId = req.params.id;
  const { currentAmount } = req.body;
  
  db.run('UPDATE targets SET current_amount = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ? AND user_id = ?', 
    [currentAmount, targetId, req.user.id], function(err) {
    if (err) {
      return res.status(500).json({ error: 'Database error' });
    }
    
    if (this.changes === 0) {
      return res.status(404).json({ error: 'Target not found' });
    }
    
    res.json({ success: true });
  });
});

// Get investment transactions for a target
app.get('/api/targets/:id/investments', authenticateToken, (req, res) => {
  const targetId = req.params.id;
  
  // Verify target belongs to user
  db.get('SELECT id FROM targets WHERE id = ? AND user_id = ?', [targetId, req.user.id], (err, target) => {
    if (err) {
      return res.status(500).json({ error: 'Database error' });
    }
    
    if (!target) {
      return res.status(404).json({ error: 'Target not found' });
    }
    
    // Get investment transactions for this target
    db.all('SELECT * FROM transactions WHERE target_id = ? AND type = "investment" AND user_id = ? ORDER BY date DESC', 
      [targetId, req.user.id], (err, transactions) => {
      if (err) {
        return res.status(500).json({ error: 'Database error' });
      }
      
      res.json({ transactions });
    });
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`Finance Manager Backend running on port ${PORT}`);
  console.log(`API endpoints available at http://localhost:${PORT}/api`);
});
