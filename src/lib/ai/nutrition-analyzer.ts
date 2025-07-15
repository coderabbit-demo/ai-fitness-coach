import { analyzeImageWithOpenAI, NutritionAnalysis } from './openai-vision';
import { analyzeImageWithGoogle } from './google-vision';
import logger from '@/lib/logger';

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