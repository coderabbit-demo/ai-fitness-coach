import { serve } from 'inngest/next';
import { inngest } from '@/lib/inngest/client';

// Import the functions at the top level
import { analyzeFoodImage } from '@/lib/inngest/functions/analyze-food';
import { updateNutritionData } from '@/lib/inngest/functions/update-nutrition';
import { handleAnalysisError } from '@/lib/inngest/functions/error-handler';

// Conditionally export the routes only if environment variables are available
let routes;

if (inngest) {

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