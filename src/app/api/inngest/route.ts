import { serve } from 'inngest/next';
import { inngest } from '@/lib/inngest/client';
import { analyzeFoodImage } from '@/lib/inngest/functions/analyze-food';
import { updateNutritionData } from '@/lib/inngest/functions/update-nutrition';
import { handleAnalysisError } from '@/lib/inngest/functions/error-handler';

export const { GET, POST, PUT } = serve({
  client: inngest,
  functions: [
    analyzeFoodImage,
    updateNutritionData,
    handleAnalysisError,
  ],
}); 