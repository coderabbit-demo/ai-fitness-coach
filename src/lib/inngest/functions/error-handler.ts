import { inngest } from '@/lib/inngest/client';
import { createClient } from '@/utils/supabase/server';
import { AIErrorMonitor } from '@/lib/monitoring/ai-errors';
import logger from '@/lib/logger';

export const handleAnalysisError = inngest.createFunction(
  { id: 'handle-analysis-error' },
  { event: 'food/analysis.failed' },
  async ({ event, step }) => {
    // Validate event data structure
    if (!event.data || typeof event.data !== 'object') {
      throw new Error('Invalid event data format');
    }
    
    const { logId, userId, error, provider } = event.data;
    
    // Validate required fields
    if (!logId || !userId || !error || !provider) {
      throw new Error('Missing required fields in event data');
    }

    // Log error to monitoring system
    await step.run('log-error', async () => {
      try {
        AIErrorMonitor.logError({
          provider,
          errorType: 'analysis_failed',
          message: error.message,
          userId,
          timestamp: new Date(),
        });
      } catch (monitoringError) {
        logger.error('Failed to log error to monitoring system', { 
          monitoringError, 
          logId, 
          userId 
        });
        // Don't throw here - continue with other steps
      }
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
        throw updateError;
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