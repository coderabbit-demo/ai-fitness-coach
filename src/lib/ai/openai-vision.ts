import OpenAI from 'openai';
import logger from '@/lib/logger';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
  maxRetries: 3,
  timeout: 60000, // 60 seconds
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

    let analysis: NutritionAnalysis;
    try {
      analysis = JSON.parse(content) as NutritionAnalysis;
    } catch (parseError) {
      logger.error('Failed to parse OpenAI response as JSON', {
        error: parseError,
        content: content.substring(0, 500) // Log first 500 chars for debugging
      });
      throw new Error('Invalid JSON response from OpenAI');
    }
    
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