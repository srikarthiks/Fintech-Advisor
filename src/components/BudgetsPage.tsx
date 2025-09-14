import React, { useState, useMemo } from 'react';
import {
  Box,
  Card,
  Typography,
  Button,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  LinearProgress,
  Chip,
  Grid,
  IconButton,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
  AccountBalance as AccountBalanceIcon,
  PieChart as PieChartIcon,
  AddCircle as AddCircleIcon,
  Search as SearchIcon
} from '@mui/icons-material';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { Budget, Category, Transaction } from '../types';
import { apiService } from '../services/apiService';

interface BudgetsPageProps {
  budgets: Budget;
  setBudgets: React.Dispatch<React.SetStateAction<Budget>>;
  categories: Category[];
  setCategories: React.Dispatch<React.SetStateAction<Category[]>>;
  transactions: Transaction[];
  currency: string;
}

const BudgetsPage: React.FC<BudgetsPageProps> = ({
  budgets,
  setBudgets,
  categories,
  setCategories,
  transactions,
  currency
}) => {
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingCategory, setEditingCategory] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    category: '',
    amount: ''
  });
  const [categorySearchValue, setCategorySearchValue] = useState('');
  const [showCategorySuggestions, setShowCategorySuggestions] = useState(false);
  const [showAddCategory, setShowAddCategory] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');

  const expenseCategories = categories.filter(cat => cat.type === 'expense');

  const budgetPerformance = useMemo(() => {
    return expenseCategories.map(category => {
      const budget = budgets[category.name];
      const budgetAmount = budget ? Number(budget.amount) : 0;
      const spent = transactions
        .filter(t => t.type === 'expense' && t.category === category.name)
        .reduce((sum, t) => sum + Number(t.amount), 0);
      
      return {
        category: category.name,
        budgetAmount,
        spent,
        hasBudget: !!budget,
        percentage: budgetAmount > 0 ? (spent / budgetAmount) * 100 : 0
      };
    });
  }, [expenseCategories, budgets, transactions]);

  // Chart data for budget vs spent
  const chartData = useMemo(() => {
    return budgetPerformance
      .filter(item => item.hasBudget && item.budgetAmount > 0)
      .map(item => ({
        name: item.category,
        budget: item.budgetAmount,
        spent: item.spent,
        remaining: Math.max(0, item.budgetAmount - item.spent)
      }));
  }, [budgetPerformance]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const amount = parseFloat(formData.amount);
      
      if (editingCategory) {
        // Update existing budget
        await apiService.createBudget(editingCategory, amount);
      } else {
        // Create new budget
        await apiService.createBudget(formData.category, amount);
      }

      // Refresh budgets
      const updatedBudgets = await apiService.getBudgets();
      setBudgets(updatedBudgets);
      
      resetForm();
      setShowAddForm(false);
    } catch (error) {
      console.error('Error saving budget:', error);
    }
  };

  const handleEdit = (categoryName: string) => {
    const budget = budgets[categoryName];
    setEditingCategory(categoryName);
    setFormData({
      category: categoryName,
      amount: budget ? budget.amount.toString() : ''
    });
    setShowAddForm(true);
  };

  const handleDelete = async (categoryName: string) => {
    if (!window.confirm('Are you sure you want to delete this budget?')) return;
    
    try {
      await apiService.deleteBudget(categoryName);
      
      // Refresh budgets
      const updatedBudgets = await apiService.getBudgets();
      setBudgets(updatedBudgets);
    } catch (error) {
      console.error('Error deleting budget:', error);
    }
  };

  const resetForm = () => {
    setFormData({
      category: '',
      amount: ''
    });
    setEditingCategory(null);
    setCategorySearchValue('');
    setShowCategorySuggestions(false);
  };

  const handleCategorySearch = (value: string) => {
    setCategorySearchValue(value);
    setShowCategorySuggestions(value.length > 0);
    
    // Clear the selected category when user starts typing
    if (formData.category && value !== formData.category) {
      setFormData(prev => ({ ...prev, category: '' }));
    }
    
    // If user types an exact match, select it
    const exactMatch = expenseCategories.find(cat => 
      cat.name.toLowerCase() === value.toLowerCase()
    );
    
    if (exactMatch) {
      setFormData(prev => ({ ...prev, category: exactMatch.name }));
      setCategorySearchValue('');
      setShowCategorySuggestions(false);
    }
  };

  const handleCategorySelect = (categoryName: string) => {
    setFormData(prev => ({ ...prev, category: categoryName }));
    setCategorySearchValue('');
    setShowCategorySuggestions(false);
  };

  const handleCreateNewCategoryFromSearch = async () => {
    if (!categorySearchValue.trim()) return;
    
    try {
      const newCategory = await apiService.createCategory(categorySearchValue.trim(), 'expense') as Category;
      setCategories(prev => [...prev, newCategory]);
      setFormData(prev => ({ ...prev, category: newCategory.name }));
      setCategorySearchValue('');
      setShowCategorySuggestions(false);
    } catch (error) {
      console.error('Error creating category:', error);
    }
  };

  const handleAddCategory = async () => {
    if (!newCategoryName.trim()) return;
    
    try {
      const newCategory = await apiService.createCategory(newCategoryName.trim(), 'expense') as Category;
      setCategories(prev => [...prev, newCategory]);
      setFormData(prev => ({ ...prev, category: newCategory.name }));
      setNewCategoryName('');
      setShowAddCategory(false);
    } catch (error) {
      console.error('Error creating category:', error);
    }
  };

  const getFilteredCategories = () => {
    if (!categorySearchValue) return expenseCategories;
    
    return expenseCategories.filter(cat =>
      cat.name.toLowerCase().includes(categorySearchValue.toLowerCase())
    );
  };

  const totalBudget = Object.values(budgets).reduce((sum, budget) => sum + Number(budget.amount), 0);
  const totalSpent = budgetPerformance.reduce((sum, item) => sum + item.spent, 0);
  const totalRemaining = totalBudget - totalSpent;

  const COLORS = ['#1976d2', '#4caf50', '#f44336', '#ff9800', '#9c27b0', '#00bcd4', '#795548', '#607d8b'];

  return (
    <div className="min-h-screen bg-dark-blue overflow-x-hidden">
      {/* Header */}
      <div className="p-4 md:p-8 pb-4 flex flex-col md:flex-row justify-between items-stretch md:items-center gap-4">
        <div>
          <h1 className="text-2xl md:text-4xl font-light text-text-primary mb-2">
            Budgets
          </h1>
          <p className="text-text-secondary text-sm md:text-base">
            Set and track your monthly spending limits
          </p>
        </div>

        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => setShowAddForm(true)}
          sx={{
            background: '#1976d2',
            '&:hover': { background: '#1565c0' }
          }}
        >
          Add Budget
        </Button>
      </div>

      {/* Budget Overview Cards */}
      <div className="p-4 md:p-8 pb-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="card text-center min-h-[140px] flex flex-col justify-center">
          <AccountBalanceIcon className="text-5xl text-accent-blue mb-4" />
          <div className="text-2xl font-semibold text-accent-blue mb-2">
            {currency}{totalBudget.toFixed(2)}
          </div>
          <div className="text-text-secondary">Total Budget</div>
        </div>

        <div className="card text-center min-h-[140px] flex flex-col justify-center">
          <TrendingDownIcon className="text-5xl text-accent-red mb-4" />
          <div className="text-2xl font-semibold text-accent-red mb-2">
            {currency}{totalSpent.toFixed(2)}
          </div>
          <div className="text-text-secondary">Total Spent</div>
        </div>

        <div className="card text-center min-h-[140px] flex flex-col justify-center">
          <TrendingUpIcon className={`text-5xl mb-4 ${totalRemaining >= 0 ? 'text-accent-green' : 'text-accent-red'}`} />
          <div className={`text-2xl font-semibold mb-2 ${totalRemaining >= 0 ? 'text-accent-green' : 'text-accent-red'}`}>
            {currency}{Math.abs(totalRemaining).toFixed(2)}
          </div>
          <div className="text-text-secondary">{totalRemaining >= 0 ? 'Remaining' : 'Over Budget'}</div>
        </div>

        <div className="card text-center min-h-[140px] flex flex-col justify-center">
          <PieChartIcon className="text-5xl text-accent-orange mb-4" />
          <div className="text-2xl font-semibold text-accent-orange mb-2">
            {totalBudget > 0 ? ((totalSpent / totalBudget) * 100).toFixed(1) : 0}%
          </div>
          <div className="text-text-secondary">Budget Used</div>
        </div>
      </div>

      {/* Budget Chart and List */}
      <div className="p-4 md:p-8 grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Budget vs Spent Chart */}
        <div className="card">
          <h2 className="text-xl font-semibold text-text-primary mb-4">Budget vs Spent</h2>
          {chartData.length > 0 ? (
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={chartData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, spent, budget }) => `${name}: ${currency}${spent.toFixed(0)}/${currency}${budget.toFixed(0)}`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="spent"
                  >
                    {chartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => [`${currency}${Number(value).toFixed(2)}`, 'Spent']} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="h-64 flex items-center justify-center text-text-secondary">
              No budget data available
            </div>
          )}
        </div>

        {/* Budget Performance List */}
        <div className="card">
          <h2 className="text-xl font-semibold text-text-primary mb-4">Budget Performance</h2>
          <div className="space-y-4">
            {budgetPerformance.map((item) => (
              <div key={item.category} className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-text-primary font-medium">{item.category}</span>
                  <div className="flex items-center gap-2">
                    <span className="text-text-secondary text-sm">
                      {currency}{item.spent.toFixed(2)} / {currency}{item.budgetAmount.toFixed(2)}
                    </span>
                    <Chip
                      label={`${item.percentage.toFixed(1)}%`}
                      size="small"
                      color={item.percentage > 100 ? 'error' : item.percentage > 80 ? 'warning' : 'success'}
                    />
                    <div className="flex gap-1">
                      <IconButton
                        size="small"
                        onClick={() => handleEdit(item.category)}
                        sx={{ color: '#1976d2' }}
                      >
                        <EditIcon />
                      </IconButton>
                      {item.hasBudget && (
                        <IconButton
                          size="small"
                          onClick={() => handleDelete(item.category)}
                          sx={{ color: '#f44336' }}
                        >
                          <DeleteIcon />
                        </IconButton>
                      )}
                    </div>
                  </div>
                </div>
                <LinearProgress
                  variant="determinate"
                  value={Math.min(item.percentage, 100)}
                  sx={{
                    height: 8,
                    borderRadius: 4,
                    backgroundColor: '#3a3a4e',
                    '& .MuiLinearProgress-bar': {
                      backgroundColor: item.percentage > 100 ? '#f44336' : item.percentage > 80 ? '#ff9800' : '#4caf50'
                    }
                  }}
                />
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Add/Edit Budget Dialog */}
      <Dialog
        open={showAddForm}
        onClose={() => setShowAddForm(false)}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: {
            background: '#2a2a3e',
            border: '1px solid #3a3a4e'
          }
        }}
      >
        <DialogTitle sx={{ color: '#ffffff', pb: 2 }}>
          {editingCategory ? 'Edit Budget' : 'Add New Budget'}
        </DialogTitle>

        <form onSubmit={handleSubmit}>
          <DialogContent>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, pt: 1 }}>
              <div className="relative">
                <TextField
                  label="Search or type category"
                  value={formData.category || categorySearchValue}
                  onChange={(e) => handleCategorySearch(e.target.value)}
                  fullWidth
                  disabled={!!editingCategory}
                  placeholder="Type to search categories..."
                  InputProps={{
                    sx: { color: '#ffffff' },
                    startAdornment: <SearchIcon sx={{ color: '#b0b0b0', mr: 1 }} />
                  }}
                  InputLabelProps={{
                    sx: { color: '#b0b0b0' }
                  }}
                  sx={{
                    '& .MuiOutlinedInput-notchedOutline': {
                      borderColor: '#3a3a4e'
                    },
                    '&:hover .MuiOutlinedInput-notchedOutline': {
                      borderColor: '#1976d2'
                    }
                  }}
                />
                
                {/* Category Suggestions Dropdown */}
                {showCategorySuggestions && !editingCategory && (
                  <div className="absolute top-full left-0 right-0 z-10 mt-1 bg-card-bg border border-border-color rounded-lg shadow-lg max-h-48 overflow-y-auto">
                    {getFilteredCategories().length > 0 ? (
                      getFilteredCategories().map(cat => (
                        <div
                          key={cat.id}
                          className="px-4 py-2 hover:bg-hover-bg cursor-pointer text-text-primary flex items-center justify-between"
                          onClick={() => handleCategorySelect(cat.name)}
                        >
                          <span>{cat.name}</span>
                        </div>
                      ))
                    ) : (
                      <div className="px-4 py-2 text-text-secondary">
                        No categories found
                      </div>
                    )}
                    
                    {/* Add New Category Option */}
                    {categorySearchValue.trim() && (
                      <div
                        className="px-4 py-2 hover:bg-hover-bg cursor-pointer text-accent-blue border-t border-border-color flex items-center gap-2"
                        onClick={handleCreateNewCategoryFromSearch}
                      >
                        <AddCircleIcon fontSize="small" />
                        <span>Create "{categorySearchValue}"</span>
                      </div>
                    )}
                  </div>
                )}
              </div>

              <TextField
                label="Budget Amount"
                type="number"
                step="0.01"
                value={formData.amount}
                onChange={(e) => setFormData(prev => ({ ...prev, amount: e.target.value }))}
                required
                fullWidth
                InputProps={{
                  sx: { color: '#ffffff' }
                }}
                InputLabelProps={{
                  sx: { color: '#b0b0b0' }
                }}
                sx={{
                  '& .MuiOutlinedInput-notchedOutline': {
                    borderColor: '#3a3a4e'
                  },
                  '&:hover .MuiOutlinedInput-notchedOutline': {
                    borderColor: '#1976d2'
                  }
                }}
              />
            </Box>
          </DialogContent>
          <DialogActions sx={{ p: 3 }}>
            <Button
              onClick={() => setShowAddForm(false)}
              sx={{ color: '#b0b0b0' }}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="contained"
              sx={{
                background: '#1976d2',
                '&:hover': { background: '#1565c0' }
              }}
            >
              {editingCategory ? 'Update' : 'Add'} Budget
            </Button>
          </DialogActions>
        </form>
      </Dialog>

      {/* Add Category Dialog */}
      <Dialog
        open={showAddCategory}
        onClose={() => setShowAddCategory(false)}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: {
            background: '#2a2a3e',
            border: '1px solid #3a3a4e'
          }
        }}
      >
        <DialogTitle sx={{ color: '#ffffff', pb: 2 }}>
          Add New Category
        </DialogTitle>

        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, pt: 1 }}>
            <TextField
              label="Category Name"
              value={newCategoryName}
              onChange={(e) => setNewCategoryName(e.target.value)}
              fullWidth
              placeholder="Enter category name..."
              InputProps={{
                sx: { color: '#ffffff' }
              }}
              InputLabelProps={{
                sx: { color: '#b0b0b0' }
              }}
              sx={{
                '& .MuiOutlinedInput-notchedOutline': {
                  borderColor: '#3a3a4e'
                },
                '&:hover .MuiOutlinedInput-notchedOutline': {
                  borderColor: '#1976d2'
                }
              }}
            />
            
            <div className="bg-card-bg p-3 rounded-lg">
              <p className="text-text-secondary text-sm">
                This will create a new expense category that you can use for your budgets.
              </p>
            </div>
          </Box>
        </DialogContent>
        
        <DialogActions sx={{ p: 3 }}>
          <Button
            onClick={() => setShowAddCategory(false)}
            sx={{ color: '#b0b0b0' }}
          >
            Cancel
          </Button>
          <Button
            onClick={handleAddCategory}
            variant="contained"
            disabled={!newCategoryName.trim()}
            sx={{
              background: '#1976d2',
              '&:hover': { background: '#1565c0' }
            }}
          >
            Add Category
          </Button>
        </DialogActions>
      </Dialog>
    </div>
  );
};

export default BudgetsPage;