export interface FoodItem {
  id: string
  name: string
  calories: number
  protein_g: number
  carbs_g: number
  fat_g: number
  fiber_g: number
  serving_size?: string
  confidence_score?: number
}

export interface NutritionLog {
  id: string
  user_id: string
  food_items: FoodItem[]
  total_calories: number
  total_protein_g: number
  total_carbs_g: number
  total_fat_g: number
  total_fiber_g: number
  image_url?: string
  confidence_score?: number
  notes?: string
  logged_at: string
  created_at: string
  updated_at: string
}

export interface NutritionLogInput {
  food_items: FoodItem[]
  total_calories: number
  total_protein_g: number
  total_carbs_g: number
  total_fat_g: number
  total_fiber_g: number
  image_url?: string
  confidence_score?: number
  notes?: string
}

export interface CameraError {
  type: 'permission' | 'hardware' | 'not_supported' | 'unknown'
  message: string
}

export interface UploadState {
  isUploading: boolean
  progress: number
  stage: 'idle' | 'compressing' | 'uploading' | 'complete' | 'error'
  error?: string
}