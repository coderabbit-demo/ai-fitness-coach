import { NutritionAnalysis } from './openai-vision';
import * as openAIVision from './openai-vision';
import * as googleVision from './google-vision';
import logger from '@/lib/logger';

export type AIProvider = 'openai' | 'google';

interface ProviderFailure {
  provider: AIProvider;
  message: string;
  skipped?: boolean;
}

export class NutritionAnalysisError extends Error {
  readonly providerFailures: ProviderFailure[];
  readonly userMessage: string;

  constructor(providerFailures: ProviderFailure[]) {
    super('All AI providers failed to analyze the image');
    this.name = 'NutritionAnalysisError';
    this.providerFailures = providerFailures;
    this.userMessage = 'We could not analyze this meal photo because our AI providers are temporarily unavailable. Please try again in a few minutes.';
  }
}

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
    const providerFailures: ProviderFailure[] = [];

    for (const provider of providers) {
      if (!this.isProviderConfigured(provider)) {
        const message = `${provider} provider is not configured`;
        providerFailures.push({ provider, message, skipped: true });
        logger.warn('Skipping unconfigured AI provider', { provider });
        continue;
      }

      if (this.shouldSkipProvider(provider)) {
        const message = `${provider} provider is temporarily disabled after repeated failures`;
        providerFailures.push({ provider, message, skipped: true });
        logger.warn('Skipping AI provider after repeated failures', { provider });
        continue;
      }

      try {
        const analysis = await this.callProvider(provider, imageBase64);
        if (!this.isValidAnalysis(analysis)) {
          throw new Error(`${provider} returned an invalid nutrition analysis`);
        }

        this.resetFailureCount(provider);

        logger.info('Nutrition analysis successful', {
          provider,
          totalCalories: analysis.totalCalories,
          confidenceScore: analysis.confidenceScore
        });

        return analysis;
      } catch (error) {
        this.incrementFailureCount(provider);
        const message = error instanceof Error ? error.message : 'Unknown provider error';
        providerFailures.push({ provider, message });
        logger.error('Nutrition analysis failed', { provider, error });
      }
    }

    throw new NutritionAnalysisError(providerFailures);
  }

  private async callProvider(provider: AIProvider, imageBase64: string): Promise<NutritionAnalysis> {
    switch (provider) {
      case 'openai':
        return await openAIVision.analyzeImageWithOpenAI(imageBase64);
      case 'google':
        return await googleVision.analyzeImageWithGoogle(imageBase64);
      default:
        throw new Error(`Unknown provider: ${provider}`);
    }
  }

  private isProviderConfigured(provider: AIProvider): boolean {
    switch (provider) {
      case 'openai':
        return openAIVision.isOpenAIConfigured?.() ?? true;
      case 'google':
        return googleVision.isGoogleVisionConfigured?.() ?? true;
      default:
        return false;
    }
  }

  private isValidAnalysis(analysis: NutritionAnalysis | null | undefined): analysis is NutritionAnalysis {
    return !!analysis && Array.isArray(analysis.foodItems) && typeof analysis.totalCalories === 'number';
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
