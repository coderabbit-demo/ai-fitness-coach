'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { createClient } from '@/utils/supabase/client';
import { format, subDays } from 'date-fns';
import { TrendingUp, Calendar, BarChart3 } from 'lucide-react';

interface DayData {
  date: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber: number;
  dayLabel: string;
}

interface WeeklyTrendsChartProps {
  userId: string;
  className?: string;
}

/**
 * Displays weekly nutrition trends with interactive chart and metric selection.
 *
 * Shows line charts for calories, protein, carbs, fat, and fiber over a 7-day period.
 * Allows users to switch between different metrics and displays average values.
 * Fetches data from daily nutrition summaries and handles loading states.
 *
 * @param userId - ID of the authenticated user
 * @param className - Optional CSS class for styling
 */
export function WeeklyTrendsChart({ userId, className }: WeeklyTrendsChartProps) {
  const [weekData, setWeekData] = useState<DayData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeMetric, setActiveMetric] = useState<'calories' | 'protein' | 'carbs' | 'fat' | 'fiber'>('calories');

  useEffect(() => {
    fetchWeeklyData();
  }, [userId]);

  const fetchWeeklyData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const supabase = createClient();
      const endDate = new Date();
      const startDate = subDays(endDate, 6);

      const { data, error } = await supabase
        .from('daily_nutrition_summaries')
        .select('*')
        .eq('user_id', userId)
        .gte('date', format(startDate, 'yyyy-MM-dd'))
        .lte('date', format(endDate, 'yyyy-MM-dd'))
        .order('date', { ascending: true });

      if (error) {
        console.error('Error fetching weekly data:', error);
        throw new Error('Failed to fetch weekly data');
      }

      // Fill in missing days with zero values
      const weekData: DayData[] = [];
      for (let i = 0; i < 7; i++) {
        const date = subDays(endDate, 6 - i);
        const dateStr = format(date, 'yyyy-MM-dd');
        const dayData = data?.find(d => d.date === dateStr);
        
        weekData.push({
          date: dateStr,
          calories: Math.round(dayData?.total_calories || 0),
          protein: Math.round(dayData?.total_protein_g || 0),
          carbs: Math.round(dayData?.total_carbs_g || 0),
          fat: Math.round(dayData?.total_fat_g || 0),
          fiber: Math.round(dayData?.total_fiber_g || 0),
          dayLabel: format(date, 'EEE'),
        });
      }

      setWeekData(weekData);
    } catch (err) {
      console.error('Error in fetchWeeklyData:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  const metricConfig = {
    calories: { 
      color: '#f97316', 
      label: 'Calories',
      unit: 'cal',
      description: 'Daily calorie intake'
    },
    protein: { 
      color: '#3b82f6', 
      label: 'Protein',
      unit: 'g',
      description: 'Protein consumption'
    },
    carbs: { 
      color: '#10b981', 
      label: 'Carbs',
      unit: 'g',
      description: 'Carbohydrate intake'
    },
    fat: { 
      color: '#f59e0b', 
      label: 'Fat',
      unit: 'g',
      description: 'Fat consumption'
    },
    fiber: { 
      color: '#8b5cf6', 
      label: 'Fiber',
      unit: 'g',
      description: 'Fiber intake'
    },
  };

  const currentConfig = metricConfig[activeMetric];
  const averageValue = weekData.length > 0 
    ? Math.round(weekData.reduce((sum, day) => sum + day[activeMetric], 0) / weekData.length)
    : 0;

  const totalValue = weekData.reduce((sum, day) => sum + day[activeMetric], 0);
  const daysWithData = weekData.filter(day => day[activeMetric] > 0).length;

  if (loading) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-green-500" />
            Weekly Trends
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-48 flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-red-500" />
            Weekly Trends
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <div className="text-red-600 mb-2">Failed to load data</div>
            <Button onClick={fetchWeeklyData} size="sm" variant="outline">
              Try Again
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-green-500" />
            Weekly Trends
          </div>
          <div className="flex items-center gap-1 text-sm text-gray-500">
            <Calendar className="h-4 w-4" />
            Last 7 days
          </div>
        </CardTitle>
      </CardHeader>
      
      <CardContent>
        <div className="space-y-4">
          {/* Metric Selector */}
          <div className="flex flex-wrap gap-2">
            {Object.entries(metricConfig).map(([key, config]) => (
              <Button
                key={key}
                onClick={() => setActiveMetric(key as any)}
                size="sm"
                variant={activeMetric === key ? "default" : "outline"}
                className="text-xs"
              >
                {config.label}
              </Button>
            ))}
          </div>

          {/* Chart */}
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={weekData} margin={{ top: 5, right: 5, left: 5, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                <XAxis 
                  dataKey="dayLabel" 
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 12 }}
                />
                <YAxis 
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 12 }}
                />
                <Tooltip 
                  formatter={(value, _name) => [
                    `${value} ${currentConfig.unit}`, 
                    currentConfig.label
                  ]}
                  labelFormatter={(label) => `${label}`}
                  contentStyle={{
                    backgroundColor: 'rgba(255, 255, 255, 0.95)',
                    border: '1px solid #e5e7eb',
                    borderRadius: '8px',
                    fontSize: '12px'
                  }}
                />
                <Line 
                  type="monotone" 
                  dataKey={activeMetric}
                  stroke={currentConfig.color}
                  strokeWidth={2}
                  dot={{ 
                    fill: currentConfig.color, 
                    strokeWidth: 2, 
                    r: 4 
                  }}
                  activeDot={{ 
                    r: 6, 
                    stroke: currentConfig.color,
                    strokeWidth: 2,
                    fill: 'white'
                  }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Summary Stats */}
          <div className="grid grid-cols-3 gap-4 pt-2 border-t text-center">
            <div>
              <div className="text-lg font-semibold" style={{ color: currentConfig.color }}>
                {averageValue}
              </div>
              <div className="text-xs text-gray-500">
                Avg/day
              </div>
            </div>
            <div>
              <div className="text-lg font-semibold text-gray-700">
                {totalValue}
              </div>
              <div className="text-xs text-gray-500">
                Total {currentConfig.unit}
              </div>
            </div>
            <div>
              <div className="text-lg font-semibold text-gray-700">
                {daysWithData}/7
              </div>
              <div className="text-xs text-gray-500">
                Days logged
              </div>
            </div>
          </div>

          {/* No Data State */}
          {daysWithData === 0 && (
            <div className="text-center py-4 text-gray-500">
              <BarChart3 className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <div className="text-sm">No {currentConfig.label.toLowerCase()} data yet</div>
              <div className="text-xs mt-1">Start logging meals to see your trends!</div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}