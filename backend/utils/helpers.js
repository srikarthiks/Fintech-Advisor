// Utility helper functions

// Format currency
export const formatCurrency = (amount, currency = '₹') => {
  return `${currency}${parseFloat(amount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`;
};

// Format date
export const formatDate = (dateString) => {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-IN', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
};

// Calculate age in days
export const getAgeInDays = (dateString) => {
  const date = new Date(dateString);
  const now = new Date();
  const diffTime = Math.abs(now - date);
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
};

// Calculate percentage
export const calculatePercentage = (part, whole) => {
  if (whole === 0) return 0;
  return Math.round((part / whole) * 100 * 100) / 100;
};

// Generate random ID
export const generateId = () => {
  return Math.random().toString(36).substr(2, 9);
};

// Validate email
export const isValidEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

// Validate amount
export const isValidAmount = (amount) => {
  return !isNaN(parseFloat(amount)) && parseFloat(amount) >= 0;
};

// Validate date
export const isValidDate = (dateString) => {
  const date = new Date(dateString);
  return date instanceof Date && !isNaN(date);
};

// Get month name
export const getMonthName = (monthNumber) => {
  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];
  return months[monthNumber - 1] || 'Invalid Month';
};

// Get quarter
export const getQuarter = (month) => {
  if (month >= 1 && month <= 3) return 'Q1';
  if (month >= 4 && month <= 6) return 'Q2';
  if (month >= 7 && month <= 9) return 'Q3';
  if (month >= 10 && month <= 12) return 'Q4';
  return 'Invalid Quarter';
};

// Calculate compound interest
export const calculateCompoundInterest = (principal, rate, time, frequency = 12) => {
  const amount = principal * Math.pow(1 + (rate / frequency), frequency * time);
  return amount - principal;
};

// Calculate SIP returns
export const calculateSIPReturns = (monthlyAmount, annualRate, years) => {
  const monthlyRate = annualRate / 12 / 100;
  const totalMonths = years * 12;
  
  const futureValue = monthlyAmount * 
    ((Math.pow(1 + monthlyRate, totalMonths) - 1) / monthlyRate) * 
    (1 + monthlyRate);
  
  const totalInvested = monthlyAmount * totalMonths;
  const totalReturns = futureValue - totalInvested;
  
  return {
    totalInvested,
    futureValue,
    totalReturns,
    returnPercentage: (totalReturns / totalInvested) * 100
  };
};

// Calculate EMI
export const calculateEMI = (principal, annualRate, years) => {
  const monthlyRate = annualRate / 12 / 100;
  const totalMonths = years * 12;
  
  const emi = principal * 
    (monthlyRate * Math.pow(1 + monthlyRate, totalMonths)) / 
    (Math.pow(1 + monthlyRate, totalMonths) - 1);
  
  return emi;
};

// Get financial year
export const getFinancialYear = (date) => {
  const d = new Date(date);
  const year = d.getFullYear();
  const month = d.getMonth() + 1;
  
  if (month >= 4) {
    return `${year}-${year + 1}`;
  } else {
    return `${year - 1}-${year}`;
  }
};

// Sanitize string
export const sanitizeString = (str) => {
  if (typeof str !== 'string') return str;
  return str.replace(/[<>]/g, '').trim();
};

// Generate slug
export const generateSlug = (text) => {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
};

// Debounce function
export const debounce = (func, wait) => {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
};

// Throttle function
export const throttle = (func, limit) => {
  let inThrottle;
  return function() {
    const args = arguments;
    const context = this;
    if (!inThrottle) {
      func.apply(context, args);
      inThrottle = true;
      setTimeout(() => inThrottle = false, limit);
    }
  };
};

// Deep clone object
export const deepClone = (obj) => {
  if (obj === null || typeof obj !== 'object') return obj;
  if (obj instanceof Date) return new Date(obj.getTime());
  if (obj instanceof Array) return obj.map(item => deepClone(item));
  if (typeof obj === 'object') {
    const clonedObj = {};
    for (const key in obj) {
      if (obj.hasOwnProperty(key)) {
        clonedObj[key] = deepClone(obj[key]);
      }
    }
    return clonedObj;
  }
};

// Group array by key
export const groupBy = (array, key) => {
  return array.reduce((groups, item) => {
    const group = item[key];
    groups[group] = groups[group] || [];
    groups[group].push(item);
    return groups;
  }, {});
};

// Sort array by key
export const sortBy = (array, key, direction = 'asc') => {
  return array.sort((a, b) => {
    const aVal = a[key];
    const bVal = b[key];
    
    if (direction === 'desc') {
      return bVal > aVal ? 1 : -1;
    }
    return aVal > bVal ? 1 : -1;
  });
};

// Calculate running total
export const calculateRunningTotal = (array, key) => {
  let total = 0;
  return array.map(item => {
    total += parseFloat(item[key]) || 0;
    return { ...item, runningTotal: total };
  });
};

// Get date range
export const getDateRange = (startDate, endDate) => {
  const dates = [];
  const start = new Date(startDate);
  const end = new Date(endDate);
  
  while (start <= end) {
    dates.push(new Date(start));
    start.setDate(start.getDate() + 1);
  }
  
  return dates;
};

// Get month range
export const getMonthRange = (startDate, endDate) => {
  const months = [];
  const start = new Date(startDate);
  const end = new Date(endDate);
  
  while (start <= end) {
    months.push({
      year: start.getFullYear(),
      month: start.getMonth() + 1,
      monthName: getMonthName(start.getMonth() + 1)
    });
    start.setMonth(start.getMonth() + 1);
  }
  
  return months;
};

export default {
  formatCurrency,
  formatDate,
  getAgeInDays,
  calculatePercentage,
  generateId,
  isValidEmail,
  isValidAmount,
  isValidDate,
  getMonthName,
  getQuarter,
  calculateCompoundInterest,
  calculateSIPReturns,
  calculateEMI,
  getFinancialYear,
  sanitizeString,
  generateSlug,
  debounce,
  throttle,
  deepClone,
  groupBy,
  sortBy,
  calculateRunningTotal,
  getDateRange,
  getMonthRange
};
