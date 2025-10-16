// Logging Middleware
const fs = require('fs');
const path = require('path');

class Logger {
  constructor() {
    this.logDir = path.join(__dirname, '../logs');
    this.ensureLogDirectory();
  }

  ensureLogDirectory() {
    if (!fs.existsSync(this.logDir)) {
      fs.mkdirSync(this.logDir, { recursive: true });
    }
  }

  formatMessage(level, message) {
    const timestamp = new Date().toISOString();
    return `[${timestamp}] ${level.toUpperCase()}: ${message}\n`;
  }

  log(level, message) {
    const logMessage = this.formatMessage(level, message);
    
    // Console output
    console.log(logMessage.trim());
    
    // File output
    const logFile = path.join(this.logDir, `${level}.log`);
    fs.appendFileSync(logFile, logMessage);
    
    // Also log to combined file
    const combinedFile = path.join(this.logDir, 'combined.log');
    fs.appendFileSync(combinedFile, logMessage);
  }

  info(message) {
    this.log('info', message);
  }

  error(message) {
    this.log('error', message);
  }

  debug(message) {
    this.log('debug', message);
  }

  warn(message) {
    this.log('warn', message);
  }
}

// Request logging middleware
const requestLogger = (req, res, next) => {
  const logger = new Logger();
  const start = Date.now();
  
  logger.info(`${req.method} ${req.url} - ${req.ip}`);
  
  res.on('finish', () => {
    const duration = Date.now() - start;
    logger.info(`${req.method} ${req.url} - ${res.statusCode} - ${duration}ms`);
  });
  
  next();
};

module.exports = { Logger, requestLogger };