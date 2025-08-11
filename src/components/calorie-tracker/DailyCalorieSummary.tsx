'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Flame, Target, TrendingUp, TrendingDown, Settings, Plus } from 'lucide-react';

interface DailySummaryData {
  total_calories: number;
  total_protein_g: number;
  total_carbs_g: number;
  total_fat_g: number;
  total_fiber_g: number;
  meal_count: number;
}

interface UserGoals {
  daily_calorie_goal: number;
  daily_protein_goal_g: number;
  daily_carbs_goal_g: number;
  daily_fat_goal_g: number;
  daily_fiber_goal_g: number;
  activity_level?: string;
  weight_goal?: string;
}

interface GoalProgress {
  calories: { current: number; goal: number; percentage: number };
  protein: { current: number; goal: number; percentage: number };
  carbs: { current: number; goal: number; percentage: number };
  fat: { current: number; goal: number; percentage: number };
}

interface DailyCalorieSummaryProps {
  summary: DailySummaryData | null;
  goals: UserGoals | null;
  goalProgress: GoalProgress | null;
  isLoading?: boolean;
  onEditGoals?: () => void;
  onAddMeal?: () => void;
}

/**
 * Displays daily calorie and macronutrient summary with progress toward user goals.
 *
 * Shows calorie consumption vs targets, macro breakdown with progress bars,
 * meal count, and goal achievement status. Includes action buttons for
 * goal editing and meal addition.
 *
 * @param summary - Daily nutrition summary data
 * @param goals - User's nutrition goals
 * @param goalProgress - Progress calculation for each macro
 * @param isLoading - Loading state indicator
 * @param onEditGoals - Callback for editing nutrition goals
 * @param onAddMeal - Callback for adding new meal
 */
export function DailyCalorieSummary({
  summary,
  goals,
  goalProgress,
  isLoading = false,
  onEditGoals,
  onAddMeal
}: DailyCalorieSummaryProps) {
  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Flame className="h-5 w-5 text-orange-500" />
            Today&apos;s Nutrition
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="h-4 bg-gray-200 rounded animate-pulse" />
            <div className="h-4 bg-gray-200 rounded animate-pulse" />
            <div className="h-4 bg-gray-200 rounded animate-pulse" />
          </div>
        </CardContent>
      </Card>
    );
  }

  const caloriesConsumed = summary?.total_calories || 0;
  const calorieGoal = goals?.daily_calorie_goal || 2000;
  const caloriesRemaining = calorieGoal - caloriesConsumed;
  const calorieProgress = Math.min((caloriesConsumed / calorieGoal) * 100, 100);

  const macros = [
    {
      name: 'Protein',
      consumed: summary?.total_protein_g || 0,
      goal: goals?.daily_protein_goal_g || 150,
      unit: 'g',
      color: 'bg-blue-500',
      progress: goalProgress?.protein?.percentage || 0,
    },
    {
      name: 'Carbs',
      consumed: summary?.total_carbs_g || 0,
      goal: goals?.daily_carbs_goal_g || 200,
      unit: 'g',
      color: 'bg-green-500',
      progress: goalProgress?.carbs?.percentage || 0,
    },
    {
      name: 'Fat',
      consumed: summary?.total_fat_g || 0,
      goal: goals?.daily_fat_goal_g || 70,
      unit: 'g',
      color: 'bg-yellow-500',
      progress: goalProgress?.fat?.percentage || 0,
    },
    {
      name: 'Fiber',
      consumed: summary?.total_fiber_g || 0,
      goal: goals?.daily_fiber_goal_g || 25,
      unit: 'g',
      color: 'bg-purple-500',
      progress: ((summary?.total_fiber_g || 0) / (goals?.daily_fiber_goal_g || 25)) * 100,
    },
  ];

  const getCalorieStatus = () => {
    const percentageOfGoal = (caloriesConsumed / calorieGoal) * 100;
    if (percentageOfGoal < 50) return { color: 'text-orange-600', icon: TrendingUp, text: "Keep going!" };
    if (percentageOfGoal < 90) return { color: 'text-blue-600', icon: Target, text: 'On track' };
    if (percentageOfGoal <= 110) return { color: 'text-green-600', icon: Target, text: "Goal achieved!" };
    return { color: 'text-red-600', icon: TrendingDown, text: 'Over goal' };
  };

  const calorieStatus = getCalorieStatus();
  const StatusIcon = calorieStatus.icon;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Flame className="h-5 w-5 text-orange-500" />
            Today&apos;s Nutrition
          </CardTitle>
          <div className="flex gap-2">
            {onAddMeal && (
              <Button size="sm" onClick={onAddMeal} className="gap-1">
                <Plus className="h-4 w-4" />
                Add Meal
              </Button>
            )}
            {onEditGoals && (
              <Button size="sm" variant="outline" onClick={onEditGoals} className="gap-1">
                <Settings className="h-4 w-4" />
                Edit Goals
              </Button>
            )}
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* Calorie Summary */}
        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-2">
              <span className="text-lg font-semibold">Calories</span>
              <Badge variant="outline" className={`${calorieStatus.color} border-current`}>
                <StatusIcon className="h-3 w-3 mr-1" />
                {calorieStatus.text}
              </Badge>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold text-orange-600">
                {Math.round(caloriesConsumed)}
              </div>
              <div className="text-sm text-gray-500">
                / {calorieGoal} cal
              </div>
            </div>
          </div>
          
          <Progress value={calorieProgress} className="h-3" />
          
          <div className="flex justify-between items-center text-sm">
            <span className="text-gray-600">
              {summary?.meal_count || 0} meals logged
            </span>
            <span className={`font-medium ${caloriesRemaining >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {caloriesRemaining >= 0 ? (
                <span className="flex items-center gap-1">
                  <TrendingUp className="h-3 w-3" />
                  {Math.round(caloriesRemaining)} remaining
                </span>
              ) : (
                <span className="flex items-center gap-1">
                  <TrendingDown className="h-3 w-3" />
                  {Math.round(Math.abs(caloriesRemaining))} over
                </span>
              )}
            </span>
          </div>
        </div>

        {/* Macronutrients */}
        <div className="space-y-4">
          <h3 className="font-medium text-gray-900">Macronutrients</h3>
          <div className="grid grid-cols-2 gap-4">
            {macros.map((macro) => (
              <div key={macro.name} className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full ${macro.color}`} />
                    {macro.name}
                  </span>
                  <span className="text-sm text-gray-500">
                    {macro.consumed.toFixed(1)}{macro.unit}
                  </span>
                </div>
                <Progress value={Math.min(macro.progress, 100)} className="h-2" />
                <div className="flex justify-between text-xs text-gray-500">
                  <span>Goal: {macro.goal}{macro.unit}</span>
                  <span>{macro.progress.toFixed(0)}%</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* No data state */}
        {(!summary || summary.meal_count === 0) && (
          <div className="text-center py-8 text-gray-500">
            <div className="mb-2">No meals logged today</div>
            {onAddMeal && (
              <Button onClick={onAddMeal} size="sm">
                <Plus className="h-4 w-4 mr-1" />
                Log your first meal
              </Button>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}