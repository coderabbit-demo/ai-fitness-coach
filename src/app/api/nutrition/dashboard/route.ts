import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { format, subDays } from 'date-fns';

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

    if (summariesError) throw summariesError;

    // Fetch user goals
    const { data: userGoals, error: goalsError } = await supabase
      .from('user_nutrition_goals')
      .select('*')
      .eq('user_id', user.id)
      .single();

    if (goalsError && goalsError.code !== 'PGRST116') throw goalsError;

    // Fetch recent meal logs
    const { data: recentMeals, error: mealsError } = await supabase
      .from('nutrition_logs')
      .select('*')
      .eq('user_id', user.id)
      .eq('processing_status', 'completed')
      .order('created_at', { ascending: false })
      .limit(10);

    if (mealsError) throw mealsError;

    // Calculate analytics
    const totalCalories = dailySummaries?.reduce((sum: number, day: { total_calories?: number }) => sum + (day.total_calories || 0), 0) || 0;
    const avgCalories = dailySummaries?.length ? totalCalories / dailySummaries.length : 0;
    const mealCount = dailySummaries?.reduce((sum: number, day: { meal_count?: number }) => sum + (day.meal_count || 0), 0) || 0;

    return NextResponse.json({
      dailySummaries,
      userGoals,
      recentMeals,
      analytics: {
        totalCalories,
        avgCalories,
        mealCount,
        daysTracked: dailySummaries?.length || 0,
      },
    });

  } catch (error) {
    console.error('Dashboard API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 