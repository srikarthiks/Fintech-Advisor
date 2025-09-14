// Logging utility

const LOG_LEVELS = {
  ERROR: 0,
  WARN: 1,
  INFO: 2,
  DEBUG: 3
};

const COLORS = {
  ERROR: '\x1b[31m', // Red
  WARN: '\x1b[33m',  // Yellow
  INFO: '\x1b[36m',  // Cyan
  DEBUG: '\x1b[90m', // Gray
  RESET: '\x1b[0m'   // Reset
};

class Logger {
  constructor(level = 'INFO') {
    this.level = LOG_LEVELS[level.toUpperCase()] || LOG_LEVELS.INFO;
  }

  setLevel(level) {
    this.level = LOG_LEVELS[level.toUpperCase()] || LOG_LEVELS.INFO;
  }

  formatMessage(level, message, meta = {}) {
    const timestamp = new Date().toISOString();
    const levelStr = level.padEnd(5);
    const metaStr = Object.keys(meta).length > 0 ? JSON.stringify(meta) : '';
    
    return `${timestamp} [${levelStr}] ${message} ${metaStr}`.trim();
  }

  formatMessageWithColor(level, message, meta = {}) {
    const timestamp = new Date().toISOString();
    const levelStr = level.padEnd(5);
    const color = COLORS[level] || COLORS.RESET;
    const metaStr = Object.keys(meta).length > 0 ? JSON.stringify(meta) : '';
    
    return `${color}${timestamp} [${levelStr}] ${message} ${metaStr}${COLORS.RESET}`.trim();
  }

  error(message, meta = {}) {
    if (this.level >= LOG_LEVELS.ERROR) {
      console.error(this.formatMessageWithColor('ERROR', message, meta));
    }
  }

  warn(message, meta = {}) {
    if (this.level >= LOG_LEVELS.WARN) {
      console.warn(this.formatMessageWithColor('WARN', message, meta));
    }
  }

  info(message, meta = {}) {
    if (this.level >= LOG_LEVELS.INFO) {
      console.info(this.formatMessageWithColor('INFO', message, meta));
    }
  }

  debug(message, meta = {}) {
    if (this.level >= LOG_LEVELS.DEBUG) {
      console.log(this.formatMessageWithColor('DEBUG', message, meta));
    }
  }

  // HTTP request logger
  logRequest(req, res, responseTime) {
    const { method, url, ip } = req;
    const { statusCode } = res;
    const userAgent = req.get('User-Agent') || '';
    
    const level = statusCode >= 400 ? 'ERROR' : statusCode >= 300 ? 'WARN' : 'INFO';
    
    this[level.toLowerCase()](`${method} ${url}`, {
      statusCode,
      responseTime: `${responseTime}ms`,
      ip,
      userAgent: userAgent.substring(0, 100)
    });
  }

  // Database operation logger
  logDatabase(operation, table, duration, error = null) {
    const level = error ? 'ERROR' : 'DEBUG';
    const message = `${operation} ${table}`;
    const meta = {
      duration: `${duration}ms`,
      ...(error && { error: error.message })
    };
    
    this[level.toLowerCase()](message, meta);
  }

  // API endpoint logger
  logAPI(endpoint, method, duration, statusCode, error = null) {
    const level = error ? 'ERROR' : statusCode >= 400 ? 'WARN' : 'INFO';
    const message = `API ${method} ${endpoint}`;
    const meta = {
      duration: `${duration}ms`,
      statusCode,
      ...(error && { error: error.message })
    };
    
    this[level.toLowerCase()](message, meta);
  }

  // Performance logger
  logPerformance(operation, duration, details = {}) {
    const level = duration > 1000 ? 'WARN' : 'DEBUG';
    const message = `Performance: ${operation}`;
    const meta = {
      duration: `${duration}ms`,
      ...details
    };
    
    this[level.toLowerCase()](message, meta);
  }

  // Security logger
  logSecurity(event, details = {}) {
    this.warn(`Security: ${event}`, details);
  }

  // Business logic logger
  logBusiness(event, details = {}) {
    this.info(`Business: ${event}`, details);
  }
}

// Create default logger instance
const logger = new Logger(process.env.LOG_LEVEL || 'INFO');

// Middleware for request logging
export const requestLogger = (req, res, next) => {
  const start = Date.now();
  
  res.on('finish', () => {
    const duration = Date.now() - start;
    logger.logRequest(req, res, duration);
  });
  
  next();
};

// Middleware for error logging
export const errorLogger = (err, req, res, next) => {
  logger.error('Unhandled error', {
    error: err.message,
    stack: err.stack,
    url: req.url,
    method: req.method,
    ip: req.ip,
    userAgent: req.get('User-Agent')
  });
  
  next(err);
};

// Database query logger
export const logDatabaseQuery = (query, params, duration, error = null) => {
  logger.logDatabase('QUERY', 'database', duration, error);
  logger.debug('Query details', { query, params });
};

// API response logger
export const logAPIResponse = (endpoint, method, duration, statusCode, error = null) => {
  logger.logAPI(endpoint, method, duration, statusCode, error);
};

// Performance monitor
export const logPerformance = (operation, startTime, details = {}) => {
  const duration = Date.now() - startTime;
  logger.logPerformance(operation, duration, details);
};

// Security event logger
export const logSecurityEvent = (event, details = {}) => {
  logger.logSecurity(event, details);
};

// Business event logger
export const logBusinessEvent = (event, details = {}) => {
  logger.logBusiness(event, details);
};

export default logger;
