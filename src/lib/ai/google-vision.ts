import { ImageAnnotatorClient } from '@google-cloud/vision';
import logger from '@/lib/logger';
import { NutritionAnalysis } from './openai-vision';

// Validate required environment variables
const credentials = process.env.GOOGLE_APPLICATION_CREDENTIALS;
const projectId = process.env.GOOGLE_CLOUD_PROJECT_ID;

if (!credentials) {
  throw new Error('GOOGLE_APPLICATION_CREDENTIALS environment variable is required');
}

if (!projectId) {
  throw new Error('GOOGLE_CLOUD_PROJECT_ID environment variable is required');
}

const client = new ImageAnnotatorClient({
  keyFilename: credentials,
  projectId: projectId,
});

/**
 * Analyzes a base64-encoded image using Google Cloud Vision to detect food-related objects and estimates their nutritional content.
 *
 * Filters detected objects to those related to food, fruit, or vegetables, then generates a nutrition analysis based on these objects.
 *
 * @param imageBase64 - The base64-encoded image data to analyze
 * @returns A nutrition analysis object containing estimated nutritional values for detected food items
 * @throws If the Google Vision client is not properly initialized or if the analysis process fails
 */
export async function analyzeImageWithGoogle(imageBase64: string): Promise<NutritionAnalysis> {
  try {
    if (!client.objectLocalization) {
      throw new Error('Google Vision client not properly initialized');
    }
    
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

/**
 * Generates a fallback nutrition analysis for detected food-related objects in an image.
 *
 * Each detected object is assigned default nutritional values and aggregated totals are calculated. This implementation does not perform actual food recognition or database lookup and is intended as a placeholder.
 *
 * @param objects - Array of detected objects, typically filtered for food-related items
 * @param imageBase64 - The base64-encoded image data
 * @returns A nutrition analysis with default values and a confidence score
 */
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