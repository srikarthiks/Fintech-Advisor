// Authentication middleware
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'fallback_secret_key_change_in_production';

// Middleware to authenticate JWT tokens
export const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ error: 'Invalid or expired token' });
    }
    
    req.user = user;
    next();
  });
};

// Middleware to check if user owns the resource
export const checkResourceOwnership = (resourceUserIdField = 'user_id') => {
  return (req, res, next) => {
    const resourceUserId = req.params[resourceUserIdField] || req.body[resourceUserIdField];
    const requestingUserId = req.user.id;

    if (resourceUserId && parseInt(resourceUserId) !== parseInt(requestingUserId)) {
      return res.status(403).json({ error: 'Access denied: You can only access your own resources' });
    }

    next();
  };
};

// Generate JWT token
export const generateToken = (payload) => {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '24h' });
};

// Verify token without middleware (for utility functions)
export const verifyToken = (token) => {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (error) {
    return null;
  }
};
