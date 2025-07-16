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
import { Trash2, Clock } from 'lucide-react'
import { useState } from 'react'
import { logError } from '@/lib/logger'
import Image from 'next/image'

interface NutritionLog {
  id: string
  food_items: string | string[] | { [key: string]: unknown }
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

  const formatFoodItems = (items: string | string[] | { [key: string]: unknown }): string => {
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
                <Image 
                  src={log.image_url} 
                  alt="Meal" 
                  width={80}
                  height={80}
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