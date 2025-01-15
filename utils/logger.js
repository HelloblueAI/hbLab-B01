import fs from 'fs';
import path from 'path';

class Logger {
  constructor() {
    this.debugMode = process.env.DEBUG_MODE === 'true';
    this.logFilePath = path.resolve(process.env.LOG_FILE_PATH || './logs/app.log');
    this.ensureLogDirectory();
  }

  ensureLogDirectory() {
    const logDir = path.dirname(this.logFilePath);
    if (!fs.existsSync(logDir)) {
      fs.mkdirSync(logDir, { recursive: true });
    }
  }

  formatMessage(level, message, additionalInfo) {
    const timestamp = new Date().toISOString();
    return `${timestamp} [${level}]: ${message} ${
      additionalInfo ? JSON.stringify(additionalInfo) : ''
    }`.trim();
  }

  writeToFile(message) {
    fs.appendFile(this.logFilePath, `${message}\n`, (err) => {
      if (err) {
        console.error('[LOGGER ERROR]: Failed to write to log file.', err);
      }
    });
  }

  log(message, additionalInfo = null) {
    const formattedMessage = this.formatMessage('LOG', message, additionalInfo);
    if (this.debugMode) {
      console.log(formattedMessage);
    }
    this.writeToFile(formattedMessage);
  }

  warn(message, additionalInfo = null) {
    const formattedMessage = this.formatMessage('WARN', message, additionalInfo);
    if (this.debugMode) {
      console.warn(formattedMessage);
    }
    this.writeToFile(formattedMessage);
  }

  error(message, additionalInfo = null) {
    const formattedMessage = this.formatMessage('ERROR', message, additionalInfo);
    console.error(formattedMessage);
    this.writeToFile(formattedMessage);
  }
}

const logger = new Logger();
export default logger;
