import React, { useState, useMemo } from 'react';
import {
  Box,
  Card,
  Button,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Chip,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Tabs,
  Tab,
  CircularProgress
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Search as SearchIcon,
  FilterList as FilterIcon,
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
  SmartToy as SmartToyIcon,
  AutoAwesome as AutoAwesomeIcon,
  AddCircle as AddCircleIcon
} from '@mui/icons-material';
import { Transaction, Category, Budget, Target } from '../types';
import { apiService } from '../services/apiService';

interface TransactionsPageProps {
  transactions: Transaction[];
  setTransactions: React.Dispatch<React.SetStateAction<Transaction[]>>;
  categories: Category[];
  setCategories: React.Dispatch<React.SetStateAction<Category[]>>;
  budgets: Budget;
  targets: Target[];
  currency: string;
}

const TransactionsPage: React.FC<TransactionsPageProps> = ({
  transactions,
  setTransactions,
  categories,
  setCategories,
  budgets,
  targets,
  currency
}) => {
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'income' | 'expense'>('all');
  const [filterCategory, setFilterCategory] = useState('all');
  const [showAddCategory, setShowAddCategory] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [showAITransaction, setShowAITransaction] = useState(false);
  const [aiInput, setAiInput] = useState('');
  const [isProcessingAI, setIsProcessingAI] = useState(false);
  const [categorySearchValue, setCategorySearchValue] = useState('');
  const [showCategorySuggestions, setShowCategorySuggestions] = useState(false);

  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    description: '',
    amount: '',
    type: 'expense' as 'income' | 'expense',
    category: ''
  });
  const [tabValue, setTabValue] = useState(0);

  const filteredTransactions = useMemo(() => {
    return transactions.filter(transaction => {
      const matchesSearch = transaction.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          transaction.category.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesType = filterType === 'all' || transaction.type === filterType;
      const matchesCategory = filterCategory === 'all' || transaction.category === filterCategory;

      return matchesSearch && matchesType && matchesCategory;
    });
  }, [transactions, searchTerm, filterType, filterCategory]);

  const incomeCategories = categories.filter(cat => cat.type === 'income');
  const expenseCategories = categories.filter(cat => cat.type === 'expense');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const transactionData = {
        date: formData.date,
        description: formData.description,
        amount: parseFloat(formData.amount),
        type: formData.type,
        category: formData.category
      };

      if (editingTransaction) {
          const updatedTransaction = await apiService.put<Transaction>(`/api/transactions/${editingTransaction.id}`, transactionData);
          setTransactions(prev => prev.map(t => t.id === editingTransaction.id ? updatedTransaction : t));
      } else {
          const newTransaction = await apiService.post<Transaction>('/api/transactions', transactionData);
          setTransactions(prev => [...prev, newTransaction]);
      }

      resetForm();
      setShowAddForm(false);
    } catch (error) {
      console.error('Error saving transaction:', error);
    }
  };

  const handleEdit = (transaction: Transaction) => {
    setEditingTransaction(transaction);
    setFormData({
      date: transaction.date,
      description: transaction.description,
      amount: transaction.amount.toString(),
      type: transaction.type,
      category: transaction.category
    });
    setTabValue(transaction.type === 'income' ? 1 : 0);
    setShowAddForm(true);
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm('Are you sure you want to delete this transaction?')) return;
    
    try {
      await apiService.delete(`/api/transactions/${id}`);
      setTransactions(prev => prev.filter(t => t.id !== id));
    } catch (error) {
      console.error('Error deleting transaction:', error);
    }
  };

  const resetForm = () => {
    setFormData({
      date: new Date().toISOString().split('T')[0],
      description: '',
      amount: '',
      type: 'expense',
      category: ''
    });
    setTabValue(0);
    setEditingTransaction(null);
    setCategorySearchValue('');
    setShowCategorySuggestions(false);
  };

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
    const type = newValue === 0 ? 'expense' : 'income';
    setFormData(prev => ({ ...prev, type, category: '' }));
  };

  const handleAddCategory = async () => {
    if (!newCategoryName.trim()) return;
    
    try {
      const newCategory = await apiService.createCategory(newCategoryName.trim(), formData.type) as Category;
      setCategories(prev => [...prev, newCategory]);
      setFormData(prev => ({ ...prev, category: newCategory.name }));
      setNewCategoryName('');
      setShowAddCategory(false);
    } catch (error) {
      console.error('Error creating category:', error);
    }
  };

  const handleCategorySearch = (value: string) => {
    setCategorySearchValue(value);
    setShowCategorySuggestions(value.length > 0);
    
    // Clear the selected category when user starts typing
    if (formData.category && value !== formData.category) {
      setFormData(prev => ({ ...prev, category: '' }));
    }
    
    // If user types an exact match, select it
    const availableCategories = formData.type === 'income' ? incomeCategories : expenseCategories;
    const exactMatch = availableCategories.find(cat => 
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
      const newCategory = await apiService.createCategory(categorySearchValue.trim(), formData.type) as Category;
      setCategories(prev => [...prev, newCategory]);
      setFormData(prev => ({ ...prev, category: newCategory.name }));
      setCategorySearchValue('');
      setShowCategorySuggestions(false);
    } catch (error) {
      console.error('Error creating category:', error);
    }
  };

  const getFilteredCategories = () => {
    const availableCategories = formData.type === 'income' ? incomeCategories : expenseCategories;
    if (!categorySearchValue) return availableCategories;
    
    return availableCategories.filter(cat =>
      cat.name.toLowerCase().includes(categorySearchValue.toLowerCase())
    );
  };

  const handleAITransaction = async () => {
    if (!aiInput.trim()) return;
    
    setIsProcessingAI(true);
    try {
      // Parse the AI input to extract transaction details
      const transactionData = parseAITransaction(aiInput);
      
      if (transactionData) {
        // Create the transaction
        const newTransaction = await apiService.post<Transaction>('/api/transactions', transactionData);
        setTransactions(prev => [newTransaction, ...prev]);
        setAiInput('');
        setShowAITransaction(false);
      } else {
        alert('Could not understand the transaction. Please try a different format.');
      }
    } catch (error) {
      console.error('Error creating AI transaction:', error);
      alert('Failed to create transaction. Please try again.');
    } finally {
      setIsProcessingAI(false);
    }
  };

  const parseAITransaction = (input: string) => {
    // Simple AI parsing logic - can be enhanced with more sophisticated NLP
    const lowerInput = input.toLowerCase();
    
    // Extract amount (look for numbers with currency symbols or words)
    const amountMatch = input.match(/(\d+(?:\.\d{2})?)/);
    if (!amountMatch) return null;
    
    const amount = parseFloat(amountMatch[1]);
    
    // Determine if it's income or expense
    const isIncome = /\b(earned|received|salary|income|bonus|refund|deposit)\b/.test(lowerInput);
    const isExpense = /\b(spent|paid|bought|purchase|expense|cost|bill)\b/.test(lowerInput);
    
    const type = isIncome ? 'income' : isExpense ? 'expense' : 'expense'; // default to expense
    
    // Extract description (use the input as description, cleaned up)
    const description = input.trim();
    
    // Try to match with existing categories
    const availableCategories = type === 'income' ? incomeCategories : expenseCategories;
    let matchedCategory = '';
    
    // Simple category matching based on keywords
    for (const category of availableCategories) {
      const categoryLower = category.name.toLowerCase();
      if (lowerInput.includes(categoryLower) || 
          (categoryLower.includes('food') && /\b(food|eat|restaurant|grocery|dining)\b/.test(lowerInput)) ||
          (categoryLower.includes('transport') && /\b(transport|taxi|bus|car|fuel|gas)\b/.test(lowerInput)) ||
          (categoryLower.includes('entertainment') && /\b(entertainment|movie|game|fun)\b/.test(lowerInput)) ||
          (categoryLower.includes('shopping') && /\b(shopping|buy|store|shop)\b/.test(lowerInput))) {
        matchedCategory = category.name;
        break;
      }
    }
    
    // If no category matched, use the first available category
    if (!matchedCategory && availableCategories.length > 0) {
      matchedCategory = availableCategories[0].name;
    }
    
    return {
      date: new Date().toISOString().split('T')[0],
      description,
      amount,
      type,
      category: matchedCategory
    };
  };

  const getBudgetInfo = (category: string) => {
    const budget = budgets[category];
    if (!budget) return null;

    const spent = transactions
      .filter(t => t.type === 'expense' && t.category === category)
      .reduce((sum, t) => sum + Number(t.amount), 0);

      return {
      budget: Number(budget.amount),
      spent
    };
  };

  return (
    <div className="min-h-screen bg-dark-blue overflow-x-hidden">
      {/* Header */}
      <div className="p-4 md:p-8 pb-4 flex flex-col md:flex-row justify-between items-stretch md:items-center gap-4">
        <div>
          <h1 className="text-2xl md:text-4xl font-light text-text-primary mb-2">
            Transactions
          </h1>
          <p className="text-text-secondary text-sm md:text-base">
            Manage your income and expenses
          </p>
        </div>

        <div className="flex gap-3">
          <Button
            variant="outlined"
            startIcon={<SmartToyIcon />}
            onClick={() => setShowAITransaction(true)}
            sx={{
              borderColor: '#3a3a4e',
              color: '#b0b0b0',
              '&:hover': {
                borderColor: '#1976d2',
                color: '#1976d2'
              }
            }}
          >
            AI Add
          </Button>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => setShowAddForm(true)}
            sx={{
              background: '#1976d2',
              '&:hover': { background: '#1565c0' }
            }}
          >
            Add Transaction
          </Button>
        </div>
      </div>

      {/* Filters */}
      <div className="p-4 md:p-8 pb-4">
        <Card sx={{ background: '#2a2a3e', border: '1px solid #3a3a4e', p: 3 }}>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <TextField
              label="Search"
              placeholder="Search transactions..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              InputProps={{
                startAdornment: <SearchIcon sx={{ color: '#b0b0b0', mr: 1 }} />,
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
            
            <FormControl>
              <InputLabel sx={{ color: '#b0b0b0' }}>Type</InputLabel>
              <Select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value as any)}
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
                <MenuItem value="all">All Types</MenuItem>
                <MenuItem value="income">Income</MenuItem>
                <MenuItem value="expense">Expense</MenuItem>
              </Select>
            </FormControl>
            
            <FormControl>
              <InputLabel sx={{ color: '#b0b0b0' }}>Category</InputLabel>
              <Select
                value={filterCategory}
                onChange={(e) => setFilterCategory(e.target.value)}
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
                <MenuItem value="all">All Categories</MenuItem>
                {categories.map(cat => (
                  <MenuItem key={cat.id} value={cat.name}>{cat.name}</MenuItem>
                ))}
              </Select>
            </FormControl>
            
            <Button
              variant="outlined"
              startIcon={<FilterIcon />}
                onClick={() => {
                  setSearchTerm('');
                  setFilterType('all');
                  setFilterCategory('all');
              }}
              sx={{
                borderColor: '#3a3a4e',
                color: '#b0b0b0',
                '&:hover': {
                  borderColor: '#1976d2',
                  color: '#1976d2'
                }
              }}
            >
              Clear Filters
            </Button>
                        </div>
        </Card>
      </div>

      {/* Add/Edit Dialog */}
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
          {editingTransaction ? 'Edit Transaction' : 'Add New Transaction'}
        </DialogTitle>

        <form onSubmit={handleSubmit}>
          <DialogContent>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, pt: 1 }}>
              {/* Transaction Type Tabs */}
              <Box sx={{ borderBottom: 1, borderColor: '#3a3a4e' }}>
                <Tabs 
                  value={tabValue} 
                  onChange={handleTabChange}
                  sx={{
                    '& .MuiTab-root': {
                      color: '#b0b0b0',
                      '&.Mui-selected': {
                        color: '#1976d2'
                      }
                    },
                    '& .MuiTabs-indicator': {
                      backgroundColor: '#1976d2'
                    }
                  }}
                >
                  <Tab 
                    label="Expense" 
                    icon={<TrendingDownIcon />}
                    iconPosition="start"
                  />
                  <Tab 
                    label="Income" 
                    icon={<TrendingUpIcon />}
                    iconPosition="start"
                  />
                </Tabs>
              </Box>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <TextField
                  label="Date"
                  type="date"
                  value={formData.date}
                  onChange={(e) => setFormData(prev => ({ ...prev, date: e.target.value }))}
                required
                InputLabelProps={{
                    shrink: true,
                  sx: { color: '#b0b0b0' }
                  }}
                InputProps={{
                  sx: { color: '#ffffff' }
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

              <TextField
                label="Amount"
                type="number"
                value={formData.amount}
                onChange={(e) => setFormData(prev => ({ ...prev, amount: e.target.value }))}
                required
                inputProps={{ step: "0.01" }}
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
                </div>

                  <TextField
                label="Description"
                placeholder="Optional description..."
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
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

              <div className="relative">
                <TextField
                  label="Search or type category"
                  value={formData.category || categorySearchValue}
                  onChange={(e) => handleCategorySearch(e.target.value)}
                  fullWidth
                  required
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
                {showCategorySuggestions && (
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
              {editingTransaction ? 'Update' : 'Add'} Transaction
            </Button>
          </DialogActions>
        </form>
      </Dialog>

      {/* Transactions Table */}
      <div className="p-4 md:p-8">
        <Card sx={{ background: '#2a2a3e', border: '1px solid #3a3a4e' }}>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell sx={{ color: '#b0b0b0', borderColor: '#3a3a4e' }}>Date</TableCell>
                  <TableCell sx={{ color: '#b0b0b0', borderColor: '#3a3a4e' }}>Description</TableCell>
                  <TableCell sx={{ color: '#b0b0b0', borderColor: '#3a3a4e' }}>Category</TableCell>
                  <TableCell sx={{ color: '#b0b0b0', borderColor: '#3a3a4e' }}>Type</TableCell>
                  <TableCell sx={{ color: '#b0b0b0', borderColor: '#3a3a4e' }}>Amount</TableCell>
                  <TableCell sx={{ color: '#b0b0b0', borderColor: '#3a3a4e' }}>Budget</TableCell>
                  <TableCell sx={{ color: '#b0b0b0', borderColor: '#3a3a4e' }}>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredTransactions.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} sx={{ textAlign: 'center', color: '#b0b0b0', borderColor: '#3a3a4e', py: 6 }}>
                      No transactions found
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredTransactions.map((transaction) => {
                    const budgetInfo = getBudgetInfo(transaction.category);
                    return (
                      <TableRow key={transaction.id} sx={{ '&:hover': { backgroundColor: '#3a3a4e' } }}>
                        <TableCell sx={{ color: '#b0b0b0', borderColor: '#3a3a4e' }}>
                          {new Date(transaction.date).toLocaleDateString()}
                        </TableCell>
                        <TableCell sx={{ color: '#ffffff', borderColor: '#3a3a4e' }}>
                          {transaction.description}
                        </TableCell>
                        <TableCell sx={{ color: '#b0b0b0', borderColor: '#3a3a4e' }}>
                          {transaction.category}
                        </TableCell>
                        <TableCell sx={{ borderColor: '#3a3a4e' }}>
                          <Chip
                            label={transaction.type}
                            size="small"
                            color={transaction.type === 'income' ? 'success' : 'error'}
                            icon={transaction.type === 'income' ? <TrendingUpIcon /> : <TrendingDownIcon />}
                          />
                        </TableCell>
                        <TableCell sx={{ 
                          color: transaction.type === 'income' ? '#4caf50' : '#f44336',
                          borderColor: '#3a3a4e',
                          fontWeight: 'bold'
                        }}>
                          {transaction.type === 'income' ? '+' : '-'}{currency}{Number(transaction.amount).toFixed(2)}
                        </TableCell>
                        <TableCell sx={{ color: '#b0b0b0', borderColor: '#3a3a4e' }}>
                          {budgetInfo ? (
                            <div>
                              <div>{currency}{budgetInfo.spent.toFixed(2)} / {currency}{budgetInfo.budget.toFixed(2)}</div>
                              <Chip
                                label={`${budgetInfo.budget > 0 ? ((budgetInfo.spent / budgetInfo.budget) * 100).toFixed(1) : 0}%`}
            size="small"
                                color={budgetInfo.spent > budgetInfo.budget ? 'error' : budgetInfo.spent > budgetInfo.budget * 0.8 ? 'warning' : 'success'}
                              />
                            </div>
                          ) : (
                            <span style={{ color: '#666' }}>No budget</span>
                          )}
                        </TableCell>
                        <TableCell sx={{ borderColor: '#3a3a4e' }}>
                          <div className="flex gap-2">
                            <IconButton
            size="small"
                              onClick={() => handleEdit(transaction)}
                              sx={{ color: '#1976d2' }}
                            >
                              <EditIcon />
                            </IconButton>
                            <IconButton
            size="small"
                              onClick={() => handleDelete(transaction.id)}
                              sx={{ color: '#f44336' }}
                            >
                              <DeleteIcon />
                            </IconButton>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </Card>
      </div>

      {/* AI Transaction Dialog */}
      <Dialog
        open={showAITransaction}
        onClose={() => setShowAITransaction(false)}
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
          <div className="flex items-center gap-2">
            <AutoAwesomeIcon sx={{ color: '#ff9800' }} />
            AI Transaction Creator
          </div>
        </DialogTitle>

        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, pt: 1 }}>
            <TextField
              label="Describe your transaction"
              multiline
              rows={3}
              value={aiInput}
              onChange={(e) => setAiInput(e.target.value)}
              fullWidth
              placeholder="Examples: 'Spent 50 on groceries', 'Received 1000 salary', 'Paid 25 for lunch'"
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
              <h4 className="text-text-primary font-semibold mb-2">Examples:</h4>
              <div className="space-y-1 text-sm text-text-secondary">
                <div>• "Spent 50 on groceries"</div>
                <div>• "Received 1000 salary"</div>
                <div>• "Paid 25 for lunch at restaurant"</div>
                <div>• "Bought movie tickets for 15"</div>
                <div>• "Earned 200 from freelance work"</div>
              </div>
            </div>
            </Box>
          </DialogContent>
        
          <DialogActions sx={{ p: 3 }}>
            <Button
            onClick={() => setShowAITransaction(false)}
              sx={{ color: '#b0b0b0' }}
            >
              Cancel
            </Button>
            <Button
            onClick={handleAITransaction}
              variant="contained"
            disabled={!aiInput.trim() || isProcessingAI}
            startIcon={isProcessingAI ? <CircularProgress size={20} /> : <AutoAwesomeIcon />}
              sx={{
              background: '#ff9800',
              '&:hover': { background: '#f57c00' }
              }}
            >
            {isProcessingAI ? 'Processing...' : 'Create Transaction'}
            </Button>
          </DialogActions>
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
                This will create a new {formData.type} category that you can use for your transactions.
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

export default TransactionsPage;