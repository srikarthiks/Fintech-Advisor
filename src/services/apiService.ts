import { Transaction } from '../types';

const API_BASE_URL = 'http://localhost:3010';

class ApiService {
  private token: string | null = null;

  setToken(token: string) {
    this.token = token;
  }

  isAuthenticated(): boolean {
    return !!this.token;
  }

  clearToken() {
    this.token = null;
    localStorage.removeItem('token');
  }

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const url = `${API_BASE_URL}${endpoint}`;
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string> || {}),
    };

    if (this.token) {
      headers.Authorization = `Bearer ${this.token}`;
    }

    console.log('API Request:', {
      url,
      method: options.method || 'GET',
      hasToken: !!this.token,
      headers: headers
    });

    const response = await fetch(url, {
      ...options,
      headers,
    });

    console.log('API Response:', {
      status: response.status,
      statusText: response.statusText,
      url: response.url
    });

    if (!response.ok) {
      // Handle 401 Unauthorized specifically
      if (response.status === 401) {
        console.error('Authentication failed - token may be expired');
        this.clearToken();
        throw new Error('Authentication failed. Please login again.');
      }
      
      const error = await response.json().catch(() => ({ message: 'Unknown error' }));
      console.error('API Error:', error);
      throw new Error(error.message || 'Request failed');
    }

    return response.json();
  }

  // Auth
  async login(email: string, password: string) {
    return this.request('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
  }

  async register(email: string, password: string) {
    return this.request('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
  }

  // Categories
  async getCategories() {
    return this.request('/api/categories');
  }

  async createCategory(name: string, type: 'income' | 'expense') {
    return this.request('/api/categories', {
      method: 'POST',
      body: JSON.stringify({ name, type }),
    });
  }

  // Transactions
  async getTransactions() {
    return this.request('/api/transactions');
  }

  async post<T>(endpoint: string, data: any): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async put<T>(endpoint: string, data: any): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async delete(endpoint: string): Promise<void> {
    return this.request<void>(endpoint, {
      method: 'DELETE',
    });
  }

  async createTransaction(transaction: Omit<Transaction, 'id'>) {
    return this.request('/api/transactions', {
      method: 'POST',
      body: JSON.stringify(transaction),
    });
  }

  async createInvestmentTransaction(transaction: any, targetId: number, actionStepId?: string) {
    return this.request('/api/transactions', {
      method: 'POST',
      body: JSON.stringify({
        ...transaction,
        type: 'investment',
        targetId,
        actionStepId
      }),
    });
  }

  async updateTransaction(id: number, transaction: Partial<Transaction>) {
    return this.request(`/api/transactions/${id}`, {
      method: 'PUT',
      body: JSON.stringify(transaction),
    });
  }

  async deleteTransaction(id: number) {
    return this.request(`/api/transactions/${id}`, {
      method: 'DELETE',
    });
  }

  // Budgets
  async getBudgets() {
    return this.request('/api/budgets');
  }

  async createBudget(category: string, amount: number) {
    return this.request('/api/budgets', {
      method: 'POST',
      body: JSON.stringify({ category, amount }),
    });
  }

  async deleteBudget(category: string) {
    return this.request(`/api/budgets/${encodeURIComponent(category)}`, {
      method: 'DELETE',
    });
  }

  // AI Analysis
  async analyzeFinancialData(period: string = 'month', userId?: number) {
    return this.request('/api/analyze', {
      method: 'POST',
      body: JSON.stringify({ period, userId }),
    });
  }

  // AI Advisor - Using analyze endpoint temporarily until /api/advisor is implemented
  // async getFinancialAdvice(question: string, userId?: number) {
  //   return this.request('/api/advisor', {
  //     method: 'POST',
  //     body: JSON.stringify({ question, userId }),
  //   });
  // }

  // Targets
  async getTargets(userId?: number) {
    return this.request('/api/targets', {
      method: 'GET',
    });
  }

  async createTarget(target: any, userId?: number) {
    return this.request('/api/targets', {
      method: 'POST',
      body: JSON.stringify({ ...target, userId }),
    });
  }

  async updateTarget(targetId: number, updates: any) {
    return this.request(`/api/targets/${targetId}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
  }

  async deleteTarget(targetId: number) {
    return this.request(`/api/targets/${targetId}`, {
      method: 'DELETE',
    });
  }

  // Action Steps
  async updateActionStep(targetId: number, stepId: string, updates: { completed?: boolean; amount?: number; description?: string }) {
    return this.request(`/api/targets/${targetId}/steps/${stepId}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
  }

  async updateTargetProgress(targetId: number, currentAmount: number) {
    return this.request(`/api/targets/${targetId}/progress`, {
      method: 'PUT',
      body: JSON.stringify({ currentAmount }),
    });
  }

  async getTargetInvestments(targetId: number) {
    return this.request(`/api/targets/${targetId}/investments`);
  }
}

export const apiService = new ApiService();
