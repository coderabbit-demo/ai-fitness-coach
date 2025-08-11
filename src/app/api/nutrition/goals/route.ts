import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import logger from '@/lib/logger';

/**
 * Handles retrieval and management of user nutrition goals.
 *
 * GET: Fetches the user's current nutrition goals
 * POST: Creates or updates nutrition goals for the authenticated user
 * 
 * @param request - NextRequest for goal management operations
 * @returns JSON response with goals data or error message
 */
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

    if (error && error.code !== 'PGRST116') {
      logger.error('Failed to fetch user goals', { error, userId: user.id });
      throw error;
    }

    // If no goals exist, return default values
    const defaultGoals = {
      daily_calorie_goal: 2000,
      daily_protein_goal_g: 150,
      daily_carbs_goal_g: 200,
      daily_fat_goal_g: 70,
      daily_fiber_goal_g: 25,
      activity_level: 'moderate',
      weight_goal: 'maintain'
    };

    logger.info('User goals fetched', { userId: user.id, hasGoals: !!goals });

    return NextResponse.json({ 
      success: true,
      goals: goals || defaultGoals 
    });

  } catch (error) {
    logger.error('Get goals API error', { error });
    return NextResponse.json({ 
      error: 'Failed to fetch goals',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
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

    // Validate required fields
    if (!daily_calorie_goal || daily_calorie_goal < 500 || daily_calorie_goal > 5000) {
      return NextResponse.json({ 
        error: 'Invalid daily calorie goal. Must be between 500-5000.' 
      }, { status: 400 });
    }

    // Validate activity level
    const validActivityLevels = ['sedentary', 'light', 'moderate', 'active', 'very_active'];
    if (activity_level && !validActivityLevels.includes(activity_level)) {
      return NextResponse.json({ 
        error: 'Invalid activity level. Must be one of: ' + validActivityLevels.join(', ') 
      }, { status: 400 });
    }

    // Validate weight goal
    const validWeightGoals = ['lose', 'maintain', 'gain'];
    if (weight_goal && !validWeightGoals.includes(weight_goal)) {
      return NextResponse.json({ 
        error: 'Invalid weight goal. Must be one of: ' + validWeightGoals.join(', ') 
      }, { status: 400 });
    }

    const { data: goals, error } = await supabase
      .from('user_nutrition_goals')
      .upsert({
        user_id: user.id,
        daily_calorie_goal: parseInt(daily_calorie_goal),
        daily_protein_goal_g: parseFloat(daily_protein_goal_g) || 150,
        daily_carbs_goal_g: parseFloat(daily_carbs_goal_g) || 200,
        daily_fat_goal_g: parseFloat(daily_fat_goal_g) || 70,
        daily_fiber_goal_g: parseFloat(daily_fiber_goal_g) || 25,
        activity_level: activity_level || 'moderate',
        weight_goal: weight_goal || 'maintain',
        updated_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) {
      logger.error('Failed to update user goals', { error, userId: user.id });
      throw error;
    }

    logger.info('User goals updated successfully', { 
      userId: user.id, 
      calorieGoal: daily_calorie_goal,
      activityLevel: activity_level,
      weightGoal: weight_goal
    });

    return NextResponse.json({ 
      success: true,
      goals 
    });

  } catch (error) {
    logger.error('Update goals API error', { error });
    return NextResponse.json({ 
      error: 'Failed to update goals',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}