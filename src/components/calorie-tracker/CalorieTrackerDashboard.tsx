'use client';

import { useState, useEffect, useCallback } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { DailyCalorieSummary } from './DailyCalorieSummary';
import { WeeklyTrendsChart } from './WeeklyTrendsChart';
import { FoodLogManager } from './FoodLogManager';
import { AIAnalysisDisplay } from './AIAnalysisDisplay';
import PhotoUpload from './PhotoUpload';
import { 
  LayoutDashboard, 
  Plus, 
  TrendingUp, 
  History, 
  RefreshCw,
  AlertCircle
} from 'lucide-react';

interface DashboardData {
  dailySummaries: any[];
  todaySummary: any;
  userGoals: any;
  recentMeals: any[];
  goalProgress: any;
  analytics: any;
}

interface CalorieTrackerDashboardProps {
  userId: string;
}

/**
 * Main calorie tracker dashboard component that orchestrates all Phase 3 functionality.
 *
 * Provides a tabbed interface with dashboard overview, meal logging, trends analysis,
 * and meal history. Fetches dashboard data from API and manages state for all child
 * components. Handles data refresh when meals are added or updated.
 *
 * @param userId - ID of the authenticated user
 */
export function CalorieTrackerDashboard({ userId }: CalorieTrackerDashboardProps) {
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [refreshKey, setRefreshKey] = useState(0);

  // Fetch dashboard data
  const fetchDashboardData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch('/api/nutrition/dashboard?days=7', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch dashboard data: ${response.statusText}`);
      }

      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.error || 'Failed to fetch dashboard data');
      }

      setDashboardData(result.data);
    } catch (err) {
      console.error('Dashboard fetch error:', err);
      setError(err instanceof Error ? err.message : 'Unknown error occurred');
    } finally {
      setLoading(false);
    }
  }, []);

  // Initial data fetch
  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData, refreshKey]);

  // Handle data refresh when meals are updated
  const handleDataRefresh = useCallback(() => {
    setRefreshKey(prev => prev + 1);
  }, []);

  // Handle navigation to add meal tab
  const handleAddMeal = useCallback(() => {
    setActiveTab('add-meal');
  }, []);

  // Handle goal editing (placeholder for future implementation)
  const handleEditGoals = useCallback(() => {
    // TODO: Implement goal editing modal/dialog
    alert('Goal editing will be implemented in a future update');
  }, []);

  // Loading state
  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Loading Dashboard</h3>
          <p className="text-gray-600">Fetching your nutrition data...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          <div className="mb-2">Failed to load dashboard data</div>
          <div className="text-sm mb-3">{error}</div>
          <Button onClick={fetchDashboardData} size="sm" variant="outline">
            <RefreshCw className="h-4 w-4 mr-1" />
            Try Again
          </Button>
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-6">
      {/* Dashboard Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Nutrition Dashboard</h1>
          <p className="text-gray-600 mt-1">
            Track your daily nutrition and achieve your health goals
          </p>
        </div>
        <div className="flex gap-2">
          <Button onClick={handleDataRefresh} variant="outline" size="sm">
            <RefreshCw className="h-4 w-4 mr-1" />
            Refresh
          </Button>
          <Button onClick={handleAddMeal} size="sm">
            <Plus className="h-4 w-4 mr-1" />
            Add Meal
          </Button>
        </div>
      </div>

      {/* Main Dashboard Content */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="dashboard" className="flex items-center gap-2">
            <LayoutDashboard className="h-4 w-4" />
            <span className="hidden sm:inline">Dashboard</span>
          </TabsTrigger>
          <TabsTrigger value="add-meal" className="flex items-center gap-2">
            <Plus className="h-4 w-4" />
            <span className="hidden sm:inline">Add Meal</span>
          </TabsTrigger>
          <TabsTrigger value="trends" className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4" />
            <span className="hidden sm:inline">Trends</span>
          </TabsTrigger>
          <TabsTrigger value="history" className="flex items-center gap-2">
            <History className="h-4 w-4" />
            <span className="hidden sm:inline">History</span>
          </TabsTrigger>
        </TabsList>

        {/* Dashboard Tab */}
        <TabsContent value="dashboard" className="space-y-6 mt-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Daily Summary - Takes up 2 columns on large screens */}
            <div className="lg:col-span-2">
              <DailyCalorieSummary
                summary={dashboardData?.todaySummary}
                goals={dashboardData?.userGoals}
                goalProgress={dashboardData?.goalProgress}
                onEditGoals={handleEditGoals}
                onAddMeal={handleAddMeal}
              />
            </div>
            
            {/* Weekly Trends - Takes up 1 column */}
            <div>
              <WeeklyTrendsChart userId={userId} />
            </div>
          </div>

          {/* Recent Meals */}
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle>Recent Meals</CardTitle>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => setActiveTab('history')}
                >
                  View All
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {(dashboardData?.recentMeals?.length || 0) > 0 ? (
                <div className="space-y-4">
                  {dashboardData?.recentMeals?.slice(0, 3).map((meal: any) => (
                    <div key={meal.id} className="p-3 border rounded-lg">
                      <div className="flex justify-between items-start mb-2">
                        <div className="text-sm text-gray-600">
                          {new Date(meal.created_at).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                            hour: 'numeric',
                            minute: '2-digit'
                          })}
                        </div>
                        <div className="text-lg font-semibold text-orange-600">
                          {Math.round(meal.total_calories)} cal
                        </div>
                      </div>
                      
                      {meal.food_items?.length > 0 && (
                        <div className="text-sm text-gray-700">
                          {meal.food_items.slice(0, 2).map((item: any, index: number) => (
                            <span key={index}>
                              {item.name}
                              {index < meal.food_items.length - 1 && index < 1 ? ', ' : ''}
                            </span>
                          ))}
                          {meal.food_items.length > 2 && ` +${meal.food_items.length - 2} more`}
                        </div>
                      )}
                      
                      <AIAnalysisDisplay 
                        log={meal} 
                        isCompact={true}
                        className="mt-2"
                      />
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <div className="mb-2">No meals logged yet</div>
                  <Button onClick={handleAddMeal} size="sm">
                    Log your first meal
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Analytics Summary */}
          {dashboardData?.analytics && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Card>
                <CardContent className="pt-6">
                  <div className="text-2xl font-bold text-orange-600">
                    {dashboardData.analytics.avgCalories}
                  </div>
                  <p className="text-xs text-gray-600">Avg Calories/Day</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <div className="text-2xl font-bold text-blue-600">
                    {dashboardData.analytics.totalMeals}
                  </div>
                  <p className="text-xs text-gray-600">Total Meals</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <div className="text-2xl font-bold text-green-600">
                    {dashboardData.analytics.daysTracked}
                  </div>
                  <p className="text-xs text-gray-600">Days Tracked</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <div className="text-2xl font-bold text-purple-600">
                    {Math.round((dashboardData.analytics.daysTracked / 7) * 100)}%
                  </div>
                  <p className="text-xs text-gray-600">Week Complete</p>
                </CardContent>
              </Card>
            </div>
          )}
        </TabsContent>

        {/* Add Meal Tab */}
        <TabsContent value="add-meal" className="mt-6">
          <div className="max-w-2xl mx-auto">
            <PhotoUpload />
          </div>
        </TabsContent>

        {/* Trends Tab */}
        <TabsContent value="trends" className="mt-6">
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
            <WeeklyTrendsChart userId={userId} />
            
            {/* Additional trend analysis could go here */}
            <Card>
              <CardHeader>
                <CardTitle>Nutrition Insights</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4 text-sm text-gray-600">
                  <div>
                    <strong>Weekly Average:</strong> {dashboardData?.analytics?.avgCalories || 0} calories/day
                  </div>
                  <div>
                    <strong>Goal Progress:</strong> 
                    {dashboardData?.goalProgress && dashboardData.userGoals ? (
                      <span className={`ml-1 font-medium ${
                        (dashboardData.goalProgress.calories.current / dashboardData.userGoals.daily_calorie_goal) * 100 > 90
                          ? 'text-green-600' : 'text-orange-600'
                      }`}>
                        {Math.round((dashboardData.goalProgress.calories.current / dashboardData.userGoals.daily_calorie_goal) * 100)}% of daily goal
                      </span>
                    ) : (
                      <span className="ml-1">Set goals to see progress</span>
                    )}
                  </div>
                  <div>
                    <strong>Consistency:</strong> {dashboardData?.analytics?.daysTracked || 0} out of 7 days logged this week
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* History Tab */}
        <TabsContent value="history" className="mt-6">
          <FoodLogManager 
            userId={userId} 
            onLogUpdated={handleDataRefresh}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}