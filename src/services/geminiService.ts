import { Transaction, Budget, Category } from '../types';

interface FinancialData {
  transactions: Transaction[];
  budgets: Budget;
  categories: Category[];
  currency: string;
}

interface AdviceResponse {
  summary: string;
  insights: string[];
  recommendations: string[];
  warnings: string[];
  opportunities: string[];
}

interface AnalysisResponse {
  overallSummary: string;
  keyInsights: string[];
  budgetAnalysis: Array<{
    category: string;
    spent: number;
    budget: number;
    status: 'under' | 'over' | 'on-track';
    recommendation: string;
  }>;
  potentialSavings: string[];
  needsVsWants: {
    needs: number;
    wants: number;
    needsPercentage: number;
    wantsPercentage: number;
  };
  trends: string[];
  riskAssessment: string;
}

class GeminiService {
  constructor() {
    // In a real implementation, this would come from environment variables
    // const apiKey = process.env.REACT_APP_GEMINI_API_KEY || '';
  }

  async getFinancialAdvice(question: string, data: FinancialData): Promise<AdviceResponse> {
    try {
      console.log('Getting financial advice for question:', question);
      console.log('Financial data:', data);
      
      // For now, return mock data since we don't have a real Gemini API key
      // In a real implementation, this would call the actual Gemini API
      const result = this.generateMockAdvice(question, data);
      console.log('Generated advice:', result);
      return result;
    } catch (error) {
      console.error('Error getting financial advice:', error);
      throw new Error('Failed to get financial advice');
    }
  }

  async analyzeFinancialData(data: FinancialData, period: string = 'month'): Promise<AnalysisResponse> {
    try {
      // For now, return mock analysis since we don't have a real Gemini API key
      // In a real implementation, this would call the actual Gemini API
      return this.generateMockAnalysis(data, period);
    } catch (error) {
      console.error('Error analyzing financial data:', error);
      throw new Error('Failed to analyze financial data');
    }
  }

  private generateMockAdvice(question: string, data: FinancialData): AdviceResponse {
    try {
      console.log('generateMockAdvice called with:', { question, data });
      
      const { transactions, budgets, categories, currency } = data;
    
    // Add safety checks for data
    if (!transactions || !Array.isArray(transactions)) {
      console.warn('No transactions data available, transactions:', transactions);
    }
    if (!budgets || typeof budgets !== 'object') {
      console.warn('No budgets data available, budgets:', budgets);
    }
    
    // Calculate basic financial metrics
    const totalIncome = (transactions || [])
      .filter(t => t.type === 'income')
      .reduce((sum, t) => sum + t.amount, 0);
    
    const totalExpenses = (transactions || [])
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + t.amount, 0);
    
    const netIncome = totalIncome - totalExpenses;
    const totalBudget = budgets ? Object.values(budgets).reduce((sum, budget) => sum + budget.amount, 0) : 0;
    
    // Generate category spending analysis
    const categorySpending = (transactions || [])
      .filter(t => t.type === 'expense')
      .reduce((acc, t) => {
        acc[t.category] = (acc[t.category] || 0) + t.amount;
        return acc;
      }, {} as Record<string, number>);
    
    const topSpendingCategory = Object.entries(categorySpending)
      .sort((a, b) => b[1] - a[1])[0];
    
    // Generate mock advice based on the question and data
    const insights: string[] = [];
    const recommendations: string[] = [];
    const warnings: string[] = [];
    const opportunities: string[] = [];
    
    // Basic insights
    insights.push(`Your net income is ${currency}${netIncome.toFixed(2)} this month`);
    insights.push(`You've spent ${currency}${totalExpenses.toFixed(2)} out of ${currency}${totalBudget.toFixed(2)} budgeted`);
    
    if (topSpendingCategory) {
      insights.push(`Your highest spending category is ${topSpendingCategory[0]} at ${currency}${topSpendingCategory[1].toFixed(2)}`);
    }
    
    // Recommendations based on spending patterns
    if (netIncome < 0) {
      warnings.push('You are spending more than you earn. Consider reducing expenses or increasing income.');
      recommendations.push('Create a strict budget and track all expenses');
      recommendations.push('Look for ways to reduce discretionary spending');
    } else if (netIncome < totalIncome * 0.1) {
      warnings.push('Your savings rate is very low. Consider increasing your savings.');
      recommendations.push('Aim to save at least 20% of your income');
    } else {
      opportunities.push('Great job! You have a positive cash flow. Consider investing the surplus.');
    }
    
    // Budget-specific recommendations
    if (budgets && typeof budgets === 'object') {
      Object.entries(budgets).forEach(([category, budget]) => {
        const spent = categorySpending[category] || 0;
        const percentage = budget.amount > 0 ? (spent / budget.amount) * 100 : 0;
        
        if (percentage > 100) {
          warnings.push(`You've exceeded your ${category} budget by ${(percentage - 100).toFixed(1)}%`);
          recommendations.push(`Consider reducing spending in ${category} or increasing the budget`);
        } else if (percentage > 80) {
          warnings.push(`You're close to exceeding your ${category} budget (${percentage.toFixed(1)}%)`);
        }
      });
    }
    
    // General recommendations
    if ((transactions || []).length < 10) {
      recommendations.push('Consider tracking more transactions for better insights');
    }
    
    if (!budgets || Object.keys(budgets).length < 5) {
      recommendations.push('Create budgets for more categories to better control spending');
    }
    
    // Opportunities
    if (netIncome > 0) {
      opportunities.push('Consider setting up an emergency fund with 3-6 months of expenses');
      opportunities.push('Look into investment options for your surplus income');
    }
    
    // Generate summary based on question
    let summary = '';
    if (question.toLowerCase().includes('save')) {
      summary = `Based on your current spending of ${currency}${totalExpenses.toFixed(2)}, you could potentially save more by reducing discretionary expenses and optimizing your budget allocation.`;
    } else if (question.toLowerCase().includes('spend')) {
      summary = `Your spending analysis shows ${currency}${totalExpenses.toFixed(2)} in total expenses. ${topSpendingCategory ? `Your highest category is ${topSpendingCategory[0]} at ${currency}${topSpendingCategory[1].toFixed(2)}.` : ''}`;
    } else if (question.toLowerCase().includes('budget')) {
      summary = `Your current budget allocation totals ${currency}${totalBudget.toFixed(2)}. You've spent ${currency}${totalExpenses.toFixed(2)}, leaving ${currency}${(totalBudget - totalExpenses).toFixed(2)} remaining.`;
    } else {
      summary = `Your financial overview shows ${currency}${totalIncome.toFixed(2)} in income and ${currency}${totalExpenses.toFixed(2)} in expenses, resulting in a ${netIncome >= 0 ? 'positive' : 'negative'} cash flow of ${currency}${Math.abs(netIncome).toFixed(2)}.`;
    }
    
    return {
      summary,
      insights,
      recommendations,
      warnings,
      opportunities
    };
  }

  // Real Gemini API implementation (commented out for now)
  /*
  private async callGeminiAPI(prompt: string): Promise<string> {
    const response = await fetch(`${this.baseUrl}?key=${this.apiKey}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [{
          parts: [{
            text: prompt
          }]
        }]
      })
    });

    if (!response.ok) {
      throw new Error(`Gemini API error: ${response.statusText}`);
    }

    const data = await response.json();
    return data.candidates[0].content.parts[0].text;
  }
  */

  private generateMockAnalysis(data: FinancialData, period: string): AnalysisResponse {
    const { transactions, budgets, currency } = data;
    
    // Add safety checks for data
    if (!transactions || !Array.isArray(transactions)) {
      console.warn('No transactions data available for analysis');
    }
    if (!budgets || typeof budgets !== 'object') {
      console.warn('No budgets data available for analysis');
    }
    
    // Calculate financial metrics
    const totalIncome = (transactions || [])
      .filter(t => t.type === 'income')
      .reduce((sum, t) => sum + Number(t.amount), 0);
    
    const totalExpenses = (transactions || [])
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + Number(t.amount), 0);
    
    const netIncome = totalIncome - totalExpenses;
    
    // Calculate category spending
    const categorySpending: { [key: string]: number } = {};
    (transactions || [])
      .filter(t => t.type === 'expense')
      .forEach(t => {
        categorySpending[t.category] = (categorySpending[t.category] || 0) + Number(t.amount);
      });
    
    // AI-based Budget analysis
    const budgetAnalysis = budgets ? Object.entries(budgets).map(([category, budget]) => {
      const spent = categorySpending[category] || 0;
      const budgetAmount = Number(budget.amount);
      const percentage = budgetAmount > 0 ? (spent / budgetAmount) * 100 : 0;
      
      let status: 'under' | 'over' | 'on-track' = 'under';
      let recommendation = '';
      
      if (percentage > 100) {
        status = 'over';
        recommendation = `🚨 Budget exceeded by ${currency}${(spent - budgetAmount).toFixed(2)}. Consider reducing ${category.toLowerCase()} expenses or increasing budget.`;
      } else if (percentage > 80) {
        status = 'on-track';
        recommendation = `⚠️ Close to budget limit (${percentage.toFixed(1)}%). Monitor ${category.toLowerCase()} spending carefully.`;
      } else {
        status = 'under';
        recommendation = `✅ Good budget management! You have ${currency}${(budgetAmount - spent).toFixed(2)} remaining for ${category.toLowerCase()}.`;
      }
      
      return {
        category,
        spent,
        budget: budgetAmount,
        status,
        recommendation
      };
    }) : [];
    
    // AI-based Key Insights
    const topSpendingCategory = Object.entries(categorySpending)
      .sort((a, b) => b[1] - a[1])[0];
    
    const transactionCount = transactions ? transactions.length : 0;
    const incomeCount = transactions ? transactions.filter(t => t.type === 'income').length : 0;
    const expenseCount = transactions ? transactions.filter(t => t.type === 'expense').length : 0;
    const avgTransaction = expenseCount > 0 ? totalExpenses / expenseCount : 0;
    
    const keyInsights = [
      `💰 Net income: ${currency}${netIncome.toFixed(2)} (${netIncome >= 0 ? 'positive' : 'negative'} cash flow)`,
      `📊 Total transactions: ${transactionCount} (${incomeCount} income, ${expenseCount} expenses)`,
      topSpendingCategory ? `🎯 Top spending category: ${topSpendingCategory[0]} (${currency}${topSpendingCategory[1].toFixed(2)})` : '📝 No expense data available',
      `💾 Savings rate: ${totalIncome > 0 ? ((netIncome / totalIncome) * 100).toFixed(1) : 0}%`,
      `📈 Average transaction: ${currency}${avgTransaction.toFixed(2)}`
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
    
    return {
      overallSummary: `🤖 AI Analysis: Your ${period} financial health shows ${netIncome >= 0 ? 'positive' : 'negative'} cash flow of ${currency}${Math.abs(netIncome).toFixed(2)}. You earned ${currency}${totalIncome.toFixed(2)} and spent ${currency}${totalExpenses.toFixed(2)}. ${needsPercentage > 70 ? 'High essential spending ratio detected.' : 'Good balance between needs and wants.'}`,
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
  }
}

export const geminiService = new GeminiService();
