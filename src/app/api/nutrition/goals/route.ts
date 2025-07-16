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
    
    // Validate request body structure
    if (!body || typeof body !== 'object') {
      return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
    }
    
    const {
      daily_calorie_goal,
      daily_protein_goal_g,
      daily_carbs_goal_g,
      daily_fat_goal_g,
      daily_fiber_goal_g,
      activity_level,
      weight_goal,
    } = body;

    // Validate required numeric fields
    const numericFields = [
      { name: 'daily_calorie_goal', value: daily_calorie_goal },
      { name: 'daily_protein_goal_g', value: daily_protein_goal_g },
      { name: 'daily_carbs_goal_g', value: daily_carbs_goal_g },
      { name: 'daily_fat_goal_g', value: daily_fat_goal_g },
      { name: 'daily_fiber_goal_g', value: daily_fiber_goal_g },
    ];

    for (const field of numericFields) {
      if (field.value === undefined || field.value === null) {
        return NextResponse.json(
          { error: `Missing required field: ${field.name}` }, 
          { status: 400 }
        );
      }
      if (typeof field.value !== 'number' || field.value < 0 || !isFinite(field.value)) {
        return NextResponse.json(
          { error: `${field.name} must be a positive number` }, 
          { status: 400 }
        );
      }
    }

    // Validate activity level
    const validActivityLevels = ['sedentary', 'lightly_active', 'moderately_active', 'very_active', 'super_active'];
    if (activity_level && !validActivityLevels.includes(activity_level)) {
      return NextResponse.json(
        { error: 'Invalid activity_level. Must be one of: ' + validActivityLevels.join(', ') }, 
        { status: 400 }
      );
    }

    // Validate weight goal
    const validWeightGoals = ['lose', 'maintain', 'gain'];
    if (weight_goal && !validWeightGoals.includes(weight_goal)) {
      return NextResponse.json(
        { error: 'Invalid weight_goal. Must be one of: ' + validWeightGoals.join(', ') }, 
        { status: 400 }
      );
    }

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