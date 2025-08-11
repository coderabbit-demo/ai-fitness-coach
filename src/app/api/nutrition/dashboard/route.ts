import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { format, subDays } from 'date-fns';
import logger from '@/lib/logger';

/**
 * Handles retrieval of nutrition dashboard data for authenticated users.
 *
 * Fetches daily nutrition summaries, user goals, recent meals, and analytics
 * for a specified number of days (default: 7). Returns aggregated data including
 * total calories, average daily intake, meal counts, and progress metrics.
 *
 * @param request - NextRequest containing optional 'days' query parameter
 * @returns JSON response with dashboard data or error message
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { searchParams } = new URL(request.url);
    const days = parseInt(searchParams.get('days') || '7');
    
    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const endDate = new Date();
    const startDate = subDays(endDate, days - 1);

    // Fetch daily summaries
    const { data: dailySummaries, error: summariesError } = await supabase
      .from('daily_nutrition_summaries')
      .select('*')
      .eq('user_id', user.id)
      .gte('date', format(startDate, 'yyyy-MM-dd'))
      .lte('date', format(endDate, 'yyyy-MM-dd'))
      .order('date', { ascending: true });

    if (summariesError) {
      logger.error('Failed to fetch daily summaries', { error: summariesError, userId: user.id });
      throw summariesError;
    }

    // Fetch user goals
    const { data: userGoals, error: goalsError } = await supabase
      .from('user_nutrition_goals')
      .select('*')
      .eq('user_id', user.id)
      .single();

    if (goalsError && goalsError.code !== 'PGRST116') {
      logger.error('Failed to fetch user goals', { error: goalsError, userId: user.id });
      throw goalsError;
    }

    // Fetch recent meal logs
    const { data: recentMeals, error: mealsError } = await supabase
      .from('nutrition_logs')
      .select('*')
      .eq('user_id', user.id)
      .eq('processing_status', 'completed')
      .order('created_at', { ascending: false })
      .limit(10);

    if (mealsError) {
      logger.error('Failed to fetch recent meals', { error: mealsError, userId: user.id });
      throw mealsError;
    }

    // Fetch today's summary specifically
    const today = format(new Date(), 'yyyy-MM-dd');
    const todaySummary = dailySummaries?.find(s => s.date === today) || null;

    // Calculate analytics
    const totalCalories = dailySummaries?.reduce((sum, day) => sum + (day.total_calories || 0), 0) || 0;
    const avgCalories = dailySummaries?.length ? totalCalories / dailySummaries.length : 0;
    const totalMeals = dailySummaries?.reduce((sum, day) => sum + (day.meal_count || 0), 0) || 0;

    // Calculate goal progress for today
    const goalProgress = userGoals && todaySummary ? {
      calories: {
        current: todaySummary.total_calories || 0,
        goal: userGoals.daily_calorie_goal || 2000,
        percentage: ((todaySummary.total_calories || 0) / (userGoals.daily_calorie_goal || 2000)) * 100
      },
      protein: {
        current: todaySummary.total_protein_g || 0,
        goal: userGoals.daily_protein_goal_g || 150,
        percentage: ((todaySummary.total_protein_g || 0) / (userGoals.daily_protein_goal_g || 150)) * 100
      },
      carbs: {
        current: todaySummary.total_carbs_g || 0,
        goal: userGoals.daily_carbs_goal_g || 200,
        percentage: ((todaySummary.total_carbs_g || 0) / (userGoals.daily_carbs_goal_g || 200)) * 100
      },
      fat: {
        current: todaySummary.total_fat_g || 0,
        goal: userGoals.daily_fat_goal_g || 70,
        percentage: ((todaySummary.total_fat_g || 0) / (userGoals.daily_fat_goal_g || 70)) * 100
      }
    } : null;

    logger.info('Dashboard data fetched successfully', {
      userId: user.id,
      daysRequested: days,
      summariesCount: dailySummaries?.length || 0,
      mealsCount: recentMeals?.length || 0
    });

    return NextResponse.json({
      success: true,
      data: {
        dailySummaries,
        todaySummary,
        userGoals,
        recentMeals,
        goalProgress,
        analytics: {
          totalCalories: Math.round(totalCalories),
          avgCalories: Math.round(avgCalories),
          totalMeals,
          daysTracked: dailySummaries?.length || 0,
          period: {
            startDate: format(startDate, 'yyyy-MM-dd'),
            endDate: format(endDate, 'yyyy-MM-dd'),
            days
          }
        }
      }
    });

  } catch (error) {
    logger.error('Dashboard API error', { error, stack: error instanceof Error ? error.stack : undefined });
    return NextResponse.json({ 
      error: 'Failed to fetch dashboard data',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}