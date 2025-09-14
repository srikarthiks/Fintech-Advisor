import React, { useState } from 'react';
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
  IconButton,
  Chip,
  Alert
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Flag as FlagIcon,
  TrendingUp as TrendingUpIcon,
  CalendarToday as CalendarIcon,
  AttachMoney as MoneyIcon
} from '@mui/icons-material';
import { Target, TargetPlanDetails } from '../types';
import { apiService } from '../services/apiService';

interface GoalsPageProps {
  targets: Target[];
  setTargets: React.Dispatch<React.SetStateAction<Target[]>>;
  currency: string;
}

const GoalsPage: React.FC<GoalsPageProps> = ({
  targets,
  setTargets,
  currency
}) => {
  const [openDialog, setOpenDialog] = useState(false);
  const [editingTarget, setEditingTarget] = useState<Target | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    targetAmount: '',
    currentAmount: '',
    targetDate: ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const targetData = {
        name: formData.name,
        targetAmount: parseFloat(formData.targetAmount),
        currentAmount: parseFloat(formData.currentAmount),
        targetDate: formData.targetDate,
        planDetails: {
          missionBrief: '',
          investmentArenas: [],
          sideQuests: [],
          bossBattles: [],
          roadmap: [],
          riskLevels: [],
          strategistsPick: ''
        }
      };

      if (editingTarget) {
        const updatedTarget = await apiService.put<Target>(`/api/targets/${editingTarget.id}`, targetData);
        setTargets(prev => prev.map(t => t.id === editingTarget.id ? updatedTarget : t));
      } else {
        const newTarget = await apiService.post<Target>('/api/targets', targetData);
        setTargets(prev => [...prev, newTarget]);
      }

      resetForm();
      setOpenDialog(false);
    } catch (error) {
      console.error('Error saving target:', error);
    }
  };

  const handleEdit = (target: Target) => {
    setEditingTarget(target);
    setFormData({
      name: target.name,
      targetAmount: target.targetAmount.toString(),
      currentAmount: target.currentAmount.toString(),
      targetDate: target.targetDate
    });
    setOpenDialog(true);
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm('Are you sure you want to delete this goal?')) return;
    
    try {
      await apiService.delete(`/api/targets/${id}`);
      setTargets(prev => prev.filter(t => t.id !== id));
    } catch (error) {
      console.error('Error deleting target:', error);
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      targetAmount: '',
      currentAmount: '',
      targetDate: ''
    });
    setEditingTarget(null);
  };

  const getProgressPercentage = (current: number, target: number) => {
    return target > 0 ? Math.min((current / target) * 100, 100) : 0;
  };

  const getDaysRemaining = (targetDate: string) => {
    const today = new Date();
    const target = new Date(targetDate);
    const diffTime = target.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  return (
    <div className="min-h-screen bg-dark-blue overflow-x-hidden">
      {/* Header */}
      <div className="p-4 md:p-8 pb-4 flex flex-col md:flex-row justify-between items-stretch md:items-center gap-4">
        <div>
          <h1 className="text-2xl md:text-4xl font-light text-text-primary mb-2">
            Financial Goals
          </h1>
          <p className="text-text-secondary text-sm md:text-base">
            Set and track your financial objectives
          </p>
        </div>

        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => setOpenDialog(true)}
          sx={{
            background: '#1976d2',
            '&:hover': { background: '#1565c0' }
          }}
        >
          Add Goal
        </Button>
      </div>

      {/* Goals Grid */}
      <div className="p-4 md:p-8">
        {targets.length === 0 ? (
          <div className="card text-center py-12">
            <FlagIcon className="text-6xl text-text-secondary mb-4" />
            <h3 className="text-xl font-semibold text-text-primary mb-2">No Goals Yet</h3>
            <p className="text-text-secondary mb-6">
              Start by creating your first financial goal
            </p>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => setOpenDialog(true)}
              sx={{
                background: '#1976d2',
                '&:hover': { background: '#1565c0' }
              }}
            >
              Create Your First Goal
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {targets.map((target) => {
              const progress = getProgressPercentage(target.currentAmount, target.targetAmount);
              const daysRemaining = getDaysRemaining(target.targetDate);
              const isOverdue = daysRemaining < 0;
              const isNearDeadline = daysRemaining <= 30 && daysRemaining >= 0;

              return (
                <Card
                  key={target.id}
                  sx={{
                    background: '#2a2a3e',
                    border: '1px solid #3a3a4e',
                    borderRadius: 2,
                    p: 3,
                    position: 'relative',
                    overflow: 'hidden'
                  }}
                >
                  {/* Header */}
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-text-primary mb-1">
                        {target.name}
                      </h3>
                      <div className="flex items-center gap-2 text-text-secondary text-sm">
                        <CalendarIcon className="text-base" />
                        <span>
                          {isOverdue ? 'Overdue' : `${daysRemaining} days left`}
                        </span>
                      </div>
                    </div>
                    <div className="flex gap-1">
                      <IconButton
                        size="small"
                        onClick={() => handleEdit(target)}
                        sx={{ color: '#1976d2' }}
                      >
                        <EditIcon />
                      </IconButton>
                      <IconButton
                        size="small"
                        onClick={() => handleDelete(target.id)}
                        sx={{ color: '#f44336' }}
                      >
                        <DeleteIcon />
                      </IconButton>
                    </div>
                  </div>

                  {/* Progress */}
                  <div className="mb-4">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-text-secondary text-sm">Progress</span>
                      <span className="text-text-primary font-semibold">
                        {progress.toFixed(1)}%
                      </span>
                    </div>
                    <LinearProgress
                      variant="determinate"
                      value={progress}
                      sx={{
                        height: 8,
                        borderRadius: 4,
                        backgroundColor: '#3a3a4e',
                        '& .MuiLinearProgress-bar': {
                          backgroundColor: progress >= 100 ? '#4caf50' : '#1976d2'
                        }
                      }}
                    />
                  </div>

                  {/* Amounts */}
                  <div className="space-y-2 mb-4">
                    <div className="flex justify-between items-center">
                      <span className="text-text-secondary text-sm">Current</span>
                      <span className="text-text-primary font-semibold">
                        {currency}{target.currentAmount.toLocaleString()}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-text-secondary text-sm">Target</span>
                      <span className="text-text-primary font-semibold">
                        {currency}{target.targetAmount.toLocaleString()}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-text-secondary text-sm">Remaining</span>
                      <span className="text-text-primary font-semibold">
                        {currency}{(target.targetAmount - target.currentAmount).toLocaleString()}
                      </span>
                    </div>
                  </div>

                  {/* Status */}
                  <div className="flex justify-between items-center">
                    <Chip
                      label={progress >= 100 ? 'Completed' : isOverdue ? 'Overdue' : isNearDeadline ? 'Due Soon' : 'On Track'}
                      size="small"
                      color={
                        progress >= 100 ? 'success' :
                        isOverdue ? 'error' :
                        isNearDeadline ? 'warning' : 'primary'
                      }
                    />
                    {progress >= 100 && (
                      <TrendingUpIcon className="text-accent-green" />
                    )}
                  </div>

                  {/* Warning for overdue goals */}
                  {isOverdue && (
                    <Alert severity="warning" sx={{ mt: 2, fontSize: '0.75rem' }}>
                      This goal is overdue. Consider adjusting the target date or amount.
                    </Alert>
                  )}
                </Card>
              );
            })}
          </div>
        )}
      </div>

      {/* Add/Edit Goal Dialog */}
      <Dialog
        open={openDialog}
        onClose={() => setOpenDialog(false)}
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
          {editingTarget ? 'Edit Goal' : 'Add New Goal'}
        </DialogTitle>

        <form onSubmit={handleSubmit}>
          <DialogContent>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, pt: 1 }}>
              <TextField
                label="Goal Name"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
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

              <TextField
                label="Target Amount"
                type="number"
                value={formData.targetAmount}
                onChange={(e) => setFormData(prev => ({ ...prev, targetAmount: e.target.value }))}
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

              <TextField
                label="Current Amount"
                type="number"
                value={formData.currentAmount}
                onChange={(e) => setFormData(prev => ({ ...prev, currentAmount: e.target.value }))}
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

              <TextField
                label="Target Date"
                type="date"
                value={formData.targetDate}
                onChange={(e) => setFormData(prev => ({ ...prev, targetDate: e.target.value }))}
                required
                fullWidth
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
            </Box>
          </DialogContent>
          <DialogActions sx={{ p: 3 }}>
            <Button
              onClick={() => setOpenDialog(false)}
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
              {editingTarget ? 'Update' : 'Add'} Goal
            </Button>
          </DialogActions>
        </form>
      </Dialog>
    </div>
  );
};

export default GoalsPage;
