# Phase 2: AI Integration Setup - Technical Implementation

## Overview

This document provides a comprehensive technical implementation plan for Phase 2 of the AI Calorie Tracker project. Phase 2 focuses on integrating AI-powered food analysis capabilities using OpenAI Vision API and Google Cloud Vision API, with Inngest handling background processing.

## Architecture Overview

```
User Photo Upload → Supabase Storage → Inngest Event → AI Analysis → Database Update → User Notification
```

### Technology Stack
- **Background Processing**: Inngest for event-driven functions
- **AI Providers**: OpenAI Vision API (primary), Google Cloud Vision API (fallback)
- **Image Storage**: Supabase Storage with CDN
- **Database**: PostgreSQL with Row Level Security
- **Monitoring**: Winston-based logging with error tracking

## 1. Inngest Configuration & Setup

### 1.1 Package Installation & Dependencies
```bash
npm install inngest
npm install @inngest/next
npm install openai
npm install @google-cloud/vision
```

### 1.2 Environment Variables Setup
**File**: `.env.local`
```env
# Inngest Configuration
INNGEST_EVENT_KEY=your_inngest_event_key
INNGEST_SIGNING_KEY=your_inngest_signing_key
INNGEST_DEV=true  # Set to false in production

# OpenAI Configuration
OPENAI_API_KEY=your_openai_api_key

# Google Cloud Vision Configuration
GOOGLE_APPLICATION_CREDENTIALS=path/to/service-account-key.json
GOOGLE_CLOUD_PROJECT_ID=your_project_id
```

### 1.3 Inngest Client Configuration
**File**: `src/lib/inngest/client.ts`
```typescript
import { Inngest } from 'inngest';

export const inngest = new Inngest({
  id: 'ai-fitness-coach',
  name: 'AI Fitness Coach',
  eventKey: process.env.INNGEST_EVENT_KEY,
});
```

### 1.4 Next.js API Route Setup
**File**: `src/app/api/inngest/route.ts`
```typescript
import { serve } from 'inngest/next';
import { inngest } from '@/lib/inngest/client';
import { analyzeFoodImage } from '@/lib/inngest/functions/analyze-food';
import { updateNutritionData } from '@/lib/inngest/functions/update-nutrition';

export const { GET, POST, PUT } = serve({
  client: inngest,
  functions: [
    analyzeFoodImage,
    updateNutritionData,
  ],
});
```

## 2. AI Model Integration Setup

### 2.1 OpenAI Vision API Integration
**File**: `src/lib/ai/openai-vision.ts`
```typescript
import OpenAI from 'openai';
import { logger } from '@/lib/logger';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export interface NutritionAnalysis {
  foodItems: Array<{
    name: string;
    quantity: string;
    calories: number;
    protein_g: number;
    carbs_g: number;
    fat_g: number;
    fiber_g: number;
  }>;
  totalCalories: number;
  totalProtein: number;
  totalCarbs: number;
  totalFat: number;
  totalFiber: number;
  confidenceScore: number;
  analysisNotes: string;
}

export async function analyzeImageWithOpenAI(imageBase64: string): Promise<NutritionAnalysis> {
  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4-vision-preview",
      messages: [
        {
          role: "user",
          content: [
            {
              type: "text",
              text: `Analyze this food image and provide detailed nutritional information. Return a JSON object with the following structure:
              {
                "foodItems": [
                  {
                    "name": "food name",
                    "quantity": "estimated portion size",
                    "calories": number,
                    "protein_g": number,
                    "carbs_g": number,
                    "fat_g": number,
                    "fiber_g": number
                  }
                ],
                "totalCalories": number,
                "totalProtein": number,
                "totalCarbs": number,
                "totalFat": number,
                "totalFiber": number,
                "confidenceScore": number (0-1),
                "analysisNotes": "any additional observations"
              }
              
              Guidelines:
              - Provide realistic portion estimates
              - If uncertain, provide ranges and note in analysisNotes
              - Consider cooking methods and preparation
              - Rate confidence based on image clarity and recognizability`
            },
            {
              type: "image_url",
              image_url: {
                url: `data:image/jpeg;base64,${imageBase64}`,
                detail: "high"
              }
            }
          ]
        }
      ],
      max_tokens: 1000,
      temperature: 0.1,
    });

    const content = response.choices[0]?.message?.content;
    if (!content) {
      throw new Error('No response from OpenAI');
    }

    const analysis = JSON.parse(content) as NutritionAnalysis;
    
    logger.info('OpenAI analysis completed', {
      totalCalories: analysis.totalCalories,
      confidenceScore: analysis.confidenceScore,
      foodItemCount: analysis.foodItems.length
    });

    return analysis;
  } catch (error) {
    logger.error('OpenAI Vision analysis failed', { error });
    throw error;
  }
}
```

### 2.2 Google Cloud Vision API Integration
**File**: `src/lib/ai/google-vision.ts`
```typescript
import { ImageAnnotatorClient } from '@google-cloud/vision';
import { logger } from '@/lib/logger';
import { NutritionAnalysis } from './openai-vision';

const client = new ImageAnnotatorClient({
  keyFilename: process.env.GOOGLE_APPLICATION_CREDENTIALS,
  projectId: process.env.GOOGLE_CLOUD_PROJECT_ID,
});

export async function analyzeImageWithGoogle(imageBase64: string): Promise<NutritionAnalysis> {
  try {
    const [result] = await client.objectLocalization({
      image: {
        content: imageBase64,
      },
    });

    const objects = result.localizedObjectAnnotations || [];
    const foodObjects = objects.filter(obj => 
      obj.name?.toLowerCase().includes('food') || 
      obj.name?.toLowerCase().includes('fruit') ||
      obj.name?.toLowerCase().includes('vegetable')
    );

    // Use detected objects to create nutrition analysis
    // This would require a food database lookup or additional AI processing
    const analysis = await processFoodObjects(foodObjects, imageBase64);
    
    logger.info('Google Vision analysis completed', {
      objectsDetected: objects.length,
      foodObjectsDetected: foodObjects.length,
      totalCalories: analysis.totalCalories
    });

    return analysis;
  } catch (error) {
    logger.error('Google Vision analysis failed', { error });
    throw error;
  }
}

async function processFoodObjects(objects: any[], imageBase64: string): Promise<NutritionAnalysis> {
  // Fallback implementation - would need food database or additional processing
  // For now, return a default structure
  return {
    foodItems: objects.map(obj => ({
      name: obj.name || 'Unknown food',
      quantity: 'Medium portion',
      calories: 200, // Default estimate
      protein_g: 10,
      carbs_g: 25,
      fat_g: 8,
      fiber_g: 3,
    })),
    totalCalories: objects.length * 200,
    totalProtein: objects.length * 10,
    totalCarbs: objects.length * 25,
    totalFat: objects.length * 8,
    totalFiber: objects.length * 3,
    confidenceScore: 0.6, // Lower confidence for Google fallback
    analysisNotes: 'Analysis based on object detection. Manual verification recommended.',
  };
}
```

### 2.3 AI Service Manager with Fallback Logic
**File**: `src/lib/ai/nutrition-analyzer.ts`
```typescript
import { analyzeImageWithOpenAI, NutritionAnalysis } from './openai-vision';
import { analyzeImageWithGoogle } from './google-vision';
import { logger } from '@/lib/logger';

export type AIProvider = 'openai' | 'google';

export class NutritionAnalyzer {
  private static instance: NutritionAnalyzer;
  private failureCount: Map<AIProvider, number> = new Map();
  private readonly MAX_FAILURES = 3;

  static getInstance(): NutritionAnalyzer {
    if (!NutritionAnalyzer.instance) {
      NutritionAnalyzer.instance = new NutritionAnalyzer();
    }
    return NutritionAnalyzer.instance;
  }

  async analyzeImage(imageBase64: string): Promise<NutritionAnalysis> {
    const providers: AIProvider[] = ['openai', 'google'];
    
    for (const provider of providers) {
      if (this.shouldSkipProvider(provider)) {
        continue;
      }

      try {
        const analysis = await this.callProvider(provider, imageBase64);
        this.resetFailureCount(provider);
        
        logger.info('Nutrition analysis successful', {
          provider,
          totalCalories: analysis.totalCalories,
          confidenceScore: analysis.confidenceScore
        });

        return analysis;
      } catch (error) {
        this.incrementFailureCount(provider);
        logger.error('Nutrition analysis failed', { provider, error });
      }
    }

    throw new Error('All AI providers failed to analyze the image');
  }

  private async callProvider(provider: AIProvider, imageBase64: string): Promise<NutritionAnalysis> {
    switch (provider) {
      case 'openai':
        return await analyzeImageWithOpenAI(imageBase64);
      case 'google':
        return await analyzeImageWithGoogle(imageBase64);
      default:
        throw new Error(`Unknown provider: ${provider}`);
    }
  }

  private shouldSkipProvider(provider: AIProvider): boolean {
    return (this.failureCount.get(provider) || 0) >= this.MAX_FAILURES;
  }

  private incrementFailureCount(provider: AIProvider): void {
    this.failureCount.set(provider, (this.failureCount.get(provider) || 0) + 1);
  }

  private resetFailureCount(provider: AIProvider): void {
    this.failureCount.set(provider, 0);
  }
}
```

## 3. Background Processing Pipeline

### 3.1 Image Processing Function
**File**: `src/lib/inngest/functions/analyze-food.ts`
```typescript
import { inngest } from '@/lib/inngest/client';
import { NutritionAnalyzer } from '@/lib/ai/nutrition-analyzer';
import { createClient } from '@/utils/supabase/server';
import { logger } from '@/lib/logger';

export const analyzeFoodImage = inngest.createFunction(
  { id: 'analyze-food-image' },
  { event: 'food/image.uploaded' },
  async ({ event, step }) => {
    const { imageUrl, userId, logId } = event.data;

    // Step 1: Download and prepare image
    const imageBase64 = await step.run('download-image', async () => {
      const response = await fetch(imageUrl);
      if (!response.ok) {
        throw new Error(`Failed to download image: ${response.statusText}`);
      }
      
      const buffer = await response.arrayBuffer();
      return Buffer.from(buffer).toString('base64');
    });

    // Step 2: Analyze image with AI
    const analysis = await step.run('analyze-nutrition', async () => {
      const analyzer = NutritionAnalyzer.getInstance();
      return await analyzer.analyzeImage(imageBase64);
    });

    // Step 3: Update database with results
    await step.run('update-database', async () => {
      const supabase = createClient();
      
      const { error } = await supabase
        .from('nutrition_logs')
        .update({
          food_items: analysis.foodItems,
          total_calories: analysis.totalCalories,
          total_protein_g: analysis.totalProtein,
          total_carbs_g: analysis.totalCarbs,
          total_fat_g: analysis.totalFat,
          total_fiber_g: analysis.totalFiber,
          confidence_score: analysis.confidenceScore,
          notes: analysis.analysisNotes,
          processed_at: new Date().toISOString(),
          processing_status: 'completed',
        })
        .eq('id', logId)
        .eq('user_id', userId);

      if (error) {
        logger.error('Failed to update nutrition log', { error, logId, userId });
        throw error;
      }

      logger.info('Nutrition analysis completed and saved', {
        logId,
        userId,
        totalCalories: analysis.totalCalories,
        confidenceScore: analysis.confidenceScore
      });
    });

    // Step 4: Send notification event
    await step.sendEvent('nutrition-analysis-complete', {
      name: 'nutrition/analysis.completed',
      data: {
        logId,
        userId,
        totalCalories: analysis.totalCalories,
        confidenceScore: analysis.confidenceScore,
      },
    });

    return { success: true, analysis };
  }
);
```

### 3.2 Nutrition Data Update Function
**File**: `src/lib/inngest/functions/update-nutrition.ts`
```typescript
import { inngest } from '@/lib/inngest/client';
import { createClient } from '@/utils/supabase/server';
import { logger } from '@/lib/logger';

export const updateNutritionData = inngest.createFunction(
  { id: 'update-nutrition-data' },
  { event: 'nutrition/analysis.completed' },
  async ({ event, step }) => {
    const { logId, userId, totalCalories, confidenceScore } = event.data;

    // Update user's daily nutrition summary
    await step.run('update-daily-summary', async () => {
      const supabase = createClient();
      
      // Get today's date
      const today = new Date().toISOString().split('T')[0];
      
      // Calculate daily totals
      const { data: todayLogs, error: fetchError } = await supabase
        .from('nutrition_logs')
        .select('total_calories, total_protein_g, total_carbs_g, total_fat_g, total_fiber_g')
        .eq('user_id', userId)
        .gte('created_at', `${today}T00:00:00`)
        .lt('created_at', `${today}T23:59:59`);

      if (fetchError) {
        logger.error('Failed to fetch daily nutrition logs', { error: fetchError, userId });
        throw fetchError;
      }

      const dailyTotals = todayLogs.reduce((acc, log) => ({
        calories: acc.calories + (log.total_calories || 0),
        protein: acc.protein + (log.total_protein_g || 0),
        carbs: acc.carbs + (log.total_carbs_g || 0),
        fat: acc.fat + (log.total_fat_g || 0),
        fiber: acc.fiber + (log.total_fiber_g || 0),
      }), { calories: 0, protein: 0, carbs: 0, fat: 0, fiber: 0 });

      logger.info('Daily nutrition summary updated', {
        userId,
        date: today,
        dailyTotals
      });

      return dailyTotals;
    });

    // Check if user should receive insights
    await step.run('check-insights-trigger', async () => {
      if (confidenceScore < 0.7) {
        await step.sendEvent('low-confidence-alert', {
          name: 'nutrition/low-confidence',
          data: {
            logId,
            userId,
            confidenceScore,
          },
        });
      }
    });

    return { success: true };
  }
);
```

## 4. Database Schema Updates

### 4.1 Add Processing Status to Nutrition Logs
**File**: `supabase/migrations/003_add_processing_status.sql`
```sql
-- Add processing status and timestamps to nutrition_logs
ALTER TABLE nutrition_logs 
ADD COLUMN IF NOT EXISTS processing_status TEXT DEFAULT 'pending' CHECK (processing_status IN ('pending', 'processing', 'completed', 'failed')),
ADD COLUMN IF NOT EXISTS processed_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS error_message TEXT;

-- Add index for processing status queries
CREATE INDEX IF NOT EXISTS idx_nutrition_logs_processing_status ON nutrition_logs(processing_status);
CREATE INDEX IF NOT EXISTS idx_nutrition_logs_user_date ON nutrition_logs(user_id, created_at);
```

### 4.2 Create Supabase Storage Bucket
**File**: `supabase/migrations/004_create_meal_images_bucket.sql`
```sql
-- Create storage bucket for meal images
INSERT INTO storage.buckets (id, name, public) VALUES ('meal-images', 'meal-images', true);

-- Create RLS policies for meal images
CREATE POLICY "Users can upload their own meal images" ON storage.objects
FOR INSERT WITH CHECK (bucket_id = 'meal-images' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can view their own meal images" ON storage.objects
FOR SELECT USING (bucket_id = 'meal-images' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can update their own meal images" ON storage.objects
FOR UPDATE USING (bucket_id = 'meal-images' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete their own meal images" ON storage.objects
FOR DELETE USING (bucket_id = 'meal-images' AND auth.uid()::text = (storage.foldername(name))[1]);
```

## 5. API Routes for Integration

### 5.1 Image Upload & Processing Trigger
**File**: `src/app/api/nutrition/upload/route.ts`
```typescript
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { inngest } from '@/lib/inngest/client';
import { logger } from '@/lib/logger';

export async function POST(request: NextRequest) {
  try {
    const supabase = createClient();
    
    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const formData = await request.formData();
    const image = formData.get('image') as File;
    const notes = formData.get('notes') as string;

    if (!image) {
      return NextResponse.json({ error: 'No image provided' }, { status: 400 });
    }

    // Validate image type and size
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (!allowedTypes.includes(image.type)) {
      return NextResponse.json({ error: 'Invalid image type' }, { status: 400 });
    }

    const maxSize = 10 * 1024 * 1024; // 10MB
    if (image.size > maxSize) {
      return NextResponse.json({ error: 'Image too large' }, { status: 400 });
    }

    // Upload image to Supabase Storage
    const fileName = `${user.id}/${Date.now()}-${image.name}`;
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('meal-images')
      .upload(fileName, image, {
        cacheControl: '3600',
        upsert: false,
      });

    if (uploadError) {
      logger.error('Image upload failed', { error: uploadError, userId: user.id });
      return NextResponse.json({ error: 'Upload failed' }, { status: 500 });
    }

    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from('meal-images')
      .getPublicUrl(fileName);

    // Create nutrition log entry
    const { data: logData, error: logError } = await supabase
      .from('nutrition_logs')
      .insert({
        user_id: user.id,
        image_url: publicUrl,
        notes: notes || null,
        processing_status: 'pending',
      })
      .select()
      .single();

    if (logError) {
      logger.error('Failed to create nutrition log', { error: logError, userId: user.id });
      return NextResponse.json({ error: 'Failed to create log' }, { status: 500 });
    }

    // Update processing status to 'processing'
    await supabase
      .from('nutrition_logs')
      .update({ processing_status: 'processing' })
      .eq('id', logData.id);

    // Trigger AI analysis
    await inngest.send({
      name: 'food/image.uploaded',
      data: {
        imageUrl: publicUrl,
        userId: user.id,
        logId: logData.id,
      },
    });

    logger.info('Image uploaded and processing started', {
      userId: user.id,
      logId: logData.id,
      imageUrl: publicUrl
    });

    return NextResponse.json({
      success: true,
      logId: logData.id,
      imageUrl: publicUrl,
    });

  } catch (error) {
    logger.error('Upload API error', { error });
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
```

### 5.2 Get Processing Status
**File**: `src/app/api/nutrition/status/[logId]/route.ts`
```typescript
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';

export async function GET(
  request: NextRequest,
  { params }: { params: { logId: string } }
) {
  try {
    const supabase = createClient();
    
    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: log, error } = await supabase
      .from('nutrition_logs')
      .select('processing_status, total_calories, confidence_score, food_items, error_message, created_at')
      .eq('id', params.logId)
      .eq('user_id', user.id)
      .single();

    if (error) {
      return NextResponse.json({ error: 'Log not found' }, { status: 404 });
    }

    return NextResponse.json({
      status: log.processing_status,
      totalCalories: log.total_calories,
      confidenceScore: log.confidence_score,
      foodItems: log.food_items,
      errorMessage: log.error_message,
      createdAt: log.created_at,
    });

  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
```

### 5.3 Get User's Nutrition Logs
**File**: `src/app/api/nutrition/logs/route.ts`
```typescript
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';

export async function GET(request: NextRequest) {
  try {
    const supabase = createClient();
    
    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '10');
    const offset = parseInt(searchParams.get('offset') || '0');
    const status = searchParams.get('status');

    let query = supabase
      .from('nutrition_logs')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (status) {
      query = query.eq('processing_status', status);
    }

    const { data: logs, error } = await query;

    if (error) {
      return NextResponse.json({ error: 'Failed to fetch logs' }, { status: 500 });
    }

    return NextResponse.json({ logs });

  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
```

## 6. Testing & Validation

### 6.1 AI Integration Tests
**File**: `src/lib/ai/__tests__/nutrition-analyzer.test.ts`
```typescript
import { NutritionAnalyzer } from '../nutrition-analyzer';

// Mock the AI providers
jest.mock('../openai-vision', () => ({
  analyzeImageWithOpenAI: jest.fn(),
}));

jest.mock('../google-vision', () => ({
  analyzeImageWithGoogle: jest.fn(),
}));

describe('NutritionAnalyzer', () => {
  let analyzer: NutritionAnalyzer;

  beforeEach(() => {
    analyzer = NutritionAnalyzer.getInstance();
    jest.clearAllMocks();
  });

  it('should analyze image successfully with OpenAI', async () => {
    const mockAnalysis = {
      foodItems: [{ name: 'Apple', calories: 95 }],
      totalCalories: 95,
      confidenceScore: 0.9,
    };

    const { analyzeImageWithOpenAI } = require('../openai-vision');
    analyzeImageWithOpenAI.mockResolvedValue(mockAnalysis);

    const result = await analyzer.analyzeImage('mock-base64');
    
    expect(result).toEqual(mockAnalysis);
    expect(analyzeImageWithOpenAI).toHaveBeenCalledWith('mock-base64');
  });

  it('should fallback to Google Vision when OpenAI fails', async () => {
    const mockAnalysis = {
      foodItems: [{ name: 'Banana', calories: 105 }],
      totalCalories: 105,
      confidenceScore: 0.6,
    };

    const { analyzeImageWithOpenAI } = require('../openai-vision');
    const { analyzeImageWithGoogle } = require('../google-vision');
    
    analyzeImageWithOpenAI.mockRejectedValue(new Error('OpenAI failed'));
    analyzeImageWithGoogle.mockResolvedValue(mockAnalysis);

    const result = await analyzer.analyzeImage('mock-base64');
    
    expect(result).toEqual(mockAnalysis);
    expect(analyzeImageWithOpenAI).toHaveBeenCalledWith('mock-base64');
    expect(analyzeImageWithGoogle).toHaveBeenCalledWith('mock-base64');
  });

  it('should throw error when all providers fail', async () => {
    const { analyzeImageWithOpenAI } = require('../openai-vision');
    const { analyzeImageWithGoogle } = require('../google-vision');
    
    analyzeImageWithOpenAI.mockRejectedValue(new Error('OpenAI failed'));
    analyzeImageWithGoogle.mockRejectedValue(new Error('Google failed'));

    await expect(analyzer.analyzeImage('mock-base64')).rejects.toThrow('All AI providers failed');
  });
});
```

### 6.2 Inngest Function Tests
**File**: `src/lib/inngest/__tests__/analyze-food.test.ts`
```typescript
import { analyzeFoodImage } from '../functions/analyze-food';

// Mock dependencies
jest.mock('@/lib/ai/nutrition-analyzer');
jest.mock('@/utils/supabase/server');

describe('analyzeFoodImage', () => {
  it('should process image and update database', async () => {
    const mockEvent = {
      data: {
        imageUrl: 'https://example.com/image.jpg',
        userId: 'user-123',
        logId: 'log-123',
      },
    };

    const mockAnalysis = {
      foodItems: [{ name: 'Pizza', calories: 300 }],
      totalCalories: 300,
      confidenceScore: 0.8,
    };

    // Mock the analyzer
    const { NutritionAnalyzer } = require('@/lib/ai/nutrition-analyzer');
    NutritionAnalyzer.getInstance.mockReturnValue({
      analyzeImage: jest.fn().mockResolvedValue(mockAnalysis),
    });

    // Mock Supabase
    const mockSupabase = {
      from: jest.fn().mockReturnThis(),
      update: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
    };
    
    const { createClient } = require('@/utils/supabase/server');
    createClient.mockReturnValue(mockSupabase);

    // Mock fetch for image download
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      arrayBuffer: () => Promise.resolve(new ArrayBuffer(8)),
    });

    const result = await analyzeFoodImage.handler(mockEvent);
    
    expect(result).toHaveProperty('success', true);
    expect(result).toHaveProperty('analysis');
  });
});
```

### 6.3 API Route Tests
**File**: `src/app/api/nutrition/upload/__tests__/route.test.ts`
```typescript
import { POST } from '../route';
import { NextRequest } from 'next/server';

// Mock dependencies
jest.mock('@/utils/supabase/server');
jest.mock('@/lib/inngest/client');

describe('/api/nutrition/upload', () => {
  it('should upload image and trigger processing', async () => {
    const mockFile = new File(['test'], 'test.jpg', { type: 'image/jpeg' });
    const formData = new FormData();
    formData.append('image', mockFile);
    formData.append('notes', 'Test meal');

    const request = new NextRequest('http://localhost/api/nutrition/upload', {
      method: 'POST',
      body: formData,
    });

    // Mock Supabase
    const mockSupabase = {
      auth: {
        getUser: jest.fn().mockResolvedValue({
          data: { user: { id: 'user-123' } },
          error: null,
        }),
      },
      storage: {
        from: jest.fn().mockReturnThis(),
        upload: jest.fn().mockResolvedValue({
          data: { path: 'user-123/test.jpg' },
          error: null,
        }),
        getPublicUrl: jest.fn().mockReturnValue({
          data: { publicUrl: 'https://example.com/test.jpg' },
        }),
      },
      from: jest.fn().mockReturnThis(),
      insert: jest.fn().mockReturnThis(),
      select: jest.fn().mockReturnThis(),
      single: jest.fn().mockResolvedValue({
        data: { id: 'log-123' },
        error: null,
      }),
    };

    const { createClient } = require('@/utils/supabase/server');
    createClient.mockReturnValue(mockSupabase);

    // Mock Inngest
    const { inngest } = require('@/lib/inngest/client');
    inngest.send = jest.fn().mockResolvedValue({});

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.logId).toBe('log-123');
    expect(inngest.send).toHaveBeenCalledWith({
      name: 'food/image.uploaded',
      data: {
        imageUrl: 'https://example.com/test.jpg',
        userId: 'user-123',
        logId: 'log-123',
      },
    });
  });
});
```

## 7. Error Handling & Monitoring

### 7.1 Error Monitoring Setup
**File**: `src/lib/monitoring/ai-errors.ts`
```typescript
import { logger } from '@/lib/logger';

export interface AIError {
  provider: string;
  errorType: string;
  message: string;
  imageUrl?: string;
  userId?: string;
  timestamp: Date;
}

export class AIErrorMonitor {
  static logError(error: AIError): void {
    logger.error('AI processing error', {
      ...error,
      timestamp: error.timestamp.toISOString(),
    });

    // Could integrate with external monitoring service
    // e.g., Sentry, DataDog, etc.
  }

  static async getErrorStats(): Promise<{
    totalErrors: number;
    errorsByProvider: Record<string, number>;
    recentErrors: AIError[];
  }> {
    // Implementation would query error logs/database
    return {
      totalErrors: 0,
      errorsByProvider: {},
      recentErrors: [],
    };
  }
}
```

### 7.2 Error Handling in Inngest Functions
**File**: `src/lib/inngest/functions/error-handler.ts`
```typescript
import { inngest } from '@/lib/inngest/client';
import { createClient } from '@/utils/supabase/server';
import { AIErrorMonitor } from '@/lib/monitoring/ai-errors';
import { logger } from '@/lib/logger';

export const handleAnalysisError = inngest.createFunction(
  { id: 'handle-analysis-error' },
  { event: 'food/analysis.failed' },
  async ({ event, step }) => {
    const { logId, userId, error, provider } = event.data;

    // Log error to monitoring system
    await step.run('log-error', async () => {
      AIErrorMonitor.logError({
        provider,
        errorType: 'analysis_failed',
        message: error.message,
        userId,
        timestamp: new Date(),
      });
    });

    // Update database with error status
    await step.run('update-database', async () => {
      const supabase = createClient();
      
      const { error: updateError } = await supabase
        .from('nutrition_logs')
        .update({
          processing_status: 'failed',
          error_message: error.message,
        })
        .eq('id', logId);

      if (updateError) {
        logger.error('Failed to update error status', { updateError, logId });
      }
    });

    // Send user notification about failure
    await step.sendEvent('user-notification', {
      name: 'nutrition/analysis.failed',
      data: {
        userId,
        logId,
        message: 'We had trouble analyzing your food image. Please try again.',
      },
    });
  }
);
```

## 8. Development & Deployment Checklist

### 8.1 Development Setup
- [ ] Install required packages (`inngest`, `@inngest/next`, `openai`, `@google-cloud/vision`)
- [ ] Set up environment variables in `.env.local`
- [ ] Create Inngest account and get API keys
- [ ] Set up OpenAI API access
- [ ] Configure Google Cloud Vision API
- [ ] Run database migrations
- [ ] Set up Supabase Storage bucket

### 8.2 Configuration
- [ ] Configure Inngest client with project ID
- [ ] Set up Next.js API route for Inngest
- [ ] Configure AI provider credentials
- [ ] Set up storage bucket policies
- [ ] Configure error monitoring

### 8.3 Testing
- [ ] Run unit tests for AI integration
- [ ] Test Inngest functions locally
- [ ] Test API routes with mock data
- [ ] Validate error handling scenarios
- [ ] Test image upload and processing flow

### 8.4 Production Deployment
- [ ] Deploy Inngest functions to production
- [ ] Configure production environment variables
- [ ] Set up monitoring and alerting
- [ ] Test production image processing
- [ ] Monitor AI provider costs and usage

## 9. Performance Considerations

### 9.1 Image Processing
- **Image Optimization**: Compress images before AI analysis
- **Async Processing**: Use Inngest for non-blocking background processing
- **Caching**: Cache AI results for similar images
- **Rate Limiting**: Implement rate limiting for AI API calls

### 9.2 Database Optimization
- **Indexing**: Proper indexes for user queries and date ranges
- **Connection Pooling**: Efficient database connections
- **Query Optimization**: Optimized queries for nutrition summaries

### 9.3 Cost Management
- **AI Provider Costs**: Monitor and set usage limits
- **Storage Costs**: Implement image cleanup policies
- **Processing Limits**: Set reasonable processing limits per user

## 10. Security Considerations

### 10.1 Data Protection
- **Image Privacy**: Secure image storage with proper access controls
- **AI Data**: Ensure AI providers don't retain user data
- **Authentication**: Proper user authentication for all endpoints
- **Input Validation**: Validate all user inputs and file uploads

### 10.2 API Security
- **Rate Limiting**: Prevent abuse of AI processing endpoints
- **File Upload Security**: Validate file types and sizes
- **Error Handling**: Don't expose sensitive information in errors
- **Logging**: Log security events without exposing sensitive data

This comprehensive technical implementation provides a complete roadmap for implementing Phase 2 of the AI Calorie Tracker project, with detailed code examples, testing strategies, and deployment considerations. 