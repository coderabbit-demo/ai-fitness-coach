'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { createClient } from '@/utils/supabase/client';
import { format, subDays } from 'date-fns';
import { TrendingUp } from 'lucide-react';

interface WeeklyTrendsProps {
  userId: string;
}

interface DayData {
  date: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  dayLabel: string;
}

export function WeeklyTrendsChart({ userId }: WeeklyTrendsProps) {
  const [weekData, setWeekData] = useState<DayData[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeMetric, setActiveMetric] = useState<'calories' | 'protein' | 'carbs' | 'fat'>('calories');

  useEffect(() => {
    fetchWeeklyData();
  }, [userId]);

  const fetchWeeklyData = async () => {
    try {
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

      if (error) throw error;

      // Fill in missing days with zero values
      const weekData: DayData[] = [];
      for (let i = 0; i < 7; i++) {
        const date = subDays(endDate, 6 - i);
        const dateStr = format(date, 'yyyy-MM-dd');
        const dayData = data?.find(d => d.date === dateStr);
        
        weekData.push({
          date: dateStr,
          calories: dayData?.total_calories || 0,
          protein: dayData?.total_protein_g || 0,
          carbs: dayData?.total_carbs_g || 0,
          fat: dayData?.total_fat_g || 0,
          dayLabel: format(date, 'EEE'),
        });
      }

      setWeekData(weekData);
    } catch (error) {
      console.error('Error fetching weekly data:', error);
    } finally {
      setLoading(false);
    }
  };

  const metricConfig = {
    calories: { color: '#f97316', label: 'Calories' },
    protein: { color: '#3b82f6', label: 'Protein (g)' },
    carbs: { color: '#10b981', label: 'Carbs (g)' },
    fat: { color: '#f59e0b', label: 'Fat (g)' },
  };

  const averageCalories = weekData.reduce((sum, day) => sum + day.calories, 0) / weekData.length;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TrendingUp className="h-5 w-5 text-green-500" />
          Weekly Trends
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Metric Selector */}
          <div className="flex gap-2">
            {Object.entries(metricConfig).map(([key, config]) => (
              <button
                key={key}
                onClick={() => setActiveMetric(key as any)}
                className={`px-3 py-1 rounded-full text-sm transition-colors ${
                  activeMetric === key
                    ? 'bg-blue-500 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {config.label}
              </button>
            ))}
          </div>

          {/* Chart */}
          {loading ? (
            <div className="h-48 flex items-center justify-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={weekData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="dayLabel" />
                <YAxis />
                <Tooltip 
                  formatter={(value) => [`${value}`, metricConfig[activeMetric].label]}
                />
                <Line 
                  type="monotone" 
                  dataKey={activeMetric}
                  stroke={metricConfig[activeMetric].color}
                  strokeWidth={2}
                  dot={{ fill: metricConfig[activeMetric].color }}
                />
              </LineChart>
            </ResponsiveContainer>
          )}

          {/* Summary Stats */}
          <div className="text-center text-sm text-gray-600">
            Average daily calories: {averageCalories.toFixed(0)}
          </div>
        </div>
      </CardContent>
    </Card>
  );
} 