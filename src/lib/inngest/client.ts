import { Inngest } from 'inngest';

// Validate required environment variables
const eventKey = process.env.INNGEST_EVENT_KEY;

if (!eventKey) {
  throw new Error('INNGEST_EVENT_KEY environment variable is required');
}

export const inngest = new Inngest({
  id: 'ai-fitness-coach',
  name: 'AI Fitness Coach',
  eventKey: eventKey,
}); 