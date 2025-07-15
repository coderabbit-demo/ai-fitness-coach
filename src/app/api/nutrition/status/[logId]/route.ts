import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';

export async function GET(
  request: NextRequest,
  { params }: { params: { logId: string } }
) {
  try {
    const supabase = await createClient();
    
    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: log, error } = await supabase
      .from('nutrition_logs')
      .select('processing_status, total_calories, confidence_score, food_items, error_message, created_at')
      .eq('id', params.logId)
      .eq('user_id', user.id)
      .single();

    if (error) {
      return NextResponse.json({ error: 'Log not found' }, { status: 404 });
    }

    return NextResponse.json({
      status: log.processing_status,
      totalCalories: log.total_calories,
      confidenceScore: log.confidence_score,
      foodItems: log.food_items,
      errorMessage: log.error_message,
      createdAt: log.created_at,
    });

  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 