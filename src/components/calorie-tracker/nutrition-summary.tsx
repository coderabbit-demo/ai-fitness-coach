"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { Zap, Target, Award } from 'lucide-react'

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
            Today&apos;s Achievements
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