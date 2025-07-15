import { Inngest } from 'inngest';
import logger from '@/lib/logger';

// Validate required environment variables
const eventKey = process.env.INNGEST_EVENT_KEY;

// Only initialize if environment variable is available (not during build)
let inngest: Inngest | null = null;

if (eventKey) {
  inngest = new Inngest({
    id: 'ai-fitness-coach',
    name: 'AI Fitness Coach',
    eventKey: eventKey,
  });
  logger.info('Inngest client initialized successfully');
} else {
  logger.warn('INNGEST_EVENT_KEY environment variable is missing - Inngest functionality will be disabled');
}

export { inngest };

// Log initialization status for debugging
if (process.env.NODE_ENV !== 'production') {
  logger.info('Inngest client initialization status:', { 
    initialized: !!inngest, 
    hasEventKey: !!eventKey 
  });
}

// Helper function to get the inngest client with proper error handling
export function getInngestClient(): Inngest {
  if (!inngest) {
    logger.error('Attempted to use Inngest client but it is not initialized - INNGEST_EVENT_KEY environment variable is required');
    throw new Error('INNGEST_EVENT_KEY environment variable is required');
  }
  return inngest;
} 