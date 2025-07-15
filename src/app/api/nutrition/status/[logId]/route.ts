import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { SupabaseStorageServerClient } from '@/lib/supabase-storage-server';

/**
 * Handles GET requests to retrieve the status and details of a nutrition log by its ID for the authenticated user.
 *
 * Validates the `logId` parameter, checks user authentication, and queries the database for the specified nutrition log. Returns a JSON response with the log's status, total calories, confidence score, food items, error message, and creation timestamp, or an appropriate error response if the log is not found, access is denied, or other errors occur.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ logId: string }> }
) {
  try {
    // Validate logId parameter
    const { logId } = await params;
    if (!logId || typeof logId !== 'string') {
      return NextResponse.json({ error: 'Invalid logId parameter' }, { status: 400 });
    }

    // Check if logId is a valid UUID format or numeric ID
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(logId);
    const isNumeric = /^\d+$/.test(logId);
    
    if (!isUuid && !isNumeric) {
      return NextResponse.json({ error: 'Invalid logId format. Must be UUID or numeric.' }, { status: 400 });
    }

    const supabase = await createClient();
    
    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: log, error } = await supabase
      .from('nutrition_logs')
      .select('processing_status, total_calories, confidence_score, food_items, error_message, created_at, image_path')
      .eq('id', logId)
      .eq('user_id', user.id)
      .single();

    if (error) {
      // Handle different types of database errors
      if (error.code === 'PGRST116') {
        // No rows found
        return NextResponse.json({ error: 'Log not found' }, { status: 404 });
      } else if (error.code === 'PGRST301') {
        // Row-level security violation
        return NextResponse.json({ error: 'Access denied' }, { status: 403 });
      } else if (error.message.includes('connection') || error.message.includes('timeout')) {
        // Network/connection issues
        return NextResponse.json({ error: 'Database connection error' }, { status: 503 });
      } else {
        // Other database errors
        console.error('Database error:', error);
        return NextResponse.json({ error: 'Database error' }, { status: 500 });
      }
    }

    // Generate fresh signed URL for image if image_path exists
    let imageUrl: string | null = null;
    if (log.image_path) {
      const storageClient = new SupabaseStorageServerClient();
      imageUrl = await storageClient.getSignedImageUrl(user.id, log.image_path, 3600);
    }

    return NextResponse.json({
      status: log.processing_status,
      totalCalories: log.total_calories,
      confidenceScore: log.confidence_score,
      foodItems: log.food_items,
      errorMessage: log.error_message,
      createdAt: log.created_at,
      imageUrl,
    });

  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 