import { inngest } from '@/lib/inngest/client';
import { createClient } from '@/utils/supabase/server';
import { AIErrorMonitor } from '@/lib/monitoring/ai-errors';
import logger from '@/lib/logger';

export const handleAnalysisError = inngest.createFunction(
  { id: 'handle-analysis-error' },
  { event: 'food/analysis.failed' },
  async ({ event, step }) => {
    const { logId, userId, error, provider } = event.data;

    // Log error to monitoring system
    await step.run('log-error', async () => {
      AIErrorMonitor.logError({
        provider,
        errorType: 'analysis_failed',
        message: error.message,
        userId,
        timestamp: new Date(),
      });
    });

    // Update database with error status
    await step.run('update-database', async () => {
      const supabase = await createClient();
      
      const { error: updateError } = await supabase
        .from('nutrition_logs')
        .update({
          processing_status: 'failed',
          error_message: error.message,
        })
        .eq('id', logId);

      if (updateError) {
        logger.error('Failed to update error status', { updateError, logId });
      }
    });

    // Send user notification about failure
    await step.sendEvent('user-notification', {
      name: 'nutrition/analysis.failed',
      data: {
        userId,
        logId,
        message: 'We had trouble analyzing your food image. Please try again.',
      },
    });
  }
); 