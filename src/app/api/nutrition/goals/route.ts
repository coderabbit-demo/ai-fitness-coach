import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: goals, error } = await supabase
      .from('user_nutrition_goals')
      .select('*')
      .eq('user_id', user.id)
      .single();

    if (error && error.code !== 'PGRST116') throw error;

    return NextResponse.json({ goals });

  } catch (error) {
    console.error('Get goals API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const {
      daily_calorie_goal,
      daily_protein_goal_g,
      daily_carbs_goal_g,
      daily_fat_goal_g,
      daily_fiber_goal_g,
      activity_level,
      weight_goal,
    } = body;

    const { data: goals, error } = await supabase
      .from('user_nutrition_goals')
      .upsert({
        user_id: user.id,
        daily_calorie_goal,
        daily_protein_goal_g,
        daily_carbs_goal_g,
        daily_fat_goal_g,
        daily_fiber_goal_g,
        activity_level,
        weight_goal,
        updated_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ goals });

  } catch (error) {
    console.error('Update goals API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 