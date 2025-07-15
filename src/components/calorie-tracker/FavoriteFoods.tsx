'use client';

import React, { useState, useEffect } from 'react';
import { Heart, Search, Plus, Clock, TrendingUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { offlineStorage } from '@/lib/pwa/offline-storage';
import { syncService } from '@/lib/pwa/sync-service';
import { useToast } from '@/hooks/use-toast';

interface FavoriteFood {
  id: string;
  name: string;
  calories: number;
  macros: {
    protein: number;
    carbs: number;
    fat: number;
    fiber: number;
  };
  imageUrl?: string;
  frequency: number;
  lastUsed: Date;
  tags: string[];
  customServingSizes?: Array<{
    name: string;
    multiplier: number;
  }>;
}

interface FavoriteFoodsProps {
  onSelectFood?: (food: FavoriteFood, portion: number) => void;
  isModal?: boolean;
}

export const FavoriteFoods: React.FC<FavoriteFoodsProps> = ({ 
  onSelectFood,
  isModal = false 
}) => {
  const [favorites, setFavorites] = useState<FavoriteFood[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedFood, setSelectedFood] = useState<FavoriteFood | null>(null);
  const [portion, setPortion] = useState(1);
  const { toast } = useToast();

  const mealTags = ['breakfast', 'lunch', 'dinner', 'snack'];
  const allTags = [...mealTags, 'quick', 'healthy', 'protein', 'low-carb'];

  useEffect(() => {
    loadFavorites();
  }, []);

  const loadFavorites = async () => {
    try {
      const cached = await offlineStorage.getFavoriteFoods();
      setFavorites(cached.sort((a, b) => b.frequency - a.frequency));
    } catch (_error) {
      console.error('Failed to load favorites:', _error);
      toast({
        title: "Error",
        description: "Failed to load favorite foods",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const filteredFavorites = favorites.filter(food => {
    const matchesSearch = food.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesTags = selectedTags.length === 0 || 
      selectedTags.some(tag => food.tags.includes(tag));
    return matchesSearch && matchesTags;
  });

  const toggleTag = (tag: string) => {
    setSelectedTags(prev => 
      prev.includes(tag) 
        ? prev.filter(t => t !== tag)
        : [...prev, tag]
    );
  };

  const handleQuickAdd = async (food: FavoriteFood) => {
    if (onSelectFood) {
      // If we're in modal mode, show portion selector
      setSelectedFood(food);
    } else {
      // Direct add with default portion
      await logFavoriteFood(food, 1);
    }
  };

  const logFavoriteFood = async (food: FavoriteFood, portionSize: number) => {
    const adjustedNutrition = {
      calories: Math.round(food.calories * portionSize),
      protein: Math.round(food.macros.protein * portionSize),
      carbs: Math.round(food.macros.carbs * portionSize),
      fat: Math.round(food.macros.fat * portionSize),
      fiber: Math.round(food.macros.fiber * portionSize),
    };

    const mealData = {
      food_items: [{
        name: food.name,
        calories: adjustedNutrition.calories,
        protein_g: adjustedNutrition.protein,
        carbs_g: adjustedNutrition.carbs,
        fat_g: adjustedNutrition.fat,
        fiber_g: adjustedNutrition.fiber,
        quantity: portionSize,
        unit: 'serving'
      }],
      total_calories: adjustedNutrition.calories,
      total_protein_g: adjustedNutrition.protein,
      total_carbs_g: adjustedNutrition.carbs,
      total_fat_g: adjustedNutrition.fat,
      total_fiber_g: adjustedNutrition.fiber,
      confidence_score: 1.0,
      notes: 'Added from favorites',
      meal_date: new Date().toISOString().split('T')[0],
      meal_type: getMealType(),
      user_id: 'current-user-id' // Replace with actual user ID
    };

    try {
      await syncService.queueMealLog(mealData);
      
      // Update frequency
      const updatedFood = {
        ...food,
        frequency: food.frequency + 1,
        lastUsed: new Date()
      };
      await offlineStorage.saveFavoriteFood(updatedFood);
      
      toast({
        title: "Meal logged!",
        description: `${food.name} added to your log`
      });

      // Refresh favorites list
      await loadFavorites();
    } catch {
      toast({
        title: "Error",
        description: "Failed to log meal",
        variant: "destructive"
      });
    }
  };

  const getMealType = (): string => {
    const hour = new Date().getHours();
    if (hour < 11) return 'breakfast';
    if (hour < 15) return 'lunch';
    if (hour < 18) return 'snack';
    return 'dinner';
  };

  const formatLastUsed = (date: Date): string => {
    const now = new Date();
    const diffDays = Math.floor((now.getTime() - new Date(date).getTime()) / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
    return `${Math.floor(diffDays / 30)} months ago`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500" />
      </div>
    );
  }

  return (
    <div className={cn("p-4", isModal && "max-h-[600px] overflow-y-auto")}>
      {/* Search and Filters */}
      <div className="mb-6 space-y-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <Input
            type="text"
            placeholder="Search favorites..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        
        <div className="flex flex-wrap gap-2">
          {allTags.map(tag => (
            <Badge
              key={tag}
              variant={selectedTags.includes(tag) ? "default" : "outline"}
              className="cursor-pointer"
              onClick={() => toggleTag(tag)}
            >
              {tag}
            </Badge>
          ))}
        </div>
      </div>

      {/* Favorites List */}
      {filteredFavorites.length === 0 ? (
        <div className="text-center py-8">
          <Heart className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500">
            {searchTerm || selectedTags.length > 0 
              ? "No favorites match your search"
              : "No favorite foods yet"
            }
          </p>
          <p className="text-sm text-gray-400 mt-2">
            Your frequently logged foods will appear here
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-3">
          {filteredFavorites.map(food => (
            <div
              key={food.id}
              className="bg-white rounded-lg border p-4 hover:shadow-md transition-shadow"
            >
              <div className="flex items-start gap-3">
                {food.imageUrl && (
                  <>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={food.imageUrl}
                      alt={food.name}
                      className="w-16 h-16 rounded-lg object-cover"
                    />
                  </>
                )}
                
                <div className="flex-1">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="font-medium text-gray-900">{food.name}</h3>
                      <p className="text-sm text-gray-600">
                        {food.calories} cal • {food.macros.protein}g protein • {food.macros.carbs}g carbs • {food.macros.fat}g fat
                      </p>
                    </div>
                    
                    <Button
                      size="sm"
                      onClick={() => handleQuickAdd(food)}
                      className="ml-2"
                    >
                      <Plus className="w-4 h-4 mr-1" />
                      Add
                    </Button>
                  </div>
                  
                  <div className="flex items-center gap-4 mt-2">
                    <div className="flex items-center gap-1 text-xs text-gray-500">
                      <TrendingUp className="w-3 h-3" />
                      <span>Used {food.frequency} times</span>
                    </div>
                    <div className="flex items-center gap-1 text-xs text-gray-500">
                      <Clock className="w-3 h-3" />
                      <span>{formatLastUsed(food.lastUsed)}</span>
                    </div>
                  </div>
                  
                  {food.tags.length > 0 && (
                    <div className="flex gap-1 mt-2">
                      {food.tags.map(tag => (
                        <Badge key={tag} variant="secondary" className="text-xs">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Portion Selector Modal */}
      {selectedFood && onSelectFood && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 max-w-sm w-full">
            <h3 className="font-semibold text-lg mb-4">Select Portion Size</h3>
            <p className="text-sm text-gray-600 mb-4">
              {selectedFood.name} - {selectedFood.calories} cal per serving
            </p>
            
            <div className="space-y-3">
              {/* Quick portion buttons */}
              <div className="grid grid-cols-4 gap-2">
                {[0.5, 1, 1.5, 2].map(size => (
                  <Button
                    key={size}
                    variant={portion === size ? "default" : "outline"}
                    size="sm"
                    onClick={() => setPortion(size)}
                  >
                    {size}x
                  </Button>
                ))}
              </div>
              
              {/* Custom serving sizes if available */}
              {selectedFood.customServingSizes && (
                <div className="grid grid-cols-2 gap-2">
                  {selectedFood.customServingSizes.map(serving => (
                    <Button
                      key={serving.name}
                      variant="outline"
                      size="sm"
                      onClick={() => setPortion(serving.multiplier)}
                    >
                      {serving.name}
                    </Button>
                  ))}
                </div>
              )}
              
              {/* Custom input */}
              <Input
                type="number"
                value={portion}
                onChange={(e) => setPortion(parseFloat(e.target.value) || 1)}
                step="0.1"
                min="0.1"
                className="text-center"
              />
              
              <div className="text-center text-sm text-gray-600">
                Total: {Math.round(selectedFood.calories * portion)} calories
              </div>
            </div>
            
            <div className="flex gap-2 mt-6">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => {
                  setSelectedFood(null);
                  setPortion(1);
                }}
              >
                Cancel
              </Button>
              <Button
                className="flex-1"
                onClick={() => {
                  onSelectFood(selectedFood, portion);
                  setSelectedFood(null);
                  setPortion(1);
                }}
              >
                Add to Log
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};