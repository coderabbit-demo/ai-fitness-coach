import { getInngestClient } from '@/lib/inngest/client';
import { NutritionAnalyzer } from '@/lib/ai/nutrition-analyzer';
import { createClient } from '@/utils/supabase/server';
import logger from '@/lib/logger';

export const analyzeFoodImage = getInngestClient().createFunction(
  { id: 'analyze-food-image' },
  { event: 'food/image.uploaded' },
  async ({ event, step }) => {
    const { imageUrl, userId, logId } = event.data;

    // Step 1: Download and prepare image
    const imageBase64 = await step.run('download-image', async () => {
      const response = await fetch(imageUrl);
      if (!response.ok) {
        throw new Error(`Failed to download image: ${response.statusText}`);
      }
      
      const buffer = await response.arrayBuffer();
      return Buffer.from(buffer).toString('base64');
    });

    // Step 2: Analyze image with AI
    const analysis = await step.run('analyze-nutrition', async () => {
      try {
        const analyzer = NutritionAnalyzer.getInstance();
        return await analyzer.analyzeImage(imageBase64);
      } catch (error) {
        // Send error event for monitoring
        await step.sendEvent('analysis-error', {
          name: 'food/analysis.failed',
          data: {
            logId,
            userId,
            error: {
              message: error instanceof Error ? error.message : 'Unknown error',
              stack: error instanceof Error ? error.stack : undefined,
            },
            provider: 'unknown',
          },
        });
        throw error;
      }
    });

    // Step 3: Update database with results
    await step.run('update-database', async () => {
      const supabase = await createClient();
      
      const { error } = await supabase
        .from('nutrition_logs')
        .update({
          food_items: analysis.foodItems,
          total_calories: analysis.totalCalories,
          total_protein_g: analysis.totalProtein,
          total_carbs_g: analysis.totalCarbs,
          total_fat_g: analysis.totalFat,
          total_fiber_g: analysis.totalFiber,
          confidence_score: analysis.confidenceScore,
          notes: analysis.analysisNotes,
          processed_at: new Date().toISOString(),
          processing_status: 'completed',
        })
        .eq('id', logId)
        .eq('user_id', userId);

      if (error) {
        logger.error('Failed to update nutrition log', { error, logId, userId });
        throw error;
      }

      logger.info('Nutrition analysis completed and saved', {
        logId,
        userId,
        totalCalories: analysis.totalCalories,
        confidenceScore: analysis.confidenceScore
      });
    });

    // Step 4: Send notification event
    await step.sendEvent('nutrition-analysis-complete', {
      name: 'nutrition/analysis.completed',
      data: {
        logId,
        userId,
        totalCalories: analysis.totalCalories,
        confidenceScore: analysis.confidenceScore,
      },
    });

    return { success: true, analysis };
  }
); 