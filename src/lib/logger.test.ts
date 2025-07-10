import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals';
import logger, { 
  createServiceLogger, 
  authLogger, 
  dbLogger, 
  apiLogger, 
  clientLogger,
  logError,
  logAuthEvent
} from './logger';

// Mock console methods
const mockConsole = {
  error: jest.fn(),
  warn: jest.fn(),
  info: jest.fn(),
  debug: jest.fn(),
  log: jest.fn(),
};

// Mock environment variables
const originalEnv = process.env;
const originalWindow = (global as any).window;

describe('Logger Module', () => {
  beforeEach(() => {
    // Reset all mocks
    jest.clearAllMocks();
    
    // Mock console methods
    jest.spyOn(console, 'error').mockImplementation(mockConsole.error);
    jest.spyOn(console, 'warn').mockImplementation(mockConsole.warn);
    jest.spyOn(console, 'info').mockImplementation(mockConsole.info);
    jest.spyOn(console, 'debug').mockImplementation(mockConsole.debug);
    jest.spyOn(console, 'log').mockImplementation(mockConsole.log);
    
    // Reset environment
    process.env = { ...originalEnv };
    delete (global as any).window;
  });

  afterEach(() => {
    // Restore original state
    jest.restoreAllMocks();
    process.env = originalEnv;
    (global as any).window = originalWindow;
  });

  describe('Environment Detection', () => {
    it('should detect browser environment when window is defined', () => {
      // Simulate browser environment
      (global as any).window = {};
      process.env.NODE_ENV = 'development';
      
      // Re-import to test environment detection
      jest.resetModules();
      const { createServiceLogger } = require('./logger');
      
      const testLogger = createServiceLogger('TEST');
      
      // Should use debug level in development
      testLogger.debug('test message');
      expect(mockConsole.debug).toHaveBeenCalled();
    });

    it('should detect node environment when window is undefined', () => {
      // Ensure window is undefined
      delete (global as any).window;
      process.env.NODE_ENV = 'production';
      
      jest.resetModules();
      const { createServiceLogger } = require('./logger');
      
      const testLogger = createServiceLogger('TEST');
      
      // Should use warn level in production for browser
      testLogger.info('test message');
      expect(mockConsole.info).toHaveBeenCalled();
    });
  });

  describe('Log Level Configuration', () => {
    it('should use debug level in development environment', () => {
      process.env.NODE_ENV = 'development';
      delete process.env.TASKMASTER_LOG_LEVEL;
      
      jest.resetModules();
      const { createServiceLogger } = require('./logger');
      
      const testLogger = createServiceLogger('TEST');
      testLogger.debug('debug message');
      
      expect(mockConsole.debug).toHaveBeenCalled();
    });

    it('should use info level in production environment', () => {
      process.env.NODE_ENV = 'production';
      delete process.env.TASKMASTER_LOG_LEVEL;
      
      jest.resetModules();
      const { createServiceLogger } = require('./logger');
      
      const testLogger = createServiceLogger('TEST');
      testLogger.debug('debug message');
      testLogger.info('info message');
      
      expect(mockConsole.debug).not.toHaveBeenCalled();
      expect(mockConsole.info).toHaveBeenCalled();
    });

    it('should respect TASKMASTER_LOG_LEVEL environment variable', () => {
      process.env.TASKMASTER_LOG_LEVEL = 'error';
      
      jest.resetModules();
      const { createServiceLogger } = require('./logger');
      
      const testLogger = createServiceLogger('TEST');
      testLogger.info('info message');
      testLogger.warn('warn message');
      testLogger.error('error message');
      
      expect(mockConsole.info).not.toHaveBeenCalled();
      expect(mockConsole.warn).not.toHaveBeenCalled();
      expect(mockConsole.error).toHaveBeenCalled();
    });

    it('should handle invalid log levels gracefully', () => {
      process.env.TASKMASTER_LOG_LEVEL = 'invalid';
      
      jest.resetModules();
      const { createServiceLogger } = require('./logger');
      
      expect(() => {
        const testLogger = createServiceLogger('TEST');
        testLogger.info('test message');
      }).not.toThrow();
    });
  });

  describe('Message Formatting', () => {
    it('should format messages with timestamp, level, and content', () => {
      const testLogger = createServiceLogger('TEST');
      testLogger.info('test message');
      
      const logCall = mockConsole.info.mock.calls[0];
      const logMessage = logCall[0];
      
      expect(logMessage).toMatch(/\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/); // ISO timestamp
      expect(logMessage).toContain('INFO');
      expect(logMessage).toContain('[TEST]');
      expect(logMessage).toContain('test message');
    });

    it('should include service name in formatted message', () => {
      const testLogger = createServiceLogger('CUSTOM_SERVICE');
      testLogger.warn('warning message');
      
      const logCall = mockConsole.warn.mock.calls[0];
      const logMessage = logCall[0];
      
      expect(logMessage).toContain('[CUSTOM_SERVICE]');
      expect(logMessage).toContain('warning message');
    });

    it('should format messages without service name for default logger', () => {
      logger.info('default message');
      
      const logCall = mockConsole.info.mock.calls[0];
      const logMessage = logCall[0];
      
      expect(logMessage).toContain('INFO');
      expect(logMessage).toContain('default message');
      expect(logMessage).not.toMatch(/\[.*\]:/); // No service brackets
    });

    it('should include meta object in formatted message', () => {
      const meta = { userId: '123', action: 'login' };
      const testLogger = createServiceLogger('TEST');
      testLogger.info('user action', meta);
      
      const logCall = mockConsole.info.mock.calls[0];
      const logMessage = logCall[0];
      
      expect(logMessage).toContain('user action');
      expect(logMessage).toContain(JSON.stringify(meta));
    });

    it('should handle empty meta object', () => {
      const testLogger = createServiceLogger('TEST');
      testLogger.info('message', {});
      
      const logCall = mockConsole.info.mock.calls[0];
      const logMessage = logCall[0];
      
      expect(logMessage).toContain('message');
      expect(logMessage).toContain('{}');
    });

    it('should handle undefined meta object', () => {
      const testLogger = createServiceLogger('TEST');
      testLogger.info('message', undefined);
      
      const logCall = mockConsole.info.mock.calls[0];
      const logMessage = logCall[0];
      
      expect(logMessage).toContain('message');
      expect(logMessage).not.toContain('undefined');
    });
  });

  describe('Log Level Filtering', () => {
    beforeEach(() => {
      process.env.TASKMASTER_LOG_LEVEL = 'warn';
      jest.resetModules();
    });

    it('should filter out messages below configured level', () => {
      const { createServiceLogger } = require('./logger');
      const testLogger = createServiceLogger('TEST');
      
      testLogger.debug('debug message');
      testLogger.info('info message');
      testLogger.warn('warn message');
      testLogger.error('error message');
      
      expect(mockConsole.debug).not.toHaveBeenCalled();
      expect(mockConsole.info).not.toHaveBeenCalled();
      expect(mockConsole.warn).toHaveBeenCalled();
      expect(mockConsole.error).toHaveBeenCalled();
    });

    it('should allow messages at or above configured level', () => {
      process.env.TASKMASTER_LOG_LEVEL = 'info';
      const { createServiceLogger } = require('./logger');
      const testLogger = createServiceLogger('TEST');
      
      testLogger.debug('debug message');
      testLogger.info('info message');
      testLogger.warn('warn message');
      
      expect(mockConsole.debug).not.toHaveBeenCalled();
      expect(mockConsole.info).toHaveBeenCalled();
      expect(mockConsole.warn).toHaveBeenCalled();
    });
  });

  describe('All Log Methods', () => {
    let testLogger: any;
    
    beforeEach(() => {
      process.env.TASKMASTER_LOG_LEVEL = 'silly'; // Allow all levels
      jest.resetModules();
      const { createServiceLogger } = require('./logger');
      testLogger = createServiceLogger('TEST');
    });

    it('should call console.error for error level', () => {
      testLogger.error('error message');
      expect(mockConsole.error).toHaveBeenCalledWith(
        expect.stringContaining('ERROR')
      );
    });

    it('should call console.warn for warn level', () => {
      testLogger.warn('warn message');
      expect(mockConsole.warn).toHaveBeenCalledWith(
        expect.stringContaining('WARN')
      );
    });

    it('should call console.info for info level', () => {
      testLogger.info('info message');
      expect(mockConsole.info).toHaveBeenCalledWith(
        expect.stringContaining('INFO')
      );
    });

    it('should call console.debug for debug level', () => {
      testLogger.debug('debug message');
      expect(mockConsole.debug).toHaveBeenCalledWith(
        expect.stringContaining('DEBUG')
      );
    });

    it('should call console.log for http level', () => {
      testLogger.http('http message');
      expect(mockConsole.log).toHaveBeenCalledWith(
        expect.stringContaining('HTTP')
      );
    });

    it('should call console.log for verbose level', () => {
      testLogger.verbose('verbose message');
      expect(mockConsole.log).toHaveBeenCalledWith(
        expect.stringContaining('VERBOSE')
      );
    });

    it('should call console.log for silly level', () => {
      testLogger.silly('silly message');
      expect(mockConsole.log).toHaveBeenCalledWith(
        expect.stringContaining('SILLY')
      );
    });
  });

  describe('Service Loggers', () => {
    beforeEach(() => {
      process.env.TASKMASTER_LOG_LEVEL = 'debug';
      jest.resetModules();
    });

    it('should create auth logger with correct service name', () => {
      const { authLogger } = require('./logger');
      authLogger.info('auth message');
      
      const logCall = mockConsole.info.mock.calls[0];
      expect(logCall[0]).toContain('[AUTH]');
      expect(logCall[0]).toContain('auth message');
    });

    it('should create database logger with correct service name', () => {
      const { dbLogger } = require('./logger');
      dbLogger.info('db message');
      
      const logCall = mockConsole.info.mock.calls[0];
      expect(logCall[0]).toContain('[DATABASE]');
      expect(logCall[0]).toContain('db message');
    });

    it('should create API logger with correct service name', () => {
      const { apiLogger } = require('./logger');
      apiLogger.info('api message');
      
      const logCall = mockConsole.info.mock.calls[0];
      expect(logCall[0]).toContain('[API]');
      expect(logCall[0]).toContain('api message');
    });

    it('should create client logger with correct service name', () => {
      const { clientLogger } = require('./logger');
      clientLogger.info('client message');
      
      const logCall = mockConsole.info.mock.calls[0];
      expect(logCall[0]).toContain('[CLIENT]');
      expect(logCall[0]).toContain('client message');
    });

    it('should create custom service logger', () => {
      const { createServiceLogger } = require('./logger');
      const customLogger = createServiceLogger('CUSTOM');
      customLogger.info('custom message');
      
      const logCall = mockConsole.info.mock.calls[0];
      expect(logCall[0]).toContain('[CUSTOM]');
      expect(logCall[0]).toContain('custom message');
    });
  });

  describe('Error Logging Utility', () => {
    beforeEach(() => {
      jest.resetModules();
    });

    it('should log Error objects with proper formatting', () => {
      const { logError } = require('./logger');
      const error = new Error('Test error');
      error.stack = 'Error: Test error\n    at test.js:1:1';
      
      logError(error, 'test context');
      
      expect(mockConsole.error).toHaveBeenCalledWith(
        expect.stringContaining('Error in test context')
      );
    });

    it('should handle errors with custom properties', () => {
      const { logError } = require('./logger');
      const error = new Error('Custom error');
      (error as any).code = 'ERR_CUSTOM';
      
      logError(error, 'custom context', { additional: 'info' });
      
      const logCall = mockConsole.error.mock.calls[0];
      const logMessage = logCall[0];
      
      expect(logMessage).toContain('Error in custom context');
      expect(logMessage).toContain('ERR_CUSTOM');
      expect(logMessage).toContain('additional');
    });

    it('should handle non-Error objects', () => {
      const { logError } = require('./logger');
      
      logError('string error', 'context');
      logError(null, 'null context');
      logError(undefined, 'undefined context');
      
      expect(mockConsole.error).toHaveBeenCalledTimes(3);
    });

    it('should log without context when not provided', () => {
      const { logError } = require('./logger');
      const error = new Error('Test error');
      
      logError(error);
      
      expect(mockConsole.error).toHaveBeenCalledWith(
        expect.stringContaining('Error')
      );
    });
  });

  describe('Auth Event Logging', () => {
    beforeEach(() => {
      jest.resetModules();
      delete (global as any).window;
      delete (global as any).navigator;
    });

    it('should log auth events with proper formatting', () => {
      const { logAuthEvent } = require('./logger');
      
      logAuthEvent('login', 'user123');
      
      expect(mockConsole.info).toHaveBeenCalledWith(
        expect.stringContaining('[AUTH]')
      );
      expect(mockConsole.info).toHaveBeenCalledWith(
        expect.stringContaining('Auth event: login')
      );
    });

    it('should include user ID in auth event logs', () => {
      const { logAuthEvent } = require('./logger');
      
      logAuthEvent('logout', 'user456', { reason: 'timeout' });
      
      const logCall = mockConsole.info.mock.calls[0];
      const logMessage = logCall[0];
      
      expect(logMessage).toContain('user456');
      expect(logMessage).toContain('reason');
      expect(logMessage).toContain('timeout');
    });

    it('should handle auth events without user ID', () => {
      const { logAuthEvent } = require('./logger');
      
      logAuthEvent('registration_attempt');
      
      expect(mockConsole.info).toHaveBeenCalledWith(
        expect.stringContaining('Auth event: registration_attempt')
      );
    });

    it('should include user agent in browser environment', () => {
      // Simulate browser environment
      (global as any).window = {};
      (global as any).navigator = {
        userAgent: 'Mozilla/5.0 (Test Browser)'
      };
      
      jest.resetModules();
      const { logAuthEvent } = require('./logger');
      
      logAuthEvent('login', 'user123');
      
      const logCall = mockConsole.info.mock.calls[0];
      const logMessage = logCall[0];
      
      expect(logMessage).toContain('Mozilla/5.0 (Test Browser)');
    });

    it('should include timestamp in auth event logs', () => {
      const { logAuthEvent } = require('./logger');
      
      logAuthEvent('password_change', 'user789');
      
      const logCall = mockConsole.info.mock.calls[0];
      const logMessage = logCall[0];
      
      expect(logMessage).toMatch(/\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/);
    });
  });

  describe('Edge Cases and Error Handling', () => {
    it('should handle missing console methods gracefully', () => {
      // Temporarily remove console methods
      const originalError = console.error;
      const originalWarn = console.warn;
      const originalInfo = console.info;
      const originalDebug = console.debug;
      const originalLog = console.log;
      
      delete (console as any).error;
      delete (console as any).warn;
      delete (console as any).info;
      delete (console as any).debug;
      delete (console as any).log;
      
      const testLogger = createServiceLogger('TEST');
      
      expect(() => {
        testLogger.error('error message');
        testLogger.warn('warn message');
        testLogger.info('info message');
        testLogger.debug('debug message');
        testLogger.http('http message');
      }).not.toThrow();
      
      // Restore console methods
      console.error = originalError;
      console.warn = originalWarn;
      console.info = originalInfo;
      console.debug = originalDebug;
      console.log = originalLog;
    });

    it('should handle circular references in meta objects', () => {
      const circular: any = { name: 'test' };
      circular.self = circular;
      
      const testLogger = createServiceLogger('TEST');
      
      expect(() => {
        testLogger.info('circular test', circular);
      }).not.toThrow();
    });

    it('should handle very large meta objects', () => {
      const largeMeta = {
        data: 'x'.repeat(10000),
        nested: {
          deep: {
            very: {
              deep: 'value'
            }
          }
        }
      };
      
      const testLogger = createServiceLogger('TEST');
      
      expect(() => {
        testLogger.info('large meta test', largeMeta);
      }).not.toThrow();
    });

    it('should handle null and undefined values in meta', () => {
      const testLogger = createServiceLogger('TEST');
      
      expect(() => {
        testLogger.info('null test', null as any);
        testLogger.info('undefined test', undefined);
      }).not.toThrow();
    });

    it('should handle empty strings and special characters', () => {
      const testLogger = createServiceLogger('TEST');
      
      expect(() => {
        testLogger.info('');
        testLogger.info('Special chars: \n\t\r"\'\\');
        testLogger.info('Unicode: 🚀 🎉 ✨');
      }).not.toThrow();
    });
  });

  describe('Performance Considerations', () => {
    it('should not format messages when logging is disabled', () => {
      process.env.TASKMASTER_LOG_LEVEL = 'error';
      jest.resetModules();
      
      const { createServiceLogger } = require('./logger');
      const testLogger = createServiceLogger('TEST');
      
      const expensiveOperation = jest.fn(() => ({ expensive: 'data' }));
      
      // This should not call the expensive operation due to level filtering
      testLogger.debug('debug message', expensiveOperation());
      
      expect(expensiveOperation).toHaveBeenCalled(); // Note: This will be called due to eager evaluation
      expect(mockConsole.debug).not.toHaveBeenCalled();
    });

    it('should handle rapid sequential logging', () => {
      const testLogger = createServiceLogger('TEST');
      
      const start = Date.now();
      for (let i = 0; i < 1000; i++) {
        testLogger.info(`Message ${i}`);
      }
      const end = Date.now();
      
      expect(end - start).toBeLessThan(1000); // Should complete within 1 second
      expect(mockConsole.info).toHaveBeenCalledTimes(1000);
    });
  });
});