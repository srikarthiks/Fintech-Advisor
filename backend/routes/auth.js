// Authentication routes
import express from 'express';
import bcrypt from 'bcryptjs';
import { db } from '../config/database.js';
import { generateToken } from '../middleware/auth.js';
import { validateRequired, validateEmailFormat, validatePasswordStrength } from '../middleware/validation.js';

const router = express.Router();

// Register new user
router.post('/register', 
  validateRequired(['email', 'password']),
  validateEmailFormat,
  validatePasswordStrength,
  async (req, res) => {
    try {
      const { email, password, name } = req.body;

      // Check if user already exists
      db.get('SELECT id FROM users WHERE email = ?', [email], async (err, user) => {
        if (err) {
          console.error('Database error:', err);
          return res.status(500).json({ error: 'Database error' });
        }

        if (user) {
          return res.status(400).json({ error: 'User already exists' });
        }

        // Hash password
        const saltRounds = 12;
        const hashedPassword = await bcrypt.hash(password, saltRounds);

        // Insert new user
        db.run(
          'INSERT INTO users (email, password, name) VALUES (?, ?, ?)',
          [email, hashedPassword, name || null],
          function(err) {
            if (err) {
              console.error('Database error:', err);
              return res.status(500).json({ error: 'Failed to create user' });
            }

            // Generate token
            const token = generateToken({ id: this.lastID, email });

            res.status(201).json({
              message: 'User created successfully',
              token,
              user: { id: this.lastID, email, name }
            });
          }
        );
      });
    } catch (error) {
      console.error('Registration error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
);

// Login user
router.post('/login',
  validateRequired(['email', 'password']),
  validateEmailFormat,
  async (req, res) => {
    try {
      const { email, password } = req.body;

      // Find user by email
      db.get('SELECT * FROM users WHERE email = ?', [email], async (err, user) => {
        if (err) {
          console.error('Database error:', err);
          return res.status(500).json({ error: 'Database error' });
        }

        if (!user) {
          return res.status(401).json({ error: 'Invalid credentials' });
        }

        // Check password
        const isValidPassword = await bcrypt.compare(password, user.password);
        if (!isValidPassword) {
          return res.status(401).json({ error: 'Invalid credentials' });
        }

        // Generate token
        const token = generateToken({ id: user.id, email: user.email });

        res.json({
          message: 'Login successful',
          token,
          user: { id: user.id, email: user.email, name: user.name }
        });
      });
    } catch (error) {
      console.error('Login error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
);

// Get current user profile
router.get('/profile', (req, res) => {
  // This route should be protected by authenticateToken middleware
  // req.user will be available from the middleware
  res.json({
    user: req.user
  });
});

// Change password
router.post('/change-password',
  validateRequired(['currentPassword', 'newPassword']),
  validatePasswordStrength,
  async (req, res) => {
    try {
      const { currentPassword, newPassword } = req.body;
      const userId = req.user.id;

      // Get current user
      db.get('SELECT password FROM users WHERE id = ?', [userId], async (err, user) => {
        if (err) {
          console.error('Database error:', err);
          return res.status(500).json({ error: 'Database error' });
        }

        if (!user) {
          return res.status(404).json({ error: 'User not found' });
        }

        // Verify current password
        const isValidPassword = await bcrypt.compare(currentPassword, user.password);
        if (!isValidPassword) {
          return res.status(401).json({ error: 'Current password is incorrect' });
        }

        // Hash new password
        const saltRounds = 12;
        const hashedNewPassword = await bcrypt.hash(newPassword, saltRounds);

        // Update password
        db.run(
          'UPDATE users SET password = ? WHERE id = ?',
          [hashedNewPassword, userId],
          function(err) {
            if (err) {
              console.error('Database error:', err);
              return res.status(500).json({ error: 'Failed to update password' });
            }

            res.json({ message: 'Password updated successfully' });
          }
        );
      });
    } catch (error) {
      console.error('Change password error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
);

export default router;
