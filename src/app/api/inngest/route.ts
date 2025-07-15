import { serve } from 'inngest/next';
import { inngest } from '@/lib/inngest/client';

// Conditionally export the routes only if environment variables are available
let routes;

if (inngest) {
  const { analyzeFoodImage } = require('@/lib/inngest/functions/analyze-food');
  const { updateNutritionData } = require('@/lib/inngest/functions/update-nutrition');
  const { handleAnalysisError } = require('@/lib/inngest/functions/error-handler');

  routes = serve({
    client: inngest,
    functions: [
      analyzeFoodImage,
      updateNutritionData,
      handleAnalysisError,
    ],
  });
} else {
  // Export stub functions for build time
  routes = {
    GET: () => new Response('Service not available', { status: 503 }),
    POST: () => new Response('Service not available', { status: 503 }),
    PUT: () => new Response('Service not available', { status: 503 }),
  };
}

export const { GET, POST, PUT } = routes; 