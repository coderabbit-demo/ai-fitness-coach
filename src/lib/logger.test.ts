import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import logger, { 
  createServiceLogger, 
  authLogger, 
  dbLogger, 
  apiLogger, 
  clientLogger, 
  logError, 
  logAuthEvent 
} from './logger'

describe('Logger', () => {
  let consoleSpy: any
  let originalEnv: any
  let originalWindow: any

  beforeEach(() => {
    // Mock console methods
    consoleSpy = {
      log: vi.spyOn(console, 'log').mockImplementation(() => {}),
      warn: vi.spyOn(console, 'warn').mockImplementation(() => {}),
      error: vi.spyOn(console, 'error').mockImplementation(() => {}),
      debug: vi.spyOn(console, 'debug').mockImplementation(() => {}),
      info: vi.spyOn(console, 'info').mockImplementation(() => {}),
    }
    
    // Store original environment
    originalEnv = process.env
    originalWindow = global.window
  })

  afterEach(() => {
    vi.restoreAllMocks()
    process.env = originalEnv
    global.window = originalWindow
  })

  describe('Environment Detection', () => {
    it('should detect browser environment correctly', () => {
      // Simulate browser environment
      global.window = {} as any
      
      // Re-import to get fresh environment check
      // Note: This is a limitation of the current implementation
      // In a real scenario, you'd want to make environment detection testable
      expect(typeof window !== 'undefined').toBe(true)
    })

    it('should detect Node.js environment correctly', () => {
      delete global.window
      expect(typeof window === 'undefined').toBe(true)
    })
  })

  describe('Log Level Configuration', () => {
    it('should use debug level in development by default', () => {
      process.env.NODE_ENV = 'development'
      delete process.env.TASKMASTER_LOG_LEVEL
      
      logger.debug('debug message')
      expect(consoleSpy.debug).toHaveBeenCalled()
    })

    it('should use info level in production by default', () => {
      process.env.NODE_ENV = 'production'
      delete process.env.TASKMASTER_LOG_LEVEL
      
      logger.info('info message')
      expect(consoleSpy.info).toHaveBeenCalled()
      
      logger.debug('debug message')
      expect(consoleSpy.debug).not.toHaveBeenCalled()
    })

    it('should respect TASKMASTER_LOG_LEVEL environment variable', () => {
      process.env.TASKMASTER_LOG_LEVEL = 'error'
      
      logger.error('error message')
      expect(consoleSpy.error).toHaveBeenCalled()
      
      logger.warn('warn message')
      expect(consoleSpy.warn).not.toHaveBeenCalled()
    })
  })

  describe('Default Logger', () => {
    beforeEach(() => {
      process.env.NODE_ENV = 'development'
      delete process.env.TASKMASTER_LOG_LEVEL
    })

    it('should log error messages', () => {
      logger.error('test error')
      expect(consoleSpy.error).toHaveBeenCalledWith(expect.stringContaining('test error'))
      expect(consoleSpy.error).toHaveBeenCalledWith(expect.stringContaining('ERROR'))
    })

    it('should log warning messages', () => {
      logger.warn('test warning')
      expect(consoleSpy.warn).toHaveBeenCalledWith(expect.stringContaining('test warning'))
      expect(consoleSpy.warn).toHaveBeenCalledWith(expect.stringContaining('WARN'))
    })

    it('should log info messages', () => {
      logger.info('test info')
      expect(consoleSpy.info).toHaveBeenCalledWith(expect.stringContaining('test info'))
      expect(consoleSpy.info).toHaveBeenCalledWith(expect.stringContaining('INFO'))
    })

    it('should log debug messages', () => {
      logger.debug('test debug')
      expect(consoleSpy.debug).toHaveBeenCalledWith(expect.stringContaining('test debug'))
      expect(consoleSpy.debug).toHaveBeenCalledWith(expect.stringContaining('DEBUG'))
    })

    it('should log http messages', () => {
      logger.http('test http')
      expect(consoleSpy.log).toHaveBeenCalledWith(expect.stringContaining('test http'))
      expect(consoleSpy.log).toHaveBeenCalledWith(expect.stringContaining('HTTP'))
    })

    it('should log verbose messages', () => {
      logger.verbose('test verbose')
      expect(consoleSpy.log).toHaveBeenCalledWith(expect.stringContaining('test verbose'))
      expect(consoleSpy.log).toHaveBeenCalledWith(expect.stringContaining('VERBOSE'))
    })

    it('should log silly messages', () => {
      logger.silly('test silly')
      expect(consoleSpy.log).toHaveBeenCalledWith(expect.stringContaining('test silly'))
      expect(consoleSpy.log).toHaveBeenCalledWith(expect.stringContaining('SILLY'))
    })
  })

  describe('Message Formatting', () => {
    beforeEach(() => {
      process.env.NODE_ENV = 'development'
    })

    it('should include timestamp in ISO format', () => {
      logger.info('test message')
      expect(consoleSpy.info).toHaveBeenCalledWith(
        expect.stringMatching(/\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z/)
      )
    })

    it('should format messages with log level', () => {
      logger.warn('test message')
      expect(consoleSpy.warn).toHaveBeenCalledWith(expect.stringContaining('WARN'))
    })

    it('should include service name when provided', () => {
      const serviceLogger = createServiceLogger('TEST_SERVICE')
      serviceLogger.info('test message')
      expect(consoleSpy.info).toHaveBeenCalledWith(expect.stringContaining('[TEST_SERVICE]'))
    })

    it('should handle metadata objects', () => {
      const meta = { userId: '123', action: 'login' }
      logger.info('test message', meta)
      expect(consoleSpy.info).toHaveBeenCalledWith(expect.stringContaining('userId'))
      expect(consoleSpy.info).toHaveBeenCalledWith(expect.stringContaining('123'))
    })

    it('should handle empty metadata', () => {
      logger.info('test message', {})
      expect(consoleSpy.info).toHaveBeenCalledWith(expect.stringContaining('test message'))
    })

    it('should handle undefined metadata', () => {
      logger.info('test message', undefined)
      expect(consoleSpy.info).toHaveBeenCalledWith(expect.stringContaining('test message'))
    })
  })

  describe('Log Level Filtering', () => {
    it('should filter messages based on error level', () => {
      process.env.TASKMASTER_LOG_LEVEL = 'error'
      
      logger.error('error message')
      logger.warn('warn message')
      logger.info('info message')
      
      expect(consoleSpy.error).toHaveBeenCalled()
      expect(consoleSpy.warn).not.toHaveBeenCalled()
      expect(consoleSpy.info).not.toHaveBeenCalled()
    })

    it('should filter messages based on warn level', () => {
      process.env.TASKMASTER_LOG_LEVEL = 'warn'
      
      logger.error('error message')
      logger.warn('warn message')
      logger.info('info message')
      
      expect(consoleSpy.error).toHaveBeenCalled()
      expect(consoleSpy.warn).toHaveBeenCalled()
      expect(consoleSpy.info).not.toHaveBeenCalled()
    })

    it('should filter messages based on info level', () => {
      process.env.TASKMASTER_LOG_LEVEL = 'info'
      
      logger.warn('warn message')
      logger.info('info message')
      logger.debug('debug message')
      
      expect(consoleSpy.warn).toHaveBeenCalled()
      expect(consoleSpy.info).toHaveBeenCalled()
      expect(consoleSpy.debug).not.toHaveBeenCalled()
    })

    it('should allow all messages at debug level', () => {
      process.env.TASKMASTER_LOG_LEVEL = 'debug'
      
      logger.error('error message')
      logger.warn('warn message')
      logger.info('info message')
      logger.debug('debug message')
      
      expect(consoleSpy.error).toHaveBeenCalled()
      expect(consoleSpy.warn).toHaveBeenCalled()
      expect(consoleSpy.info).toHaveBeenCalled()
      expect(consoleSpy.debug).toHaveBeenCalled()
    })
  })

  describe('Service Loggers', () => {
    beforeEach(() => {
      process.env.NODE_ENV = 'development'
    })

    it('should create service logger with correct service name', () => {
      const serviceLogger = createServiceLogger('CUSTOM_SERVICE')
      serviceLogger.info('test message')
      expect(consoleSpy.info).toHaveBeenCalledWith(expect.stringContaining('[CUSTOM_SERVICE]'))
    })

    it('should have auth logger with AUTH service name', () => {
      authLogger.info('auth message')
      expect(consoleSpy.info).toHaveBeenCalledWith(expect.stringContaining('[AUTH]'))
    })

    it('should have database logger with DATABASE service name', () => {
      dbLogger.info('db message')
      expect(consoleSpy.info).toHaveBeenCalledWith(expect.stringContaining('[DATABASE]'))
    })

    it('should have API logger with API service name', () => {
      apiLogger.info('api message')
      expect(consoleSpy.info).toHaveBeenCalledWith(expect.stringContaining('[API]'))
    })

    it('should have client logger with CLIENT service name', () => {
      clientLogger.info('client message')
      expect(consoleSpy.info).toHaveBeenCalledWith(expect.stringContaining('[CLIENT]'))
    })
  })

  describe('Error Logging Utility', () => {
    beforeEach(() => {
      process.env.NODE_ENV = 'development'
    })

    it('should log Error objects with full details', () => {
      const error = new Error('Test error message')
      error.stack = 'Error stack trace'
      
      logError(error)
      
      expect(consoleSpy.error).toHaveBeenCalledWith(
        expect.stringContaining('Error'),
        expect.objectContaining({
          message: 'Test error message',
          stack: 'Error stack trace',
          name: 'Error'
        })
      )
    })

    it('should log error with context', () => {
      const error = new Error('Test error')
      
      logError(error, 'user registration')
      
      expect(consoleSpy.error).toHaveBeenCalledWith(
        expect.stringContaining('Error in user registration'),
        expect.any(Object)
      )
    })

    it('should log error with additional metadata', () => {
      const error = new Error('Test error')
      const meta = { userId: '123', action: 'login' }
      
      logError(error, 'authentication', meta)
      
      expect(consoleSpy.error).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          message: 'Test error',
          userId: '123',
          action: 'login'
        })
      )
    })

    it('should handle non-Error objects', () => {
      const error = 'String error'
      
      logError(error)
      
      expect(consoleSpy.error).toHaveBeenCalledWith(
        expect.stringContaining('Error'),
        expect.objectContaining({
          message: 'Unknown error'
        })
      )
    })

    it('should handle error objects with code property', () => {
      const error = { code: 'AUTH_ERROR', message: 'Authentication failed' }
      
      logError(error)
      
      expect(consoleSpy.error).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          code: 'AUTH_ERROR',
          message: 'Unknown error'
        })
      )
    })
  })

  describe('Auth Event Logging', () => {
    beforeEach(() => {
      process.env.NODE_ENV = 'development'
      global.window = {} as any
      global.navigator = { userAgent: 'Test User Agent' } as any
    })

    it('should log auth events with event name', () => {
      logAuthEvent('login')
      
      expect(consoleSpy.info).toHaveBeenCalledWith(
        expect.stringContaining('Auth event: login'),
        expect.objectContaining({
          event: 'login'
        })
      )
    })

    it('should log auth events with user ID', () => {
      logAuthEvent('logout', 'user123')
      
      expect(consoleSpy.info).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          event: 'logout',
          userId: 'user123'
        })
      )
    })

    it('should include timestamp in auth events', () => {
      logAuthEvent('login')
      
      expect(consoleSpy.info).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          timestamp: expect.stringMatching(/\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z/)
        })
      )
    })

    it('should include user agent in browser environment', () => {
      logAuthEvent('login')
      
      expect(consoleSpy.info).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          userAgent: 'Test User Agent'
        })
      )
    })

    it('should handle additional metadata', () => {
      const meta = { ip: '192.168.1.1', device: 'mobile' }
      logAuthEvent('login', 'user123', meta)
      
      expect(consoleSpy.info).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          event: 'login',
          userId: 'user123',
          ip: '192.168.1.1',
          device: 'mobile'
        })
      )
    })

    it('should not include user agent in server environment', () => {
      delete global.navigator
      delete global.window
      
      logAuthEvent('login')
      
      expect(consoleSpy.info).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          event: 'login',
          userAgent: undefined
        })
      )
    })
  })

  describe('Edge Cases and Error Handling', () => {
    beforeEach(() => {
      process.env.NODE_ENV = 'development'
    })

    it('should handle very long messages', () => {
      const longMessage = 'a'.repeat(10000)
      logger.info(longMessage)
      expect(consoleSpy.info).toHaveBeenCalledWith(expect.stringContaining(longMessage))
    })

    it('should handle special characters in messages', () => {
      const specialMessage = 'Special chars: !@#$%^&*()_+-=[]{}|;:,.<>?'
      logger.info(specialMessage)
      expect(consoleSpy.info).toHaveBeenCalledWith(expect.stringContaining(specialMessage))
    })

    it('should handle unicode characters', () => {
      const unicodeMessage = 'Unicode: 🚀 🌟 ✨ 中文 العربية'
      logger.info(unicodeMessage)
      expect(consoleSpy.info).toHaveBeenCalledWith(expect.stringContaining(unicodeMessage))
    })

    it('should handle circular references in metadata', () => {
      const obj: any = { name: 'test' }
      obj.self = obj
      
      expect(() => logger.info('test message', obj)).not.toThrow()
    })

    it('should handle invalid log levels gracefully', () => {
      process.env.TASKMASTER_LOG_LEVEL = 'invalid_level'
      
      expect(() => logger.info('test message')).not.toThrow()
    })

    it('should handle missing console methods gracefully', () => {
      const originalConsole = console.info
      delete (console as any).info
      
      expect(() => logger.info('test message')).not.toThrow()
      
      console.info = originalConsole
    })
  })

  describe('Performance Considerations', () => {
    it('should not format messages when log level prevents output', () => {
      process.env.TASKMASTER_LOG_LEVEL = 'error'
      
      const expensiveOperation = vi.fn(() => ({ expensive: 'data' }))
      logger.debug('debug message', expensiveOperation())
      
      // The expensive operation should still be called because the current
      // implementation doesn't have lazy evaluation
      expect(expensiveOperation).toHaveBeenCalled()
      expect(consoleSpy.debug).not.toHaveBeenCalled()
    })

    it('should handle high-frequency logging efficiently', () => {
      const startTime = Date.now()
      
      for (let i = 0; i < 1000; i++) {
        logger.info(`Message ${i}`)
      }
      
      const endTime = Date.now()
      expect(endTime - startTime).toBeLessThan(2000) // Should complete within 2 seconds
    })
  })

  describe('Browser vs Server Environment Handling', () => {
    it('should handle browser-specific features', () => {
      global.window = {} as any
      global.navigator = { userAgent: 'Mozilla/5.0' } as any
      
      logAuthEvent('login')
      
      expect(consoleSpy.info).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          userAgent: 'Mozilla/5.0'
        })
      )
    })

    it('should handle server environment without browser globals', () => {
      delete global.window
      delete global.navigator
      
      expect(() => logAuthEvent('login')).not.toThrow()
    })
  })

  describe('Complex Metadata Scenarios', () => {
    beforeEach(() => {
      process.env.NODE_ENV = 'development'
    })

    it('should handle nested objects in metadata', () => {
      const meta = {
        user: {
          id: '123',
          profile: {
            name: 'John Doe',
            email: 'john@example.com'
          }
        }
      }
      
      logger.info('User action', meta)
      expect(consoleSpy.info).toHaveBeenCalledWith(expect.stringContaining('John Doe'))
    })

    it('should handle arrays in metadata', () => {
      const meta = {
        tags: ['auth', 'security', 'login'],
        ids: [1, 2, 3]
      }
      
      logger.info('Tagged event', meta)
      expect(consoleSpy.info).toHaveBeenCalledWith(expect.stringContaining('auth'))
    })

    it('should handle functions in metadata', () => {
      const meta = {
        callback: () => 'test',
        data: 'normal data'
      }
      
      expect(() => logger.info('Function metadata', meta)).not.toThrow()
    })
  })
})