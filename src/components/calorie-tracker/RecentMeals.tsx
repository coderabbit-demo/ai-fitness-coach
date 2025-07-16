'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { format } from 'date-fns';
import { Clock, Eye } from 'lucide-react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';

interface Meal {
  id: string;
  food_items: Array<{
    name: string;
    quantity: string;
    calories: number;
  }>;
  total_calories: number;
  confidence_score: number;
  image_url?: string;
  created_at: string;
  processing_status: string;
}

interface RecentMealsProps {
  meals: Meal[];
}

export function RecentMeals({ meals }: RecentMealsProps) {
  const router = useRouter();

  const getConfidenceBadge = (score: number) => {
    if (score >= 0.8) return <Badge className="bg-green-100 text-green-800">High</Badge>;
    if (score >= 0.6) return <Badge className="bg-yellow-100 text-yellow-800">Medium</Badge>;
    return <Badge className="bg-red-100 text-red-800">Low</Badge>;
  };

  const handleViewMeal = (mealId: string) => {
    // Navigate to detailed meal view page
    router.push(`/meal/${mealId}`);
  };

  const handleViewAllMeals = () => {
    // Navigate to all meals/food log page
    router.push('/food-log');
  };

  if (meals.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5 text-gray-500" />
            Recent Meals
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-gray-500">
            <p>No meals logged yet.</p>
            <p className="text-sm mt-2">Start by adding your first meal!</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Clock className="h-5 w-5 text-gray-500" />
          Recent Meals
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {meals.map((meal) => (
            <div key={meal.id} className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50">
              <div className="flex items-center gap-3">
                {/* Meal Image */}
                {meal.image_url && (
                  <Image
                    src={meal.image_url}
                    alt={`Meal containing ${meal.food_items.map(item => item.name).join(', ')}`}
                    width={48}
                    height={48}
                    className="w-12 h-12 object-cover rounded-lg"
                  />
                )}
                
                <div className="flex-1">
                  {/* Food Items */}
                  <div className="font-medium text-sm">
                    {meal.food_items?.length > 0 ? (
                      meal.food_items.slice(0, 2).map((item, index) => (
                        <span key={index}>
                          {item.name}
                          {index < Math.min(meal.food_items.length, 2) - 1 && ', '}
                        </span>
                      ))
                    ) : (
                      'Processing...'
                    )}
                    {meal.food_items?.length > 2 && (
                      <span className="text-gray-500">
                        +{meal.food_items.length - 2} more
                      </span>
                    )}
                  </div>
                  
                  {/* Time and Status */}
                  <div className="flex items-center gap-2 text-xs text-gray-500 mt-1">
                    <span>{format(new Date(meal.created_at), 'h:mm a')}</span>
                    {meal.processing_status === 'completed' && meal.confidence_score > 0 && (
                      getConfidenceBadge(meal.confidence_score)
                    )}
                    {meal.processing_status === 'processing' && (
                      <Badge className="bg-blue-100 text-blue-800">Processing</Badge>
                    )}
                    {meal.processing_status === 'failed' && (
                      <Badge className="bg-red-100 text-red-800">Failed</Badge>
                    )}
                  </div>
                </div>
              </div>

              {/* Calories and Actions */}
              <div className="flex items-center gap-3">
                <div className="text-right">
                  <div className="font-semibold text-orange-600">
                    {meal.total_calories || 0} cal
                  </div>
                </div>
                
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => handleViewMeal(meal.id)}
                >
                  <Eye className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))}
          
          {/* View All Button */}
          <div className="pt-2">
            <Button 
              variant="outline" 
              className="w-full"
              onClick={handleViewAllMeals}
            >
              View All Meals
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
} 