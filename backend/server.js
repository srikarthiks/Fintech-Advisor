// Modular Finance Manager Backend Server
import express from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';
import { initializeDatabase } from './config/database.js';
import { authenticateToken } from './middleware/auth.js';
import { sanitizeInput } from './middleware/validation.js';

// Import routes
import authRoutes from './routes/auth.js';
import targetsRoutes from './routes/targets.js';
import transactionsRoutes from './routes/transactions.js';
import categoriesRoutes from './routes/categories.js';
import budgetsRoutes from './routes/budgets.js';
import analysisRoutes from './routes/analysis.js';

const app = express();
const PORT = process.env.PORT || 3010;

// Middleware
app.use(cors({
  origin: [
    'http://localhost:5173',
    'http://localhost:51785',
    'http://localhost:3000',
    'http://localhost:5174'
  ],
  credentials: true
}));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(sanitizeInput);

// Initialize database
initializeDatabase().then(() => {
  console.log('Database initialized successfully');
}).catch(error => {
  console.error('Database initialization failed:', error);
  process.exit(1);
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/targets', authenticateToken, targetsRoutes);
app.use('/api/transactions', authenticateToken, transactionsRoutes);
app.use('/api/categories', authenticateToken, categoriesRoutes);
app.use('/api/budgets', authenticateToken, budgetsRoutes);
app.use('/api/analyze', authenticateToken, analysisRoutes);

// Legacy endpoint for backward compatibility
app.post('/api/advisor', authenticateToken, (req, res) => {
  // Redirect to analysis endpoint
  res.redirect(307, '/api/analyze');
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Error:', err);
  
  if (err.type === 'entity.parse.failed') {
    return res.status(400).json({ error: 'Invalid JSON in request body' });
  }
  
  if (err.type === 'entity.too.large') {
    return res.status(413).json({ error: 'Request entity too large' });
  }
  
  res.status(500).json({ 
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong'
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ 
    error: 'Endpoint not found',
    path: req.originalUrl,
    method: req.method
  });
});

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('\nReceived SIGINT. Graceful shutdown...');
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('\nReceived SIGTERM. Graceful shutdown...');
  process.exit(0);
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Finance Manager Backend Server running on port ${PORT}`);
  console.log(`📊 Health check: http://localhost:${PORT}/health`);
  console.log(`🔗 API Base URL: http://localhost:${PORT}/api`);
  console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
});

export default app;
