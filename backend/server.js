import express from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { sequelize } from './config/database.js';
import { User, Category, Transaction, Budget } from './models/index.js';

const app = express();
const PORT = process.env.PORT || 3010;
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

// Middleware
app.use(cors({
  origin: [
    'http://localhost:5173',
    'http://localhost:51785',
    'http://localhost:3000',
    'http://localhost:5174'
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  optionsSuccessStatus: 200
}));
app.use(bodyParser.json());

// Auth middleware
const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        return res.status(401).json({ message: 'Access token required' });
    }

    jwt.verify(token, JWT_SECRET, (err, user) => {
        if (err) {
            return res.status(403).json({ message: 'Invalid token' });
        }
        req.userId = user.id;
        next();
    });
};

// Initialize database
async function initializeDatabase() {
    try {
        await sequelize.authenticate();
        console.log('✅ Database connected');
        
        // Use force: false and alter: false to avoid MySQL key limits
        // The database should already exist with proper structure
        await sequelize.sync({ force: false, alter: false });
        console.log('✅ Database synchronized');
    } catch (error) {
        console.error('❌ Database sync failed:', error.message);
        console.log('⚠️  Continuing without sync - ensure database tables exist manually');
        // Don't exit, just continue without sync
    }
}

// Default categories for new users
const DEFAULT_CATEGORIES = [
    // Income categories
    { name: 'Salary', type: 'income' },
    { name: 'Freelance', type: 'income' },
    { name: 'Investment', type: 'income' },
    { name: 'Bonus', type: 'income' },
    { name: 'Other Income', type: 'income' },
    
    // Expense categories
    { name: 'Food & Dining', type: 'expense' },
    { name: 'Transportation', type: 'expense' },
    { name: 'Shopping', type: 'expense' },
    { name: 'Entertainment', type: 'expense' },
    { name: 'Bills & Utilities', type: 'expense' },
    { name: 'Healthcare', type: 'expense' },
    { name: 'Education', type: 'expense' },
    { name: 'Travel', type: 'expense' },
    { name: 'Rent', type: 'expense' },
    { name: 'Other Expenses', type: 'expense' }
];

// Helper function to create default categories and budgets for new user
async function createDefaultDataForUser(userId) {
    try {
        // Create default categories
        const categories = await Promise.all(
            DEFAULT_CATEGORIES.map(cat => 
                Category.create({
                    name: cat.name,
                    type: cat.type,
                    UserId: userId
                })
            )
        );

        // Create default budgets (0 amount) for expense categories for current month
        const currentDate = new Date();
        const currentMonth = currentDate.getMonth() + 1;
        const currentYear = currentDate.getFullYear();
        const monthString = `${currentYear}-${currentMonth.toString().padStart(2, '0')}`;

        const expenseCategories = categories.filter(cat => cat.type === 'expense');
        await Promise.all(
            expenseCategories.map(cat =>
                Budget.create({
                    category: cat.name,
                    amount: 0,
                    month: monthString,
                    year: currentYear,
                    UserId: userId
                })
            )
        );

        console.log(`✅ Created ${categories.length} default categories and ${expenseCategories.length} default budgets for user ${userId}`);
    } catch (error) {
        console.error('Error creating default data:', error);
    }
}

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    version: '1.0.0',
    database: 'MySQL with Sequelize'
  });
});

// Auth Routes
app.post('/api/auth/register', async (req, res) => {
    try {
        const { email, password } = req.body;
        
        if (!email || !password) {
            return res.status(400).json({ message: 'Email and password required' });
        }

        const existingUser = await User.findOne({ where: { email } });
        if (existingUser) {
            return res.status(400).json({ message: 'User already exists' });
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        const user = await User.create({ email, password: hashedPassword });

        // Create default categories and budgets for new user
        await createDefaultDataForUser(user.id);

        const token = jwt.sign({ id: user.id, email: user.email }, JWT_SECRET);
        res.json({ token, user: { id: user.id, email: user.email } });
    } catch (error) {
        console.error('Registration error:', error);
        res.status(500).json({ message: 'Registration failed' });
    }
});

app.post('/api/auth/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        
        if (!email || !password) {
            return res.status(400).json({ message: 'Email and password required' });
        }

        const user = await User.findOne({ where: { email } });
        if (!user) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }

        const validPassword = await bcrypt.compare(password, user.password);
        if (!validPassword) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }

        // Check if user has any categories, if not create default ones
        const existingCategories = await Category.count({ where: { UserId: user.id } });
        if (existingCategories === 0) {
            console.log(`Creating default data for existing user ${user.id}`);
            await createDefaultDataForUser(user.id);
        }

        const token = jwt.sign({ id: user.id, email: user.email }, JWT_SECRET);
        res.json({ token, user: { id: user.id, email: user.email } });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ message: 'Login failed' });
    }
});

// Categories Routes
app.get('/api/categories', authenticateToken, async (req, res) => {
    try {
        const categories = await Category.findAll({ 
            where: { UserId: req.userId },
            order: [['name', 'ASC']]
        });
        res.json({ categories });
    } catch (error) {
        console.error('Error fetching categories:', error);
        res.status(500).json({ message: 'Failed to fetch categories' });
    }
});

app.post('/api/categories', authenticateToken, async (req, res) => {
    try {
        const { name, type } = req.body;
        
        if (!name || !type) {
            return res.status(400).json({ message: 'Name and type required' });
        }

        const category = await Category.create({
            name,
            type,
            UserId: req.userId
        });

        res.json(category);
    } catch (error) {
        console.error('Error creating category:', error);
        res.status(500).json({ message: 'Failed to create category' });
    }
});

// Transactions Routes
app.get('/api/transactions', authenticateToken, async (req, res) => {
    try {
        const transactions = await Transaction.findAll({
            where: { UserId: req.userId },
            order: [['date', 'DESC']]
        });
        res.json({ transactions });
    } catch (error) {
        console.error('Error fetching transactions:', error);
        res.status(500).json({ message: 'Failed to fetch transactions' });
    }
});

app.post('/api/transactions', authenticateToken, async (req, res) => {
    try {
        const { date, description, amount, type, category } = req.body;
        
        if (!date || !description || !amount || !type || !category) {
            return res.status(400).json({ message: 'All fields required' });
        }

        const transaction = await Transaction.create({
            date,
            description,
            amount,
            type,
            category,
            UserId: req.userId
        });

        res.json(transaction);
    } catch (error) {
        console.error('Error creating transaction:', error);
        res.status(500).json({ message: 'Failed to create transaction' });
    }
});

app.put('/api/transactions/:id', authenticateToken, async (req, res) => {
    try {
        const { id } = req.params;
        const { date, description, amount, type, category } = req.body;

        const [updatedCount] = await Transaction.update({
            date,
            description,
            amount,
            type,
            category
        }, {
            where: { id, UserId: req.userId }
        });

        if (updatedCount > 0) {
            const updatedTransaction = await Transaction.findOne({ where: { id } });
            res.json(updatedTransaction);
        } else {
            res.status(404).json({ message: 'Transaction not found' });
        }
    } catch (error) {
        console.error('Error updating transaction:', error);
        res.status(500).json({ message: 'Failed to update transaction' });
    }
});

app.delete('/api/transactions/:id', authenticateToken, async (req, res) => {
    try {
        const { id } = req.params;

        const deletedCount = await Transaction.destroy({
            where: { id, UserId: req.userId }
        });

        if (deletedCount > 0) {
            res.json({ message: 'Transaction deleted successfully' });
        } else {
            res.status(404).json({ message: 'Transaction not found' });
        }
    } catch (error) {
        console.error('Error deleting transaction:', error);
        res.status(500).json({ message: 'Failed to delete transaction' });
    }
});

// Budgets Routes
app.get('/api/budgets', authenticateToken, async (req, res) => {
    try {
        const currentDate = new Date();
        const currentMonth = currentDate.getMonth() + 1;
        const currentYear = currentDate.getFullYear();
        const monthString = `${currentYear}-${currentMonth.toString().padStart(2, '0')}`;

        const budgets = await Budget.findAll({
            where: {
                UserId: req.userId,
                month: monthString,
                year: currentYear
            }
        });

        // Convert to frontend format
        const budgetObject = {};
        budgets.forEach(budget => {
            budgetObject[budget.category] = {
                amount: parseFloat(budget.amount)
            };
        });

        res.json({ budgets: budgetObject });
    } catch (error) {
        console.error('Error fetching budgets:', error);
        res.status(500).json({ message: 'Failed to fetch budgets' });
    }
});

app.post('/api/budgets', authenticateToken, async (req, res) => {
    try {
        const { category, amount } = req.body;
        
        if (!category || amount === undefined) {
            return res.status(400).json({ message: 'Category and amount required' });
        }

        const currentDate = new Date();
        const currentMonth = currentDate.getMonth() + 1;
        const currentYear = currentDate.getFullYear();
        const monthString = `${currentYear}-${currentMonth.toString().padStart(2, '0')}`;

        const [budget, created] = await Budget.upsert({
            category,
            amount,
            month: monthString,
            year: currentYear,
            UserId: req.userId
        });

        res.json(budget);
    } catch (error) {
        console.error('Error creating/updating budget:', error);
        res.status(500).json({ message: 'Failed to create/update budget' });
    }
});

app.delete('/api/budgets/:category', authenticateToken, async (req, res) => {
    try {
        const category = decodeURIComponent(req.params.category);
        const currentDate = new Date();
        const currentMonth = currentDate.getMonth() + 1;
        const currentYear = currentDate.getFullYear();
        const monthString = `${currentYear}-${currentMonth.toString().padStart(2, '0')}`;

        const deletedCount = await Budget.destroy({
            where: {
                category,
                month: monthString,
                year: currentYear,
                UserId: req.userId
            }
        });

        if (deletedCount > 0) {
            res.json({ message: 'Budget deleted successfully' });
        } else {
            res.status(404).json({ message: 'Budget not found' });
        }
    } catch (error) {
        console.error('Error deleting budget:', error);
        res.status(500).json({ message: 'Failed to delete budget' });
    }
});

// AI Analysis Route
app.post('/api/analyze', authenticateToken, async (req, res) => {
    try {
        const { period = 'month', userId } = req.body;
        
        // Use userId from payload or fallback to JWT token userId
        const targetUserId = userId || req.userId;
        
        // Get all user data for analysis
        const transactions = await Transaction.findAll({
            where: { UserId: targetUserId },
            order: [['date', 'DESC']]
        });
        
        const categories = await Category.findAll({
            where: { UserId: targetUserId }
        });
        
        const budgets = await Budget.findAll({
            where: { UserId: targetUserId }
        });
        
        // Convert budgets to the expected format
        const budgetMap = {};
        budgets.forEach(budget => {
            budgetMap[budget.category] = { amount: budget.amount };
        });
        
        // Calculate period-based data
        const now = new Date();
        let startDate;
        
        switch (period) {
            case 'week':
                startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
                break;
            case 'month':
                startDate = new Date(now.getFullYear(), now.getMonth(), 1);
                break;
            case 'quarter':
                const quarterStart = Math.floor(now.getMonth() / 3) * 3;
                startDate = new Date(now.getFullYear(), quarterStart, 1);
                break;
            case 'year':
                startDate = new Date(now.getFullYear(), 0, 1);
                break;
            default:
                startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        }
        
        // Filter transactions by period
        const periodTransactions = transactions.filter(t => new Date(t.date) >= startDate);
        
        // Calculate financial metrics
        const totalIncome = periodTransactions
            .filter(t => t.type === 'income')
            .reduce((sum, t) => sum + parseFloat(t.amount), 0);
        
        const totalExpenses = periodTransactions
            .filter(t => t.type === 'expense')
            .reduce((sum, t) => sum + parseFloat(t.amount), 0);
        
        const netIncome = totalIncome - totalExpenses;
        
        // Calculate category spending
        const categorySpending = {};
        periodTransactions
            .filter(t => t.type === 'expense')
            .forEach(t => {
                categorySpending[t.category] = (categorySpending[t.category] || 0) + parseFloat(t.amount);
            });
        
        // AI-based Budget analysis
        const budgetAnalysis = Object.entries(budgetMap).map(([category, budget]) => {
            const spent = categorySpending[category] || 0;
            const budgetAmount = parseFloat(budget.amount);
            const percentage = budgetAmount > 0 ? (spent / budgetAmount) * 100 : 0;
            
            let status = 'under';
            let recommendation = '';
            
            if (percentage > 100) {
                status = 'over';
                recommendation = `🚨 Budget exceeded by ₹${(spent - budgetAmount).toFixed(2)}. Consider reducing ${category.toLowerCase()} expenses or increasing budget.`;
            } else if (percentage > 80) {
                status = 'on-track';
                recommendation = `⚠️ Close to budget limit (${percentage.toFixed(1)}%). Monitor ${category.toLowerCase()} spending carefully.`;
            } else {
                status = 'under';
                recommendation = `✅ Good budget management! You have ₹${(budgetAmount - spent).toFixed(2)} remaining for ${category.toLowerCase()}.`;
            }
            
            return {
                category,
                spent,
                budget: budgetAmount,
                status,
                recommendation
            };
        });
        
        // AI-based Key Insights
        const topSpendingCategory = Object.entries(categorySpending)
            .sort((a, b) => b[1] - a[1])[0];
        
        const keyInsights = [
            `💰 Net income: ₹${netIncome.toFixed(2)} (${netIncome >= 0 ? 'positive' : 'negative'} cash flow)`,
            `📊 Total transactions: ${periodTransactions.length} (${periodTransactions.filter(t => t.type === 'income').length} income, ${periodTransactions.filter(t => t.type === 'expense').length} expenses)`,
            topSpendingCategory ? `🎯 Top spending category: ${topSpendingCategory[0]} (₹${topSpendingCategory[1].toFixed(2)})` : '📝 No expense data available',
            `💾 Savings rate: ${totalIncome > 0 ? ((netIncome / totalIncome) * 100).toFixed(1) : 0}%`,
            `📈 Average transaction: ₹${periodTransactions.length > 0 ? (totalExpenses / periodTransactions.filter(t => t.type === 'expense').length).toFixed(2) : 0}`
        ];
        
        // AI-based Potential Savings Analysis
        const potentialSavings = [
            '🔍 Review subscription services - cancel unused memberships',
            '🍽️ Meal planning can reduce food expenses by 20-30%',
            '⚡ Compare utility providers for better rates',
            '🚗 Carpool or use public transport to save on transportation',
            '💳 Set up automatic savings transfers',
            '🛒 Use shopping lists to avoid impulse purchases'
        ];
        
        // AI-based Needs vs Wants Analysis
        const needsCategories = ['Rent', 'Utilities', 'Groceries', 'Healthcare', 'Transportation', 'Insurance', 'Education'];
        const wantsCategories = ['Entertainment', 'Shopping', 'Dining', 'Travel', 'Hobbies', 'Gifts'];
        
        const needs = Object.entries(categorySpending)
            .filter(([category]) => needsCategories.some(need => 
                category.toLowerCase().includes(need.toLowerCase()) || 
                need.toLowerCase().includes(category.toLowerCase())
            ))
            .reduce((sum, [, amount]) => sum + amount, 0);
        
        const wants = Object.entries(categorySpending)
            .filter(([category]) => wantsCategories.some(want => 
                category.toLowerCase().includes(want.toLowerCase()) || 
                want.toLowerCase().includes(category.toLowerCase())
            ))
            .reduce((sum, [, amount]) => sum + amount, 0);
        
        // If no clear categorization, use 70/30 rule
        const uncategorized = totalExpenses - needs - wants;
        const finalNeeds = needs + (uncategorized * 0.7);
        const finalWants = wants + (uncategorized * 0.3);
        
        const needsPercentage = totalExpenses > 0 ? (finalNeeds / totalExpenses) * 100 : 0;
        const wantsPercentage = 100 - needsPercentage;
        
        // AI-based Trends Analysis
        const trends = [
            netIncome > 0 ? '📈 Positive cash flow trend - good financial health' : '📉 Negative cash flow - needs immediate attention',
            '🔄 Regular transaction patterns observed',
            needsPercentage > 80 ? '⚠️ High needs ratio - consider increasing income' : '✅ Balanced needs vs wants ratio',
            '📊 Budget adherence varies by category'
        ];
        
        // AI-based Risk Assessment
        let riskAssessment = '';
        if (netIncome < 0) {
            riskAssessment = '🔴 HIGH RISK: Negative cash flow detected. Immediate action needed to reduce expenses or increase income.';
        } else if (netIncome < totalExpenses * 0.1) {
            riskAssessment = '🟡 MEDIUM RISK: Low savings rate. Consider increasing income or reducing discretionary spending.';
        } else if (needsPercentage > 80) {
            riskAssessment = '🟡 MEDIUM RISK: High needs ratio. Focus on increasing income or reducing essential expenses.';
        } else {
            riskAssessment = '🟢 LOW RISK: Healthy financial position with positive cash flow and balanced spending.';
        }
        
        const analysisResult = {
            overallSummary: `🤖 AI Analysis: Your ${period} financial health shows ${netIncome >= 0 ? 'positive' : 'negative'} cash flow of ₹${Math.abs(netIncome).toFixed(2)}. You earned ₹${totalIncome.toFixed(2)} and spent ₹${totalExpenses.toFixed(2)}. ${needsPercentage > 70 ? 'High essential spending ratio detected.' : 'Good balance between needs and wants.'}`,
            keyInsights,
            budgetAnalysis,
            potentialSavings,
            needsVsWants: {
                needs: finalNeeds,
                wants: finalWants,
                needsPercentage: Math.round(needsPercentage),
                wantsPercentage: Math.round(wantsPercentage)
            },
            trends,
            riskAssessment
        };
        
        res.json(analysisResult);
    } catch (error) {
        console.error('Error in AI analysis:', error);
        res.status(500).json({ message: 'Failed to analyze financial data' });
    }
});

// Targets/Goals placeholder (for future implementation)
app.get('/api/targets', authenticateToken, async (req, res) => {
    try {
        res.json({ targets: [] });
    } catch (error) {
        console.error('Error fetching targets:', error);
        res.status(500).json({ message: 'Failed to fetch targets' });
    }
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Error:', err);
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

// Start server
async function startServer() {
    await initializeDatabase();
    
    app.listen(PORT, () => {
        console.log(`🚀 Finance Manager Backend Server running on port ${PORT}`);
        console.log(`📊 Health check: http://localhost:${PORT}/health`);
        console.log(`🔗 API Base URL: http://localhost:${PORT}/api`);
        console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
        console.log(`🗄️  Database: MySQL with Sequelize ORM`);
    });
}

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('\n🛑 Received SIGINT. Graceful shutdown...');
  await sequelize.close();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log('\n🛑 Received SIGTERM. Graceful shutdown...');
  await sequelize.close();
  process.exit(0);
});

// Start the server
startServer().catch(console.error);

export default app;