import React, { useMemo } from 'react';
import {
  LinearProgress,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow
} from '@mui/material';
import {
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
  AccountBalance as AccountBalanceIcon,
  PieChart as PieChartIcon
} from '@mui/icons-material';
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';
import { Transaction, Category, Budget } from '../types';

interface DashboardProps {
  transactions?: Transaction[];
  categories?: Category[];
  budgets?: Budget;
  currency: string;
}

const Dashboard: React.FC<DashboardProps> = ({ transactions = [], categories = [], budgets = {}, currency }) => {
  const stats = useMemo(() => {
    const totalIncome = (transactions || [])
      .filter(t => t.type === 'income')
      .reduce((sum, t) => sum + Number(t.amount), 0);

    const totalExpenses = (transactions || [])
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + Number(t.amount), 0);

    const netIncome = totalIncome - totalExpenses;

    const totalBudget = Object.values(budgets || {})
      .reduce((sum, budget) => sum + Number(budget.amount), 0);

    const budgetUsed = Object.entries(budgets || {}).reduce((sum, [category, budget]) => {
      const spent = (transactions || [])
        .filter(t => t.type === 'expense' && t.category === category)
        .reduce((catSum, t) => catSum + Number(t.amount), 0);
      return sum + spent;
    }, 0);

    return {
      totalIncome,
      totalExpenses,
      netIncome,
      totalBudget,
      budgetUsed,
      budgetRemaining: totalBudget - budgetUsed
    };
  }, [transactions, budgets]);

  // Chart data for expenses by category
  const expenseChartData = useMemo(() => {
    const categoryExpenses = (transactions || [])
      .filter(t => t.type === 'expense')
      .reduce((acc, t) => {
        acc[t.category] = (acc[t.category] || 0) + Number(t.amount);
        return acc;
      }, {} as Record<string, number>);

    return Object.entries(categoryExpenses).map(([category, amount]) => ({
      name: category,
      value: amount,
      amount: amount
    }));
  }, [transactions]);

  // Monthly trend data
  const monthlyTrendData = useMemo(() => {
    const monthlyData = (transactions || []).reduce((acc, t) => {
      const month = new Date(t.date).toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
      if (!acc[month]) {
        acc[month] = { income: 0, expenses: 0 };
      }
      if (t.type === 'income') {
        acc[month].income += Number(t.amount);
      } else {
        acc[month].expenses += Number(t.amount);
      }
      return acc;
    }, {} as Record<string, { income: number; expenses: number }>);

    return Object.entries(monthlyData).map(([month, data]) => ({
      month,
      income: data.income,
      expenses: data.expenses,
      net: data.income - data.expenses
    }));
  }, [transactions]);

  const recentTransactions = (transactions || []).slice(0, 5);

  const COLORS = ['#1976d2', '#4caf50', '#f44336', '#ff9800', '#9c27b0', '#00bcd4', '#795548', '#607d8b'];

  return (
    <div className="min-h-screen bg-dark-blue overflow-x-hidden">
      {/* Header */}
      <div className="p-4 md:p-8 pb-4">
        <h1 className="text-2xl md:text-4xl font-light text-text-primary mb-2">
          Dashboard
        </h1>
        <p className="text-text-secondary text-sm md:text-base">
          Overview of your financial health
        </p>
      </div>

      {/* Stats Cards */}
      <div className="p-4 md:p-8 pb-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="card text-center min-h-[140px] flex flex-col justify-center">
          <TrendingUpIcon className="text-5xl text-accent-green mb-4" />
          <div className="text-2xl font-semibold text-accent-green mb-2">
            {currency}{(Number(stats.totalIncome) || 0).toFixed(2)}
          </div>
          <div className="text-text-secondary">Total Income</div>
        </div>

        <div className="card text-center min-h-[140px] flex flex-col justify-center">
          <TrendingDownIcon className="text-5xl text-accent-red mb-4" />
          <div className="text-2xl font-semibold text-accent-red mb-2">
            {currency}{(Number(stats.totalExpenses) || 0).toFixed(2)}
          </div>
          <div className="text-text-secondary">Total Expenses</div>
        </div>

        <div className="card text-center min-h-[140px] flex flex-col justify-center">
          <AccountBalanceIcon className={`text-5xl mb-4 ${(Number(stats.netIncome) || 0) >= 0 ? 'text-accent-green' : 'text-accent-red'}`} />
          <div className={`text-2xl font-semibold mb-2 ${(Number(stats.netIncome) || 0) >= 0 ? 'text-accent-green' : 'text-accent-red'}`}>
            {currency}{Math.abs(Number(stats.netIncome) || 0).toFixed(2)}
          </div>
          <div className="text-text-secondary">Net {(Number(stats.netIncome) || 0) >= 0 ? 'Income' : 'Loss'}</div>
        </div>

        <div className="card text-center min-h-[140px] flex flex-col justify-center">
          <PieChartIcon className="text-5xl text-accent-blue mb-4" />
          <div className="text-2xl font-semibold text-accent-blue mb-2">
            {currency}{(Number(stats.budgetUsed) || 0).toFixed(2)}
          </div>
          <div className="text-text-secondary">Budget Used</div>
        </div>
      </div>

      {/* Charts Row */}
      <div className="p-4 md:p-8 pb-4 grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Expenses by Category Pie Chart */}
        <div className="card">
          <h2 className="text-xl font-semibold text-text-primary mb-4">Expenses by Category</h2>
          {expenseChartData.length > 0 ? (
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={expenseChartData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={(entry: any) => `${entry.name} ${(entry.percent * 100).toFixed(0)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {expenseChartData.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => [`${currency}${Number(value).toFixed(2)}`, 'Amount']} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="h-64 flex items-center justify-center text-text-secondary">
              No expense data available
            </div>
          )}
        </div>

        {/* Monthly Trend Bar Chart */}
        <div className="card">
          <h2 className="text-xl font-semibold text-text-primary mb-4">Monthly Trend</h2>
          {monthlyTrendData.length > 0 ? (
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={monthlyTrendData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#3a3a4e" />
                  <XAxis dataKey="month" stroke="#b0b0b0" />
                  <YAxis stroke="#b0b0b0" />
                  <Tooltip 
                    formatter={(value, name) => [`${currency}${Number(value).toFixed(2)}`, name === 'income' ? 'Income' : name === 'expenses' ? 'Expenses' : 'Net']}
                    labelStyle={{ color: '#000' }}
                    contentStyle={{ backgroundColor: '#2a2a3e', border: '1px solid #3a3a4e' }}
                  />
                  <Legend />
                  <Bar dataKey="income" fill="#4caf50" name="Income" />
                  <Bar dataKey="expenses" fill="#f44336" name="Expenses" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="h-64 flex items-center justify-center text-text-secondary">
              No trend data available
            </div>
          )}
        </div>
      </div>

      {/* Budget Overview and Recent Transactions */}
      <div className="p-4 md:p-8 grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Budget Overview */}
        <div className="card">
          <h2 className="text-xl font-semibold text-text-primary mb-4">Budget Overview</h2>
          <div className="space-y-4">
            {Object.entries(budgets || {}).map(([category, budget]) => {
              const spent = (transactions || [])
                .filter(t => t.type === 'expense' && t.category === category)
                .reduce((sum, t) => sum + Number(t.amount), 0);
              const percentage = Number(budget.amount) > 0 ? (spent / Number(budget.amount)) * 100 : 0;
              
              return (
                <div key={category} className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-text-primary font-medium">{category}</span>
                    <div className="flex items-center gap-2">
                      <span className="text-text-secondary text-sm">
                        {currency}{spent.toFixed(2)} / {currency}{Number(budget.amount).toFixed(2)}
                      </span>
                      <Chip
                        label={`${percentage.toFixed(1)}%`}
                        size="small"
                        color={percentage > 100 ? 'error' : percentage > 80 ? 'warning' : 'success'}
                      />
                    </div>
                  </div>
                  <LinearProgress
                    variant="determinate"
                    value={Math.min(percentage, 100)}
                    sx={{
                      height: 8,
                      borderRadius: 4,
                      backgroundColor: '#3a3a4e',
                      '& .MuiLinearProgress-bar': {
                        backgroundColor: percentage > 100 ? '#f44336' : percentage > 80 ? '#ff9800' : '#4caf50'
                      }
                    }}
                  />
                </div>
              );
            })}
          </div>
        </div>

        {/* Recent Transactions */}
        <div className="card">
          <h2 className="text-xl font-semibold text-text-primary mb-4">Recent Transactions</h2>
          {recentTransactions.length === 0 ? (
            <div className="text-center py-8 text-text-secondary">
              No transactions yet
            </div>
          ) : (
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell sx={{ color: '#b0b0b0', borderColor: '#3a3a4e' }}>Description</TableCell>
                    <TableCell sx={{ color: '#b0b0b0', borderColor: '#3a3a4e' }}>Category</TableCell>
                    <TableCell sx={{ color: '#b0b0b0', borderColor: '#3a3a4e' }}>Amount</TableCell>
                    <TableCell sx={{ color: '#b0b0b0', borderColor: '#3a3a4e' }}>Date</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {recentTransactions.map((transaction) => (
                    <TableRow key={transaction.id}>
                      <TableCell sx={{ color: '#ffffff', borderColor: '#3a3a4e' }}>
                        {transaction.description}
                      </TableCell>
                      <TableCell sx={{ color: '#b0b0b0', borderColor: '#3a3a4e' }}>
                        {transaction.category}
                      </TableCell>
                      <TableCell sx={{ 
                        color: transaction.type === 'income' ? '#4caf50' : '#f44336',
                        borderColor: '#3a3a4e'
                      }}>
                        {transaction.type === 'income' ? '+' : '-'}{currency}{Number(transaction.amount).toFixed(2)}
                      </TableCell>
                      <TableCell sx={{ color: '#b0b0b0', borderColor: '#3a3a4e' }}>
                        {new Date(transaction.date).toLocaleDateString()}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
