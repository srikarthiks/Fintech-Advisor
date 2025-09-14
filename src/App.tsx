import React, { useState, useEffect } from 'react';
import { apiService } from './services/apiService';
import { User, Transaction, Category, Budget, Target } from './types';
import AuthPage from './components/AuthPage';
import Dashboard from './components/Dashboard';
import TransactionsPage from './components/TransactionsPage';
import BudgetsPage from './components/BudgetsPage';
import AnalysisPage from './components/AnalysisPage';
import TargetPage from './components/TargetPage';
import AdvisorPage from './components/AdvisorPage';
import Sidebar from './components/Sidebar';

function App() {
  const [user, setUser] = useState<User | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [budgets, setBudgets] = useState<Budget>({});
  const [targets, setTargets] = useState<Target[]>([]);
  const [currentPage, setCurrentPage] = useState('dashboard');
  const [isLoading, setIsLoading] = useState(false);
  const [currency] = useState('₹'); // Default to INR, can be made configurable later

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      apiService.setToken(token);
      // Decode JWT token to get user info
      try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        
        // Check if token is expired
        if (payload.exp && payload.exp * 1000 < Date.now()) {
          console.log('Token expired');
          localStorage.removeItem('token');
          return;
        }
        
        const user = {
          id: payload.id,
          email: payload.email
        };
        setUser(user);
      } catch (error) {
        console.error('Error decoding token:', error);
        localStorage.removeItem('token');
      }
    }
  }, []);

  useEffect(() => {
    if (user) {
      fetchData();
    }
  }, [user]);

  const fetchData = async () => {
    
    try {
      setIsLoading(true);
      const [transactionsData, categoriesData, budgetsData, targetsData] = await Promise.all([
        apiService.getTransactions(),
        apiService.getCategories(),
        apiService.getBudgets(),
        apiService.getTargets(),
      ]);
      
      setTransactions(transactionsData.transactions);
      setCategories(categoriesData.categories);
      setBudgets(budgetsData.budgets);
      setTargets(targetsData.targets || []);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogin = async (email: string, password: string) => {
    try {
      const response = await apiService.login(email, password);
      localStorage.setItem('token', response.token);
      apiService.setToken(response.token);
      setUser(response.user);
      // fetchData will be called automatically when user state changes
    } catch (error) {
      throw error;
    }
  };

  const handleRegister = async (email: string, password: string) => {
    try {
      const response = await apiService.register(email, password);
      localStorage.setItem('token', response.token);
      apiService.setToken(response.token);
      setUser(response.user);
      // fetchData will be called automatically when user state changes
    } catch (error) {
      throw error;
    }
  };

  const handleLogout = () => {
    apiService.clearToken();
    setUser(null);
    setTransactions([]);
    setCategories([]);
    setBudgets({});
    setTargets([]);
  };

  if (!user) {
    return <AuthPage onLogin={handleLogin} onRegister={handleRegister} />;
  }

  return (
    <div className="min-h-screen bg-dark-blue text-white flex">
      <Sidebar currentPage={currentPage} onPageChange={setCurrentPage} onLogout={handleLogout} />
      
      <main className="flex-1">
        {currentPage === 'dashboard' && (
          <Dashboard 
            transactions={transactions}
            categories={categories}
            budgets={budgets}
            currency={currency}
          />
        )}
        {currentPage === 'transactions' && (
          <TransactionsPage 
            transactions={transactions}
            setTransactions={setTransactions}
            categories={categories}
            setCategories={setCategories}
            budgets={budgets}
            targets={targets}
            currency={currency}
          />
        )}
        {currentPage === 'budgets' && (
          <BudgetsPage 
            budgets={budgets}
            setBudgets={setBudgets}
            categories={categories}
            setCategories={setCategories}
            transactions={transactions}
            currency={currency}
          />
        )}
        {currentPage === 'analysis' && (
          <AnalysisPage 
            transactions={transactions}
            budgets={budgets}
            categories={categories}
            user={user}
            currency={currency}
          />
        )}
        {currentPage === 'goals' && (
          <TargetPage 
            targets={targets}
            setTargets={setTargets}
            currency={currency}
            user={user}
            transactions={transactions}
            budgets={budgets}
            categories={categories}
          />
        )}
        {currentPage === 'advisor' && (
          <AdvisorPage 
            transactions={transactions}
            budgets={budgets}
            categories={categories}
            currency={currency}
            user={user}
          />
        )}
      </main>
    </div>
  );
}

export default App;