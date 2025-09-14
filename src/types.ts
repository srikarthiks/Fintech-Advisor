export type TransactionType = 'income' | 'expense' | 'investment';

export interface Category {
  id: number;
  name: string;
  type: TransactionType;
  isDefault: boolean;
  createdAt: string;
  updatedAt: string;
}

export type Currency = 'USD' | 'INR';

export interface Transaction {
    id: number;
    date: string; // YYY-MM-DD
    description: string;
    amount: number;
    type: TransactionType;
    category: string; // Keep as string for backward compatibility, but will store category name
    targetId?: number; // Link to target for investment transactions
    actionStepId?: string; // Link to specific action step
}

export interface BudgetItem {
  amount: number;
  icon: string;
}

export type Budget = {
    [key: string]: BudgetItem;
};

export interface InvestmentOption {
  title: string;
  description: string;
  pros: string[];
  cons:string[];
}

export interface Tactic {
  title: string;
  description: string;
}

export interface ActionStep {
  id: string;
  monthRange: string;
  description: string;
  completed: boolean;
  amount?: number; // Amount saved/achieved for this step
  targetAmount?: number; // Target amount for this step
}

export interface RiskChoice {
  riskLevel: string;
  description: string;
}

export interface TargetPlanDetails {
  missionBrief: string;
  investmentArenas: InvestmentOption[];
  sideQuests: Tactic[];
  bossBattles: Tactic[];
  roadmap: ActionStep[];
  riskLevels: RiskChoice[];
  strategistsPick: string;
}

export interface Target {
  id: number;
  name: string;
  targetAmount: number;
  currentAmount: number;
  targetDate: string; // YYYY-MM-DD
  planDetails: TargetPlanDetails;
}

// This is a legacy type name, but the structure is updated.
// It represents the detailed plan returned by the AI.
export type TargetPlanResult = TargetPlanDetails;

export interface AnalysisResult {
  overallSummary: string;
  keyInsights: string[];
  budgetAnalysis: {
    category: string;
    spent: number;
    budget: number;
  }[];
  potentialSavings: string[];
  needsVsWants: {
    needs: number;
    wants: number;
    needsPercentage: number;
    wantsPercentage: number;
  };
}

export interface User {
  id: number;
  email: string;
}
