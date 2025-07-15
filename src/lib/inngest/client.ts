import { Inngest } from 'inngest';

export const inngest = new Inngest({
  id: 'ai-fitness-coach',
  name: 'AI Fitness Coach',
  eventKey: process.env.INNGEST_EVENT_KEY,
}); 