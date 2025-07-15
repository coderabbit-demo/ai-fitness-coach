import logger from '@/lib/logger';

export interface AIError {
  provider: string;
  errorType: string;
  message: string;
  imageUrl?: string;
  userId?: string;
  timestamp: Date;
}

export class AIErrorMonitor {
  static logError(error: AIError): void {
    logger.error('AI processing error', {
      ...error,
      timestamp: error.timestamp.toISOString(),
    });

    // Could integrate with external monitoring service
    // e.g., Sentry, DataDog, etc.
  }

  static async getErrorStats(): Promise<{
    totalErrors: number;
    errorsByProvider: Record<string, number>;
    recentErrors: AIError[];
  }> {
    // Implementation would query error logs/database
    // For now, return mock data
    return {
      totalErrors: 0,
      errorsByProvider: {},
      recentErrors: [],
    };
  }
} 