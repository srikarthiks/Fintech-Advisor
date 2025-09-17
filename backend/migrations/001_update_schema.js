// Database migration to update schema for new modular structure
import sqlite3 from 'sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DB_PATH = path.join(__dirname, '..', 'finance_manager.db');

export const runMigration = () => {
  return new Promise((resolve, reject) => {
    const db = new sqlite3.Database(DB_PATH);

    db.serialize(() => {
      console.log('🔄 Running database migration...');

      // Update categories table to add user_id if it doesn't exist
      db.run(`ALTER TABLE categories ADD COLUMN user_id INTEGER`, (err) => {
        if (err && !err.message.includes('duplicate column name')) {
          console.log('Categories user_id column already exists or error:', err.message);
        } else {
          console.log('✅ Added user_id to categories table');
        }
      });

      // Update categories table to add type column if it doesn't exist
      db.run(`ALTER TABLE categories ADD COLUMN type TEXT`, (err) => {
        if (err && !err.message.includes('duplicate column name')) {
          console.log('Categories type column already exists or error:', err.message);
        } else {
          console.log('✅ Added type to categories table');
        }
      });

      // Update action_steps table to add step_number if it doesn't exist
      db.run(`ALTER TABLE action_steps ADD COLUMN step_number INTEGER`, (err) => {
        if (err && !err.message.includes('duplicate column name')) {
          console.log('Action steps step_number column already exists or error:', err.message);
        } else {
          console.log('✅ Added step_number to action_steps table');
        }
      });

      // Update action_steps table to add completed_amount if it doesn't exist
      db.run(`ALTER TABLE action_steps ADD COLUMN completed_amount REAL DEFAULT 0`, (err) => {
        if (err && !err.message.includes('duplicate column name')) {
          console.log('Action steps completed_amount column already exists or error:', err.message);
        } else {
          console.log('✅ Added completed_amount to action_steps table');
        }
      });

      // Update transactions table to add user_id if it doesn't exist
      db.run(`ALTER TABLE transactions ADD COLUMN user_id INTEGER`, (err) => {
        if (err && !err.message.includes('duplicate column name')) {
          console.log('Transactions user_id column already exists or error:', err.message);
        } else {
          console.log('✅ Added user_id to transactions table');
        }
      });

      // Update transactions table to add target_id if it doesn't exist
      db.run(`ALTER TABLE transactions ADD COLUMN target_id INTEGER`, (err) => {
        if (err && !err.message.includes('duplicate column name')) {
          console.log('Transactions target_id column already exists or error:', err.message);
        } else {
          console.log('✅ Added target_id to transactions table');
        }
      });

      // Update transactions table to add action_step_id if it doesn't exist
      db.run(`ALTER TABLE transactions ADD COLUMN action_step_id TEXT`, (err) => {
        if (err && !err.message.includes('duplicate column name')) {
          console.log('Transactions action_step_id column already exists or error:', err.message);
        } else {
          console.log('✅ Added action_step_id to transactions table');
        }
      });

      // Create budgets table if it doesn't exist
      db.run(`CREATE TABLE IF NOT EXISTS budgets (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        category_id INTEGER NOT NULL,
        amount REAL NOT NULL,
        month INTEGER NOT NULL,
        year INTEGER NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users (id),
        FOREIGN KEY (category_id) REFERENCES categories (id)
      )`, (err) => {
        if (err) {
          console.log('Budgets table creation error:', err.message);
        } else {
          console.log('✅ Created budgets table');
        }
      });

      // Update existing data - set user_id for existing categories
      db.run(`UPDATE categories SET user_id = 1 WHERE user_id IS NULL`, (err) => {
        if (err) {
          console.log('Update categories user_id error:', err.message);
        } else {
          console.log('✅ Updated existing categories with user_id');
        }
      });

      // Update existing data - set type for existing categories
      db.run(`UPDATE categories SET type = 'expense' WHERE type IS NULL`, (err) => {
        if (err) {
          console.log('Update categories type error:', err.message);
        } else {
          console.log('✅ Updated existing categories with type');
        }
      });

      // Update existing data - set user_id for existing transactions
      db.run(`UPDATE transactions SET user_id = 1 WHERE user_id IS NULL`, (err) => {
        if (err) {
          console.log('Update transactions user_id error:', err.message);
        } else {
          console.log('✅ Updated existing transactions with user_id');
        }
      });

      console.log('🎉 Database migration completed successfully!');
      resolve();
    });

    db.close((err) => {
      if (err) {
        console.error('Error closing database:', err.message);
        reject(err);
      } else {
        console.log('Database connection closed');
      }
    });
  });
};
