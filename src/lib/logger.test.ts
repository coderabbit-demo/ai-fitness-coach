import logger, { 
  createServiceLogger, 
  authLogger, 
  dbLogger, 
  apiLogger, 
  clientLogger, 
  logError, 
  logAuthEvent 
} from './logger'

// Mock environment variables
const originalEnv = process.env
const originalWindow = global.window

describe('Logger', () => {
  let consoleLogSpy: jest.SpyInstance
  let consoleErrorSpy: jest.SpyInstance
  let consoleWarnSpy: jest.SpyInstance
  let consoleInfoSpy: jest.SpyInstance
  let consoleDebugSpy: jest.SpyInstance

  beforeEach(() => {
    // Mock console methods
    consoleLogSpy = jest.spyOn(console, 'log').mockImplementation()
    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation()
    consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation()
    consoleInfoSpy = jest.spyOn(console, 'info').mockImplementation()
    consoleDebugSpy = jest.spyOn(console, 'debug').mockImplementation()

    // Reset environment
    process.env = { ...originalEnv }
    delete (global as any).window
  })

  afterEach(() => {
    jest.restoreAllMocks()
    process.env = originalEnv
    if (originalWindow) {
      (global as any).window = originalWindow
    }
  })

  describe('Default Logger', () => {
    test('should have all required logging methods', () => {
      expect(typeof logger.error).toBe('function')
      expect(typeof logger.warn).toBe('function')
      expect(typeof logger.info).toBe('function')
      expect(typeof logger.debug).toBe('function')
      expect(typeof logger.http).toBe('function')
      expect(typeof logger.verbose).toBe('function')
      expect(typeof logger.silly).toBe('function')
    })

    test('should log error messages', () => {
      logger.error('Test error message')
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        expect.stringContaining('ERROR : Test error message')
      )
    })

    test('should log warn messages', () => {
      logger.warn('Test warning message')
      expect(consoleWarnSpy).toHaveBeenCalledWith(
        expect.stringContaining('WARN : Test warning message')
      )
    })

    test('should log info messages', () => {
      logger.info('Test info message')
      expect(consoleInfoSpy).toHaveBeenCalledWith(
        expect.stringContaining('INFO : Test info message')
      )
    })

    test('should log debug messages', () => {
      logger.debug('Test debug message')
      expect(consoleDebugSpy).toHaveBeenCalledWith(
        expect.stringContaining('DEBUG : Test debug message')
      )
    })

    test('should log http messages', () => {
      logger.http('Test http message')
      expect(consoleLogSpy).toHaveBeenCalledWith(
        expect.stringContaining('HTTP : Test http message')
      )
    })

    test('should log verbose messages', () => {
      logger.verbose('Test verbose message')
      expect(consoleLogSpy).toHaveBeenCalledWith(
        expect.stringContaining('VERBOSE : Test verbose message')
      )
    })

    test('should log silly messages', () => {
      logger.silly('Test silly message')
      expect(consoleLogSpy).toHaveBeenCalledWith(
        expect.stringContaining('SILLY : Test silly message')
      )
    })
  })

  describe('Message Formatting', () => {
    test('should include timestamp in log messages', () => {
      logger.info('Test message')
      expect(consoleInfoSpy).toHaveBeenCalledWith(
        expect.stringMatching(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z/)
      )
    })

    test('should include log level in uppercase', () => {
      logger.error('Test error')
      logger.warn('Test warn')
      logger.info('Test info')
      
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        expect.stringContaining('ERROR')
      )
      expect(consoleWarnSpy).toHaveBeenCalledWith(
        expect.stringContaining('WARN')
      )
      expect(consoleInfoSpy).toHaveBeenCalledWith(
        expect.stringContaining('INFO')
      )
    })

    test('should include metadata as JSON string', () => {
      const metadata = { userId: 123, action: 'login' }
      logger.info('User action', metadata)
      
      expect(consoleInfoSpy).toHaveBeenCalledWith(
        expect.stringContaining(JSON.stringify(metadata))
      )
    })

    test('should handle undefined metadata', () => {
      logger.info('Test message', undefined)
      expect(consoleInfoSpy).toHaveBeenCalledWith(
        expect.stringContaining('Test message ')
      )
    })

    test('should handle empty metadata object', () => {
      logger.info('Test message', {})
      expect(consoleInfoSpy).toHaveBeenCalledWith(
        expect.stringContaining('{}')
      )
    })
  })

  describe('Log Level Filtering', () => {
    test('should respect NODE_ENV=production log level (info)', () => {
      process.env.NODE_ENV = 'production'
      
      // Re-import to get new logger with updated environment
      jest.resetModules()
      const { default: prodLogger } = require('./logger')
      
      prodLogger.debug('Debug message')
      prodLogger.info('Info message')
      prodLogger.error('Error message')
      
      expect(consoleDebugSpy).not.toHaveBeenCalled()
      expect(consoleInfoSpy).toHaveBeenCalled()
      expect(consoleErrorSpy).toHaveBeenCalled()
    })

    test('should respect TASKMASTER_LOG_LEVEL environment variable', () => {
      process.env.TASKMASTER_LOG_LEVEL = 'error'
      
      jest.resetModules()
      const { default: customLogger } = require('./logger')
      
      customLogger.debug('Debug message')
      customLogger.info('Info message')
      customLogger.warn('Warn message')
      customLogger.error('Error message')
      
      expect(consoleDebugSpy).not.toHaveBeenCalled()
      expect(consoleInfoSpy).not.toHaveBeenCalled()
      expect(consoleWarnSpy).not.toHaveBeenCalled()
      expect(consoleErrorSpy).toHaveBeenCalled()
    })

    test('should default to debug level in development', () => {
      process.env.NODE_ENV = 'development'
      
      jest.resetModules()
      const { default: devLogger } = require('./logger')
      
      devLogger.debug('Debug message')
      devLogger.silly('Silly message')
      
      expect(consoleDebugSpy).toHaveBeenCalled()
      expect(consoleLogSpy).toHaveBeenCalled()
    })

    test('should handle invalid log levels gracefully', () => {
      process.env.TASKMASTER_LOG_LEVEL = 'invalid'
      
      jest.resetModules()
      const { default: invalidLogger } = require('./logger')
      
      expect(() => {
        invalidLogger.info('Test message')
      }).not.toThrow()
    })
  })

  describe('Browser Environment Detection', () => {
    test('should detect browser environment', () => {
      // Mock browser environment
      (global as any).window = {}
      process.env.NODE_ENV = 'production'
      
      jest.resetModules()
      const { default: browserLogger } = require('./logger')
      
      browserLogger.debug('Debug message')
      browserLogger.warn('Warn message')
      
      expect(consoleDebugSpy).not.toHaveBeenCalled()
      expect(consoleWarnSpy).toHaveBeenCalled()
    })

    test('should use warn level in browser production', () => {
      (global as any).window = {}
      process.env.NODE_ENV = 'production'
      
      jest.resetModules()
      const { default: browserLogger } = require('./logger')
      
      browserLogger.info('Info message')
      browserLogger.warn('Warn message')
      browserLogger.error('Error message')
      
      expect(consoleInfoSpy).not.toHaveBeenCalled()
      expect(consoleWarnSpy).toHaveBeenCalled()
      expect(consoleErrorSpy).toHaveBeenCalled()
    })

    test('should use debug level in browser development', () => {
      (global as any).window = {}
      process.env.NODE_ENV = 'development'
      
      jest.resetModules()
      const { default: browserLogger } = require('./logger')
      
      browserLogger.debug('Debug message')
      browserLogger.silly('Silly message')
      
      expect(consoleDebugSpy).toHaveBeenCalled()
      expect(consoleLogSpy).toHaveBeenCalled()
    })
  })

  describe('Service Loggers', () => {
    test('should create service logger with service name', () => {
      const serviceLogger = createServiceLogger('TEST_SERVICE')
      serviceLogger.info('Test message')
      
      expect(consoleInfoSpy).toHaveBeenCalledWith(
        expect.stringContaining('[TEST_SERVICE]')
      )
    })

    test('should have predefined service loggers', () => {
      expect(authLogger).toBeDefined()
      expect(dbLogger).toBeDefined()
      expect(apiLogger).toBeDefined()
      expect(clientLogger).toBeDefined()
    })

    test('authLogger should include AUTH service tag', () => {
      authLogger.info('Authentication event')
      
      expect(consoleInfoSpy).toHaveBeenCalledWith(
        expect.stringContaining('[AUTH]')
      )
    })

    test('dbLogger should include DATABASE service tag', () => {
      dbLogger.info('Database operation')
      
      expect(consoleInfoSpy).toHaveBeenCalledWith(
        expect.stringContaining('[DATABASE]')
      )
    })

    test('apiLogger should include API service tag', () => {
      apiLogger.info('API request')
      
      expect(consoleInfoSpy).toHaveBeenCalledWith(
        expect.stringContaining('[API]')
      )
    })

    test('clientLogger should include CLIENT service tag', () => {
      clientLogger.info('Client event')
      
      expect(consoleInfoSpy).toHaveBeenCalledWith(
        expect.stringContaining('[CLIENT]')
      )
    })
  })

  describe('logError Utility Function', () => {
    test('should log Error objects with all properties', () => {
      const error = new Error('Test error message')
      error.stack = 'Error stack trace'
      
      logError(error)
      
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        expect.stringContaining('Error'),
        expect.objectContaining({
          message: 'Test error message',
          stack: 'Error stack trace',
          name: 'Error'
        })
      )
    })

    test('should handle non-Error objects', () => {
      const errorObj = { message: 'Custom error', code: 500 }
      
      logError(errorObj)
      
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        expect.stringContaining('Error'),
        expect.objectContaining({
          message: 'Unknown error',
          code: 500
        })
      )
    })

    test('should include context in error log', () => {
      const error = new Error('Test error')
      const context = 'user-authentication'
      
      logError(error, context)
      
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        expect.stringContaining('Error in user-authentication'),
        expect.objectContaining({
          context: 'user-authentication'
        })
      )
    })

    test('should include additional metadata', () => {
      const error = new Error('Test error')
      const meta = { userId: 123, requestId: 'req-456' }
      
      logError(error, 'test-context', meta)
      
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        expect.stringContaining('Error in test-context'),
        expect.objectContaining({
          userId: 123,
          requestId: 'req-456'
        })
      )
    })

    test('should handle string errors', () => {
      logError('String error message')
      
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        expect.stringContaining('Error'),
        expect.objectContaining({
          message: 'Unknown error'
        })
      )
    })

    test('should handle null/undefined errors', () => {
      logError(null)
      logError(undefined)
      
      expect(consoleErrorSpy).toHaveBeenCalledTimes(2)
    })
  })

  describe('logAuthEvent Utility Function', () => {
    test('should log authentication events', () => {
      logAuthEvent('login', '123')
      
      expect(consoleInfoSpy).toHaveBeenCalledWith(
        expect.stringContaining('[AUTH]'),
        expect.objectContaining({
          event: 'login',
          userId: '123',
          timestamp: expect.any(String)
        })
      )
    })

    test('should handle events without userId', () => {
      logAuthEvent('logout')
      
      expect(consoleInfoSpy).toHaveBeenCalledWith(
        expect.stringContaining('[AUTH]'),
        expect.objectContaining({
          event: 'logout',
          userId: undefined,
          timestamp: expect.any(String)
        })
      )
    })

    test('should include additional metadata', () => {
      const meta = { ip: '192.168.1.1', userAgent: 'Test Browser' }
      
      logAuthEvent('login', '123', meta)
      
      expect(consoleInfoSpy).toHaveBeenCalledWith(
        expect.stringContaining('[AUTH]'),
        expect.objectContaining({
          event: 'login',
          userId: '123',
          ip: '192.168.1.1',
          userAgent: 'Test Browser'
        })
      )
    })

    test('should include userAgent in browser environment', () => {
      (global as any).window = {}
      Object.defineProperty(global, 'navigator', {
        value: { userAgent: 'Mozilla/5.0 Test Browser' },
        writable: true
      })
      
      jest.resetModules()
      const { logAuthEvent: browserLogAuthEvent } = require('./logger')
      
      browserLogAuthEvent('login', '123')
      
      expect(consoleInfoSpy).toHaveBeenCalledWith(
        expect.stringContaining('[AUTH]'),
        expect.objectContaining({
          userAgent: 'Mozilla/5.0 Test Browser'
        })
      )
    })

    test('should handle various event types', () => {
      const events = ['login', 'logout', 'register', 'password-reset', 'token-refresh']
      
      events.forEach(event => {
        logAuthEvent(event, '123')
      })
      
      expect(consoleInfoSpy).toHaveBeenCalledTimes(events.length)
      events.forEach(event => {
        expect(consoleInfoSpy).toHaveBeenCalledWith(
          expect.stringContaining(`Auth event: ${event}`),
          expect.objectContaining({ event })
        )
      })
    })
  })

  describe('Edge Cases and Error Handling', () => {
    test('should handle extremely long messages', () => {
      const longMessage = 'x'.repeat(100000)
      
      expect(() => {
        logger.info(longMessage)
      }).not.toThrow()
      
      expect(consoleInfoSpy).toHaveBeenCalledWith(
        expect.stringContaining(longMessage)
      )
    })

    test('should handle complex nested metadata', () => {
      const complexMeta = {
        level1: {
          level2: {
            level3: {
              data: 'nested',
              array: [1, 2, 3, { nested: true }]
            }
          }
        }
      }
      
      expect(() => {
        logger.info('Complex metadata', complexMeta)
      }).not.toThrow()
    })

    test('should handle circular references in metadata', () => {
      const circularMeta: any = { name: 'test' }
      circularMeta.self = circularMeta
      
      expect(() => {
        logger.info('Circular metadata', circularMeta)
      }).not.toThrow()
    })

    test('should handle special characters in messages', () => {
      const specialMessage = '🔥 Special chars: αβγ δεζ ηθι'
      
      logger.info(specialMessage)
      
      expect(consoleInfoSpy).toHaveBeenCalledWith(
        expect.stringContaining(specialMessage)
      )
    })

    test('should handle empty and null messages', () => {
      logger.info('')
      logger.info(null as any)
      logger.info(undefined as any)
      
      expect(consoleInfoSpy).toHaveBeenCalledTimes(3)
    })
  })

  describe('Performance', () => {
    test('should handle rapid logging without blocking', () => {
      const start = Date.now()
      
      for (let i = 0; i < 1000; i++) {
        logger.info(`Message ${i}`, { iteration: i })
      }
      
      const end = Date.now()
      const duration = end - start
      
      expect(duration).toBeLessThan(1000) // Should complete within 1 second
      expect(consoleInfoSpy).toHaveBeenCalledTimes(1000)
    })

    test('should not leak memory with repeated logging', () => {
      // This is a basic memory test - in real scenarios you'd use more sophisticated tools
      const initialMemory = process.memoryUsage()
      
      for (let i = 0; i < 10000; i++) {
        logger.info(`Memory test ${i}`, { data: 'x'.repeat(100) })
      }
      
      if (global.gc) {
        global.gc()
      }
      
      const finalMemory = process.memoryUsage()
      
      // Memory shouldn't increase dramatically
      expect(finalMemory.heapUsed).toBeLessThan(initialMemory.heapUsed * 3)
    })
  })

  describe('Integration with Console Methods', () => {
    test('should gracefully handle missing console methods', () => {
      const originalConsole = global.console
      
      // Mock console with missing methods
      global.console = {
        log: jest.fn(),
        error: jest.fn()
        // Deliberately missing warn, info, debug
      } as any
      
      expect(() => {
        logger.warn('Test warning')
        logger.info('Test info')
        logger.debug('Test debug')
      }).not.toThrow()
      
      // Restore console
      global.console = originalConsole
    })
  })
})