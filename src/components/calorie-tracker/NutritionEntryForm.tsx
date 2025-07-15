'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Save, Plus, X } from 'lucide-react'
import { NutritionLogInput, FoodItem } from '@/lib/nutrition-types'

interface NutritionEntryFormProps {
  imageUrl?: string
  onSave: (data: NutritionLogInput) => Promise<void>
  onCancel: () => void
  className?: string
}

/**
 * Renders a form for manual nutrition entry, allowing users to add, edit, and remove multiple food items, input nutritional values, and submit the aggregated data.
 *
 * Displays an optional meal image, calculates total nutrition values in real time, and provides fields for notes. On submission, validates input and calls the provided save handler with the nutrition log data.
 */
export default function NutritionEntryForm({
  imageUrl,
  onSave,
  onCancel,
  className
}: NutritionEntryFormProps) {
  const [foodItems, setFoodItems] = useState<FoodItem[]>([
    {
      id: '1',
      name: '',
      calories: 0,
      protein_g: 0,
      carbs_g: 0,
      fat_g: 0,
      fiber_g: 0,
      serving_size: ''
    }
  ])
  
  const [notes, setNotes] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const addFoodItem = () => {
    const newItem: FoodItem = {
      id: Date.now().toString(),
      name: '',
      calories: 0,
      protein_g: 0,
      carbs_g: 0,
      fat_g: 0,
      fiber_g: 0,
      serving_size: ''
    }
    setFoodItems([...foodItems, newItem])
  }

  const removeFoodItem = (id: string) => {
    setFoodItems(foodItems.filter(item => item.id !== id))
  }

  const updateFoodItem = (id: string, field: keyof FoodItem, value: string | number) => {
    setFoodItems(foodItems.map(item =>
      item.id === id ? { ...item, [field]: value } : item
    ))
  }

  const calculateTotals = () => {
    return foodItems.reduce((totals, item) => ({
      calories: totals.calories + (item.calories || 0),
      protein_g: totals.protein_g + (item.protein_g || 0),
      carbs_g: totals.carbs_g + (item.carbs_g || 0),
      fat_g: totals.fat_g + (item.fat_g || 0),
      fiber_g: totals.fiber_g + (item.fiber_g || 0)
    }), { calories: 0, protein_g: 0, carbs_g: 0, fat_g: 0, fiber_g: 0 })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setIsSubmitting(true)

    try {
      // Validate that at least one food item has data
      const validItems = foodItems.filter(item => item.name.trim() && item.calories > 0)
      
      if (validItems.length === 0) {
        setError('Please add at least one food item with calories.')
        return
      }

      const totals = calculateTotals()
      
      const nutritionData: NutritionLogInput = {
        food_items: validItems,
        total_calories: totals.calories,
        total_protein_g: totals.protein_g,
        total_carbs_g: totals.carbs_g,
        total_fat_g: totals.fat_g,
        total_fiber_g: totals.fiber_g,
        image_url: imageUrl,
        confidence_score: 0, // Manual entry has 0 confidence
        notes: notes.trim() || undefined
      }

      await onSave(nutritionData)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save nutrition log')
    } finally {
      setIsSubmitting(false)
    }
  }

  const totals = calculateTotals()

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle>Manual Nutrition Entry</CardTitle>
      </CardHeader>
      
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <Alert>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {imageUrl && (
            <div>
              <Label>Meal Image</Label>
              <img
                src={imageUrl}
                alt="Meal"
                className="w-full h-48 object-cover rounded-lg mt-2"
              />
            </div>
          )}

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label>Food Items</Label>
              <Button
                type="button"
                onClick={addFoodItem}
                variant="outline"
                size="sm"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Food
              </Button>
            </div>

            {foodItems.map((item, index) => (
              <Card key={item.id} className="p-4">
                <div className="flex justify-between items-start mb-3">
                  <h4 className="font-medium">Food Item {index + 1}</h4>
                  {foodItems.length > 1 && (
                    <Button
                      type="button"
                      onClick={() => removeFoodItem(item.id)}
                      variant="ghost"
                      size="sm"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="col-span-2">
                    <Label>Food Name</Label>
                    <Input
                      value={item.name}
                      onChange={(e) => updateFoodItem(item.id, 'name', e.target.value)}
                      placeholder="e.g., Grilled Chicken Breast"
                      required
                    />
                  </div>

                  <div>
                    <Label>Serving Size</Label>
                    <Input
                      value={item.serving_size || ''}
                      onChange={(e) => updateFoodItem(item.id, 'serving_size', e.target.value)}
                      placeholder="e.g., 150g"
                    />
                  </div>

                  <div>
                    <Label>Calories</Label>
                    <Input
                      type="number"
                      value={item.calories}
                      onChange={(e) => updateFoodItem(item.id, 'calories', Number(e.target.value))}
                      min="0"
                      step="1"
                      required
                    />
                  </div>

                  <div>
                    <Label>Protein (g)</Label>
                    <Input
                      type="number"
                      value={item.protein_g}
                      onChange={(e) => updateFoodItem(item.id, 'protein_g', Number(e.target.value))}
                      min="0"
                      step="0.1"
                    />
                  </div>

                  <div>
                    <Label>Carbs (g)</Label>
                    <Input
                      type="number"
                      value={item.carbs_g}
                      onChange={(e) => updateFoodItem(item.id, 'carbs_g', Number(e.target.value))}
                      min="0"
                      step="0.1"
                    />
                  </div>

                  <div>
                    <Label>Fat (g)</Label>
                    <Input
                      type="number"
                      value={item.fat_g}
                      onChange={(e) => updateFoodItem(item.id, 'fat_g', Number(e.target.value))}
                      min="0"
                      step="0.1"
                    />
                  </div>

                  <div>
                    <Label>Fiber (g)</Label>
                    <Input
                      type="number"
                      value={item.fiber_g}
                      onChange={(e) => updateFoodItem(item.id, 'fiber_g', Number(e.target.value))}
                      min="0"
                      step="0.1"
                    />
                  </div>
                </div>
              </Card>
            ))}
          </div>

          <Card className="p-4 bg-gray-50">
            <h4 className="font-medium mb-3">Totals</h4>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>Calories: {totals.calories}</div>
              <div>Protein: {totals.protein_g.toFixed(1)}g</div>
              <div>Carbs: {totals.carbs_g.toFixed(1)}g</div>
              <div>Fat: {totals.fat_g.toFixed(1)}g</div>
              <div>Fiber: {totals.fiber_g.toFixed(1)}g</div>
            </div>
          </Card>

          <div>
            <Label>Notes (Optional)</Label>
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Add any notes about this meal..."
              className="mt-2"
            />
          </div>

          <div className="flex justify-between">
            <Button type="button" onClick={onCancel} variant="ghost">
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              <Save className="h-4 w-4 mr-2" />
              {isSubmitting ? 'Saving...' : 'Save Entry'}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}