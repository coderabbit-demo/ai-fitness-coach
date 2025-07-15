# Phase 3 - Core Calorie Tracking Technical Implementation

## Overview

Phase 3 focuses on building the core calorie tracking dashboard and food management system. This phase assumes Phase 2 (AI Integration) is complete and we have a working pipeline for processing food images and storing nutritional data.

## Architecture Overview

```
Frontend Components (React/Next.js)
├── Dashboard Layout (/app/calorie-tracker)
├── Daily Summary Components  
├── Weekly Trends Components
├── Food Log Management
├── AI Analysis Display
└── Search & Filter System

Backend Services
├── Nutrition Data API Routes
├── Analytics Processing
├── Search Service
├── Data Aggregation Functions
└── Real-time Updates (Optional)
```

## Database Schema Enhancements

### 3.1 Daily Nutrition Summaries Table
**File**: `supabase/migrations/004_daily_nutrition_summaries.sql`

```sql
-- Create daily nutrition summaries for faster dashboard queries
CREATE TABLE daily_nutrition_summaries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    total_calories DECIMAL(8,2) DEFAULT 0,
    total_protein_g DECIMAL(6,2) DEFAULT 0,
    total_carbs_g DECIMAL(6,2) DEFAULT 0,
    total_fat_g DECIMAL(6,2) DEFAULT 0,
    total_fiber_g DECIMAL(6,2) DEFAULT 0,
    meal_count INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, date)
);

-- Enable RLS
ALTER TABLE daily_nutrition_summaries ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their own daily summaries"
    ON daily_nutrition_summaries FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own daily summaries"
    ON daily_nutrition_summaries FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own daily summaries"
    ON daily_nutrition_summaries FOR UPDATE
    USING (auth.uid() = user_id);

-- Indexes for performance
CREATE INDEX idx_daily_summaries_user_date ON daily_nutrition_summaries(user_id, date);
CREATE INDEX idx_daily_summaries_date ON daily_nutrition_summaries(date);

-- Function to update daily summaries
CREATE OR REPLACE FUNCTION update_daily_nutrition_summary()
RETURNS TRIGGER AS $$
BEGIN
    -- Update or insert daily summary
    INSERT INTO daily_nutrition_summaries (
        user_id, 
        date, 
        total_calories, 
        total_protein_g, 
        total_carbs_g, 
        total_fat_g, 
        total_fiber_g, 
        meal_count
    )
    SELECT 
        user_id,
        DATE(created_at) as date,
        SUM(total_calories) as total_calories,
        SUM(total_protein_g) as total_protein_g,
        SUM(total_carbs_g) as total_carbs_g,
        SUM(total_fat_g) as total_fat_g,
        SUM(total_fiber_g) as total_fiber_g,
        COUNT(*) as meal_count
    FROM nutrition_logs 
    WHERE user_id = COALESCE(NEW.user_id, OLD.user_id)
      AND DATE(created_at) = DATE(COALESCE(NEW.created_at, OLD.created_at))
      AND processing_status = 'completed'
    GROUP BY user_id, DATE(created_at)
    ON CONFLICT (user_id, date) 
    DO UPDATE SET
        total_calories = EXCLUDED.total_calories,
        total_protein_g = EXCLUDED.total_protein_g,
        total_carbs_g = EXCLUDED.total_carbs_g,
        total_fat_g = EXCLUDED.total_fat_g,
        total_fiber_g = EXCLUDED.total_fiber_g,
        meal_count = EXCLUDED.meal_count,
        updated_at = NOW();
    
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Trigger to update daily summaries
CREATE TRIGGER trigger_update_daily_nutrition_summary
    AFTER INSERT OR UPDATE OR DELETE ON nutrition_logs
    FOR EACH ROW
    EXECUTE FUNCTION update_daily_nutrition_summary();
```

### 3.2 User Goals and Preferences Table
**File**: `supabase/migrations/005_user_nutrition_goals.sql`

```sql
-- Create user nutrition goals and preferences
CREATE TABLE user_nutrition_goals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    daily_calorie_goal INTEGER DEFAULT 2000,
    daily_protein_goal_g DECIMAL(6,2) DEFAULT 150,
    daily_carbs_goal_g DECIMAL(6,2) DEFAULT 200,
    daily_fat_goal_g DECIMAL(6,2) DEFAULT 70,
    daily_fiber_goal_g DECIMAL(6,2) DEFAULT 25,
    activity_level TEXT DEFAULT 'moderate' CHECK (activity_level IN ('sedentary', 'light', 'moderate', 'active', 'very_active')),
    weight_goal TEXT DEFAULT 'maintain' CHECK (weight_goal IN ('lose', 'maintain', 'gain')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id)
);

-- Enable RLS
ALTER TABLE user_nutrition_goals ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their own nutrition goals"
    ON user_nutrition_goals FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own nutrition goals"
    ON user_nutrition_goals FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own nutrition goals"
    ON user_nutrition_goals FOR UPDATE
    USING (auth.uid() = user_id);

-- Index
CREATE INDEX idx_user_nutrition_goals_user_id ON user_nutrition_goals(user_id);
```

## Component Architecture

### 3.3 Main Dashboard Layout
**File**: `src/app/calorie-tracker/layout.tsx`

```typescript
import { Metadata } from 'next';
import { CalorieTrackerNavigation } from '@/components/calorie-tracker/CalorieTrackerNavigation';

export const metadata: Metadata = {
  title: 'Calorie Tracker - AI Fitness Coach',
  description: 'Track your daily nutrition with AI-powered food analysis',
};

export default function CalorieTrackerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-gray-50">
      <CalorieTrackerNavigation />
      <main className="container mx-auto px-4 py-6">
        {children}
      </main>
    </div>
  );
}
```

### 3.4 Main Dashboard Page
**File**: `src/app/calorie-tracker/page.tsx`

```typescript
import { createClient } from '@/utils/supabase/server';
import { redirect } from 'next/navigation';
import { DailyCalorieSummary } from '@/components/calorie-tracker/DailyCalorieSummary';
import { WeeklyTrendsChart } from '@/components/calorie-tracker/WeeklyTrendsChart';
import { QuickActions } from '@/components/calorie-tracker/QuickActions';
import { RecentMeals } from '@/components/calorie-tracker/RecentMeals';

export default async function CalorieTrackerPage() {
  const supabase = createClient();
  
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) {
    redirect('/login');
  }

  // Fetch today's summary
  const today = new Date().toISOString().split('T')[0];
  const { data: dailySummary } = await supabase
    .from('daily_nutrition_summaries')
    .select('*')
    .eq('user_id', user.id)
    .eq('date', today)
    .maybeSingle();

  // Fetch user goals
  const { data: userGoals } = await supabase
    .from('user_nutrition_goals')
    .select('*')
    .eq('user_id', user.id)
    .single();

  // Fetch recent meals
  const { data: recentMeals } = await supabase
    .from('nutrition_logs')
    .select('*')
    .eq('user_id', user.id)
    .eq('processing_status', 'completed')
    .order('created_at', { ascending: false })
    .limit(5);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-900">Calorie Tracker</h1>
        <QuickActions />
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Daily Summary */}
        <div className="lg:col-span-2">
          <DailyCalorieSummary 
            summary={dailySummary} 
            goals={userGoals}
          />
        </div>
        
        {/* Weekly Trends */}
        <div>
          <WeeklyTrendsChart userId={user.id} />
        </div>
      </div>

      {/* Recent Meals */}
      <RecentMeals meals={recentMeals || []} />
    </div>
  );
}
```

### 3.5 Daily Calorie Summary Component
**File**: `src/components/calorie-tracker/DailyCalorieSummary.tsx`

```typescript
'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Flame, Target, TrendingUp, TrendingDown } from 'lucide-react';

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
          Today's Nutrition
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
```

### 3.6 Weekly Trends Chart Component
**File**: `src/components/calorie-tracker/WeeklyTrendsChart.tsx`

```typescript
'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { createClient } from '@/utils/supabase/client';
import { format, subDays, startOfDay } from 'date-fns';
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
```

### 3.7 Food Log Management Component
**File**: `src/components/calorie-tracker/FoodLogManager.tsx`

```typescript
'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { createClient } from '@/utils/supabase/client';
import { format } from 'date-fns';
import { 
  Search, 
  Calendar, 
  Edit, 
  Trash2, 
  Image as ImageIcon, 
  AlertCircle,
  Check,
  X
} from 'lucide-react';

interface FoodLog {
  id: string;
  food_items: Array<{
    name: string;
    quantity: string;
    calories: number;
    protein_g: number;
    carbs_g: number;
    fat_g: number;
  }>;
  total_calories: number;
  confidence_score: number;
  image_url: string;
  notes: string;
  created_at: string;
  processing_status: string;
}

export function FoodLogManager() {
  const [logs, setLogs] = useState<FoodLog[]>([]);
  const [filteredLogs, setFilteredLogs] = useState<FoodLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [dateFilter, setDateFilter] = useState('');
  const [editingLog, setEditingLog] = useState<string | null>(null);
  const [editValues, setEditValues] = useState<Partial<FoodLog>>({});

  useEffect(() => {
    fetchLogs();
  }, []);

  useEffect(() => {
    filterLogs();
  }, [logs, searchTerm, dateFilter]);

  const fetchLogs = async () => {
    try {
      const supabase = createClient();
      const { data, error } = await supabase
        .from('nutrition_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;
      setLogs(data || []);
    } catch (error) {
      console.error('Error fetching logs:', error);
    } finally {
      setLoading(false);
    }
  };

  const filterLogs = () => {
    let filtered = logs;

    if (searchTerm) {
      filtered = filtered.filter(log => 
        log.food_items?.some(item => 
          item.name.toLowerCase().includes(searchTerm.toLowerCase())
        ) || 
        log.notes?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (dateFilter) {
      filtered = filtered.filter(log => 
        format(new Date(log.created_at), 'yyyy-MM-dd') === dateFilter
      );
    }

    setFilteredLogs(filtered);
  };

  const handleEdit = (log: FoodLog) => {
    setEditingLog(log.id);
    setEditValues({
      food_items: log.food_items,
      notes: log.notes,
    });
  };

  const handleSaveEdit = async (logId: string) => {
    try {
      const supabase = createClient();
      
      // Recalculate totals
      const totalCalories = editValues.food_items?.reduce((sum, item) => sum + item.calories, 0) || 0;
      const totalProtein = editValues.food_items?.reduce((sum, item) => sum + item.protein_g, 0) || 0;
      const totalCarbs = editValues.food_items?.reduce((sum, item) => sum + item.carbs_g, 0) || 0;
      const totalFat = editValues.food_items?.reduce((sum, item) => sum + item.fat_g, 0) || 0;

      const { error } = await supabase
        .from('nutrition_logs')
        .update({
          food_items: editValues.food_items,
          notes: editValues.notes,
          total_calories: totalCalories,
          total_protein_g: totalProtein,
          total_carbs_g: totalCarbs,
          total_fat_g: totalFat,
        })
        .eq('id', logId);

      if (error) throw error;

      setEditingLog(null);
      setEditValues({});
      fetchLogs();
    } catch (error) {
      console.error('Error updating log:', error);
    }
  };

  const handleDelete = async (logId: string) => {
    if (!confirm('Are you sure you want to delete this meal log?')) return;

    try {
      const supabase = createClient();
      const { error } = await supabase
        .from('nutrition_logs')
        .delete()
        .eq('id', logId);

      if (error) throw error;
      fetchLogs();
    } catch (error) {
      console.error('Error deleting log:', error);
    }
  };

  const getConfidenceBadge = (score: number) => {
    if (score >= 0.8) return <Badge className="bg-green-100 text-green-800">High</Badge>;
    if (score >= 0.6) return <Badge className="bg-yellow-100 text-yellow-800">Medium</Badge>;
    return <Badge className="bg-red-100 text-red-800">Low</Badge>;
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Food Log Management</CardTitle>
        </CardHeader>
        <CardContent>
          {/* Filters */}
          <div className="flex gap-4 mb-6">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search food items..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="relative">
              <Calendar className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Input
                type="date"
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          {/* Food Logs */}
          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredLogs.map((log) => (
                <Card key={log.id} className="border-l-4 border-blue-500">
                  <CardContent className="p-4">
                    <div className="flex justify-between items-start mb-3">
                      <div className="flex items-center gap-3">
                        <div className="text-sm text-gray-500">
                          {format(new Date(log.created_at), 'MMM d, yyyy • h:mm a')}
                        </div>
                        {getConfidenceBadge(log.confidence_score)}
                        {log.processing_status === 'pending' && (
                          <Badge className="bg-blue-100 text-blue-800">Processing</Badge>
                        )}
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEdit(log)}
                          disabled={editingLog === log.id}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDelete(log.id)}
                          className="text-red-600 hover:text-red-800"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>

                    {/* Food Items */}
                    <div className="space-y-2 mb-3">
                      {editingLog === log.id ? (
                        <div className="space-y-2">
                          {editValues.food_items?.map((item, index) => (
                            <div key={index} className="grid grid-cols-5 gap-2 text-sm">
                              <Input
                                value={item.name}
                                onChange={(e) => {
                                  const newItems = [...(editValues.food_items || [])];
                                  newItems[index].name = e.target.value;
                                  setEditValues({ ...editValues, food_items: newItems });
                                }}
                                placeholder="Food name"
                              />
                              <Input
                                value={item.quantity}
                                onChange={(e) => {
                                  const newItems = [...(editValues.food_items || [])];
                                  newItems[index].quantity = e.target.value;
                                  setEditValues({ ...editValues, food_items: newItems });
                                }}
                                placeholder="Quantity"
                              />
                              <Input
                                type="number"
                                value={item.calories}
                                onChange={(e) => {
                                  const newItems = [...(editValues.food_items || [])];
                                  newItems[index].calories = parseInt(e.target.value) || 0;
                                  setEditValues({ ...editValues, food_items: newItems });
                                }}
                                placeholder="Calories"
                              />
                              <Input
                                type="number"
                                value={item.protein_g}
                                onChange={(e) => {
                                  const newItems = [...(editValues.food_items || [])];
                                  newItems[index].protein_g = parseFloat(e.target.value) || 0;
                                  setEditValues({ ...editValues, food_items: newItems });
                                }}
                                placeholder="Protein"
                              />
                              <div className="text-gray-600">
                                C: {item.carbs_g}g | F: {item.fat_g}g
                              </div>
                            </div>
                          ))}
                          <div className="flex gap-2 mt-2">
                            <Button
                              size="sm"
                              onClick={() => handleSaveEdit(log.id)}
                              className="bg-green-500 hover:bg-green-600"
                            >
                              <Check className="h-4 w-4 mr-1" />
                              Save
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => setEditingLog(null)}
                            >
                              <X className="h-4 w-4 mr-1" />
                              Cancel
                            </Button>
                          </div>
                        </div>
                      ) : (
                        log.food_items?.map((item, index) => (
                          <div key={index} className="flex justify-between items-center p-2 bg-gray-50 rounded">
                            <div>
                              <span className="font-medium">{item.name}</span>
                              <span className="text-gray-500 ml-2">({item.quantity})</span>
                            </div>
                            <div className="text-sm text-gray-600">
                              {item.calories} cal | P: {item.protein_g}g | C: {item.carbs_g}g | F: {item.fat_g}g
                            </div>
                          </div>
                        ))
                      )}
                    </div>

                    {/* Total Calories */}
                    <div className="flex justify-between items-center font-semibold text-lg">
                      <span>Total Calories:</span>
                      <span className="text-orange-600">{log.total_calories}</span>
                    </div>

                    {/* Notes */}
                    {log.notes && (
                      <div className="mt-3 p-2 bg-blue-50 rounded">
                        <div className="text-sm text-gray-600">Notes:</div>
                        <div className="text-sm">{log.notes}</div>
                      </div>
                    )}

                    {/* Image */}
                    {log.image_url && (
                      <div className="mt-3">
                        <img 
                          src={log.image_url} 
                          alt="Meal" 
                          className="w-32 h-32 object-cover rounded-lg cursor-pointer hover:opacity-80"
                          onClick={() => window.open(log.image_url, '_blank')}
                        />
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
```

### 3.8 AI Analysis Display Component
**File**: `src/components/calorie-tracker/AIAnalysisDisplay.tsx`

```typescript
'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { 
  Brain, 
  CheckCircle, 
  AlertTriangle, 
  RefreshCw,
  Eye,
  TrendingUp,
  Info
} from 'lucide-react';

interface AIAnalysisProps {
  log: {
    id: string;
    confidence_score: number;
    processing_status: string;
    food_items: Array<{
      name: string;
      quantity: string;
      calories: number;
      protein_g: number;
      carbs_g: number;
      fat_g: number;
    }>;
    notes: string;
    image_url: string;
    error_message?: string;
  };
  onReprocess?: (logId: string) => void;
  onCorrect?: (logId: string) => void;
}

export function AIAnalysisDisplay({ log, onReprocess, onCorrect }: AIAnalysisProps) {
  const getConfidenceColor = (score: number) => {
    if (score >= 0.8) return 'bg-green-500';
    if (score >= 0.6) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  const getConfidenceText = (score: number) => {
    if (score >= 0.8) return 'High Confidence';
    if (score >= 0.6) return 'Medium Confidence';
    return 'Low Confidence';
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'processing':
        return <RefreshCw className="h-4 w-4 text-blue-500 animate-spin" />;
      case 'failed':
        return <AlertTriangle className="h-4 w-4 text-red-500" />;
      default:
        return <RefreshCw className="h-4 w-4 text-gray-500" />;
    }
  };

  return (
    <Card className="border-l-4 border-l-blue-500">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Brain className="h-5 w-5 text-blue-600" />
          AI Analysis
          {getStatusIcon(log.processing_status)}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Processing Status */}
        {log.processing_status === 'processing' && (
          <div className="flex items-center gap-2 text-blue-600">
            <RefreshCw className="h-4 w-4 animate-spin" />
            <span>Analyzing image...</span>
          </div>
        )}

        {log.processing_status === 'failed' && (
          <div className="p-3 bg-red-50 rounded-lg">
            <div className="flex items-center gap-2 text-red-700 mb-2">
              <AlertTriangle className="h-4 w-4" />
              <span className="font-medium">Analysis Failed</span>
            </div>
            {log.error_message && (
              <p className="text-sm text-red-600 mb-2">{log.error_message}</p>
            )}
            <Button 
              size="sm" 
              onClick={() => onReprocess?.(log.id)}
              className="bg-red-500 hover:bg-red-600"
            >
              <RefreshCw className="h-4 w-4 mr-1" />
              Try Again
            </Button>
          </div>
        )}

        {/* Confidence Score */}
        {log.processing_status === 'completed' && (
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium">Confidence Score</span>
              <Badge className={`${getConfidenceColor(log.confidence_score)} text-white`}>
                {getConfidenceText(log.confidence_score)}
              </Badge>
            </div>
            <Progress 
              value={log.confidence_score * 100} 
              className="h-2"
            />
            <div className="text-xs text-gray-500">
              {(log.confidence_score * 100).toFixed(1)}% confidence
            </div>
          </div>
        )}

        {/* Food Items Analysis */}
        {log.food_items && log.food_items.length > 0 && (
          <div className="space-y-2">
            <h4 className="font-medium text-sm flex items-center gap-2">
              <Eye className="h-4 w-4" />
              Detected Food Items
            </h4>
            <div className="space-y-2">
              {log.food_items.map((item, index) => (
                <div key={index} className="p-2 bg-gray-50 rounded flex justify-between items-center">
                  <div>
                    <span className="font-medium">{item.name}</span>
                    <span className="text-gray-500 ml-2">({item.quantity})</span>
                  </div>
                  <div className="text-sm font-medium text-orange-600">
                    {item.calories} cal
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Analysis Notes */}
        {log.notes && (
          <div className="p-3 bg-blue-50 rounded-lg">
            <div className="flex items-center gap-2 text-blue-700 mb-2">
              <Info className="h-4 w-4" />
              <span className="font-medium">AI Notes</span>
            </div>
            <p className="text-sm text-blue-600">{log.notes}</p>
          </div>
        )}

        {/* Action Buttons */}
        {log.processing_status === 'completed' && (
          <div className="flex gap-2 pt-2">
            <Button 
              size="sm" 
              variant="outline"
              onClick={() => onCorrect?.(log.id)}
            >
              <Eye className="h-4 w-4 mr-1" />
              Correct Analysis
            </Button>
            <Button 
              size="sm" 
              variant="outline"
              onClick={() => onReprocess?.(log.id)}
            >
              <RefreshCw className="h-4 w-4 mr-1" />
              Reprocess
            </Button>
          </div>
        )}

        {/* Confidence Tips */}
        {log.confidence_score < 0.7 && log.processing_status === 'completed' && (
          <div className="p-3 bg-yellow-50 rounded-lg">
            <div className="flex items-center gap-2 text-yellow-700 mb-2">
              <TrendingUp className="h-4 w-4" />
              <span className="font-medium">Tips for Better Results</span>
            </div>
            <ul className="text-sm text-yellow-600 space-y-1">
              <li>• Ensure good lighting when taking photos</li>
              <li>• Include the entire meal in the frame</li>
              <li>• Avoid heavily processed or mixed foods</li>
              <li>• Take photos from directly above the food</li>
            </ul>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
```

## API Routes

### 3.9 Nutrition Dashboard API
**File**: `src/app/api/nutrition/dashboard/route.ts`

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { format, subDays } from 'date-fns';

export async function GET(request: NextRequest) {
  try {
    const supabase = createClient();
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
    const totalCalories = dailySummaries?.reduce((sum, day) => sum + (day.total_calories || 0), 0) || 0;
    const avgCalories = dailySummaries?.length ? totalCalories / dailySummaries.length : 0;
    const mealCount = dailySummaries?.reduce((sum, day) => sum + (day.meal_count || 0), 0) || 0;

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
```

### 3.10 Nutrition Goals API
**File**: `src/app/api/nutrition/goals/route.ts`

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';

export async function GET(request: NextRequest) {
  try {
    const supabase = createClient();
    
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
    const supabase = createClient();
    
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
```

## Implementation Timeline

### Week 1: Database & Core Components
- [ ] Create database migrations (daily_nutrition_summaries, user_nutrition_goals)
- [ ] Build DailyCalorieSummary component
- [ ] Create basic dashboard layout
- [ ] Set up nutrition goals API

### Week 2: Advanced Components & Features
- [ ] Implement WeeklyTrendsChart with recharts
- [ ] Build FoodLogManager with edit/delete functionality
- [ ] Create AIAnalysisDisplay component
- [ ] Add search and filter functionality

### Week 3: API Integration & Testing
- [ ] Complete dashboard API endpoints
- [ ] Add nutrition goals management
- [ ] Implement real-time updates
- [ ] Write comprehensive tests

### Week 4: UI Polish & Optimization
- [ ] Mobile responsiveness
- [ ] Loading states and error handling
- [ ] Performance optimization
- [ ] User experience improvements

## Testing Strategy

### Unit Tests
- Component rendering and user interactions
- API route functionality
- Database trigger functions
- Utility functions

### Integration Tests
- Dashboard data flow
- CRUD operations on food logs
- Goal setting and progress tracking
- AI analysis display

### Performance Tests
- Chart rendering with large datasets
- Database query optimization
- Image loading and caching
- Mobile responsiveness

## Next Steps

After Phase 3 completion, the app will have:
- ✅ Complete calorie tracking dashboard
- ✅ Food log management system
- ✅ AI analysis visualization
- ✅ Goal setting and progress tracking
- ✅ Weekly trend analysis

This sets up perfectly for Phase 4 (Mobile Experience) and Phase 5 (Advanced Features). 