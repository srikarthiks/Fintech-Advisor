import React, { useState } from 'react';
import {
  Card,
  Button,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  CircularProgress,
  Alert,
  List,
  ListItem,
  ListItemText,
  ListItemIcon
} from '@mui/material';
import {
  SmartToy as SmartToyIcon,
  TrendingUp as TrendingUpIcon,
  Lightbulb as LightbulbIcon,
  Warning as WarningIcon,
  CheckCircle as CheckCircleIcon,
  Send as SendIcon
} from '@mui/icons-material';
import { Transaction, Budget, Category, User } from '../types';
import { apiService } from '../services/apiService';

interface AdvisorPageProps {
  transactions: Transaction[];
  budgets: Budget;
  categories: Category[];
  currency: string;
  user: User;
}

interface AdviceResponse {
  summary: string;
  insights: string[];
  recommendations: string[];
  warnings: string[];
  opportunities: string[];
}

const AdvisorPage: React.FC<AdvisorPageProps> = ({
  transactions,
  budgets,
  categories,
  currency,
  user
}) => {
  const [question, setQuestion] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [advice, setAdvice] = useState<AdviceResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showQuestionDialog, setShowQuestionDialog] = useState(false);

  const handleAskQuestion = async () => {
    if (!question.trim()) return;
    
    setIsAnalyzing(true);
    setError(null);
    
    try {
      console.log('Asking question:', question);
      console.log('User ID:', user?.id);
      
      if (!user?.id) {
        setError('User not found. Please login again.');
        return;
      }

      // Check if token is still valid
      const token = localStorage.getItem('token');
      if (!token) {
        setError('Session expired. Please login again.');
        setTimeout(() => window.location.reload(), 2000);
        return;
      }
      
      // Use the existing analyze endpoint temporarily
      const analysisResponse = await apiService.analyzeFinancialData('month', user.id) as any;
      
      // Transform the analysis response to match AdviceResponse format
      const response: AdviceResponse = {
        summary: analysisResponse?.overallSummary || `Analysis for your question: "${question}"`,
        insights: analysisResponse?.keyInsights || [],
        recommendations: analysisResponse?.potentialSavings || [],
        warnings: analysisResponse?.riskAssessment ? [analysisResponse.riskAssessment] : [],
        opportunities: analysisResponse?.trends || []
      };
      
      console.log('Question response:', response);
      setAdvice(response);
      setQuestion('');
      setShowQuestionDialog(false);
    } catch (error: any) {
      console.error('Ask question error:', error);
      if (error.message?.includes('Authentication failed')) {
        setError('Session expired. Please login again.');
        // Redirect to login after a delay
        setTimeout(() => {
          window.location.reload();
        }, 2000);
      } else {
        setError('Failed to get financial advice. Please try again.');
      }
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleQuickAnalysis = async () => {
    setIsAnalyzing(true);
    setError(null);
    
    try {
      console.log('Starting quick analysis...');
      console.log('User ID:', user?.id);
      
      if (!user?.id) {
        setError('User not found. Please login again.');
        return;
      }

      // Check if token is still valid
      const token = localStorage.getItem('token');
      if (!token) {
        setError('Session expired. Please login again.');
        setTimeout(() => window.location.reload(), 2000);
        return;
      }
      
      // Use the existing analyze endpoint
      const analysisResponse = await apiService.analyzeFinancialData('month', user.id) as any;
      
      // Transform the analysis response to match AdviceResponse format
      const response: AdviceResponse = {
        summary: analysisResponse?.overallSummary || 'Financial health analysis completed',
        insights: analysisResponse?.keyInsights || [],
        recommendations: analysisResponse?.potentialSavings || [],
        warnings: analysisResponse?.riskAssessment ? [analysisResponse.riskAssessment] : [],
        opportunities: analysisResponse?.trends || []
      };
      
      console.log('Analysis response:', response);
      setAdvice(response);
    } catch (error: any) {
      console.error('Quick analysis error:', error);
      if (error.message?.includes('Authentication failed')) {
        setError('Session expired. Please login again.');
        // Redirect to login after a delay
        setTimeout(() => {
          window.location.reload();
        }, 2000);
      } else {
        setError('Failed to analyze your finances. Please try again.');
      }
    } finally {
      setIsAnalyzing(false);
    }
  };

  const quickQuestions = [
    "How can I save more money?",
    "Am I spending too much on any category?",
    "What should I do with my extra income?",
    "How can I improve my budget?",
    "What are my biggest financial risks?"
  ];

  return (
    <div className="min-h-screen bg-dark-blue overflow-x-hidden">
      {/* Header */}
      <div className="p-4 md:p-8 pb-4">
        <div className="flex flex-col md:flex-row justify-between items-stretch md:items-center gap-4">
          <div>
            <h1 className="text-2xl md:text-4xl font-light text-text-primary mb-2">
              AI Financial Advisor
            </h1>
            <p className="text-text-secondary text-sm md:text-base">
              Get personalized financial advice powered by AI
            </p>
          </div>

          <div className="flex gap-4 flex-col sm:flex-row">
            <Button
              variant="outlined"
              startIcon={<SendIcon />}
              onClick={() => setShowQuestionDialog(true)}
              sx={{
                borderColor: '#3a3a4e',
                color: '#b0b0b0',
                '&:hover': {
                  borderColor: '#1976d2',
                  color: '#1976d2'
                }
              }}
            >
              Ask Question
            </Button>
            <Button
              variant="contained"
              startIcon={isAnalyzing ? <CircularProgress size={20} /> : <SmartToyIcon />}
              onClick={handleQuickAnalysis}
              disabled={isAnalyzing}
              sx={{
                background: '#1976d2',
                '&:hover': { background: '#1565c0' }
              }}
            >
              {isAnalyzing ? 'Analyzing...' : 'Quick Analysis'}
            </Button>
          </div>
        </div>
      </div>

      {/* Quick Questions */}
      <div className="p-4 md:p-8 pb-4">
        <Card sx={{ background: '#2a2a3e', border: '1px solid #3a3a4e', p: 3 }}>
          <h2 className="text-xl font-semibold text-text-primary mb-4">Quick Questions</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {quickQuestions.map((q, index) => (
              <Button
                key={index}
                variant="outlined"
                onClick={() => {
                  setQuestion(q);
                  setShowQuestionDialog(true);
                }}
                sx={{
                  borderColor: '#3a3a4e',
                  color: '#b0b0b0',
                  textAlign: 'left',
                  justifyContent: 'flex-start',
                  '&:hover': {
                    borderColor: '#1976d2',
                    color: '#1976d2'
                  }
                }}
              >
                {q}
              </Button>
            ))}
          </div>
        </Card>
      </div>

      {/* Error Alert */}
      {error && (
        <div className="mx-4 md:mx-8 mb-4">
          <Alert severity="error">{error}</Alert>
        </div>
      )}

      {/* Advice Results */}
      {advice && (
        <div className="p-4 md:p-8 space-y-6">
          {/* Summary */}
          <Card sx={{ background: '#2a2a3e', border: '1px solid #3a3a4e', p: 3 }}>
            <h2 className="text-xl font-semibold text-text-primary mb-4 flex items-center gap-2">
              <SmartToyIcon />
              AI Summary
            </h2>
            <p className="text-text-secondary">{advice.summary}</p>
          </Card>

          {/* Insights */}
          {advice.insights.length > 0 && (
            <Card sx={{ background: '#2a2a3e', border: '1px solid #3a3a4e', p: 3 }}>
              <h2 className="text-xl font-semibold text-text-primary mb-4 flex items-center gap-2">
                <LightbulbIcon />
                Key Insights
              </h2>
              <List>
                {advice.insights.map((insight, index) => (
                  <ListItem key={index} sx={{ px: 0 }}>
                    <ListItemIcon>
                      <CheckCircleIcon sx={{ color: '#4caf50' }} />
                    </ListItemIcon>
                    <ListItemText primary={insight} sx={{ color: '#ffffff' }} />
                  </ListItem>
                ))}
              </List>
            </Card>
          )}

          {/* Recommendations */}
          {advice.recommendations.length > 0 && (
            <Card sx={{ background: '#2a2a3e', border: '1px solid #3a3a4e', p: 3 }}>
              <h2 className="text-xl font-semibold text-text-primary mb-4 flex items-center gap-2">
                <TrendingUpIcon />
                Recommendations
              </h2>
              <List>
                {advice.recommendations.map((rec, index) => (
                  <ListItem key={index} sx={{ px: 0 }}>
                    <ListItemIcon>
                      <TrendingUpIcon sx={{ color: '#1976d2' }} />
                    </ListItemIcon>
                    <ListItemText primary={rec} sx={{ color: '#ffffff' }} />
                  </ListItem>
                ))}
              </List>
            </Card>
          )}

          {/* Warnings */}
          {advice.warnings.length > 0 && (
            <Card sx={{ background: '#2a2a3e', border: '1px solid #3a3a4e', p: 3 }}>
              <h2 className="text-xl font-semibold text-text-primary mb-4 flex items-center gap-2">
                <WarningIcon />
                Warnings
              </h2>
              <List>
                {advice.warnings.map((warning, index) => (
                  <ListItem key={index} sx={{ px: 0 }}>
                    <ListItemIcon>
                      <WarningIcon sx={{ color: '#f44336' }} />
                    </ListItemIcon>
                    <ListItemText primary={warning} sx={{ color: '#ffffff' }} />
                  </ListItem>
                ))}
              </List>
            </Card>
          )}

          {/* Opportunities */}
          {advice.opportunities.length > 0 && (
            <Card sx={{ background: '#2a2a3e', border: '1px solid #3a3a4e', p: 3 }}>
              <h2 className="text-xl font-semibold text-text-primary mb-4 flex items-center gap-2">
                <TrendingUpIcon />
                Opportunities
              </h2>
              <List>
                {advice.opportunities.map((opp, index) => (
                  <ListItem key={index} sx={{ px: 0 }}>
                    <ListItemIcon>
                      <LightbulbIcon sx={{ color: '#ff9800' }} />
                    </ListItemIcon>
                    <ListItemText primary={opp} sx={{ color: '#ffffff' }} />
                  </ListItem>
                ))}
              </List>
            </Card>
          )}
        </div>
      )}

      {/* Ask Question Dialog */}
      <Dialog
        open={showQuestionDialog}
        onClose={() => setShowQuestionDialog(false)}
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
          Ask AI Financial Advisor
        </DialogTitle>

        <DialogContent>
          <TextField
            label="Your Question"
            multiline
            rows={4}
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            fullWidth
            placeholder="Ask me anything about your finances..."
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
        </DialogContent>
        <DialogActions sx={{ p: 3 }}>
          <Button
            onClick={() => setShowQuestionDialog(false)}
            sx={{ color: '#b0b0b0' }}
          >
            Cancel
          </Button>
          <Button
            onClick={handleAskQuestion}
            variant="contained"
            disabled={!question.trim() || isAnalyzing}
            startIcon={isAnalyzing ? <CircularProgress size={20} /> : <SendIcon />}
            sx={{
              background: '#1976d2',
              '&:hover': { background: '#1565c0' }
            }}
          >
            {isAnalyzing ? 'Analyzing...' : 'Ask Question'}
          </Button>
        </DialogActions>
      </Dialog>
    </div>
  );
};

export default AdvisorPage;
