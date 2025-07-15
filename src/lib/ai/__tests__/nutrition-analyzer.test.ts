import { NutritionAnalyzer } from '../nutrition-analyzer';
import { NutritionAnalysis } from '../openai-vision';

// Mock the AI providers
jest.mock('../openai-vision', () => ({
  analyzeImageWithOpenAI: jest.fn(),
}));

jest.mock('../google-vision', () => ({
  analyzeImageWithGoogle: jest.fn(),
}));

// Mock logger
jest.mock('@/lib/logger', () => ({
  info: jest.fn(),
  error: jest.fn(),
}));

describe('NutritionAnalyzer', () => {
  let analyzer: NutritionAnalyzer;

  beforeEach(() => {
    analyzer = NutritionAnalyzer.getInstance();
    jest.clearAllMocks();
  });

  const mockAnalysis: NutritionAnalysis = {
    foodItems: [
      {
        name: 'Apple',
        quantity: '1 medium',
        calories: 95,
        protein_g: 0.5,
        carbs_g: 25,
        fat_g: 0.3,
        fiber_g: 4,
      }
    ],
    totalCalories: 95,
    totalProtein: 0.5,
    totalCarbs: 25,
    totalFat: 0.3,
    totalFiber: 4,
    confidenceScore: 0.9,
    analysisNotes: 'Clear image of a red apple',
  };

  it('should analyze image successfully with OpenAI', async () => {
    const { analyzeImageWithOpenAI } = require('../openai-vision');
    analyzeImageWithOpenAI.mockResolvedValue(mockAnalysis);

    const result = await analyzer.analyzeImage('mock-base64');
    
    expect(result).toEqual(mockAnalysis);
    expect(analyzeImageWithOpenAI).toHaveBeenCalledWith('mock-base64');
  });

  it('should fallback to Google Vision when OpenAI fails', async () => {
    const mockGoogleAnalysis = {
      ...mockAnalysis,
      foodItems: [{ ...mockAnalysis.foodItems[0], name: 'Banana' }],
      totalCalories: 105,
      confidenceScore: 0.6,
    };

    const { analyzeImageWithOpenAI } = require('../openai-vision');
    const { analyzeImageWithGoogle } = require('../google-vision');
    
    analyzeImageWithOpenAI.mockRejectedValue(new Error('OpenAI failed'));
    analyzeImageWithGoogle.mockResolvedValue(mockGoogleAnalysis);

    const result = await analyzer.analyzeImage('mock-base64');
    
    expect(result).toEqual(mockGoogleAnalysis);
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

  it('should skip provider after max failures', async () => {
    const { analyzeImageWithOpenAI } = require('../openai-vision');
    const { analyzeImageWithGoogle } = require('../google-vision');
    
    // Mock OpenAI to fail 3 times
    analyzeImageWithOpenAI.mockRejectedValue(new Error('OpenAI failed'));
    analyzeImageWithGoogle.mockResolvedValue(mockAnalysis);

    // First 3 failures should try OpenAI
    for (let i = 0; i < 3; i++) {
      try {
        await analyzer.analyzeImage('mock-base64');
      } catch (error) {
        // Expected to fail and use Google fallback
      }
    }

    // Clear mocks and test that OpenAI is now skipped
    jest.clearAllMocks();
    analyzeImageWithGoogle.mockResolvedValue(mockAnalysis);

    const result = await analyzer.analyzeImage('mock-base64');
    
    expect(result).toEqual(mockAnalysis);
    expect(analyzeImageWithOpenAI).not.toHaveBeenCalled();
    expect(analyzeImageWithGoogle).toHaveBeenCalledWith('mock-base64');
  });

  it('should reset failure count after successful analysis', async () => {
    const { analyzeImageWithOpenAI } = require('../openai-vision');
    const { analyzeImageWithGoogle } = require('../google-vision');
    
    // First call fails with OpenAI, succeeds with Google
    analyzeImageWithOpenAI.mockRejectedValueOnce(new Error('OpenAI failed'));
    analyzeImageWithGoogle.mockResolvedValueOnce(mockAnalysis);

    await analyzer.analyzeImage('mock-base64');

    // Clear mocks
    jest.clearAllMocks();
    
    // Second call should try OpenAI again since failure count was reset
    analyzeImageWithOpenAI.mockResolvedValue(mockAnalysis);

    const result = await analyzer.analyzeImage('mock-base64');
    
    expect(result).toEqual(mockAnalysis);
    expect(analyzeImageWithOpenAI).toHaveBeenCalledWith('mock-base64');
  });
}); 