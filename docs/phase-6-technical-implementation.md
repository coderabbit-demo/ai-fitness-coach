# Phase 6: Protected UI Integration - Technical Implementation Plan

## Overview

Phase 6 focuses on creating a protected application structure (`/app/*` routes) that consolidates the calorie tracking functionality with existing features like user profiles and weight management. This phase transforms the current public-facing application into a secure, authenticated user experience.

## Current State Analysis

### ✅ Existing Infrastructure
- **Authentication**: Supabase Auth with comprehensive middleware
- **Logging**: Winston-based system with privacy masking
- **Database**: `nutrition_logs` table ready for calorie tracking
- **UI Components**: shadcn/ui with dashboard preview components
- **Middleware**: Session management with `updateSession` function

### ✅ Available Components
- `WeightProgressChart`, `CalorieIntakeChart`, `MoodSleepChart` in `dashboard-preview.tsx`
- Comprehensive UI library (`Button`, `Card`, `Input`, `Label`, etc.)
- Weight conversion utilities with unit preferences

### ❌ Missing Components
- Protected route structure
- Calorie tracking dashboard
- Photo upload component
- Unified navigation system
- Authentication middleware for `/app/*` routes

## Technical Architecture

### Protected Route Structure
```
src/app/
├── layout.tsx              # Public layout
├── page.tsx               # Public homepage
├── login/                 # Public auth routes
├── reset-password/        # Public auth routes
└── app/                   # Protected routes
    ├── layout.tsx         # Protected layout with auth check
    ├── page.tsx          # Main dashboard
    ├── profile/          # Migrated profile page
    ├── calorie-tracker/  # Calorie tracking features
    ├── weight-tracking/  # Weight management (future)
    └── insights/         # AI insights (future)
```

### Authentication Flow
```
Public Route → Middleware → updateSession → Continue
Protected Route → Middleware → updateSession → Auth Check → Continue or Redirect
```

## Implementation Steps

### Step 1: Create Protected Route Structure

#### 1.1 Create App Layout with Authentication

**File**: `src/app/app/layout.tsx`

```typescript
import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import { AppNavigation } from '@/components/app/navigation'
import { Toaster } from '@/components/ui/toaster'

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()
  
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <AppNavigation user={user} />
      <main className="container mx-auto px-4 py-8">
        {children}
      </main>
      <Toaster />
    </div>
  )
}
```

#### 1.2 Create Protected App Navigation

**File**: `src/components/app/navigation.tsx`

```typescript
"use client"

import { useState } from 'react'
import { User } from '@supabase/supabase-js'
import { useRouter } from 'next/navigation'
import { createClient } from '@/utils/supabase/client'
import { Button } from '@/components/ui/button'
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu'
import { 
  Activity, 
  Camera, 
  User as UserIcon, 
  LineChart, 
  Settings, 
  LogOut 
} from 'lucide-react'
import Link from 'next/link'
import { logAuthEvent } from '@/lib/logger'

interface AppNavigationProps {
  user: User
}

export function AppNavigation({ user }: AppNavigationProps) {
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()

  const handleSignOut = async () => {
    setIsLoading(true)
    const supabase = createClient()
    
    logAuthEvent('logout_attempt', user.id)
    
    const { error } = await supabase.auth.signOut()
    if (error) {
      console.error('Sign out error:', error)
    } else {
      logAuthEvent('logout_success', user.id)
      router.push('/')
    }
    setIsLoading(false)
  }

  return (
    <nav className="bg-white shadow-sm border-b">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-8">
            <Link href="/app" className="text-xl font-bold text-blue-600">
              AI Fitness Coach
            </Link>
            
            <div className="hidden md:flex items-center space-x-6">
              <Link href="/app" className="flex items-center space-x-2 text-gray-700 hover:text-blue-600">
                <Activity className="w-4 h-4" />
                <span>Dashboard</span>
              </Link>
              <Link href="/app/calorie-tracker" className="flex items-center space-x-2 text-gray-700 hover:text-blue-600">
                <Camera className="w-4 h-4" />
                <span>Calorie Tracker</span>
              </Link>
              <Link href="/app/profile" className="flex items-center space-x-2 text-gray-700 hover:text-blue-600">
                <UserIcon className="w-4 h-4" />
                <span>Profile</span>
              </Link>
            </div>
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                <UserIcon className="h-5 w-5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem>
                <span className="font-medium">{user.email}</span>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href="/app/profile">
                  <Settings className="mr-2 h-4 w-4" />
                  Settings
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem 
                onClick={handleSignOut} 
                disabled={isLoading}
              >
                <LogOut className="mr-2 h-4 w-4" />
                {isLoading ? 'Signing out...' : 'Sign out'}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </nav>
  )
}
```

#### 1.3 Create Main Dashboard Page

**File**: `src/app/app/page.tsx`

```typescript
import { createClient } from '@/utils/supabase/server'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
  WeightProgressChart, 
  CalorieIntakeChart, 
  MoodSleepChart 
} from '@/components/dashboard-preview'
import { Camera, Target, TrendingUp, Calendar } from 'lucide-react'
import Link from 'next/link'

export default async function AppDashboard() {
  const supabase = await createClient()
  
  const {
    data: { user },
  } = await supabase.auth.getUser()

  // Fetch user profile and recent data
  const [profileResult, recentNutritionResult] = await Promise.all([
    supabase
      .from('user_profiles')
      .select('*')
      .eq('id', user!.id)
      .single(),
    supabase
      .from('nutrition_logs')
      .select('*')
      .eq('user_id', user!.id)
      .order('created_at', { ascending: false })
      .limit(5)
  ])

  const profile = profileResult.data
  const recentNutrition = recentNutritionResult.data || []

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            Welcome back, {profile?.full_name || user?.email}!
          </h1>
          <p className="text-gray-600 mt-2">
            Track your health journey with AI-powered insights
          </p>
        </div>
        <Button asChild>
          <Link href="/app/calorie-tracker">
            <Camera className="w-4 h-4 mr-2" />
            Log Meal
          </Link>
        </Button>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Today's Calories</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {recentNutrition.length > 0 ? 
                recentNutrition
                  .filter(log => {
                    const today = new Date().toDateString()
                    const logDate = new Date(log.created_at).toDateString()
                    return today === logDate
                  })
                  .reduce((sum, log) => sum + (log.total_calories || 0), 0)
                : 0
              }
            </div>
            <p className="text-xs text-gray-500 mt-1">
              {recentNutrition.length} meals logged
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Current Weight</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {profile?.weight_kg ? `${profile.weight_kg} kg` : 'Not set'}
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Target: {profile?.weight_kg ? `${profile.weight_kg - 5} kg` : 'Set target'}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Fitness Goals</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-1">
              {profile?.fitness_goals && profile.fitness_goals.length > 0 ? (
                profile.fitness_goals.slice(0, 2).map((goal: string) => (
                  <Badge key={goal} variant="outline" className="text-xs">
                    {goal}
                  </Badge>
                ))
              ) : (
                <span className="text-sm text-gray-500">None set</span>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <WeightProgressChart />
        </div>
        <div className="space-y-6">
          <CalorieIntakeChart />
          <MoodSleepChart />
        </div>
      </div>

      {/* Recent Meals */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="w-5 h-5" />
            Recent Meals
          </CardTitle>
          <CardDescription>
            Your latest food logging activity
          </CardDescription>
        </CardHeader>
        <CardContent>
          {recentNutrition.length > 0 ? (
            <div className="space-y-4">
              {recentNutrition.map((log) => (
                <div key={log.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center space-x-3">
                    {log.image_url && (
                      <img 
                        src={log.image_url} 
                        alt="Meal" 
                        className="w-12 h-12 rounded-lg object-cover"
                      />
                    )}
                    <div>
                      <p className="font-medium">
                        {log.food_items ? 
                          typeof log.food_items === 'string' ? 
                            log.food_items : 
                            JSON.stringify(log.food_items)
                          : 'Meal'
                        }
                      </p>
                      <p className="text-sm text-gray-500">
                        {new Date(log.created_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-medium">{log.total_calories || 0} cal</p>
                    {log.confidence_score && (
                      <p className="text-xs text-gray-500">
                        {Math.round(log.confidence_score * 100)}% confident
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <Camera className="w-12 h-12 mx-auto text-gray-400 mb-4" />
              <p className="text-gray-500 mb-4">No meals logged yet</p>
              <Button asChild>
                <Link href="/app/calorie-tracker">
                  Log Your First Meal
                </Link>
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
```

### Step 2: Migrate Profile Page

#### 2.1 Move Profile Page to Protected Route

**Action**: Move `src/app/profile/` to `src/app/app/profile/`

**Files to move**:
- `src/app/profile/page.tsx` → `src/app/app/profile/page.tsx`
- `src/app/profile/__tests__/page.test.tsx` → `src/app/app/profile/__tests__/page.test.tsx`

#### 2.2 Update Profile Page for Protected Context

**File**: `src/app/app/profile/page.tsx`

```typescript
// Remove the client-side auth check since it's now handled by layout
// Remove: router.push('/login') redirects
// Remove: user authentication logic (now passed as prop or from server)
// Keep: All existing profile functionality

"use client"

import type React from "react"
import { useState, useEffect, useCallback } from "react"
import { createClient } from "@/utils/supabase/client"
// ... rest of imports remain the same

// Remove the router.push('/login') calls since auth is handled by layout
// The component can assume user is authenticated

export default function ProfilePage() {
  // ... existing state and logic, but remove auth redirects
  
  const fetchProfile = useCallback(async () => {
    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()

      // Remove the auth check since layout handles it
      // if (!user) {
      //   router.push('/login')
      //   return
      // }

      const { data, error } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('id', user!.id)
        .single()

      // ... rest of the logic remains the same
    } catch (error) {
      logError(error, 'Error fetching profile')
      setMessage({ type: "error", text: "An unexpected error occurred" })
    } finally {
      setLoading(false)
    }
  }, []) // Remove router dependency

  // ... rest of the component remains the same
}
```

### Step 3: Create Calorie Tracker Feature

#### 3.1 Calorie Tracker Main Page

**File**: `src/app/app/calorie-tracker/page.tsx`

```typescript
import { createClient } from '@/utils/supabase/server'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { PhotoUpload } from '@/components/calorie-tracker/photo-upload'
import { MealLog } from '@/components/calorie-tracker/meal-log'
import { NutritionSummary } from '@/components/calorie-tracker/nutrition-summary'
import { Camera, Target, TrendingUp } from 'lucide-react'

export default async function CalorieTracker() {
  const supabase = await createClient()
  
  const {
    data: { user },
  } = await supabase.auth.getUser()

  // Fetch recent nutrition logs
  const { data: nutritionLogs } = await supabase
    .from('nutrition_logs')
    .select('*')
    .eq('user_id', user!.id)
    .order('created_at', { ascending: false })
    .limit(10)

  // Fetch today's nutrition summary
  const today = new Date().toISOString().split('T')[0]
  const { data: todayNutrition } = await supabase
    .from('nutrition_logs')
    .select('*')
    .eq('user_id', user!.id)
    .gte('created_at', `${today}T00:00:00`)
    .lte('created_at', `${today}T23:59:59`)

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Calorie Tracker</h1>
          <p className="text-gray-600 mt-2">
            Track your meals with AI-powered nutrition analysis
          </p>
        </div>
      </div>

      {/* Photo Upload Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Camera className="w-5 h-5" />
            Log New Meal
          </CardTitle>
          <CardDescription>
            Take a photo of your meal for instant nutrition analysis
          </CardDescription>
        </CardHeader>
        <CardContent>
          <PhotoUpload />
        </CardContent>
      </Card>

      {/* Today's Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="w-5 h-5" />
            Today's Nutrition
          </CardTitle>
        </CardHeader>
        <CardContent>
          <NutritionSummary data={todayNutrition || []} />
        </CardContent>
      </Card>

      {/* Recent Meals */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5" />
            Recent Meals
          </CardTitle>
          <CardDescription>
            Your meal logging history
          </CardDescription>
        </CardHeader>
        <CardContent>
          <MealLog data={nutritionLogs || []} />
        </CardContent>
      </Card>
    </div>
  )
}
```

#### 3.2 Photo Upload Component

**File**: `src/components/calorie-tracker/photo-upload.tsx`

```typescript
"use client"

import { useState, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { createClient } from '@/utils/supabase/client'
import { Camera, Upload, X, Loader2 } from 'lucide-react'
import { logError } from '@/lib/logger'

export function PhotoUpload() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [preview, setPreview] = useState<string | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        setMessage({ type: 'error', text: 'Please select an image file' })
        return
      }

      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        setMessage({ type: 'error', text: 'Image must be less than 5MB' })
        return
      }

      setSelectedFile(file)
      setMessage(null)

      // Create preview
      const reader = new FileReader()
      reader.onload = (e) => {
        setPreview(e.target?.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const handleUpload = async () => {
    if (!selectedFile) return

    setIsUploading(true)
    setMessage(null)

    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()

      if (!user) {
        throw new Error('User not authenticated')
      }

      // Upload image to Supabase Storage
      const fileExt = selectedFile.name.split('.').pop()
      const fileName = `${user.id}/${Date.now()}.${fileExt}`
      
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('meal-images')
        .upload(fileName, selectedFile)

      if (uploadError) {
        throw uploadError
      }

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('meal-images')
        .getPublicUrl(fileName)

      // Create nutrition log entry (will be processed by AI later)
      const { data: nutritionLog, error: logError } = await supabase
        .from('nutrition_logs')
        .insert({
          user_id: user.id,
          image_url: publicUrl,
          food_items: null, // Will be populated by AI
          total_calories: null, // Will be populated by AI
          confidence_score: null, // Will be populated by AI
          notes: 'Processing...'
        })
        .select()
        .single()

      if (logError) {
        throw logError
      }

      // TODO: Trigger AI processing via Inngest
      // This would be implemented in Phase 2 of the project
      console.log('Nutrition log created:', nutritionLog)

      setMessage({ 
        type: 'success', 
        text: 'Image uploaded successfully! AI analysis will be available soon.' 
      })
      
      // Reset form
      setSelectedFile(null)
      setPreview(null)
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }

    } catch (error) {
      logError(error, 'photo_upload')
      setMessage({ 
        type: 'error', 
        text: 'Failed to upload image. Please try again.' 
      })
    } finally {
      setIsUploading(false)
    }
  }

  const handleCancel = () => {
    setSelectedFile(null)
    setPreview(null)
    setMessage(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  return (
    <div className="space-y-6">
      {/* File Input */}
      <div className="grid w-full max-w-sm items-center gap-1.5">
        <Label htmlFor="meal-photo">Meal Photo</Label>
        <Input
          id="meal-photo"
          type="file"
          accept="image/*"
          onChange={handleFileSelect}
          ref={fileInputRef}
          disabled={isUploading}
        />
      </div>

      {/* Preview */}
      {preview && (
        <div className="relative">
          <img 
            src={preview} 
            alt="Meal preview" 
            className="w-full max-w-md h-64 object-cover rounded-lg border"
          />
          <Button
            variant="destructive"
            size="sm"
            className="absolute top-2 right-2"
            onClick={handleCancel}
            disabled={isUploading}
          >
            <X className="w-4 h-4" />
          </Button>
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-4">
        <Button
          onClick={handleUpload}
          disabled={!selectedFile || isUploading}
          className="flex-1 max-w-sm"
        >
          {isUploading ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Uploading...
            </>
          ) : (
            <>
              <Upload className="w-4 h-4 mr-2" />
              Upload & Analyze
            </>
          )}
        </Button>
        
        {selectedFile && (
          <Button 
            variant="outline" 
            onClick={handleCancel}
            disabled={isUploading}
          >
            Cancel
          </Button>
        )}
      </div>

      {/* Messages */}
      {message && (
        <Alert className={message.type === 'error' ? 'border-red-200 bg-red-50' : 'border-green-200 bg-green-50'}>
          <AlertDescription className={message.type === 'error' ? 'text-red-800' : 'text-green-800'}>
            {message.text}
          </AlertDescription>
        </Alert>
      )}
    </div>
  )
}
```

#### 3.3 Nutrition Summary Component

**File**: `src/components/calorie-tracker/nutrition-summary.tsx`

```typescript
"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { Zap, Target, TrendingUp, Award } from 'lucide-react'

interface NutritionLog {
  id: string
  total_calories: number | null
  total_protein_g: number | null
  total_carbs_g: number | null
  total_fat_g: number | null
  total_fiber_g: number | null
  confidence_score: number | null
  created_at: string
}

interface NutritionSummaryProps {
  data: NutritionLog[]
}

export function NutritionSummary({ data }: NutritionSummaryProps) {
  // Calculate totals
  const totals = data.reduce((acc, log) => ({
    calories: acc.calories + (log.total_calories || 0),
    protein: acc.protein + (log.total_protein_g || 0),
    carbs: acc.carbs + (log.total_carbs_g || 0),
    fat: acc.fat + (log.total_fat_g || 0),
    fiber: acc.fiber + (log.total_fiber_g || 0)
  }), { calories: 0, protein: 0, carbs: 0, fat: 0, fiber: 0 })

  // Example daily targets (these would come from user preferences)
  const targets = {
    calories: 2000,
    protein: 150,
    carbs: 250,
    fat: 65,
    fiber: 25
  }

  const getProgressColor = (current: number, target: number) => {
    const percentage = (current / target) * 100
    if (percentage < 50) return 'bg-red-500'
    if (percentage < 80) return 'bg-yellow-500'
    if (percentage <= 100) return 'bg-green-500'
    return 'bg-orange-500'
  }

  const getProgressPercentage = (current: number, target: number) => {
    return Math.min((current / target) * 100, 100)
  }

  if (data.length === 0) {
    return (
      <div className="text-center py-8">
        <Zap className="w-12 h-12 mx-auto text-gray-400 mb-4" />
        <p className="text-gray-500">No meals logged today</p>
        <p className="text-sm text-gray-400">Start logging meals to see your nutrition summary</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Main Calorie Progress */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2">
            <Target className="w-5 h-5" />
            Daily Calorie Goal
          </CardTitle>
          <CardDescription>
            {totals.calories} / {targets.calories} calories
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Progress</span>
              <span>{Math.round(getProgressPercentage(totals.calories, targets.calories))}%</span>
            </div>
            <Progress 
              value={getProgressPercentage(totals.calories, targets.calories)} 
              className="h-3"
            />
            <div className="flex justify-between text-xs text-gray-500">
              <span>Remaining: {Math.max(0, targets.calories - totals.calories)} cal</span>
              <span>{data.length} meals logged</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Macronutrient Breakdown */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Protein</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-xl font-bold">{Math.round(totals.protein)}g</div>
            <Progress 
              value={getProgressPercentage(totals.protein, targets.protein)} 
              className="h-2 mt-2"
            />
            <div className="text-xs text-gray-500 mt-1">
              Goal: {targets.protein}g
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Carbs</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-xl font-bold">{Math.round(totals.carbs)}g</div>
            <Progress 
              value={getProgressPercentage(totals.carbs, targets.carbs)} 
              className="h-2 mt-2"
            />
            <div className="text-xs text-gray-500 mt-1">
              Goal: {targets.carbs}g
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Fat</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-xl font-bold">{Math.round(totals.fat)}g</div>
            <Progress 
              value={getProgressPercentage(totals.fat, targets.fat)} 
              className="h-2 mt-2"
            />
            <div className="text-xs text-gray-500 mt-1">
              Goal: {targets.fat}g
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Fiber</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-xl font-bold">{Math.round(totals.fiber)}g</div>
            <Progress 
              value={getProgressPercentage(totals.fiber, targets.fiber)} 
              className="h-2 mt-2"
            />
            <div className="text-xs text-gray-500 mt-1">
              Goal: {targets.fiber}g
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Achievements */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2">
            <Award className="w-5 h-5" />
            Today's Achievements
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {getProgressPercentage(totals.protein, targets.protein) >= 80 && (
              <Badge variant="secondary">Protein Goal Met</Badge>
            )}
            {getProgressPercentage(totals.fiber, targets.fiber) >= 80 && (
              <Badge variant="secondary">Fiber Goal Met</Badge>
            )}
            {data.length >= 3 && (
              <Badge variant="secondary">3+ Meals Logged</Badge>
            )}
            {data.every(log => log.confidence_score && log.confidence_score > 0.7) && (
              <Badge variant="secondary">High Accuracy Day</Badge>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
```

#### 3.4 Meal Log Component

**File**: `src/components/calorie-tracker/meal-log.tsx`

```typescript
"use client"

import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import { createClient } from '@/utils/supabase/client'
import { Trash2, Eye, Clock } from 'lucide-react'
import { useState } from 'react'
import { logError } from '@/lib/logger'

interface NutritionLog {
  id: string
  food_items: any
  total_calories: number | null
  total_protein_g: number | null
  total_carbs_g: number | null
  total_fat_g: number | null
  image_url: string | null
  confidence_score: number | null
  notes: string | null
  created_at: string
}

interface MealLogProps {
  data: NutritionLog[]
}

export function MealLog({ data }: MealLogProps) {
  const [deletingId, setDeletingId] = useState<string | null>(null)

  const handleDelete = async (id: string) => {
    setDeletingId(id)
    try {
      const supabase = createClient()
      const { error } = await supabase
        .from('nutrition_logs')
        .delete()
        .eq('id', id)

      if (error) {
        throw error
      }

      // Refresh the page to update the list
      window.location.reload()
    } catch (error) {
      logError(error, 'meal_log_delete')
    } finally {
      setDeletingId(null)
    }
  }

  const formatFoodItems = (items: any): string => {
    if (!items) return 'Unknown food'
    if (typeof items === 'string') return items
    if (Array.isArray(items)) return items.join(', ')
    return JSON.stringify(items)
  }

  const getConfidenceColor = (score: number | null) => {
    if (!score) return 'bg-gray-500'
    if (score >= 0.8) return 'bg-green-500'
    if (score >= 0.6) return 'bg-yellow-500'
    return 'bg-red-500'
  }

  if (data.length === 0) {
    return (
      <div className="text-center py-8">
        <Clock className="w-12 h-12 mx-auto text-gray-400 mb-4" />
        <p className="text-gray-500">No meals logged yet</p>
        <p className="text-sm text-gray-400">Your meal history will appear here</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {data.map((log) => (
        <Card key={log.id}>
          <CardContent className="p-4">
            <div className="flex items-start gap-4">
              {/* Meal Image */}
              {log.image_url && (
                <img 
                  src={log.image_url} 
                  alt="Meal" 
                  className="w-20 h-20 rounded-lg object-cover flex-shrink-0"
                />
              )}
              
              {/* Meal Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h3 className="font-medium text-gray-900 truncate">
                      {formatFoodItems(log.food_items)}
                    </h3>
                    <p className="text-sm text-gray-500">
                      {new Date(log.created_at).toLocaleDateString('en-US', {
                        weekday: 'short',
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </p>
                  </div>
                  
                  {/* Actions */}
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="ghost" size="sm">
                          <Trash2 className="w-4 h-4 text-red-500" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Delete Meal Log</AlertDialogTitle>
                          <AlertDialogDescription>
                            Are you sure you want to delete this meal log? This action cannot be undone.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction 
                            onClick={() => handleDelete(log.id)}
                            disabled={deletingId === log.id}
                          >
                            {deletingId === log.id ? 'Deleting...' : 'Delete'}
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </div>
                
                {/* Nutrition Info */}
                <div className="mt-3 flex items-center gap-4 text-sm">
                  <span className="font-medium">
                    {log.total_calories || 0} cal
                  </span>
                  {log.total_protein_g && (
                    <span className="text-gray-600">
                      {Math.round(log.total_protein_g)}g protein
                    </span>
                  )}
                  {log.total_carbs_g && (
                    <span className="text-gray-600">
                      {Math.round(log.total_carbs_g)}g carbs
                    </span>
                  )}
                  {log.total_fat_g && (
                    <span className="text-gray-600">
                      {Math.round(log.total_fat_g)}g fat
                    </span>
                  )}
                </div>
                
                {/* Confidence Score & Notes */}
                <div className="mt-2 flex items-center gap-2">
                  {log.confidence_score && (
                    <Badge 
                      variant="outline" 
                      className={`text-xs ${getConfidenceColor(log.confidence_score)}`}
                    >
                      {Math.round(log.confidence_score * 100)}% confident
                    </Badge>
                  )}
                  {log.notes && log.notes !== 'Processing...' && (
                    <span className="text-xs text-gray-500 truncate">
                      {log.notes}
                    </span>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
```

### Step 4: Update Middleware for Protected Routes

#### 4.1 Enhanced Middleware Configuration

**File**: `middleware.ts`

```typescript
import { type NextRequest, NextResponse } from 'next/server'
import { updateSession } from '@/utils/supabase/middleware'

export async function middleware(request: NextRequest) {
  const response = await updateSession(request)
  
  // Check if the request is for a protected route
  if (request.nextUrl.pathname.startsWith('/app')) {
    // Let the updateSession handle the auth check
    // If user is not authenticated, updateSession will redirect to login
    return response
  }
  
  return response
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - images and other static assets
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
```

#### 4.2 Enhanced updateSession Function

**File**: `src/utils/supabase/middleware.ts`

```typescript
import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({
            request,
          })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // Refresh the auth session
  const {
    data: { user },
  } = await supabase.auth.getUser()

  // If the request is for a protected route (/app/*) and user is not authenticated
  if (request.nextUrl.pathname.startsWith('/app') && !user) {
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    url.searchParams.set('redirectTo', request.nextUrl.pathname)
    return NextResponse.redirect(url)
  }

  return supabaseResponse
}
```

### Step 5: Update Navigation and Links

#### 5.1 Update Public Homepage

**File**: `src/app/page.tsx`

```typescript
// Update the "Try it now" button to redirect to /app instead of /profile
// Find the existing button and update its href

<Button asChild>
  <Link href="/app" className="bg-blue-600 hover:bg-blue-700">
    Start Your Journey
  </Link>
</Button>
```

#### 5.2 Update Login Page Redirect

**File**: `src/app/login/page.tsx`

```typescript
// Update the successful login redirect
// Find the existing redirect and update it

if (data?.user) {
  logAuthEvent('login_success', data.user.id, {
    email: data.user.email ? `${data.user.email.substring(0, 3)}***@${data.user.email.split('@')[1]}` : 'unknown',
    sessionId: data.session?.access_token ? 'present' : 'missing'
  })
  clientLogger.info('Login successful, redirecting to app dashboard', {
    userId: data.user.id,
    hasSession: !!data.session
  })
  // Redirect to app dashboard on successful login
  router.push("/app")
}
```

### Step 6: Create Required UI Components

#### 6.1 Add Missing UI Components

**File**: `src/components/ui/progress.tsx`

```typescript
"use client"

import * as React from "react"
import * as ProgressPrimitive from "@radix-ui/react-progress"
import { cn } from "@/lib/utils"

const Progress = React.forwardRef<
  React.ElementRef<typeof ProgressPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof ProgressPrimitive.Root>
>(({ className, value, ...props }, ref) => (
  <ProgressPrimitive.Root
    ref={ref}
    className={cn(
      "relative h-4 w-full overflow-hidden rounded-full bg-secondary",
      className
    )}
    {...props}
  >
    <ProgressPrimitive.Indicator
      className="h-full w-full flex-1 bg-primary transition-all"
      style={{ transform: `translateX(-${100 - (value || 0)}%)` }}
    />
  </ProgressPrimitive.Root>
))
Progress.displayName = ProgressPrimitive.Root.displayName

export { Progress }
```

**File**: `src/components/ui/dropdown-menu.tsx`

```typescript
"use client"

import * as React from "react"
import * as DropdownMenuPrimitive from "@radix-ui/react-dropdown-menu"
import { Check, ChevronRight, Circle } from "lucide-react"
import { cn } from "@/lib/utils"

const DropdownMenu = DropdownMenuPrimitive.Root
const DropdownMenuTrigger = DropdownMenuPrimitive.Trigger
const DropdownMenuGroup = DropdownMenuPrimitive.Group
const DropdownMenuPortal = DropdownMenuPrimitive.Portal
const DropdownMenuSub = DropdownMenuPrimitive.Sub
const DropdownMenuRadioGroup = DropdownMenuPrimitive.RadioGroup

const DropdownMenuSubTrigger = React.forwardRef<
  React.ElementRef<typeof DropdownMenuPrimitive.SubTrigger>,
  React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.SubTrigger> & {
    inset?: boolean
  }
>(({ className, inset, children, ...props }, ref) => (
  <DropdownMenuPrimitive.SubTrigger
    ref={ref}
    className={cn(
      "flex cursor-default select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none focus:bg-accent data-[state=open]:bg-accent",
      inset && "pl-8",
      className
    )}
    {...props}
  >
    {children}
    <ChevronRight className="ml-auto h-4 w-4" />
  </DropdownMenuPrimitive.SubTrigger>
))
DropdownMenuSubTrigger.displayName = DropdownMenuPrimitive.SubTrigger.displayName

const DropdownMenuSubContent = React.forwardRef<
  React.ElementRef<typeof DropdownMenuPrimitive.SubContent>,
  React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.SubContent>
>(({ className, ...props }, ref) => (
  <DropdownMenuPrimitive.SubContent
    ref={ref}
    className={cn(
      "z-50 min-w-[8rem] overflow-hidden rounded-md border bg-popover p-1 text-popover-foreground shadow-lg data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2",
      className
    )}
    {...props}
  />
))
DropdownMenuSubContent.displayName = DropdownMenuPrimitive.SubContent.displayName

const DropdownMenuContent = React.forwardRef<
  React.ElementRef<typeof DropdownMenuPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.Content>
>(({ className, sideOffset = 4, ...props }, ref) => (
  <DropdownMenuPrimitive.Portal>
    <DropdownMenuPrimitive.Content
      ref={ref}
      sideOffset={sideOffset}
      className={cn(
        "z-50 min-w-[8rem] overflow-hidden rounded-md border bg-popover p-1 text-popover-foreground shadow-md data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2",
        className
      )}
      {...props}
    />
  </DropdownMenuPrimitive.Portal>
))
DropdownMenuContent.displayName = DropdownMenuPrimitive.Content.displayName

const DropdownMenuItem = React.forwardRef<
  React.ElementRef<typeof DropdownMenuPrimitive.Item>,
  React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.Item> & {
    inset?: boolean
  }
>(({ className, inset, ...props }, ref) => (
  <DropdownMenuPrimitive.Item
    ref={ref}
    className={cn(
      "relative flex cursor-default select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none transition-colors focus:bg-accent focus:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50",
      inset && "pl-8",
      className
    )}
    {...props}
  />
))
DropdownMenuItem.displayName = DropdownMenuPrimitive.Item.displayName

const DropdownMenuCheckboxItem = React.forwardRef<
  React.ElementRef<typeof DropdownMenuPrimitive.CheckboxItem>,
  React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.CheckboxItem>
>(({ className, children, checked, ...props }, ref) => (
  <DropdownMenuPrimitive.CheckboxItem
    ref={ref}
    className={cn(
      "relative flex cursor-default select-none items-center rounded-sm py-1.5 pl-8 pr-2 text-sm outline-none transition-colors focus:bg-accent focus:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50",
      className
    )}
    checked={checked}
    {...props}
  >
    <span className="absolute left-2 flex h-3.5 w-3.5 items-center justify-center">
      <DropdownMenuPrimitive.ItemIndicator>
        <Check className="h-4 w-4" />
      </DropdownMenuPrimitive.ItemIndicator>
    </span>
    {children}
  </DropdownMenuPrimitive.CheckboxItem>
))
DropdownMenuCheckboxItem.displayName = DropdownMenuPrimitive.CheckboxItem.displayName

const DropdownMenuRadioItem = React.forwardRef<
  React.ElementRef<typeof DropdownMenuPrimitive.RadioItem>,
  React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.RadioItem>
>(({ className, children, ...props }, ref) => (
  <DropdownMenuPrimitive.RadioItem
    ref={ref}
    className={cn(
      "relative flex cursor-default select-none items-center rounded-sm py-1.5 pl-8 pr-2 text-sm outline-none transition-colors focus:bg-accent focus:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50",
      className
    )}
    {...props}
  >
    <span className="absolute left-2 flex h-3.5 w-3.5 items-center justify-center">
      <DropdownMenuPrimitive.ItemIndicator>
        <Circle className="h-2 w-2 fill-current" />
      </DropdownMenuPrimitive.ItemIndicator>
    </span>
    {children}
  </DropdownMenuPrimitive.RadioItem>
))
DropdownMenuRadioItem.displayName = DropdownMenuPrimitive.RadioItem.displayName

const DropdownMenuLabel = React.forwardRef<
  React.ElementRef<typeof DropdownMenuPrimitive.Label>,
  React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.Label> & {
    inset?: boolean
  }
>(({ className, inset, ...props }, ref) => (
  <DropdownMenuPrimitive.Label
    ref={ref}
    className={cn(
      "px-2 py-1.5 text-sm font-semibold",
      inset && "pl-8",
      className
    )}
    {...props}
  />
))
DropdownMenuLabel.displayName = DropdownMenuPrimitive.Label.displayName

const DropdownMenuSeparator = React.forwardRef<
  React.ElementRef<typeof DropdownMenuPrimitive.Separator>,
  React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.Separator>
>(({ className, ...props }, ref) => (
  <DropdownMenuPrimitive.Separator
    ref={ref}
    className={cn("-mx-1 my-1 h-px bg-muted", className)}
    {...props}
  />
))
DropdownMenuSeparator.displayName = DropdownMenuPrimitive.Separator.displayName

const DropdownMenuShortcut = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLSpanElement>) => {
  return (
    <span
      className={cn("ml-auto text-xs tracking-widest opacity-60", className)}
      {...props}
    />
  )
}
DropdownMenuShortcut.displayName = "DropdownMenuShortcut"

export {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuCheckboxItem,
  DropdownMenuRadioItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuGroup,
  DropdownMenuPortal,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuRadioGroup,
}
```

#### 6.2 Add Toast Notification System

**File**: `src/components/ui/toaster.tsx`

```typescript
"use client"

import { useToast } from "@/components/ui/use-toast"
import {
  Toast,
  ToastClose,
  ToastDescription,
  ToastProvider,
  ToastTitle,
  ToastViewport,
} from "@/components/ui/toast"

export function Toaster() {
  const { toasts } = useToast()

  return (
    <ToastProvider>
      {toasts.map(function ({ id, title, description, action, ...props }) {
        return (
          <Toast key={id} {...props}>
            <div className="grid gap-1">
              {title && <ToastTitle>{title}</ToastTitle>}
              {description && (
                <ToastDescription>{description}</ToastDescription>
              )}
            </div>
            {action}
            <ToastClose />
          </Toast>
        )
      })}
      <ToastViewport />
    </ToastProvider>
  )
}
```

### Step 7: Set up Supabase Storage

#### 7.1 Create Storage Bucket

**SQL Migration**: `supabase/migrations/003_setup_meal_images_storage.sql`

```sql
-- Create the meal-images bucket
INSERT INTO storage.buckets (id, name, public) VALUES ('meal-images', 'meal-images', true);

-- Create RLS policies for meal-images bucket
CREATE POLICY "Users can upload their own meal images" ON storage.objects 
  FOR INSERT WITH CHECK (
    bucket_id = 'meal-images' AND 
    auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can view their own meal images" ON storage.objects 
  FOR SELECT USING (
    bucket_id = 'meal-images' AND 
    auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can delete their own meal images" ON storage.objects 
  FOR DELETE USING (
    bucket_id = 'meal-images' AND 
    auth.uid()::text = (storage.foldername(name))[1]
  );
```

### Step 8: Add Dependencies

#### 8.1 Required Package Dependencies

**Update**: `package.json`

```json
{
  "dependencies": {
    "@radix-ui/react-progress": "^1.0.3",
    "@radix-ui/react-dropdown-menu": "^2.0.6",
    "@radix-ui/react-alert-dialog": "^1.0.5",
    "@radix-ui/react-toast": "^1.1.5"
  }
}
```

### Step 9: Testing Strategy

#### 9.1 Component Tests

**File**: `src/app/app/__tests__/page.test.tsx`

```typescript
import { render, screen } from '@testing-library/react'
import { createClient } from '@/utils/supabase/server'
import AppDashboard from '../page'

// Mock Supabase client
jest.mock('@/utils/supabase/server', () => ({
  createClient: jest.fn(),
}))

const mockCreateClient = createClient as jest.MockedFunction<typeof createClient>

describe('App Dashboard', () => {
  beforeEach(() => {
    const mockSupabase = {
      auth: {
        getUser: jest.fn().mockResolvedValue({
          data: { user: { id: 'test-user-id', email: 'test@example.com' } }
        })
      },
      from: jest.fn().mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: { full_name: 'Test User', weight_kg: 70 }
            }),
            order: jest.fn().mockReturnValue({
              limit: jest.fn().mockResolvedValue({
                data: []
              })
            })
          })
        })
      })
    }
    mockCreateClient.mockResolvedValue(mockSupabase as any)
  })

  it('renders dashboard with welcome message', async () => {
    const dashboard = await AppDashboard()
    render(dashboard)
    
    expect(screen.getByText(/Welcome back/)).toBeInTheDocument()
    expect(screen.getByText(/Log Meal/)).toBeInTheDocument()
  })
})
```

#### 9.2 Authentication Tests

**File**: `src/app/app/__tests__/layout.test.tsx`

```typescript
import { render } from '@testing-library/react'
import { redirect } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'
import AppLayout from '../layout'

jest.mock('next/navigation', () => ({
  redirect: jest.fn(),
}))

jest.mock('@/utils/supabase/server', () => ({
  createClient: jest.fn(),
}))

const mockCreateClient = createClient as jest.MockedFunction<typeof createClient>
const mockRedirect = redirect as jest.MockedFunction<typeof redirect>

describe('App Layout', () => {
  it('redirects to login if user not authenticated', async () => {
    const mockSupabase = {
      auth: {
        getUser: jest.fn().mockResolvedValue({
          data: { user: null }
        })
      }
    }
    mockCreateClient.mockResolvedValue(mockSupabase as any)

    await AppLayout({ children: <div>Test</div> })

    expect(mockRedirect).toHaveBeenCalledWith('/login')
  })

  it('renders children if user is authenticated', async () => {
    const mockSupabase = {
      auth: {
        getUser: jest.fn().mockResolvedValue({
          data: { user: { id: 'test-user-id', email: 'test@example.com' } }
        })
      }
    }
    mockCreateClient.mockResolvedValue(mockSupabase as any)

    const layout = await AppLayout({ children: <div>Test Content</div> })
    render(layout)

    expect(mockRedirect).not.toHaveBeenCalled()
  })
})
```

## Implementation Timeline

### Week 1: Infrastructure Setup
- **Day 1-2**: Create protected route structure and app layout
- **Day 3-4**: Set up navigation and authentication middleware
- **Day 5**: Migrate profile page and update redirects

### Week 2: Core Calorie Tracking
- **Day 1-2**: Build photo upload component and Supabase storage setup
- **Day 3-4**: Create nutrition summary and meal log components
- **Day 5**: Build main dashboard with data integration

### Week 3: Polish and Integration
- **Day 1-2**: Add missing UI components and improve styling
- **Day 3-4**: Implement testing and fix bugs
- **Day 5**: Performance optimization and documentation

## Risk Mitigation

### Technical Risks
- **Authentication Complexity**: Leverage existing middleware, extensive testing
- **Data Migration**: Careful profile page migration with fallback
- **UI Consistency**: Use existing shadcn/ui components, maintain design system

### Implementation Risks
- **Breaking Changes**: Implement feature flags, gradual rollout
- **Database Issues**: Test migrations thoroughly, backup strategies
- **Performance**: Optimize image uploads, implement caching

## Success Metrics

### Functional Goals
- [ ] Protected routes working with authentication
- [ ] Profile page successfully migrated to `/app/profile`
- [ ] Photo upload functionality working
- [ ] Dashboard displaying real user data
- [ ] Navigation between all features working

### Technical Goals
- [ ] All tests passing
- [ ] Performance metrics maintained
- [ ] Logging system tracking user actions
- [ ] Database queries optimized
- [ ] Mobile responsive design

## Next Steps (Phase 7)

After Phase 6 completion, the next phase would focus on:
1. **AI Integration**: Implement Inngest for background processing
2. **Food Recognition**: Add OpenAI Vision API integration
3. **Smart Insights**: Create AI-powered recommendations
4. **Mobile PWA**: Add offline support and native app features
5. **Advanced Analytics**: Implement trend analysis and predictions

## Conclusion

Phase 6 represents a significant transformation of the application from a simple prototype to a fully functional, secure, and user-friendly health tracking platform. The implementation creates a solid foundation for advanced AI features while maintaining the simplicity and focus on user experience that defines the project's vision.

The protected route structure not only enhances security but also provides a scalable architecture for future features, making it easier to add new health tracking capabilities, AI insights, and social features as the application evolves. 