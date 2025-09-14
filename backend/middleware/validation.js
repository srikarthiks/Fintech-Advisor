// Input validation middleware

// Validate email format
export const validateEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

// Validate password strength
export const validatePassword = (password) => {
  // At least 6 characters, contains at least one letter and one number
  const passwordRegex = /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d@$!%*#?&]{6,}$/;
  return passwordRegex.test(password);
};

// Validate required fields
export const validateRequired = (fields) => {
  return (req, res, next) => {
    const missingFields = [];
    
    for (const field of fields) {
      if (!req.body[field] || req.body[field].toString().trim() === '') {
        missingFields.push(field);
      }
    }
    
    if (missingFields.length > 0) {
      return res.status(400).json({
        error: 'Missing required fields',
        missingFields: missingFields
      });
    }
    
    next();
  };
};

// Validate email format
export const validateEmailFormat = (req, res, next) => {
  const { email } = req.body;
  
  if (email && !validateEmail(email)) {
    return res.status(400).json({
      error: 'Invalid email format'
    });
  }
  
  next();
};

// Validate password strength
export const validatePasswordStrength = (req, res, next) => {
  const { password } = req.body;
  
  if (password && !validatePassword(password)) {
    return res.status(400).json({
      error: 'Password must be at least 6 characters long and contain at least one letter and one number'
    });
  }
  
  next();
};

// Validate numeric fields
export const validateNumeric = (fields) => {
  return (req, res, next) => {
    const invalidFields = [];
    
    for (const field of fields) {
      const value = req.body[field];
      if (value !== undefined && value !== null && isNaN(parseFloat(value))) {
        invalidFields.push(field);
      }
    }
    
    if (invalidFields.length > 0) {
      return res.status(400).json({
        error: 'Invalid numeric values',
        invalidFields: invalidFields
      });
    }
    
    next();
  };
};

// Validate date format
export const validateDate = (dateString) => {
  const date = new Date(dateString);
  return date instanceof Date && !isNaN(date);
};

// Validate transaction type
export const validateTransactionType = (req, res, next) => {
  const { type } = req.body;
  const validTypes = ['income', 'expense', 'investment'];
  
  if (type && !validTypes.includes(type)) {
    return res.status(400).json({
      error: 'Invalid transaction type. Must be one of: ' + validTypes.join(', ')
    });
  }
  
  next();
};

// Sanitize input to prevent XSS
export const sanitizeInput = (req, res, next) => {
  const sanitize = (obj) => {
    if (typeof obj === 'string') {
      return obj.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
    }
    if (typeof obj === 'object' && obj !== null) {
      for (const key in obj) {
        obj[key] = sanitize(obj[key]);
      }
    }
    return obj;
  };
  
  req.body = sanitize(req.body);
  next();
};
