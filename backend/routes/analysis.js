// Financial analysis routes
import express from 'express';
import { db } from '../config/database.js';

const router = express.Router();

// Get comprehensive financial analysis
router.post('/analyze', (req, res) => {
  const userId = req.user.id;

  try {
    // Get all user data for analysis
    Promise.all([
      getUserTransactions(userId),
      getUserTargets(userId),
      getUserBudgets(userId)
    ]).then(([transactions, targets, budgets]) => {
      // Perform financial analysis
      const analysis = performFinancialAnalysis(transactions, targets, budgets);
      
      res.json({
        success: true,
        analysis: analysis,
        recommendations: generateRecommendations(analysis),
        summary: generateSummary(analysis)
      });
    }).catch(error => {
      console.error('Analysis error:', error);
      res.status(500).json({ 
        success: false, 
        error: 'Failed to perform financial analysis' 
      });
    });
  } catch (error) {
    console.error('Analysis error:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Internal server error' 
    });
  }
});

// Helper function to get user transactions
function getUserTransactions(userId) {
  return new Promise((resolve, reject) => {
    db.all(
      'SELECT * FROM transactions WHERE user_id = ? ORDER BY date DESC',
      [userId],
      (err, transactions) => {
        if (err) {
          reject(err);
        } else {
          resolve(transactions || []);
        }
      }
    );
  });
}

// Helper function to get user targets
function getUserTargets(userId) {
  return new Promise((resolve, reject) => {
    db.all(
      'SELECT * FROM targets WHERE user_id = ?',
      [userId],
      (err, targets) => {
        if (err) {
          reject(err);
        } else {
          resolve(targets || []);
        }
      }
    );
  });
}

// Helper function to get user budgets
function getUserBudgets(userId) {
  return new Promise((resolve, reject) => {
    db.all(
      'SELECT b.*, c.name as category_name FROM budgets b JOIN categories c ON b.category_id = c.id WHERE b.user_id = ?',
      [userId],
      (err, budgets) => {
        if (err) {
          reject(err);
        } else {
          resolve(budgets || []);
        }
      }
    );
  });
}

// Perform comprehensive financial analysis
function performFinancialAnalysis(transactions, targets, budgets) {
  const currentDate = new Date();
  const currentMonth = currentDate.getMonth() + 1;
  const currentYear = currentDate.getFullYear();

  // Income analysis
  const incomeTransactions = transactions.filter(t => t.type === 'income');
  const totalIncome = incomeTransactions.reduce((sum, t) => sum + t.amount, 0);
  const monthlyIncome = calculateMonthlyAverage(incomeTransactions);

  // Expense analysis
  const expenseTransactions = transactions.filter(t => t.type === 'expense');
  const totalExpenses = expenseTransactions.reduce((sum, t) => sum + t.amount, 0);
  const monthlyExpenses = calculateMonthlyAverage(expenseTransactions);

  // Investment analysis
  const investmentTransactions = transactions.filter(t => t.type === 'investment');
  const totalInvestments = investmentTransactions.reduce((sum, t) => sum + t.amount, 0);
  const monthlyInvestments = calculateMonthlyAverage(investmentTransactions);

  // Net income calculation
  const netIncome = totalIncome - totalExpenses;
  const monthlyNetIncome = monthlyIncome - monthlyExpenses;

  // Savings rate
  const savingsRate = totalIncome > 0 ? ((totalIncome - totalExpenses) / totalIncome) * 100 : 0;

  // Category breakdown
  const expenseCategories = getCategoryBreakdown(expenseTransactions);
  const incomeCategories = getCategoryBreakdown(incomeTransactions);

  // Target progress analysis
  const targetAnalysis = analyzeTargets(targets);

  // Budget vs actual analysis
  const budgetAnalysis = analyzeBudgets(budgets, transactions, currentMonth, currentYear);

  // Spending trends
  const spendingTrends = analyzeSpendingTrends(transactions);

  // Financial health score
  const healthScore = calculateFinancialHealthScore({
    savingsRate,
    monthlyNetIncome,
    targetAnalysis,
    budgetAnalysis,
    spendingTrends
  });

  return {
    income: {
      total: totalIncome,
      monthly: monthlyIncome,
      transactions: incomeTransactions.length,
      categories: incomeCategories
    },
    expenses: {
      total: totalExpenses,
      monthly: monthlyExpenses,
      transactions: expenseTransactions.length,
      categories: expenseCategories
    },
    investments: {
      total: totalInvestments,
      monthly: monthlyInvestments,
      transactions: investmentTransactions.length
    },
    netIncome: {
      total: netIncome,
      monthly: monthlyNetIncome
    },
    savingsRate: Math.round(savingsRate * 100) / 100,
    targets: targetAnalysis,
    budgets: budgetAnalysis,
    trends: spendingTrends,
    healthScore: healthScore,
    period: {
      startDate: transactions.length > 0 ? transactions[transactions.length - 1].date : null,
      endDate: transactions.length > 0 ? transactions[0].date : null,
      totalTransactions: transactions.length
    }
  };
}

// Calculate monthly average
function calculateMonthlyAverage(transactions) {
  if (transactions.length === 0) return 0;

  const dates = transactions.map(t => new Date(t.date));
  const earliestDate = new Date(Math.min(...dates));
  const latestDate = new Date(Math.max(...dates));
  
  const monthsDiff = (latestDate.getFullYear() - earliestDate.getFullYear()) * 12 + 
                     (latestDate.getMonth() - earliestDate.getMonth()) + 1;
  
  const totalAmount = transactions.reduce((sum, t) => sum + t.amount, 0);
  return totalAmount / monthsDiff;
}

// Get category breakdown
function getCategoryBreakdown(transactions) {
  const categories = {};
  transactions.forEach(t => {
    const category = t.category || 'Uncategorized';
    categories[category] = (categories[category] || 0) + t.amount;
  });

  return Object.entries(categories)
    .map(([name, amount]) => ({ name, amount }))
    .sort((a, b) => b.amount - a.amount);
}

// Analyze targets
function analyzeTargets(targets) {
  const totalTargets = targets.length;
  const totalTargetAmount = targets.reduce((sum, t) => sum + t.target_amount, 0);
  const totalCurrentAmount = targets.reduce((sum, t) => sum + (t.current_amount || 0), 0);
  const overallProgress = totalTargetAmount > 0 ? (totalCurrentAmount / totalTargetAmount) * 100 : 0;

  const completedTargets = targets.filter(t => (t.current_amount || 0) >= t.target_amount).length;
  const onTrackTargets = targets.filter(t => {
    const progress = (t.current_amount || 0) / t.target_amount;
    const targetDate = new Date(t.target_date);
    const currentDate = new Date();
    const totalDays = (targetDate - new Date(t.created_at)) / (1000 * 60 * 60 * 24);
    const daysPassed = (currentDate - new Date(t.created_at)) / (1000 * 60 * 60 * 24);
    const expectedProgress = Math.min(daysPassed / totalDays, 1);
    return progress >= expectedProgress * 0.8; // 80% of expected progress
  }).length;

  return {
    totalTargets,
    totalTargetAmount,
    totalCurrentAmount,
    overallProgress: Math.round(overallProgress * 100) / 100,
    completedTargets,
    onTrackTargets,
    behindTargets: totalTargets - completedTargets - onTrackTargets
  };
}

// Analyze budgets
function analyzeBudgets(budgets, transactions, currentMonth, currentYear) {
  const currentBudgets = budgets.filter(b => b.month === currentMonth && b.year === currentYear);
  
  if (currentBudgets.length === 0) {
    return {
      totalBudgets: 0,
      totalBudgetAmount: 0,
      totalSpent: 0,
      overBudget: 0,
      underBudget: 0
    };
  }

  const totalBudgetAmount = currentBudgets.reduce((sum, b) => sum + b.amount, 0);
  
  const totalSpent = currentBudgets.reduce((sum, budget) => {
    const categorySpent = transactions
      .filter(t => t.category === budget.category_name && t.type === 'expense')
      .reduce((categorySum, t) => categorySum + t.amount, 0);
    return sum + Math.min(categorySpent, budget.amount);
  }, 0);

  const overBudget = currentBudgets.filter(budget => {
    const categorySpent = transactions
      .filter(t => t.category === budget.category_name && t.type === 'expense')
      .reduce((sum, t) => sum + t.amount, 0);
    return categorySpent > budget.amount;
  }).length;

  return {
    totalBudgets: currentBudgets.length,
    totalBudgetAmount,
    totalSpent,
    overBudget,
    underBudget: currentBudgets.length - overBudget,
    budgetUtilization: totalBudgetAmount > 0 ? (totalSpent / totalBudgetAmount) * 100 : 0
  };
}

// Analyze spending trends
function analyzeSpendingTrends(transactions) {
  const monthlySpending = {};
  const monthlyIncome = {};

  transactions.forEach(t => {
    const date = new Date(t.date);
    const monthKey = `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}`;
    
    if (t.type === 'expense') {
      monthlySpending[monthKey] = (monthlySpending[monthKey] || 0) + t.amount;
    } else if (t.type === 'income') {
      monthlyIncome[monthKey] = (monthlyIncome[monthKey] || 0) + t.amount;
    }
  });

  const months = Object.keys(monthlySpending).sort();
  const spendingTrend = months.length > 1 ? 
    ((monthlySpending[months[months.length - 1]] || 0) - (monthlySpending[months[0]] || 0)) / months.length : 0;

  return {
    monthlySpending,
    monthlyIncome,
    spendingTrend: Math.round(spendingTrend * 100) / 100,
    trendDirection: spendingTrend > 0 ? 'increasing' : spendingTrend < 0 ? 'decreasing' : 'stable'
  };
}

// Calculate financial health score
function calculateFinancialHealthScore(metrics) {
  let score = 0;
  let maxScore = 0;

  // Savings rate (30 points max)
  maxScore += 30;
  if (metrics.savingsRate >= 20) score += 30;
  else if (metrics.savingsRate >= 10) score += 20;
  else if (metrics.savingsRate >= 5) score += 10;

  // Positive net income (25 points max)
  maxScore += 25;
  if (metrics.monthlyNetIncome > 0) score += 25;
  else if (metrics.monthlyNetIncome >= -1000) score += 15;

  // Target progress (20 points max)
  maxScore += 20;
  if (metrics.targetAnalysis.overallProgress >= 80) score += 20;
  else if (metrics.targetAnalysis.overallProgress >= 50) score += 15;
  else if (metrics.targetAnalysis.overallProgress >= 25) score += 10;

  // Budget adherence (15 points max)
  maxScore += 15;
  if (metrics.budgetAnalysis.overBudget === 0) score += 15;
  else if (metrics.budgetAnalysis.overBudget <= metrics.budgetAnalysis.totalBudgets * 0.3) score += 10;

  // Spending trend (10 points max)
  maxScore += 10;
  if (metrics.spendingTrends.trendDirection === 'decreasing') score += 10;
  else if (metrics.spendingTrends.trendDirection === 'stable') score += 5;

  return Math.round((score / maxScore) * 100);
}

// Generate recommendations
function generateRecommendations(analysis) {
  const recommendations = [];

  if (analysis.savingsRate < 10) {
    recommendations.push({
      type: 'savings',
      priority: 'high',
      title: 'Increase Savings Rate',
      description: `Your current savings rate is ${analysis.savingsRate}%. Consider increasing it to at least 10-20% for better financial security.`,
      action: 'Review your expenses and identify areas to cut costs or increase income.'
    });
  }

  if (analysis.monthlyNetIncome < 0) {
    recommendations.push({
      type: 'income',
      priority: 'critical',
      title: 'Negative Cash Flow',
      description: 'You are spending more than you earn. This is unsustainable in the long term.',
      action: 'Immediately reduce expenses or find ways to increase income.'
    });
  }

  if (analysis.targets.behindTargets > 0) {
    recommendations.push({
      type: 'targets',
      priority: 'medium',
      title: 'Target Progress',
      description: `You have ${analysis.targets.behindTargets} targets that are behind schedule.`,
      action: 'Review your action plans and consider increasing monthly contributions.'
    });
  }

  if (analysis.budgets.overBudget > 0) {
    recommendations.push({
      type: 'budget',
      priority: 'medium',
      title: 'Budget Overspending',
      description: `You are over budget in ${analysis.budgets.overBudget} categories.`,
      action: 'Review your spending patterns and adjust your budget or spending habits.'
    });
  }

  if (analysis.investments.total === 0 && analysis.monthlyNetIncome > 0) {
    recommendations.push({
      type: 'investment',
      priority: 'medium',
      title: 'Start Investing',
      description: 'You have positive cash flow but no investments. Consider starting to invest for long-term growth.',
      action: 'Research investment options like SIPs, mutual funds, or fixed deposits.'
    });
  }

  return recommendations;
}

// Generate summary
function generateSummary(analysis) {
  const healthScore = analysis.healthScore;
  let healthStatus = 'Poor';
  if (healthScore >= 80) healthStatus = 'Excellent';
  else if (healthScore >= 60) healthStatus = 'Good';
  else if (healthScore >= 40) healthStatus = 'Fair';

  return {
    healthScore,
    healthStatus,
    keyMetrics: {
      monthlyIncome: analysis.income.monthly,
      monthlyExpenses: analysis.expenses.monthly,
      monthlySavings: analysis.monthlyNetIncome,
      savingsRate: analysis.savingsRate,
      targetProgress: analysis.targets.overallProgress
    },
    strengths: [
      analysis.savingsRate > 15 ? 'Good savings rate' : null,
      analysis.monthlyNetIncome > 0 ? 'Positive cash flow' : null,
      analysis.targets.completedTargets > 0 ? 'Achieving financial goals' : null,
      analysis.budgets.overBudget === 0 ? 'Good budget adherence' : null
    ].filter(Boolean),
    areasForImprovement: [
      analysis.savingsRate < 10 ? 'Increase savings rate' : null,
      analysis.monthlyNetIncome < 0 ? 'Improve cash flow' : null,
      analysis.targets.behindTargets > 0 ? 'Accelerate target progress' : null,
      analysis.budgets.overBudget > 0 ? 'Better budget management' : null
    ].filter(Boolean)
  };
}

export default router;
