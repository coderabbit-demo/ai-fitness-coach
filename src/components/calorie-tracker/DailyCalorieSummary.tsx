'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Flame, TrendingUp, TrendingDown } from 'lucide-react';

interface DailySummaryProps {
  summary: {
    total_calories: number;
    total_protein_g: number;
    total_carbs_g: number;
    total_fat_g: number;
    total_fiber_g: number;
    meal_count: number;
  } | null;
  goals: {
    daily_calorie_goal: number;
    daily_protein_goal_g: number;
    daily_carbs_goal_g: number;
    daily_fat_goal_g: number;
    daily_fiber_goal_g: number;
  } | null;
}

export function DailyCalorieSummary({ summary, goals }: DailySummaryProps) {
  const caloriesConsumed = summary?.total_calories || 0;
  const calorieGoal = goals?.daily_calorie_goal || 2000;
  const caloriesRemaining = calorieGoal - caloriesConsumed;
  const calorieProgress = (caloriesConsumed / calorieGoal) * 100;

  const macros = [
    {
      name: 'Protein',
      consumed: summary?.total_protein_g || 0,
      goal: goals?.daily_protein_goal_g || 150,
      unit: 'g',
      color: 'bg-blue-500',
    },
    {
      name: 'Carbs',
      consumed: summary?.total_carbs_g || 0,
      goal: goals?.daily_carbs_goal_g || 200,
      unit: 'g',
      color: 'bg-green-500',
    },
    {
      name: 'Fat',
      consumed: summary?.total_fat_g || 0,
      goal: goals?.daily_fat_goal_g || 70,
      unit: 'g',
      color: 'bg-yellow-500',
    },
    {
      name: 'Fiber',
      consumed: summary?.total_fiber_g || 0,
      goal: goals?.daily_fiber_goal_g || 25,
      unit: 'g',
      color: 'bg-purple-500',
    },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Flame className="h-5 w-5 text-orange-500" />
          Today&apos;s Nutrition
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Calories */}
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <span className="text-sm font-medium">Calories</span>
            <span className="text-sm text-gray-500">
              {caloriesConsumed} / {calorieGoal}
            </span>
          </div>
          <Progress value={Math.min(calorieProgress, 100)} className="h-2" />
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">
              {summary?.meal_count || 0} meals logged
            </span>
            <span className={`font-medium ${caloriesRemaining >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {caloriesRemaining >= 0 ? (
                <span className="flex items-center gap-1">
                  <TrendingUp className="h-3 w-3" />
                  {caloriesRemaining} remaining
                </span>
              ) : (
                <span className="flex items-center gap-1">
                  <TrendingDown className="h-3 w-3" />
                  {Math.abs(caloriesRemaining)} over
                </span>
              )}
            </span>
          </div>
        </div>

        {/* Macros */}
        <div className="grid grid-cols-2 gap-4">
          {macros.map((macro) => {
            const progress = (macro.consumed / macro.goal) * 100;
            return (
              <div key={macro.name} className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">{macro.name}</span>
                  <span className="text-sm text-gray-500">
                    {macro.consumed.toFixed(1)}{macro.unit}
                  </span>
                </div>
                <Progress value={Math.min(progress, 100)} className="h-1" />
                <div className="text-xs text-gray-500">
                  Goal: {macro.goal}{macro.unit}
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
} 