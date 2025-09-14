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
  ListItemIcon,
  Typography,
  Box,
  Chip,
  Divider
} from '@mui/material';
import {
  Add as AddIcon,
  Flag as FlagIcon,
  TrendingUp as TrendingUpIcon,
  CalendarToday as CalendarIcon,
  AttachMoney as MoneyIcon,
  SmartToy as SmartToyIcon,
  CheckCircle as CheckCircleIcon,
  Warning as WarningIcon,
  Lightbulb as LightbulbIcon
} from '@mui/icons-material';
import { Target, TargetPlanDetails, User, Transaction, Budget, Category } from '../types';
import { apiService } from '../services/apiService';

interface TargetPageProps {
  targets: Target[];
  setTargets: React.Dispatch<React.SetStateAction<Target[]>>;
  currency: string;
  user: User;
  transactions: Transaction[];
  budgets: Budget;
  categories: Category[];
}

interface TargetAdvice {
  summary: string;
  investmentOptions: Array<{
    title: string;
    description: string;
    amount: number;
    percentage: number;
    pros: string[];
    cons: string[];
  }>;
  actionSteps: Array<{
    monthRange: string;
    description: string;
    completed: boolean;
  }>;
  riskAssessment: string;
  totalMonthlyContribution: number;
}

interface ChatMessage {
  id: string;
  type: 'user' | 'ai';
  message: string;
  timestamp: Date;
  isTyping?: boolean;
}

const TargetPage: React.FC<TargetPageProps> = ({
  targets,
  setTargets,
  currency,
  user,
  transactions,
  budgets,
  categories
}) => {
  const [openDialog, setOpenDialog] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    targetAmount: '',
    targetDate: '',
    riskLevel: 'moderate'
  });
  const [isGettingAdvice, setIsGettingAdvice] = useState(false);
  const [targetAdvice, setTargetAdvice] = useState<TargetAdvice | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showAdviceDialog, setShowAdviceDialog] = useState(false);
  
  // Chat functionality
  const [showChat, setShowChat] = useState(false);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [currentTarget, setCurrentTarget] = useState<Target | null>(null);
  const [chatInput, setChatInput] = useState('');
  const [isChatLoading, setIsChatLoading] = useState(false);
  
  // Action plan dialog
  const [showActionPlan, setShowActionPlan] = useState(false);
  const [actionPlanTarget, setActionPlanTarget] = useState<Target | null>(null);
  
  // Progress update dialog
  const [showProgressDialog, setShowProgressDialog] = useState(false);
  const [progressTarget, setProgressTarget] = useState<Target | null>(null);
  const [progressAmount, setProgressAmount] = useState('');
  
  // Investment tracking
  const [investments, setInvestments] = useState<{[month: string]: number}>({});

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name || !formData.targetAmount || !formData.targetDate) {
      setError('Please fill in all required fields');
      return;
    }

    const targetAmount = parseFloat(formData.targetAmount);
    const targetDate = new Date(formData.targetDate);
    const currentDate = new Date();
    const monthsRemaining = Math.ceil((targetDate.getTime() - currentDate.getTime()) / (1000 * 60 * 60 * 24 * 30));

    if (targetAmount <= 0) {
      setError('Target amount must be greater than 0');
      return;
    }

    if (monthsRemaining <= 0) {
      setError('Target date must be in the future');
      return;
    }

    setIsGettingAdvice(true);
    setError(null);

    try {
      // Get AI advice for achieving this target
      const adviceResponse = await getTargetAdvice(formData.name, targetAmount, monthsRemaining, formData.riskLevel);
      setTargetAdvice(adviceResponse);
      setShowAdviceDialog(true);
    } catch (error) {
      console.error('Error getting target advice:', error);
      setError('Failed to get expert advice. Please try again.');
    } finally {
      setIsGettingAdvice(false);
    }
  };

  const getTargetAdvice = async (name: string, amount: number, months: number, riskLevel: string): Promise<TargetAdvice> => {
    // Use the existing analyze endpoint to get AI advice
    const analysisResponse = await apiService.analyzeFinancialData('month', user.id) as any;
    
    // Calculate monthly contribution needed
    const monthlyContribution = amount / months;
    
    // Generate investment options based on risk level and amount
    const investmentOptions = generateInvestmentOptions(amount, riskLevel);
    
    // Generate action steps
    const actionSteps = generateActionSteps(name, amount, months, monthlyContribution);
    
    return {
      summary: `To achieve your target of ${currency}${amount.toLocaleString()} in ${months} months, you need to save approximately ${currency}${monthlyContribution.toLocaleString()} per month. Here's a comprehensive plan to reach your goal.`,
      investmentOptions,
      actionSteps,
      riskAssessment: `Risk Level: ${riskLevel.charAt(0).toUpperCase() + riskLevel.slice(1)} - ${getRiskDescription(riskLevel)}`,
      totalMonthlyContribution: monthlyContribution
    };
  };

  const generateInvestmentOptions = (amount: number, riskLevel: string) => {
    const options = [];
    
    if (riskLevel === 'conservative') {
      options.push(
        {
          title: 'Fixed Deposits',
          description: 'Safe and guaranteed returns',
          amount: amount * 0.6,
          percentage: 60,
          pros: ['Guaranteed returns', 'No market risk', 'Easy to understand'],
          cons: ['Lower returns', 'Lock-in period', 'Inflation risk']
        },
        {
          title: 'Recurring Deposits',
          description: 'Regular savings with fixed returns',
          amount: amount * 0.3,
          percentage: 30,
          pros: ['Disciplined saving', 'Fixed returns', 'Flexible tenure'],
          cons: ['Lower liquidity', 'Fixed interest rates', 'Penalty for early withdrawal']
        },
        {
          title: 'Government Bonds',
          description: 'Government-backed securities',
          amount: amount * 0.1,
          percentage: 10,
          pros: ['Government guarantee', 'Regular interest', 'Tax benefits'],
          cons: ['Lower returns', 'Interest rate risk', 'Limited liquidity']
        }
      );
    } else if (riskLevel === 'moderate') {
      options.push(
        {
          title: 'SIP in Mutual Funds',
          description: 'Systematic Investment Plan in balanced funds',
          amount: amount * 0.5,
          percentage: 50,
          pros: ['Market-linked returns', 'Rupee cost averaging', 'Professional management'],
          cons: ['Market risk', 'No guarantee', 'Management fees']
        },
        {
          title: 'Fixed Deposits',
          description: 'Safe portion for capital protection',
          amount: amount * 0.3,
          percentage: 30,
          pros: ['Guaranteed returns', 'Capital protection', 'Stable income'],
          cons: ['Lower returns', 'Lock-in period', 'Inflation risk']
        },
        {
          title: 'PPF/EPF',
          description: 'Public Provident Fund for tax benefits',
          amount: amount * 0.2,
          percentage: 20,
          pros: ['Tax benefits', 'Guaranteed returns', 'Long-term growth'],
          cons: ['Long lock-in', 'Limited liquidity', 'Annual contribution limits']
        }
      );
    } else {
      options.push(
        {
          title: 'Equity SIP',
          description: 'Systematic Investment in equity funds',
          amount: amount * 0.6,
          percentage: 60,
          pros: ['High growth potential', 'Beat inflation', 'Long-term wealth creation'],
          cons: ['High volatility', 'Market risk', 'No guarantee of returns']
        },
        {
          title: 'Hybrid Funds',
          description: 'Balanced approach with equity and debt',
          amount: amount * 0.25,
          percentage: 25,
          pros: ['Balanced risk-return', 'Professional management', 'Diversification'],
          cons: ['Management fees', 'Market exposure', 'No guarantee']
        },
        {
          title: 'Fixed Deposits',
          description: 'Conservative portion for stability',
          amount: amount * 0.15,
          percentage: 15,
          pros: ['Capital protection', 'Guaranteed returns', 'Liquidity'],
          cons: ['Lower returns', 'Inflation risk', 'Fixed tenure']
        }
      );
    }
    
    return options;
  };

  const generateActionSteps = (name: string, amount: number, months: number, monthlyContribution: number) => {
    const steps = [];
    const stepSize = Math.ceil(months / 6); // 6 action steps
    
    for (let i = 0; i < 6; i++) {
      const startMonth = i * stepSize + 1;
      const endMonth = Math.min((i + 1) * stepSize, months);
      
      let description = '';
      switch (i) {
        case 0:
          description = `Set up automatic transfers for ${currency}${monthlyContribution.toLocaleString()} per month`;
          break;
        case 1:
          description = `Open investment accounts (FD, SIP, etc.) and start systematic investing`;
          break;
        case 2:
          description = `Review and rebalance your portfolio based on market conditions`;
          break;
        case 3:
          description = `Increase SIP amounts if possible to accelerate goal achievement`;
          break;
        case 4:
          description = `Monitor progress and adjust strategy if needed`;
          break;
        case 5:
          description = `Final review and prepare for goal completion`;
          break;
      }
      
      steps.push({
        id: `step-${i + 1}`,
        monthRange: `Month ${startMonth}${endMonth !== startMonth ? `-${endMonth}` : ''}`,
        description,
        completed: false
      });
    }
    
    return steps;
  };

  const getRiskDescription = (riskLevel: string) => {
    switch (riskLevel) {
      case 'conservative':
        return 'Focus on capital protection with guaranteed returns';
      case 'moderate':
        return 'Balanced approach with moderate risk for better returns';
      case 'aggressive':
        return 'Higher risk for maximum growth potential';
      default:
        return 'Balanced approach';
    }
  };

  const handleSaveTarget = async () => {
    if (!targetAdvice || !user?.id) return;

    try {
      const newTarget = {
        name: formData.name,
        targetAmount: parseFloat(formData.targetAmount),
        currentAmount: 0,
        targetDate: formData.targetDate,
        planDetails: {
          missionBrief: targetAdvice.summary,
          investmentArenas: targetAdvice.investmentOptions.map(option => ({
            title: option.title,
            description: option.description,
            pros: option.pros,
            cons: option.cons
          })),
          sideQuests: [],
          bossBattles: [],
          roadmap: targetAdvice.actionSteps,
          riskLevels: [{
            riskLevel: formData.riskLevel,
            description: getRiskDescription(formData.riskLevel)
          }],
          strategistsPick: `Recommended monthly contribution: ${currency}${targetAdvice.totalMonthlyContribution.toLocaleString()}`
        }
      };

      const savedTarget = await apiService.createTarget(newTarget, user.id);
      setTargets(prev => [savedTarget, ...prev]);
      setShowAdviceDialog(false);
      setOpenDialog(false);
      setFormData({ name: '', targetAmount: '', targetDate: '', riskLevel: 'moderate' });
      setTargetAdvice(null);
    } catch (error) {
      console.error('Error saving target:', error);
      setError('Failed to save target. Please try again.');
    }
  };

  const calculateProgress = (target: Target) => {
    return (target.currentAmount / target.targetAmount) * 100;
  };

  const getDaysRemaining = (targetDate: string) => {
    const target = new Date(targetDate);
    const today = new Date();
    const diffTime = target.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const generateActionPlan = (target: Target) => {
    const userFinances = analyzeUserFinances();
    const targetDate = new Date(target.targetDate);
    const today = new Date();
    const monthsRemaining = Math.ceil((targetDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24 * 30));
    const monthlyNeeded = target.targetAmount / monthsRemaining;
    const savingsGap = monthlyNeeded - userFinances.netIncome;
    
    // Generate month-by-month action plan
    const actionPlan = [];
    let cumulativeSavings = 0;
    
    for (let month = 1; month <= monthsRemaining; month++) {
      const monthDate = new Date(today.getFullYear(), today.getMonth() + month - 1, 1);
      const monthName = monthDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
      
      let monthlyContribution = monthlyNeeded;
      let expenseReduction = 0;
      let incomeIncrease = 0;
      let actions = [];
      
      // Calculate actions based on savings gap
      if (savingsGap > 0) {
        // Month 1-2: Focus on expense reduction
        if (month <= 2) {
          expenseReduction = Math.min(savingsGap * 0.6, userFinances.totalExpenses * 0.15);
          actions = [
            'Set up automatic savings transfer',
            'Cancel unused subscriptions',
            'Start meal planning to reduce food costs',
            'Use public transport 2 days/week'
          ];
        }
        // Month 3-4: Income enhancement
        else if (month <= 4) {
          incomeIncrease = Math.min(savingsGap * 0.4, userFinances.totalIncome * 0.1);
          actions = [
            'Start freelance/part-time work',
            'Sell unused items',
            'Optimize existing investments',
            'Review and rebalance portfolio'
          ];
        }
        // Month 5+: Optimization
        else {
          expenseReduction = savingsGap * 0.3;
          incomeIncrease = savingsGap * 0.2;
          actions = [
            'Increase SIP amounts if possible',
            'Use bonuses/incentives for target',
            'Fine-tune expense categories',
            'Monitor and adjust strategy'
          ];
        }
        
        monthlyContribution = userFinances.netIncome + expenseReduction + incomeIncrease;
      } else {
        // If no gap, focus on optimization
        actions = [
          'Maintain current savings rate',
          'Consider increasing target amount',
          'Optimize investment returns',
          'Review progress monthly'
        ];
      }
      
      cumulativeSavings += monthlyContribution;
      const progressPercentage = Math.min((cumulativeSavings / target.targetAmount) * 100, 100);
      
      actionPlan.push({
        month,
        monthName,
        monthlyContribution: Math.round(monthlyContribution),
        expenseReduction: Math.round(expenseReduction),
        incomeIncrease: Math.round(incomeIncrease),
        cumulativeSavings: Math.round(cumulativeSavings),
        progressPercentage: Math.round(progressPercentage),
        actions,
        status: progressPercentage >= 100 ? 'Completed' : progressPercentage >= 75 ? 'On Track' : progressPercentage >= 50 ? 'Good Progress' : 'Starting'
      });
    }
    
    return {
      target,
      userFinances,
      monthlyNeeded: Math.round(monthlyNeeded),
      savingsGap: Math.round(savingsGap),
      monthsRemaining,
      actionPlan
    };
  };

  const showTargetActionPlan = async (target: Target) => {
    setActionPlanTarget(target);
    setShowActionPlan(true);
    
    // Load existing investment data for this target
    try {
      const investmentData = await apiService.getTargetInvestments(target.id);
      const investmentMap: {[month: string]: number} = {};
      
      investmentData.transactions.forEach((transaction: any) => {
        const month = new Date(transaction.date).toLocaleDateString('en-US', { 
          month: 'long', 
          year: 'numeric' 
        });
        investmentMap[month] = (investmentMap[month] || 0) + transaction.amount;
      });
      
      setInvestments(investmentMap);
    } catch (error) {
      console.error('Error loading investment data:', error);
    }
  };

  const handleActionStepUpdate = async (targetId: number, stepId: string, updates: { completed?: boolean; amount?: number }) => {
    try {
      await apiService.updateActionStep(targetId, stepId, updates);
      
      // Update the target in the local state
      setTargets(prev => prev.map(target => {
        if (target.id === targetId) {
          const updatedPlanDetails = {
            ...target.planDetails,
            roadmap: target.planDetails.roadmap.map(step => 
              step.id === stepId ? { ...step, ...updates } : step
            )
          };
          
          // Calculate new current amount if amount was updated
          let newCurrentAmount = target.currentAmount;
          if (updates.amount !== undefined) {
            const totalStepAmounts = updatedPlanDetails.roadmap
              .filter(step => step.amount && step.amount > 0)
              .reduce((sum, step) => sum + (step.amount || 0), 0);
            newCurrentAmount = totalStepAmounts;
          }
          
          return { ...target, planDetails: updatedPlanDetails, currentAmount: newCurrentAmount };
        }
        return target;
      }));

      // Update the action plan target if it's currently displayed
      if (actionPlanTarget && actionPlanTarget.id === targetId) {
        const updatedPlanDetails = {
          ...actionPlanTarget.planDetails,
          roadmap: actionPlanTarget.planDetails.roadmap.map(step => 
            step.id === stepId ? { ...step, ...updates } : step
          )
        };
        
        // Calculate new current amount if amount was updated
        let newCurrentAmount = actionPlanTarget.currentAmount;
        if (updates.amount !== undefined) {
          const totalStepAmounts = updatedPlanDetails.roadmap
            .filter(step => step.amount && step.amount > 0)
            .reduce((sum, step) => sum + (step.amount || 0), 0);
          newCurrentAmount = totalStepAmounts;
        }
        
        setActionPlanTarget({ ...actionPlanTarget, planDetails: updatedPlanDetails, currentAmount: newCurrentAmount });
      }
    } catch (error) {
      console.error('Error updating action step:', error);
      setError('Failed to update action step. Please try again.');
    }
  };

  const handleProgressUpdate = async (targetId: number, currentAmount: number) => {
    try {
      await apiService.updateTargetProgress(targetId, currentAmount);
      
      // Update the target in the local state
      setTargets(prev => prev.map(target => 
        target.id === targetId ? { ...target, currentAmount } : target
      ));

      // Update the action plan target if it's currently displayed
      if (actionPlanTarget && actionPlanTarget.id === targetId) {
        setActionPlanTarget({ ...actionPlanTarget, currentAmount });
      }
    } catch (error) {
      console.error('Error updating progress:', error);
      setError('Failed to update progress. Please try again.');
    }
  };

  const handleInvestmentUpdate = async (targetId: number, monthName: string, amount: number) => {
    try {
      // Update local state first
      setInvestments(prev => ({ ...prev, [monthName]: amount }));
      
      // Create investment transaction only if amount is positive
      if (amount > 0) {
        console.log('Creating investment transaction:', { targetId, monthName, amount });
        
        await apiService.createInvestmentTransaction({
          date: new Date().toISOString().split('T')[0],
          description: `Investment for ${monthName}`,
          amount: amount,
          category: 'Investment'
        }, targetId);
        
        console.log('Investment transaction created successfully');
        
        // Update target progress
        const currentTarget = targets.find(t => t.id === targetId);
        if (currentTarget) {
          const newProgress = currentTarget.currentAmount + amount;
          console.log('Updating target progress:', { currentAmount: currentTarget.currentAmount, newProgress });
          await handleProgressUpdate(targetId, newProgress);
        }
      } else if (amount === 0) {
        // If amount is 0, just update local state
        console.log('Investment amount set to 0, updating local state only');
      }
    } catch (error) {
      console.error('Error updating investment:', error);
      
      // Revert local state on error
      setInvestments(prev => {
        const updated = { ...prev };
        delete updated[monthName];
        return updated;
      });
      
      setError(`Failed to update investment: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const analyzeUserFinances = () => {
    // Calculate user's financial metrics
    const totalIncome = transactions
      .filter(t => t.type === 'income')
      .reduce((sum, t) => sum + t.amount, 0);
    
    const totalExpenses = transactions
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + t.amount, 0);
    
    const netIncome = totalIncome - totalExpenses;
    const savingsRate = totalIncome > 0 ? (netIncome / totalIncome) * 100 : 0;
    
    // Analyze spending by category
    const categorySpending = transactions
      .filter(t => t.type === 'expense')
      .reduce((acc, t) => {
        acc[t.category] = (acc[t.category] || 0) + t.amount;
        return acc;
      }, {} as Record<string, number>);
    
    const topSpendingCategories = Object.entries(categorySpending)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3);
    
    // Budget analysis
    const budgetAnalysis = Object.entries(budgets).map(([category, budget]) => {
      const spent = categorySpending[category] || 0;
      const budgetAmount = budget.amount;
      const percentage = budgetAmount > 0 ? (spent / budgetAmount) * 100 : 0;
      return {
        category,
        spent,
        budget: budgetAmount,
        percentage,
        status: percentage > 100 ? 'over' : percentage > 80 ? 'warning' : 'good'
      };
    });
    
    return {
      totalIncome,
      totalExpenses,
      netIncome,
      savingsRate,
      topSpendingCategories,
      budgetAnalysis,
      categorySpending
    };
  };

  const startConversation = (target: Target) => {
    setCurrentTarget(target);
    setShowChat(true);
    
    const userFinances = analyzeUserFinances();
    const monthlyNeeded = target.targetAmount / Math.ceil((new Date(target.targetDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24 * 30));
    
    let initialMessage = `Hello! I'm your AI financial advisor. I've analyzed your financial situation and see you want to achieve "${target.name}" - saving ${currency}${target.targetAmount.toLocaleString()} by ${new Date(target.targetDate).toLocaleDateString()}.\n\n`;
    
    initialMessage += `**Your Current Financial Profile:**\n`;
    initialMessage += `- Monthly Income: ${currency}${userFinances.totalIncome.toLocaleString()}\n`;
    initialMessage += `- Monthly Expenses: ${currency}${userFinances.totalExpenses.toLocaleString()}\n`;
    initialMessage += `- Net Income: ${currency}${userFinances.netIncome.toLocaleString()}\n`;
    initialMessage += `- Savings Rate: ${userFinances.savingsRate.toFixed(1)}%\n`;
    initialMessage += `- Required for Target: ${currency}${monthlyNeeded.toLocaleString()}/month\n\n`;
    
    if (userFinances.netIncome < monthlyNeeded) {
      initialMessage += `⚠️ **Challenge Identified**: You need ${currency}${monthlyNeeded.toLocaleString()}/month but your current net income is ${currency}${userFinances.netIncome.toLocaleString()}/month. We need to find ways to bridge this gap.\n\n`;
    } else {
      initialMessage += `✅ **Good News**: Your net income can support this target! Let's optimize your strategy.\n\n`;
    }
    
    initialMessage += `How can I help you improve this target or clarify any doubts?`;
    
    setChatMessages([
      {
        id: '1',
        type: 'ai',
        message: initialMessage,
        timestamp: new Date()
      }
    ]);
  };

  const handleChatSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim() || !currentTarget) return;

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      type: 'user',
      message: chatInput.trim(),
      timestamp: new Date()
    };

    setChatMessages(prev => [...prev, userMessage]);
    setChatInput('');
    setIsChatLoading(true);

    try {
      // Get AI response for target improvement/doubt clarification
      const aiResponse = await getTargetChatAdvice(chatInput.trim(), currentTarget);
      
      const aiMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        type: 'ai',
        message: aiResponse,
        timestamp: new Date()
      };

      setChatMessages(prev => [...prev, aiMessage]);
    } catch (error) {
      console.error('Chat error:', error);
      const errorMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        type: 'ai',
        message: 'Sorry, I encountered an error. Please try again.',
        timestamp: new Date()
      };
      setChatMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsChatLoading(false);
    }
  };

  const getTargetChatAdvice = async (question: string, target: Target): Promise<string> => {
    // Get user's actual financial data
    const userFinances = analyzeUserFinances();
    
    // Generate contextual advice based on the question and target
    const targetAmount = target.targetAmount;
    const targetDate = new Date(target.targetDate);
    const today = new Date();
    const monthsRemaining = Math.ceil((targetDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24 * 30));
    const monthlyNeeded = targetAmount / monthsRemaining;
    
    // Calculate the gap between current net income and required savings
    const savingsGap = monthlyNeeded - userFinances.netIncome;
    
    // Generate responses based on common questions with user's actual data
    let response = '';
    
    if (question.toLowerCase().includes('improve') || question.toLowerCase().includes('better')) {
      response = `Here are specific ways to improve your target "${target.name}" based on YOUR financial situation:\n\n`;
      
      response += `**Current Situation Analysis:**\n`;
      response += `- Your Income: ${currency}${userFinances.totalIncome.toLocaleString()}/month\n`;
      response += `- Your Expenses: ${currency}${userFinances.totalExpenses.toLocaleString()}/month\n`;
      response += `- Your Net Income: ${currency}${userFinances.netIncome.toLocaleString()}/month\n`;
      response += `- Target Requirement: ${currency}${monthlyNeeded.toLocaleString()}/month\n\n`;
      
      if (savingsGap > 0) {
        response += `⚠️ **Challenge**: You need to save ${currency}${savingsGap.toLocaleString()} MORE per month to achieve this target.\n\n`;
        response += `**Expense Reduction Strategy:**\n`;
        response += `Your top spending categories are:\n`;
        userFinances.topSpendingCategories.forEach(([category, amount], index) => {
          response += `${index + 1}. ${category}: ${currency}${amount.toLocaleString()} (${((amount/userFinances.totalExpenses)*100).toFixed(1)}% of expenses)\n`;
        });
        response += `\n**Specific Reduction Opportunities:**\n`;
        
        // Provide specific reduction suggestions based on spending
        userFinances.topSpendingCategories.forEach(([category, amount]) => {
          const potentialSavings = amount * 0.15; // 15% reduction potential
          if (potentialSavings >= 1000) { // Only suggest if savings is significant
            response += `- ${category}: Reduce by 15% = Save ${currency}${potentialSavings.toLocaleString()}/month\n`;
          }
        });
        
        response += `\n**Income Enhancement:**\n`;
        response += `- Freelance/Part-time: Could generate ${currency}${Math.ceil(savingsGap * 0.5).toLocaleString()}/month\n`;
        response += `- Skill development: Increase earning potential\n`;
        response += `- Negotiate salary increase or promotion\n\n`;
      } else {
        response += `✅ **Good News**: Your net income (${currency}${userFinances.netIncome.toLocaleString()}) can support this target (${currency}${monthlyNeeded.toLocaleString()})!\n\n`;
        response += `**Optimization Strategies:**\n`;
        response += `1. **Increase Savings Rate**: You can save ${currency}${(userFinances.netIncome - monthlyNeeded).toLocaleString()} MORE per month\n`;
        response += `2. **Complete Target Early**: Finish in ${Math.ceil((targetAmount / userFinances.netIncome) * 30)} days instead of ${monthsRemaining} months\n`;
        response += `3. **Increase Target Amount**: You could aim for ${currency}${(targetAmount * 1.5).toLocaleString()} instead\n\n`;
      }
      
      response += `**Investment Strategy Optimization:**\n`;
      response += `Based on your ${userFinances.savingsRate.toFixed(1)}% savings rate, consider:\n`;
      if (userFinances.savingsRate < 10) {
        response += `- Conservative approach: 70% FD, 30% Balanced funds\n`;
      } else if (userFinances.savingsRate < 20) {
        response += `- Moderate approach: 50% SIP, 30% FD, 20% Equity\n`;
      } else {
        response += `- Aggressive approach: 60% Equity SIP, 25% Hybrid, 15% FD\n`;
      }
      
      response += `\nWould you like me to create a detailed action plan for any of these improvements?`;
    } else if (question.toLowerCase().includes('risk') || question.toLowerCase().includes('safe')) {
      response = `Regarding the safety and risk of your target "${target.name}":\n\n`;
      response += `**Current Risk Assessment**:\n`;
      response += `- Target Amount: ${currency}${targetAmount.toLocaleString()}\n`;
      response += `- Monthly Required: ${currency}${monthlyNeeded.toLocaleString()}\n`;
      response += `- Timeline: ${monthsRemaining} months\n\n`;
      response += `**Risk Factors**:\n`;
      response += `1. **Income Stability**: Ensure your income can support ${currency}${monthlyNeeded.toLocaleString()}/month consistently\n`;
      response += `2. **Market Volatility**: If using equity investments, market fluctuations could affect returns\n`;
      response += `3. **Emergency Buffer**: Keep 3-6 months expenses as emergency fund\n\n`;
      response += `**Mitigation Strategies**:\n`;
      response += `- Diversify investments across asset classes\n`;
      response += `- Start with conservative options and gradually increase risk\n`;
      response += `- Regular review and adjustment of strategy\n\n`;
      response += `Would you like specific recommendations for your risk level?`;
    } else if (question.toLowerCase().includes('how') || question.toLowerCase().includes('achieve')) {
      response = `Here's how to achieve your target "${target.name}":\n\n`;
      response += `**Step-by-Step Plan**:\n\n`;
      response += `1. **Set Up Automatic Transfers** (Month 1):\n`;
      response += `   - Create separate savings account\n`;
      response += `   - Set up auto-transfer of ${currency}${monthlyNeeded.toLocaleString()} on salary day\n\n`;
      response += `2. **Choose Investment Vehicles** (Month 1-2):\n`;
      response += `   - 50% in SIP (Systematic Investment Plan)\n`;
      response += `   - 30% in Fixed Deposits\n`;
      response += `   - 20% in PPF/Government schemes\n\n`;
      response += `3. **Monitor & Adjust** (Monthly):\n`;
      response += `   - Track progress against target\n`;
      response += `   - Increase SIP amounts if possible\n`;
      response += `   - Rebalance portfolio quarterly\n\n`;
      response += `4. **Accelerate** (If possible):\n`;
      response += `   - Use bonuses/incentives for target\n`;
      response += `   - Reduce unnecessary expenses\n`;
      response += `   - Consider part-time income\n\n`;
      response += `Would you like detailed information about any specific step?`;
    } else if (question.toLowerCase().includes('expense') || question.toLowerCase().includes('reduce') || question.toLowerCase().includes('cut')) {
      response = `Here's how to reduce your expenses to achieve "${target.name}":\n\n`;
      
      response += `**Your Current Expense Analysis:**\n`;
      response += `- Total Monthly Expenses: ${currency}${userFinances.totalExpenses.toLocaleString()}\n`;
      response += `- Required Savings: ${currency}${monthlyNeeded.toLocaleString()}/month\n`;
      response += `- Current Gap: ${currency}${savingsGap.toLocaleString()}/month\n\n`;
      
      response += `**Top Expense Categories & Reduction Opportunities:**\n`;
      userFinances.topSpendingCategories.forEach(([category, amount], index) => {
        const percentage = (amount / userFinances.totalExpenses) * 100;
        const reduction10 = amount * 0.1;
        const reduction20 = amount * 0.2;
        response += `${index + 1}. **${category}**: ${currency}${amount.toLocaleString()} (${percentage.toFixed(1)}%)\n`;
        response += `   - 10% reduction = Save ${currency}${reduction10.toLocaleString()}/month\n`;
        response += `   - 20% reduction = Save ${currency}${reduction20.toLocaleString()}/month\n\n`;
      });
      
      response += `**Specific Reduction Strategies:**\n`;
      userFinances.topSpendingCategories.forEach(([category, amount]) => {
        if (category.toLowerCase().includes('food') || category.toLowerCase().includes('dining')) {
          response += `🍽️ **${category}**: Cook at home 2 more days/week, use meal planning, buy in bulk\n`;
        } else if (category.toLowerCase().includes('transport') || category.toLowerCase().includes('fuel')) {
          response += `🚗 **${category}**: Carpool, use public transport, bike for short trips\n`;
        } else if (category.toLowerCase().includes('entertainment') || category.toLowerCase().includes('recreation')) {
          response += `🎬 **${category}**: Cancel unused subscriptions, free activities, group discounts\n`;
        } else if (category.toLowerCase().includes('shopping') || category.toLowerCase().includes('clothing')) {
          response += `🛍️ **${category}**: Buy only essentials, wait 24h before purchases, use coupons\n`;
        } else if (category.toLowerCase().includes('utility') || category.toLowerCase().includes('electricity')) {
          response += `⚡ **${category}**: Use energy-efficient appliances, LED bulbs, reduce AC usage\n`;
        }
      });
      
      response += `\n**Quick Wins (Immediate Savings):**\n`;
      response += `- Cancel unused subscriptions: Save ${currency}${Math.min(2000, userFinances.totalExpenses * 0.05).toLocaleString()}/month\n`;
      response += `- Reduce dining out by 50%: Save ${currency}${Math.min(3000, userFinances.totalExpenses * 0.08).toLocaleString()}/month\n`;
      response += `- Use public transport 2 days/week: Save ${currency}${Math.min(1500, userFinances.totalExpenses * 0.03).toLocaleString()}/month\n`;
      
      response += `\n**Total Potential Monthly Savings**: ${currency}${(userFinances.totalExpenses * 0.15).toLocaleString()}\n`;
      response += `**New Monthly Savings**: ${currency}${(userFinances.netIncome + userFinances.totalExpenses * 0.15).toLocaleString()}\n\n`;
      
      if (userFinances.netIncome + (userFinances.totalExpenses * 0.15) >= monthlyNeeded) {
        response += `✅ **Success!** With these reductions, you can achieve your target!\n\n`;
      } else {
        response += `⚠️ **Still need more**: Consider additional income sources or adjust target timeline.\n\n`;
      }
      
      response += `Would you like a detailed month-by-month expense reduction plan?`;
    } else if (question.toLowerCase().includes('alternative') || question.toLowerCase().includes('other')) {
      response = `Here are alternative approaches for your target "${target.name}":\n\n`;
      response += `**Alternative Investment Options**:\n\n`;
      response += `1. **Conservative Approach**:\n`;
      response += `   - 70% Fixed Deposits\n`;
      response += `   - 20% Government Bonds\n`;
      response += `   - 10% Liquid Funds\n`;
      response += `   - Lower risk, guaranteed returns\n\n`;
      response += `2. **Balanced Approach**:\n`;
      response += `   - 50% SIP in Balanced Funds\n`;
      response += `   - 30% Fixed Deposits\n`;
      response += `   - 20% PPF/EPF\n`;
      response += `   - Moderate risk, better returns\n\n`;
      response += `3. **Aggressive Approach**:\n`;
      response += `   - 60% SIP in Equity Funds\n`;
      response += `   - 25% Hybrid Funds\n`;
      response += `   - 15% Fixed Deposits\n`;
      response += `   - Higher risk, maximum growth\n\n`;
      response += `**Alternative Timeline Options**:\n`;
      response += `- Complete 6 months early with higher monthly contribution\n`;
      response += `- Extend timeline for lower monthly burden\n`;
      response += `- Phase-wise achievement (partial targets)\n\n`;
      response += `Which alternative interests you most?`;
    } else {
      response = `I understand you're asking about "${question}" regarding your target "${target.name}".\n\n`;
      response += `Based on your current financial situation, here's my advice:\n\n`;
      response += `**Current Target Analysis**:\n`;
      response += `- Target: ${currency}${targetAmount.toLocaleString()}\n`;
      response += `- Timeline: ${monthsRemaining} months\n`;
      response += `- Monthly Required: ${currency}${monthlyNeeded.toLocaleString()}\n\n`;
      response += `**Recommendations**:\n`;
      response += `1. **Consistency**: Regular monthly contributions are key\n`;
      response += `2. **Discipline**: Avoid withdrawing from target fund\n`;
      response += `3. **Review**: Monthly progress tracking\n`;
      response += `4. **Adjust**: Modify strategy based on performance\n\n`;
      response += `**Quick Tips**:\n`;
      response += `- Start with smaller amounts if needed\n`;
      response += `- Use windfall gains (bonuses, tax refunds)\n`;
      response += `- Consider increasing contributions annually\n`;
      response += `- Maintain emergency fund separately\n\n`;
      response += `Is there a specific aspect you'd like me to explain further?`;
    }
    
    return response;
  };

  return (
    <div className="min-h-screen bg-dark-blue overflow-x-hidden">
      {/* Header */}
      <div className="p-4 md:p-8 pb-4">
        <div className="flex flex-col md:flex-row justify-between items-stretch md:items-center gap-4">
          <div>
            <h1 className="text-2xl md:text-4xl font-light text-text-primary mb-2">
              Financial Targets
            </h1>
            <p className="text-text-secondary text-sm md:text-base">
              Set your financial goals and get expert advice on how to achieve them
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
            Set New Target
          </Button>
        </div>
      </div>

      {/* Error Alert */}
      {error && (
        <div className="mx-4 md:mx-8 mb-4">
          <Alert severity="error">{error}</Alert>
        </div>
      )}

      {/* Targets List */}
      <div className="p-4 md:p-8 space-y-6">
        {targets.length === 0 ? (
          <Card sx={{ background: '#2a2a3e', border: '1px solid #3a3a4e', p: 4, textAlign: 'center' }}>
            <FlagIcon sx={{ fontSize: 48, color: '#666', mb: 2 }} />
            <Typography variant="h6" sx={{ color: '#b0b0b0', mb: 2 }}>
              No targets set yet
            </Typography>
            <Typography variant="body2" sx={{ color: '#888', mb: 3 }}>
              Set your first financial target and get expert advice on how to achieve it
            </Typography>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => setOpenDialog(true)}
              sx={{
                background: '#1976d2',
                '&:hover': { background: '#1565c0' }
              }}
            >
              Set Your First Target
            </Button>
          </Card>
        ) : (
          targets.map((target) => (
            <Card key={target.id} sx={{ background: '#2a2a3e', border: '1px solid #3a3a4e', p: 3 }}>
              <div className="flex flex-col md:flex-row justify-between items-start gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <FlagIcon sx={{ color: '#1976d2' }} />
                    <h3 className="text-xl font-semibold text-text-primary">{target.name}</h3>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                    <div className="flex items-center gap-2">
                      <MoneyIcon sx={{ color: '#4caf50' }} />
                      <div>
                        <p className="text-text-secondary text-sm">Target Amount</p>
                        <p className="text-text-primary font-semibold">{currency}{target.targetAmount.toLocaleString()}</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <CalendarIcon sx={{ color: '#ff9800' }} />
                      <div>
                        <p className="text-text-secondary text-sm">Target Date</p>
                        <p className="text-text-primary font-semibold">{new Date(target.targetDate).toLocaleDateString()}</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <TrendingUpIcon sx={{ color: '#2196f3' }} />
                      <div>
                        <p className="text-text-secondary text-sm">Days Remaining</p>
                        <p className="text-text-primary font-semibold">{getDaysRemaining(target.targetDate)} days</p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="mb-2">
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-text-secondary">Progress</span>
                      <span className="text-text-primary">{calculateProgress(target).toFixed(1)}%</span>
                    </div>
                    <div className="w-full bg-gray-700 rounded-full h-2">
                      <div 
                        className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${Math.min(calculateProgress(target), 100)}%` }}
                      ></div>
                    </div>
                  </div>
                  
                  {target.planDetails && (
                    <div className="mt-3">
                      <p className="text-text-secondary text-sm mb-2">Strategy:</p>
                      <p className="text-text-primary text-sm">{target.planDetails.strategistsPick}</p>
                    </div>
                  )}
                  
                  <div className="mt-4 flex flex-wrap gap-2">
                    <Button
                      variant="outlined"
                      startIcon={<SmartToyIcon />}
                      onClick={() => startConversation(target)}
                      sx={{
                        borderColor: '#3a3a4e',
                        color: '#1976d2',
                        '&:hover': {
                          borderColor: '#1976d2',
                          backgroundColor: 'rgba(25, 118, 210, 0.1)'
                        }
                      }}
                    >
                      Discuss Target
                    </Button>
                    <Button
                      variant="contained"
                      startIcon={<TrendingUpIcon />}
                      onClick={() => showTargetActionPlan(target)}
                      sx={{
                        background: '#4caf50',
                        '&:hover': { background: '#45a049' }
                      }}
                    >
                      Show Action Plan
                    </Button>
                    <Button
                      variant="outlined"
                      startIcon={<CheckCircleIcon />}
                      onClick={() => {
                        setProgressTarget(target);
                        setProgressAmount(target.currentAmount.toString());
                        setShowProgressDialog(true);
                      }}
                      sx={{
                        borderColor: '#ff9800',
                        color: '#ff9800',
                        '&:hover': {
                          borderColor: '#ff9800',
                          backgroundColor: 'rgba(255, 152, 0, 0.1)'
                        }
                      }}
                    >
                      Update Progress
                    </Button>
                  </div>
                </div>
              </div>
            </Card>
          ))
        )}
      </div>

      {/* Set Target Dialog */}
      <Dialog
        open={openDialog}
        onClose={() => setOpenDialog(false)}
        maxWidth="md"
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
            <FlagIcon />
            Set Financial Target
          </div>
        </DialogTitle>

        <form onSubmit={handleSubmit}>
          <DialogContent>
            <div className="space-y-4">
              <TextField
                label="Target Name"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                fullWidth
                placeholder="e.g., Save for House Down Payment"
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
                fullWidth
                placeholder="100000"
                InputProps={{
                  sx: { color: '#ffffff' },
                  startAdornment: <span className="text-text-secondary mr-2">{currency}</span>
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

              <div>
                <label className="block text-text-secondary text-sm mb-2">Risk Level</label>
                <div className="flex gap-2">
                  {['conservative', 'moderate', 'aggressive'].map((risk) => (
                    <Chip
                      key={risk}
                      label={risk.charAt(0).toUpperCase() + risk.slice(1)}
                      onClick={() => setFormData(prev => ({ ...prev, riskLevel: risk }))}
                      variant={formData.riskLevel === risk ? 'filled' : 'outlined'}
                      sx={{
                        borderColor: '#3a3a4e',
                        color: formData.riskLevel === risk ? '#ffffff' : '#b0b0b0',
                        backgroundColor: formData.riskLevel === risk ? '#1976d2' : 'transparent',
                        '&:hover': {
                          borderColor: '#1976d2',
                          color: '#1976d2'
                        }
                      }}
                    />
                  ))}
                </div>
              </div>
            </div>
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
              disabled={isGettingAdvice}
              startIcon={isGettingAdvice ? <CircularProgress size={20} /> : <SmartToyIcon />}
              sx={{
                background: '#1976d2',
                '&:hover': { background: '#1565c0' }
              }}
            >
              {isGettingAdvice ? 'Getting Expert Advice...' : 'Get Expert Advice'}
            </Button>
          </DialogActions>
        </form>
      </Dialog>

      {/* Target Advice Dialog */}
      <Dialog
        open={showAdviceDialog}
        onClose={() => setShowAdviceDialog(false)}
        maxWidth="lg"
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
            <SmartToyIcon />
            Expert Financial Advice
          </div>
        </DialogTitle>

        <DialogContent>
          {targetAdvice && (
            <div className="space-y-6">
              {/* Summary */}
              <Card sx={{ background: '#1a1a2e', border: '1px solid #3a3a4e', p: 3 }}>
                <Typography variant="h6" sx={{ color: '#ffffff', mb: 2 }}>
                  <SmartToyIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
                  AI Summary
                </Typography>
                <Typography sx={{ color: '#b0b0b0' }}>
                  {targetAdvice.summary}
                </Typography>
              </Card>

              {/* Investment Options */}
              <Card sx={{ background: '#1a1a2e', border: '1px solid #3a3a4e', p: 3 }}>
                <Typography variant="h6" sx={{ color: '#ffffff', mb: 3 }}>
                  <TrendingUpIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
                  Recommended Investment Strategy
                </Typography>
                <div className="space-y-4">
                  {targetAdvice.investmentOptions.map((option, index) => (
                    <div key={index} className="border border-gray-600 rounded-lg p-4">
                      <div className="flex justify-between items-start mb-2">
                        <Typography variant="h6" sx={{ color: '#ffffff' }}>
                          {option.title}
                        </Typography>
                        <div className="text-right">
                          <Typography variant="h6" sx={{ color: '#4caf50' }}>
                            {currency}{option.amount.toLocaleString()}
                          </Typography>
                          <Typography variant="body2" sx={{ color: '#b0b0b0' }}>
                            {option.percentage}%
                          </Typography>
                        </div>
                      </div>
                      <Typography variant="body2" sx={{ color: '#b0b0b0', mb: 2 }}>
                        {option.description}
                      </Typography>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <Typography variant="body2" sx={{ color: '#4caf50', fontWeight: 'bold', mb: 1 }}>
                            Pros:
                          </Typography>
                          <List dense>
                            {option.pros.map((pro, i) => (
                              <ListItem key={i} sx={{ py: 0 }}>
                                <ListItemIcon sx={{ minWidth: 24 }}>
                                  <CheckCircleIcon sx={{ fontSize: 16, color: '#4caf50' }} />
                                </ListItemIcon>
                                <ListItemText primary={pro} sx={{ color: '#b0b0b0', '& .MuiListItemText-primary': { fontSize: '0.875rem' } }} />
                              </ListItem>
                            ))}
                          </List>
                        </div>
                        <div>
                          <Typography variant="body2" sx={{ color: '#f44336', fontWeight: 'bold', mb: 1 }}>
                            Cons:
                          </Typography>
                          <List dense>
                            {option.cons.map((con, i) => (
                              <ListItem key={i} sx={{ py: 0 }}>
                                <ListItemIcon sx={{ minWidth: 24 }}>
                                  <WarningIcon sx={{ fontSize: 16, color: '#f44336' }} />
                                </ListItemIcon>
                                <ListItemText primary={con} sx={{ color: '#b0b0b0', '& .MuiListItemText-primary': { fontSize: '0.875rem' } }} />
                              </ListItem>
                            ))}
                          </List>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </Card>

              {/* Action Steps */}
              <Card sx={{ background: '#1a1a2e', border: '1px solid #3a3a4e', p: 3 }}>
                <Typography variant="h6" sx={{ color: '#ffffff', mb: 3 }}>
                  <LightbulbIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
                  Action Plan
                </Typography>
                <List>
                  {targetAdvice.actionSteps.map((step, index) => (
                    <ListItem key={index} sx={{ py: 1 }}>
                      <ListItemIcon>
                        <CheckCircleIcon sx={{ color: '#2196f3' }} />
                      </ListItemIcon>
                      <ListItemText
                        primary={
                          <div>
                            <Typography variant="subtitle2" sx={{ color: '#1976d2', fontWeight: 'bold' }}>
                              {step.monthRange}
                            </Typography>
                            <Typography sx={{ color: '#ffffff' }}>
                              {step.description}
                            </Typography>
                          </div>
                        }
                      />
                    </ListItem>
                  ))}
                </List>
              </Card>

              {/* Risk Assessment */}
              <Card sx={{ background: '#1a1a2e', border: '1px solid #3a3a4e', p: 3 }}>
                <Typography variant="h6" sx={{ color: '#ffffff', mb: 2 }}>
                  <WarningIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
                  Risk Assessment
                </Typography>
                <Typography sx={{ color: '#b0b0b0' }}>
                  {targetAdvice.riskAssessment}
                </Typography>
              </Card>
            </div>
          )}
        </DialogContent>

        <DialogActions sx={{ p: 3 }}>
          <Button
            onClick={() => setShowAdviceDialog(false)}
            sx={{ color: '#b0b0b0' }}
          >
            Cancel
          </Button>
          <Button
            onClick={handleSaveTarget}
            variant="contained"
            sx={{
              background: '#4caf50',
              '&:hover': { background: '#45a049' }
            }}
          >
            Save Target & Start Journey
          </Button>
        </DialogActions>
      </Dialog>

      {/* Chat Dialog */}
      <Dialog
        open={showChat}
        onClose={() => setShowChat(false)}
        maxWidth="md"
        fullWidth
        PaperProps={{
          sx: {
            background: '#2a2a3e',
            border: '1px solid #3a3a4e',
            height: '80vh'
          }
        }}
      >
        <DialogTitle sx={{ color: '#ffffff', pb: 2 }}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <SmartToyIcon />
              Target Discussion
            </div>
            <Button
              onClick={() => setShowChat(false)}
              sx={{ color: '#b0b0b0', minWidth: 'auto' }}
            >
              ✕
            </Button>
          </div>
        </DialogTitle>

        <DialogContent sx={{ p: 0, display: 'flex', flexDirection: 'column' }}>
          <div className="flex-1 overflow-y-auto p-4 space-y-4" style={{ maxHeight: '60vh' }}>
            {chatMessages.map((message) => (
              <div
                key={message.id}
                className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[80%] p-3 rounded-lg ${
                    message.type === 'user'
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-700 text-white'
                  }`}
                >
                  <div className="whitespace-pre-line">{message.message}</div>
                  <div className="text-xs opacity-70 mt-1">
                    {message.timestamp.toLocaleTimeString()}
                  </div>
                </div>
              </div>
            ))}
            
            {isChatLoading && (
              <div className="flex justify-start">
                <div className="bg-gray-700 text-white p-3 rounded-lg">
                  <div className="flex items-center gap-2">
                    <CircularProgress size={16} />
                    AI is thinking...
                  </div>
                </div>
              </div>
            )}
          </div>

          <form onSubmit={handleChatSubmit} className="p-4 border-t border-gray-600">
            <div className="flex gap-2">
              <TextField
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                placeholder="Ask about improvements, risks, alternatives, or any doubts..."
                fullWidth
                disabled={isChatLoading}
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
              <Button
                type="submit"
                variant="contained"
                disabled={!chatInput.trim() || isChatLoading}
                sx={{
                  background: '#1976d2',
                  '&:hover': { background: '#1565c0' }
                }}
              >
                Send
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Action Plan Dialog */}
      <Dialog
        open={showActionPlan}
        onClose={() => setShowActionPlan(false)}
        maxWidth="xl"
        fullWidth
        PaperProps={{
          sx: {
            background: '#2a2a3e',
            border: '1px solid #3a3a4e',
            height: '90vh'
          }
        }}
      >
        <DialogTitle sx={{ color: '#ffffff', pb: 2 }}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <TrendingUpIcon />
              Target Action Plan
            </div>
            <Button
              onClick={() => setShowActionPlan(false)}
              sx={{ color: '#b0b0b0', minWidth: 'auto' }}
            >
              ✕
            </Button>
          </div>
        </DialogTitle>

        <DialogContent sx={{ p: 0 }}>
          {actionPlanTarget && (() => {
            const plan = generateActionPlan(actionPlanTarget);
            return (
              <div className="p-6">
                {/* Summary Section */}
                <Card sx={{ background: '#1a1a2e', border: '1px solid #3a3a4e', p: 3, mb: 3 }}>
                  <Typography variant="h6" sx={{ color: '#ffffff', mb: 2 }}>
                    Target Summary
                  </Typography>
                  <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                    <div>
                      <Typography variant="body2" sx={{ color: '#b0b0b0' }}>Target</Typography>
                      <Typography variant="h6" sx={{ color: '#ffffff' }}>
                        {currency}{plan.target.targetAmount.toLocaleString()}
                      </Typography>
                    </div>
                    <div>
                      <Typography variant="body2" sx={{ color: '#b0b0b0' }}>Current Progress</Typography>
                      <Typography variant="h6" sx={{ color: '#4caf50' }}>
                        {currency}{actionPlanTarget.currentAmount.toLocaleString()}
                      </Typography>
                    </div>
                    <div>
                      <Typography variant="body2" sx={{ color: '#b0b0b0' }}>From Action Steps</Typography>
                      <Typography variant="h6" sx={{ color: '#ff9800' }}>
                        {currency}{actionPlanTarget.planDetails.roadmap
                          .filter(step => step.amount && step.amount > 0)
                          .reduce((sum, step) => sum + (step.amount || 0), 0)
                          .toLocaleString()}
                      </Typography>
                    </div>
                    <div>
                      <Typography variant="body2" sx={{ color: '#b0b0b0' }}>Monthly Required</Typography>
                      <Typography variant="h6" sx={{ color: '#4caf50' }}>
                        {currency}{plan.monthlyNeeded.toLocaleString()}
                      </Typography>
                    </div>
                    <div>
                      <Typography variant="body2" sx={{ color: '#b0b0b0' }}>Savings Gap</Typography>
                      <Typography variant="h6" sx={{ color: plan.savingsGap > 0 ? '#f44336' : '#4caf50' }}>
                        {currency}{Math.abs(plan.savingsGap).toLocaleString()}
                      </Typography>
                    </div>
                  </div>
                  
                  <div className="mt-4">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-text-secondary text-sm">Overall Progress</span>
                      <span className="text-text-primary text-sm">
                        {((actionPlanTarget.currentAmount / actionPlanTarget.targetAmount) * 100).toFixed(1)}%
                      </span>
                    </div>
                    <div className="w-full bg-gray-700 rounded-full h-3">
                      <div 
                        className="bg-gradient-to-r from-blue-500 to-green-500 h-3 rounded-full transition-all duration-500"
                        style={{ width: `${Math.min((actionPlanTarget.currentAmount / actionPlanTarget.targetAmount) * 100, 100)}%` }}
                      ></div>
                    </div>
                  </div>
                </Card>

                {/* Excel-like Action Plan Table */}
                <Card sx={{ background: '#ffffff', border: '2px solid #000000', p: 0, overflow: 'hidden', boxShadow: '0 4px 8px rgba(0,0,0,0.3)' }}>
                  {/* Excel Header */}
                  <div className="bg-gray-200 border-b-2 border-black p-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-green-600 rounded flex items-center justify-center">
                        <span className="text-white font-bold text-sm">📊</span>
                      </div>
                      <Typography variant="h6" sx={{ color: '#000000', fontWeight: 'bold', fontSize: '16px' }}>
                        Monthly Action Plan - Excel View
                      </Typography>
                    </div>
                    <div className="text-sm text-gray-600 font-semibold">
                      Target: {currency}{actionPlanTarget.targetAmount.toLocaleString()}
                    </div>
                  </div>
                  
                  <div className="overflow-x-auto bg-white">
                    <table className="w-full border-collapse" style={{ minWidth: '1100px', fontFamily: 'Arial, sans-serif' }}>
                      <thead>
                        <tr className="bg-gray-300 border-b-2 border-black">
                          <th className="text-center p-3 text-black font-bold border-r-2 border-black" style={{ minWidth: '120px', fontSize: '12px' }}>
                            📅 Month
                          </th>
                          <th className="text-center p-3 text-black font-bold border-r-2 border-black" style={{ minWidth: '140px', fontSize: '12px' }}>
                            💰 Monthly Target
                          </th>
                          <th className="text-center p-3 text-black font-bold border-r-2 border-black" style={{ minWidth: '120px', fontSize: '12px' }}>
                            ✂️ Expense Cut
                          </th>
                          <th className="text-center p-3 text-black font-bold border-r-2 border-black" style={{ minWidth: '120px', fontSize: '12px' }}>
                            📈 Income Boost
                          </th>
                          <th className="text-center p-3 text-black font-bold border-r-2 border-black" style={{ minWidth: '120px', fontSize: '12px' }}>
                            💰 Investment
                          </th>
                          <th className="text-center p-3 text-black font-bold border-r-2 border-black" style={{ minWidth: '140px', fontSize: '12px' }}>
                            💎 Total Saved
                          </th>image.png
                          <th className="text-center p-3 text-black font-bold border-r-2 border-black" style={{ minWidth: '120px', fontSize: '12px' }}>
                            📊 Progress
                          </th>
                          <th className="text-center p-3 text-black font-bold border-r-2 border-black" style={{ minWidth: '100px', fontSize: '12px' }}>
                            🎯 Status
                          </th>
                          <th className="text-center p-3 text-black font-bold" style={{ minWidth: '320px', fontSize: '12px' }}>
                            ✅ Action Steps
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {plan.actionPlan.map((month, index) => {
                          const isEven = index % 2 === 0;
                          const monthSteps = actionPlanTarget ? actionPlanTarget.planDetails.roadmap
                            .filter(step => step.monthRange === month.monthName) : [];
                          const completedSteps = monthSteps.filter(step => step.completed).length;
                          const totalStepAmount = monthSteps.reduce((sum, step) => sum + (step.amount || 0), 0);
                          const investmentAmount = investments[month.monthName] || 0;
                          const totalWithInvestment = month.cumulativeSavings + totalStepAmount + investmentAmount;
                          const progressWithInvestment = Math.min((totalWithInvestment / actionPlanTarget.targetAmount) * 100, 100);
                          const progressColor = progressWithInvestment >= 100 ? '#22c55e' : 
                                              progressWithInvestment >= 75 ? '#3b82f6' : 
                                              progressWithInvestment >= 50 ? '#f59e0b' : '#ef4444';
                          
                          return (
                            <tr key={index} className={`${isEven ? 'bg-white' : 'bg-gray-50'} border-b border-gray-400 hover:bg-yellow-50 transition-colors`}>
                              {/* Month */}
                              <td className="p-3 text-center font-bold text-black border-r-2 border-gray-400" style={{ fontSize: '11px' }}>
                                {month.monthName}
                              </td>
                              
                              {/* Monthly Target */}
                              <td className="p-3 text-center text-green-700 font-bold border-r-2 border-gray-400" style={{ fontSize: '11px' }}>
                                {currency}{month.monthlyContribution.toLocaleString()}
                              </td>
                              
                              {/* Expense Cut */}
                              <td className="p-3 text-center text-blue-700 font-semibold border-r-2 border-gray-400" style={{ fontSize: '11px' }}>
                                {month.expenseReduction > 0 ? `${currency}${month.expenseReduction.toLocaleString()}` : '-'}
                              </td>
                              
                              {/* Income Boost */}
                              <td className="p-3 text-center text-purple-700 font-semibold border-r-2 border-gray-400" style={{ fontSize: '11px' }}>
                                {month.incomeIncrease > 0 ? `${currency}${month.incomeIncrease.toLocaleString()}` : '-'}
                              </td>
                              
                              {/* Investment */}
                              <td className="p-3 text-center border-r-2 border-gray-400">
                                <input
                                  type="number"
                                  placeholder="0"
                                  value={investments[month.monthName] || ''}
                                  className="w-full px-2 py-1 text-xs bg-white border-2 border-gray-400 rounded text-black placeholder-gray-400 focus:border-blue-500 text-center"
                                  style={{ fontSize: '10px' }}
                                  onChange={(e) => {
                                    const investmentAmount = parseFloat(e.target.value) || 0;
                                    handleInvestmentUpdate(actionPlanTarget!.id, month.monthName, investmentAmount);
                                  }}
                                />
                              </td>
                              
                              {/* Total Saved */}
                              <td className="p-3 text-center font-bold text-black border-r-2 border-gray-400" style={{ fontSize: '11px' }}>
                                <div className="flex flex-col">
                                  <span>{currency}{month.cumulativeSavings.toLocaleString()}</span>
                                  {totalStepAmount > 0 && (
                                    <span className="text-xs text-green-600 font-semibold">+{currency}{totalStepAmount.toLocaleString()}</span>
                                  )}
                                  {investments[month.monthName] > 0 && (
                                    <span className="text-xs text-blue-600 font-semibold">+{currency}{investments[month.monthName].toLocaleString()}</span>
                                  )}
                                </div>
                              </td>
                              
                              {/* Progress */}
                              <td className="p-3 text-center border-r-2 border-gray-400">
                                <div className="flex flex-col items-center gap-1">
                                  <div className="w-20 bg-gray-300 rounded-sm h-5 border-2 border-gray-500 relative overflow-hidden">
                                    <div 
                                      className="h-full transition-all duration-500 rounded-sm"
                                      style={{ 
                                        width: `${progressWithInvestment}%`,
                                        background: `linear-gradient(90deg, ${progressColor} 0%, ${progressColor}dd 100%)`
                                      }}
                                    ></div>
                                    <div className="absolute inset-0 flex items-center justify-center">
                                      <span className="text-xs font-bold text-black" style={{ textShadow: '1px 1px 1px white' }}>
                                        {Math.round(progressWithInvestment)}%
                                      </span>
                                    </div>
                                  </div>
                                  {completedSteps > 0 && (
                                    <span className="text-xs text-green-600 font-bold">
                                      {completedSteps}/{monthSteps.length} ✅
                                    </span>
                                  )}
                                </div>
                              </td>
                              
                              {/* Status */}
                              <td className="p-3 text-center border-r-2 border-gray-400">
                                <span className={`px-2 py-1 rounded-sm text-xs font-bold border-2 ${
                                  month.status === 'Completed' ? 'bg-green-100 text-green-800 border-green-400' :
                                  month.status === 'On Track' ? 'bg-blue-100 text-blue-800 border-blue-400' :
                                  month.status === 'Good Progress' ? 'bg-yellow-100 text-yellow-800 border-yellow-400' :
                                  'bg-gray-100 text-gray-800 border-gray-400'
                                }`}>
                                  {month.status}
                                </span>
                              </td>
                              
                              {/* Action Steps */}
                              <td className="p-3">
                                <div className="space-y-1">
                                  {monthSteps.slice(0, 3).map((step, actionIndex) => (
                                    <div key={actionIndex} className={`p-2 border-2 rounded-sm transition-all ${
                                      step.completed 
                                        ? 'bg-green-50 border-green-300 shadow-sm' 
                                        : 'bg-gray-50 border-gray-300 hover:border-gray-400'
                                    }`}>
                                      <div className="flex items-center gap-2">
                                        <input
                                          type="checkbox"
                                          checked={step.completed}
                                          onChange={(e) => handleActionStepUpdate(
                                            actionPlanTarget!.id, 
                                            step.id, 
                                            { completed: e.target.checked }
                                          )}
                                          className="w-4 h-4 rounded border-2 border-gray-400 bg-white text-green-600 focus:ring-green-500 focus:ring-2"
                                        />
                                        <span className={`text-xs flex-1 ${step.completed ? 'line-through text-green-700 font-semibold' : 'text-black'}`} style={{ fontSize: '10px' }}>
                                          {step.description}
                                        </span>
                                      </div>
                                      
                                      {step.completed && (
                                        <div className="mt-1 ml-6 flex items-center gap-2">
                                          <span className="text-xs text-gray-600 font-semibold">Amount:</span>
                                          <input
                                            type="number"
                                            value={step.amount || ''}
                                            onChange={(e) => handleActionStepUpdate(
                                              actionPlanTarget!.id,
                                              step.id,
                                              { amount: parseFloat(e.target.value) || 0 }
                                            )}
                                            placeholder="0"
                                            className="w-16 px-1 py-0.5 text-xs bg-white border-2 border-gray-400 rounded text-black placeholder-gray-400 focus:border-green-500"
                                            style={{ fontSize: '10px' }}
                                          />
                                          <span className="text-xs text-gray-600 font-semibold">{currency}</span>
                                          {step.amount && step.amount > 0 && (
                                            <span className="text-xs text-green-600 font-bold">
                                              ✓ {currency}{step.amount.toLocaleString()}
                                            </span>
                                          )}
                                        </div>
                                      )}
                                    </div>
                                  ))}
                                  
                                  {monthSteps.length > 3 && (
                                    <div className="text-xs text-gray-600 p-1 bg-gray-100 border-2 border-gray-300 rounded-sm text-center font-semibold">
                                      +{monthSteps.length - 3} more actions
                                    </div>
                                  )}
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                  
                  {/* Excel Footer */}
                  <div className="bg-gray-200 border-t-2 border-black p-4 flex justify-between items-center">
                    <div className="flex items-center gap-6">
                      <div className="text-sm text-black font-bold">
                        🎯 Total Target: {currency}{actionPlanTarget.targetAmount.toLocaleString()}
                      </div>
                      <div className="text-sm text-black font-bold">
                        📈 Current: {currency}{actionPlanTarget.currentAmount.toLocaleString()}
                      </div>
                      <div className="text-sm text-black font-bold">
                        ⏰ Timeline: {plan.monthsRemaining} months
                      </div>
                    </div>
                    <div className="text-sm text-black font-bold bg-yellow-100 px-3 py-1 rounded border-2 border-yellow-400">
                      📊 Overall: {((actionPlanTarget.currentAmount / actionPlanTarget.targetAmount) * 100).toFixed(1)}%
                    </div>
                  </div>
                </Card>
              </div>
            );
          })()}
        </DialogContent>
      </Dialog>

      {/* Progress Update Dialog */}
      <Dialog
        open={showProgressDialog}
        onClose={() => setShowProgressDialog(false)}
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
            <CheckCircleIcon />
            Update Target Progress
          </div>
        </DialogTitle>

        <DialogContent>
          {progressTarget && (
            <div className="space-y-4">
              <div>
                <Typography variant="h6" sx={{ color: '#ffffff', mb: 2 }}>
                  {progressTarget.name}
                </Typography>
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div>
                    <Typography variant="body2" sx={{ color: '#b0b0b0' }}>Target Amount</Typography>
                    <Typography variant="h6" sx={{ color: '#ffffff' }}>
                      {currency}{progressTarget.targetAmount.toLocaleString()}
                    </Typography>
                  </div>
                  <div>
                    <Typography variant="body2" sx={{ color: '#b0b0b0' }}>Current Progress</Typography>
                    <Typography variant="h6" sx={{ color: '#4caf50' }}>
                      {currency}{progressTarget.currentAmount.toLocaleString()}
                    </Typography>
                  </div>
                </div>
              </div>

              <TextField
                label="Current Amount Saved"
                type="number"
                value={progressAmount}
                onChange={(e) => setProgressAmount(e.target.value)}
                fullWidth
                InputProps={{
                  sx: { color: '#ffffff' },
                  startAdornment: <span className="text-text-secondary mr-2">{currency}</span>
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

              {progressAmount && parseFloat(progressAmount) > 0 && (
                <div className="p-3 bg-gray-800 rounded-lg">
                  <Typography variant="body2" sx={{ color: '#b0b0b0', mb: 1 }}>Progress Update</Typography>
                  <div className="flex justify-between items-center">
                    <span className="text-text-primary">
                      {((parseFloat(progressAmount) / progressTarget.targetAmount) * 100).toFixed(1)}%
                    </span>
                    <div className="w-32 bg-gray-700 rounded-full h-2">
                      <div 
                        className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${Math.min((parseFloat(progressAmount) / progressTarget.targetAmount) * 100, 100)}%` }}
                      ></div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </DialogContent>

        <DialogActions sx={{ p: 3 }}>
          <Button
            onClick={() => setShowProgressDialog(false)}
            sx={{ color: '#b0b0b0' }}
          >
            Cancel
          </Button>
          <Button
            onClick={async () => {
              if (progressTarget && progressAmount) {
                await handleProgressUpdate(progressTarget.id, parseFloat(progressAmount));
                setShowProgressDialog(false);
                setProgressTarget(null);
                setProgressAmount('');
              }
            }}
            variant="contained"
            disabled={!progressAmount || parseFloat(progressAmount) < 0}
            sx={{
              background: '#4caf50',
              '&:hover': { background: '#45a049' }
            }}
          >
            Update Progress
          </Button>
        </DialogActions>
      </Dialog>
    </div>
  );
};

export default TargetPage;
