// Check if we're in browser environment
const isBrowser = typeof window !== 'undefined'

// Define log levels
const logLevels = {
  error: 0,
  warn: 1,
  info: 2,
  http: 3,
  verbose: 4,
  debug: 5,
  silly: 6
}

// Get log level from environment or default to debug for development
const getLogLevel = () => {
  if (isBrowser) {
    return process.env.NODE_ENV === 'production' ? 'warn' : 'debug'
  }
  return process.env.TASKMASTER_LOG_LEVEL || (process.env.NODE_ENV === 'production' ? 'info' : 'debug')
}

// Simple logger interface
interface Logger {
  error: (message: string, meta?: Record<string, unknown>) => void
  warn: (message: string, meta?: Record<string, unknown>) => void
  info: (message: string, meta?: Record<string, unknown>) => void
  debug: (message: string, meta?: Record<string, unknown>) => void
  http: (message: string, meta?: Record<string, unknown>) => void
  verbose: (message: string, meta?: Record<string, unknown>) => void
  silly: (message: string, meta?: Record<string, unknown>) => void
}

// Console-based logger implementation
const createConsoleLogger = (service?: string): Logger => {
  const formatMessage = (level: string, message: string, meta?: Record<string, unknown>) => {
    const timestamp = new Date().toISOString()
    const serviceStr = service ? `[${service}]` : ''
    const metaStr = meta ? JSON.stringify(meta) : ''
    return `${timestamp} ${level.toUpperCase()} ${serviceStr}: ${message} ${metaStr}`
  }

  const shouldLog = (level: string) => {
    const currentLevel = getLogLevel()
    const currentLevelNum = logLevels[currentLevel as keyof typeof logLevels] || 2
    const messageLevelNum = logLevels[level as keyof typeof logLevels] || 2
    return messageLevelNum <= currentLevelNum
  }

  return {
    error: (message: string, meta?: Record<string, unknown>) => {
      if (shouldLog('error')) {
        console.error(formatMessage('error', message, meta))
      }
    },
    warn: (message: string, meta?: Record<string, unknown>) => {
      if (shouldLog('warn')) {
        console.warn(formatMessage('warn', message, meta))
      }
    },
    info: (message: string, meta?: Record<string, unknown>) => {
      if (shouldLog('info')) {
        console.info(formatMessage('info', message, meta))
      }
    },
    debug: (message: string, meta?: Record<string, unknown>) => {
      if (shouldLog('debug')) {
        console.debug(formatMessage('debug', message, meta))
      }
    },
    http: (message: string, meta?: Record<string, unknown>) => {
      if (shouldLog('http')) {
        console.log(formatMessage('http', message, meta))
      }
    },
    verbose: (message: string, meta?: Record<string, unknown>) => {
      if (shouldLog('verbose')) {
        console.log(formatMessage('verbose', message, meta))
      }
    },
    silly: (message: string, meta?: Record<string, unknown>) => {
      if (shouldLog('silly')) {
        console.log(formatMessage('silly', message, meta))
      }
    }
  }
}

// Create child loggers for different services
export const createServiceLogger = (service: string): Logger => {
  return createConsoleLogger(service)
}

// Default logger
const logger = createConsoleLogger()

// Auth-specific logger
export const authLogger = createServiceLogger('AUTH')

// Database logger
export const dbLogger = createServiceLogger('DATABASE')

// API logger
export const apiLogger = createServiceLogger('API')

// Client-side logger for browser environment
export const clientLogger = createServiceLogger('CLIENT')

// Export the main logger
export default logger

// Utility function to safely log errors
export const logError = (error: unknown, context?: string, meta?: Record<string, unknown>) => {
  const errorInfo = {
    message: error instanceof Error ? error.message : 'Unknown error',
    stack: error instanceof Error ? error.stack : undefined,
    code: error && typeof error === 'object' && 'code' in error ? error.code : undefined,
    name: error instanceof Error ? error.name : undefined,
    context,
    ...meta
  }
  
  logger.error(`Error${context ? ` in ${context}` : ''}`, errorInfo)
}

// Utility function to log authentication events
export const logAuthEvent = (event: string, userId?: string, meta?: Record<string, unknown>) => {
  const logData = {
    event,
    userId,
    timestamp: new Date().toISOString(),
    userAgent: isBrowser ? navigator.userAgent : undefined,
    ...meta
  }
  
  authLogger.info(`Auth event: ${event}`, logData)
} 