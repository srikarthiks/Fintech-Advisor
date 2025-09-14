import React, { useState, useMemo } from 'react';
import {
  Box,
  Card,
  Typography,
  Button,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  CircularProgress,
  Alert,
  Chip,
  LinearProgress
} from '@mui/material';
import {
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
  PieChart as PieChartIcon,
  BarChart as BarChartIcon,
  Insights as InsightsIcon
} from '@mui/icons-material';
import { Transaction, Budget, AnalysisResult, Category, User } from '../types';
import { apiService } from '../services/apiService';

interface AnalysisPageProps {
  transactions: Transaction[];
  budgets: Budget;
  categories: Category[];
  user: User | null;
  currency: string;
}

const AnalysisPage: React.FC<AnalysisPageProps> = ({
  transactions,
  budgets,
  categories,
  user,
  currency
}) => {
  const [selectedPeriod, setSelectedPeriod] = useState<'week' | 'month' | 'quarter' | 'year'>('month');
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Calculate basic stats
  const stats = useMemo(() => {
    const now = new Date();
    let startDate: Date;

    switch (selectedPeriod) {
      case 'week':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case 'month':
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        break;
      case 'quarter':
        const quarter = Math.floor(now.getMonth() / 3);
        startDate = new Date(now.getFullYear(), quarter * 3, 1);
        break;
      case 'year':
        startDate = new Date(now.getFullYear(), 0, 1);
        break;
      default:
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
    }

    const periodTransactions = transactions.filter(t => 
      new Date(t.date) >= startDate && new Date(t.date) <= now
    );

    const income = periodTransactions
      .filter(t => t.type === 'income')
      .reduce((sum, t) => sum + Number(t.amount), 0);

    const expenses = periodTransactions
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + Number(t.amount), 0);

    const netIncome = income - expenses;

    // Category breakdown
    const categoryBreakdown = periodTransactions
      .filter(t => t.type === 'expense')
      .reduce((acc, t) => {
        acc[t.category] = (acc[t.category] || 0) + Number(t.amount);
        return acc;
      }, {} as Record<string, number>);

    return {
      income,
      expenses,
      netIncome,
      categoryBreakdown,
      transactionCount: periodTransactions.length
    };
  }, [transactions, selectedPeriod]);

  const handleAnalyze = async () => {
    console.log('Analysis Debug:', {
      user: user,
      userId: user?.id,
      token: localStorage.getItem('token'),
      period: selectedPeriod
    });

    if (!user?.id) {
      setError('User not found. Please login again.');
      return;
    }

    setIsAnalyzing(true);
    setError(null);

    try {
      // Use backend AI analysis with real-time data and user ID
      const analysisResult = await apiService.analyzeFinancialData(selectedPeriod, user.id);
      setAnalysisResult(analysisResult);
    } catch (error) {
      console.error('AI Analysis Error:', error);
      setError('Failed to analyze your financial data with AI. Please try again.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <div className="min-h-screen bg-dark-blue overflow-x-hidden">
      {/* Header */}
      <div className="p-4 md:p-8 pb-4">
        <div className="flex flex-col md:flex-row justify-between items-stretch md:items-center gap-4">
          <div>
            <h1 className="text-2xl md:text-4xl font-light text-text-primary mb-2">
              Financial Analysis
            </h1>
            <p className="text-text-secondary text-sm md:text-base">
              Get insights into your spending patterns and financial health
            </p>
          </div>

          <div className="flex gap-4 flex-col sm:flex-row">
            <FormControl size="small" sx={{ minWidth: 120 }}>
              <InputLabel sx={{ color: '#b0b0b0' }}>Period</InputLabel>
              <Select
                value={selectedPeriod}
                onChange={(e) => setSelectedPeriod(e.target.value as any)}
                sx={{
                  color: '#ffffff',
                  '& .MuiOutlinedInput-notchedOutline': {
                    borderColor: '#3a3a4e'
                  },
                  '&:hover .MuiOutlinedInput-notchedOutline': {
                    borderColor: '#1976d2'
                  }
                }}
              >
                <MenuItem value="week">This Week</MenuItem>
                <MenuItem value="month">This Month</MenuItem>
                <MenuItem value="quarter">This Quarter</MenuItem>
                <MenuItem value="year">This Year</MenuItem>
              </Select>
            </FormControl>

            <Button
              variant="contained"
              onClick={handleAnalyze}
              disabled={isAnalyzing}
              startIcon={isAnalyzing ? <CircularProgress size={20} /> : <InsightsIcon />}
              sx={{
                background: '#1976d2',
                '&:hover': { background: '#1565c0' }
              }}
            >
              {isAnalyzing ? 'Analyzing...' : 'Analyze'}
            </Button>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="p-4 md:p-8 pb-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="card text-center min-h-[140px] flex flex-col justify-center">
          <TrendingUpIcon className="text-5xl text-accent-green mb-4" />
          <div className="text-2xl font-semibold text-accent-green mb-2">
            {currency}{(Number(stats.income) || 0).toFixed(2)}
          </div>
          <div className="text-text-secondary">Total Income</div>
        </div>

        <div className="card text-center min-h-[140px] flex flex-col justify-center">
          <TrendingDownIcon className="text-5xl text-accent-red mb-4" />
          <div className="text-2xl font-semibold text-accent-red mb-2">
            {currency}{(Number(stats.expenses) || 0).toFixed(2)}
          </div>
          <div className="text-text-secondary">Total Expenses</div>
        </div>

        <div className="card text-center min-h-[140px] flex flex-col justify-center">
          <PieChartIcon className={`text-5xl mb-4 ${(Number(stats.netIncome) || 0) >= 0 ? 'text-accent-green' : 'text-accent-red'}`} />
          <div className={`text-2xl font-semibold mb-2 ${(Number(stats.netIncome) || 0) >= 0 ? 'text-accent-green' : 'text-accent-red'}`}>
            {currency}{Math.abs(Number(stats.netIncome) || 0).toFixed(2)}
          </div>
          <div className="text-text-secondary">Net {(Number(stats.netIncome) || 0) >= 0 ? 'Income' : 'Loss'}</div>
        </div>

        <div className="card text-center min-h-[140px] flex flex-col justify-center">
          <BarChartIcon className="text-5xl text-accent-blue mb-4" />
          <div className="text-2xl font-semibold text-accent-blue mb-2">
            {stats.transactionCount}
          </div>
          <div className="text-text-secondary">Transactions</div>
        </div>
      </div>

      {/* Analysis Results */}
      {error && (
        <div className="mx-4 md:mx-8 mb-4">
          <Alert severity="error">{error}</Alert>
        </div>
      )}

      {analysisResult && (
        <div className="mx-4 md:mx-8 space-y-6">
          {/* Overall Summary */}
          <div className="card">
            <h2 className="text-xl font-semibold text-text-primary mb-4">Summary</h2>
            <p className="text-text-secondary">{analysisResult.overallSummary}</p>
          </div>

          {/* Key Insights */}
          <div className="card">
            <h2 className="text-xl font-semibold text-text-primary mb-4">Key Insights</h2>
            <div className="space-y-3">
              {analysisResult.keyInsights.map((insight, index) => (
                <div key={index} className="flex items-start gap-3">
                  <div className="w-2 h-2 bg-accent-blue rounded-full mt-2 flex-shrink-0"></div>
                  <p className="text-text-secondary">{insight}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Budget Analysis */}
          <div className="card">
            <h2 className="text-xl font-semibold text-text-primary mb-4">Budget Analysis</h2>
            <div className="space-y-4">
              {analysisResult.budgetAnalysis.map((item, index) => {
                const percentage = item.budget > 0 ? (item.spent / item.budget) * 100 : 0;
                return (
                  <div key={index} className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-text-primary font-medium">{item.category}</span>
                      <div className="flex items-center gap-2">
                        <span className="text-text-secondary text-sm">
                          {currency}{item.spent.toLocaleString()} / {currency}{item.budget.toLocaleString()}
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

          {/* Needs vs Wants */}
          <div className="card">
            <h2 className="text-xl font-semibold text-text-primary mb-4">Needs vs Wants</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="text-center">
                <div className="text-3xl font-bold text-accent-blue mb-2">
                  {analysisResult.needsVsWants.needsPercentage}%
                </div>
                <div className="text-text-secondary mb-2">Needs</div>
                <div className="text-text-primary">
                  {currency}{analysisResult.needsVsWants.needs.toLocaleString()}
                </div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-accent-orange mb-2">
                  {analysisResult.needsVsWants.wantsPercentage}%
                </div>
                <div className="text-text-secondary mb-2">Wants</div>
                <div className="text-text-primary">
                  {currency}{analysisResult.needsVsWants.wants.toLocaleString()}
                </div>
              </div>
            </div>
          </div>

          {/* Potential Savings */}
          <div className="card">
            <h2 className="text-xl font-semibold text-text-primary mb-4">Potential Savings</h2>
            <div className="space-y-3">
              {analysisResult.potentialSavings.map((saving, index) => (
                <div key={index} className="flex items-start gap-3">
                  <div className="w-2 h-2 bg-accent-green rounded-full mt-2 flex-shrink-0"></div>
                  <p className="text-text-secondary">{saving}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AnalysisPage;
