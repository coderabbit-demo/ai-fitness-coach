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

  describe("constructor and singleton behavior", () => {
    it("should return the same instance on multiple calls", () => {
      const instance1 = NutritionAnalyzer.getInstance();
      const instance2 = NutritionAnalyzer.getInstance();
      expect(instance1).toBe(instance2);
    });

    it("should initialize with empty failure counts", () => {
      const analyzer = NutritionAnalyzer.getInstance();
      // Test that failureCount Map is properly initialized
      expect((analyzer as any).failureCount).toBeInstanceOf(Map);
      expect((analyzer as any).failureCount.size).toBe(0);
    });

    it("should have correct MAX_FAILURES constant", () => {
      const analyzer = NutritionAnalyzer.getInstance();
      expect((analyzer as any).MAX_FAILURES).toBe(3);
    });
  });

  describe("input validation", () => {
    it("should handle empty string input", async () => {
      const { analyzeImageWithOpenAI } = require("../openai-vision");
      analyzeImageWithOpenAI.mockResolvedValue(mockAnalysis);

      const result = await analyzer.analyzeImage("");
      expect(result).toEqual(mockAnalysis);
      expect(analyzeImageWithOpenAI).toHaveBeenCalledWith("");
    });

    it("should handle null input gracefully", async () => {
      const { analyzeImageWithOpenAI } = require("../openai-vision");
      analyzeImageWithOpenAI.mockResolvedValue(mockAnalysis);

      const result = await analyzer.analyzeImage(null as any);
      expect(result).toEqual(mockAnalysis);
      expect(analyzeImageWithOpenAI).toHaveBeenCalledWith(null);
    });

    it("should handle undefined input gracefully", async () => {
      const { analyzeImageWithOpenAI } = require("../openai-vision");
      analyzeImageWithOpenAI.mockResolvedValue(mockAnalysis);

      const result = await analyzer.analyzeImage(undefined as any);
      expect(result).toEqual(mockAnalysis);
      expect(analyzeImageWithOpenAI).toHaveBeenCalledWith(undefined);
    });

    it("should handle very long base64 strings", async () => {
      const { analyzeImageWithOpenAI } = require("../openai-vision");
      analyzeImageWithOpenAI.mockResolvedValue(mockAnalysis);

      const longBase64 = "a".repeat(10000);
      const result = await analyzer.analyzeImage(longBase64);
      expect(result).toEqual(mockAnalysis);
      expect(analyzeImageWithOpenAI).toHaveBeenCalledWith(longBase64);
    });

    it("should handle special characters in base64", async () => {
      const { analyzeImageWithOpenAI } = require("../openai-vision");
      analyzeImageWithOpenAI.mockResolvedValue(mockAnalysis);

      const specialBase64 = "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD==";
      const result = await analyzer.analyzeImage(specialBase64);
      expect(result).toEqual(mockAnalysis);
      expect(analyzeImageWithOpenAI).toHaveBeenCalledWith(specialBase64);
    });
  });

  describe("error handling scenarios", () => {
    it("should handle OpenAI timeout errors specifically", async () => {
      const { analyzeImageWithOpenAI } = require("../openai-vision");
      const { analyzeImageWithGoogle } = require("../google-vision");
      
      const timeoutError = new Error("Request timeout");
      timeoutError.name = "TimeoutError";
      analyzeImageWithOpenAI.mockRejectedValue(timeoutError);
      analyzeImageWithGoogle.mockResolvedValue(mockAnalysis);

      const result = await analyzer.analyzeImage("mock-base64");
      expect(result).toEqual(mockAnalysis);
      expect(analyzeImageWithGoogle).toHaveBeenCalledWith("mock-base64");
    });

    it("should handle network errors", async () => {
      const { analyzeImageWithOpenAI } = require("../openai-vision");
      const { analyzeImageWithGoogle } = require("../google-vision");
      
      const networkError = new Error("Network error");
      networkError.name = "NetworkError";
      analyzeImageWithOpenAI.mockRejectedValue(networkError);
      analyzeImageWithGoogle.mockResolvedValue(mockAnalysis);

      const result = await analyzer.analyzeImage("mock-base64");
      expect(result).toEqual(mockAnalysis);
    });

    it("should handle rate limiting errors", async () => {
      const { analyzeImageWithOpenAI } = require("../openai-vision");
      const { analyzeImageWithGoogle } = require("../google-vision");
      
      const rateLimitError = new Error("Rate limit exceeded");
      rateLimitError.name = "RateLimitError";
      analyzeImageWithOpenAI.mockRejectedValue(rateLimitError);
      analyzeImageWithGoogle.mockResolvedValue(mockAnalysis);

      const result = await analyzer.analyzeImage("mock-base64");
      expect(result).toEqual(mockAnalysis);
    });

    it("should handle authentication errors", async () => {
      const { analyzeImageWithOpenAI } = require("../openai-vision");
      const { analyzeImageWithGoogle } = require("../google-vision");
      
      const authError = new Error("Authentication failed");
      authError.name = "AuthenticationError";
      analyzeImageWithOpenAI.mockRejectedValue(authError);
      analyzeImageWithGoogle.mockResolvedValue(mockAnalysis);

      const result = await analyzer.analyzeImage("mock-base64");
      expect(result).toEqual(mockAnalysis);
    });

    it("should handle malformed response from OpenAI", async () => {
      const { analyzeImageWithOpenAI } = require("../openai-vision");
      const { analyzeImageWithGoogle } = require("../google-vision");
      
      analyzeImageWithOpenAI.mockResolvedValue(null);
      analyzeImageWithGoogle.mockResolvedValue(mockAnalysis);

      const result = await analyzer.analyzeImage("mock-base64");
      expect(result).toEqual(mockAnalysis);
    });

    it("should handle malformed response from Google Vision", async () => {
      const { analyzeImageWithOpenAI } = require("../openai-vision");
      const { analyzeImageWithGoogle } = require("../google-vision");
      
      analyzeImageWithOpenAI.mockRejectedValue(new Error("OpenAI failed"));
      analyzeImageWithGoogle.mockResolvedValue(undefined);

      await expect(analyzer.analyzeImage("mock-base64")).rejects.toThrow("All AI providers failed to analyze the image");
    });

    it("should handle provider throwing non-Error objects", async () => {
      const { analyzeImageWithOpenAI } = require("../openai-vision");
      const { analyzeImageWithGoogle } = require("../google-vision");
      
      analyzeImageWithOpenAI.mockRejectedValue("String error");
      analyzeImageWithGoogle.mockResolvedValue(mockAnalysis);

      const result = await analyzer.analyzeImage("mock-base64");
      expect(result).toEqual(mockAnalysis);
    });
  });

  describe("provider failure tracking", () => {
    it("should track failures correctly for both providers", async () => {
      const { analyzeImageWithOpenAI } = require("../openai-vision");
      const { analyzeImageWithGoogle } = require("../google-vision");
      
      analyzeImageWithOpenAI.mockRejectedValue(new Error("OpenAI failed"));
      analyzeImageWithGoogle.mockRejectedValue(new Error("Google failed"));

      // Make multiple failed calls
      for (let i = 0; i < 5; i++) {
        try {
          await analyzer.analyzeImage("mock-base64");
        } catch (error) {
          // Expected to fail
        }
      }

      // OpenAI should be called only 3 times (max failures)
      expect(analyzeImageWithOpenAI).toHaveBeenCalledTimes(3);
      // Google should be called 5 times (not yet at max failures)
      expect(analyzeImageWithGoogle).toHaveBeenCalledTimes(5);
    });

    it("should reset failure count for specific provider after success", async () => {
      const { analyzeImageWithOpenAI } = require("../openai-vision");
      const { analyzeImageWithGoogle } = require("../google-vision");
      
      // Fail OpenAI twice
      analyzeImageWithOpenAI.mockRejectedValueOnce(new Error("OpenAI failed"));
      analyzeImageWithGoogle.mockResolvedValueOnce(mockAnalysis);
      await analyzer.analyzeImage("mock-base64");
      
      analyzeImageWithOpenAI.mockRejectedValueOnce(new Error("OpenAI failed"));
      analyzeImageWithGoogle.mockResolvedValueOnce(mockAnalysis);
      await analyzer.analyzeImage("mock-base64");

      // Clear mocks and make OpenAI succeed
      jest.clearAllMocks();
      analyzeImageWithOpenAI.mockResolvedValue(mockAnalysis);

      const result = await analyzer.analyzeImage("mock-base64");
      expect(result).toEqual(mockAnalysis);
      expect(analyzeImageWithOpenAI).toHaveBeenCalledWith("mock-base64");
    });

    it("should handle concurrent requests correctly", async () => {
      const { analyzeImageWithOpenAI } = require("../openai-vision");
      analyzeImageWithOpenAI.mockResolvedValue(mockAnalysis);

      // Make multiple concurrent requests
      const promises = [];
      for (let i = 0; i < 5; i++) {
        promises.push(analyzer.analyzeImage(`mock-base64-${i}`));
      }

      const results = await Promise.all(promises);
      expect(results).toHaveLength(5);
      results.forEach(result => expect(result).toEqual(mockAnalysis));
    });

    it("should skip both providers when both reach max failures", async () => {
      const { analyzeImageWithOpenAI } = require("../openai-vision");
      const { analyzeImageWithGoogle } = require("../google-vision");
      
      analyzeImageWithOpenAI.mockRejectedValue(new Error("OpenAI failed"));
      analyzeImageWithGoogle.mockRejectedValue(new Error("Google failed"));

      // Make enough calls to exhaust both providers
      for (let i = 0; i < 6; i++) {
        try {
          await analyzer.analyzeImage("mock-base64");
        } catch (error) {
          // Expected to fail
        }
      }

      // Clear mocks and verify neither provider is called
      jest.clearAllMocks();
      
      await expect(analyzer.analyzeImage("mock-base64")).rejects.toThrow("All AI providers failed to analyze the image");
      expect(analyzeImageWithOpenAI).not.toHaveBeenCalled();
      expect(analyzeImageWithGoogle).not.toHaveBeenCalled();
    });
  });

  describe("nutrition analysis response validation", () => {
    it("should handle analysis with multiple food items", async () => {
      const { analyzeImageWithOpenAI } = require("../openai-vision");
      
      const multiItemAnalysis = {
        ...mockAnalysis,
        foodItems: [
          {
            name: "Apple",
            quantity: "1 medium",
            calories: 95,
            protein_g: 0.5,
            carbs_g: 25,
            fat_g: 0.3,
            fiber_g: 4,
          },
          {
            name: "Banana",
            quantity: "1 large",
            calories: 121,
            protein_g: 1.5,
            carbs_g: 31,
            fat_g: 0.4,
            fiber_g: 3.1,
          }
        ],
        totalCalories: 216,
        totalProtein: 2.0,
        totalCarbs: 56,
        totalFat: 0.7,
        totalFiber: 7.1,
      };
      
      analyzeImageWithOpenAI.mockResolvedValue(multiItemAnalysis);

      const result = await analyzer.analyzeImage("mock-base64");
      expect(result).toEqual(multiItemAnalysis);
      expect(result.foodItems).toHaveLength(2);
    });

    it("should handle analysis with zero calories", async () => {
      const { analyzeImageWithOpenAI } = require("../openai-vision");
      
      const zeroCalorieAnalysis = {
        ...mockAnalysis,
        foodItems: [
          {
            name: "Water",
            quantity: "1 glass",
            calories: 0,
            protein_g: 0,
            carbs_g: 0,
            fat_g: 0,
            fiber_g: 0,
          }
        ],
        totalCalories: 0,
        totalProtein: 0,
        totalCarbs: 0,
        totalFat: 0,
        totalFiber: 0,
      };
      
      analyzeImageWithOpenAI.mockResolvedValue(zeroCalorieAnalysis);

      const result = await analyzer.analyzeImage("mock-base64");
      expect(result).toEqual(zeroCalorieAnalysis);
      expect(result.totalCalories).toBe(0);
    });

    it("should handle analysis with low confidence score", async () => {
      const { analyzeImageWithOpenAI } = require("../openai-vision");
      
      const lowConfidenceAnalysis = {
        ...mockAnalysis,
        confidenceScore: 0.1,
        analysisNotes: "Image quality is poor, analysis may be inaccurate",
      };
      
      analyzeImageWithOpenAI.mockResolvedValue(lowConfidenceAnalysis);

      const result = await analyzer.analyzeImage("mock-base64");
      expect(result).toEqual(lowConfidenceAnalysis);
      expect(result.confidenceScore).toBe(0.1);
    });

    it("should handle analysis with high confidence score", async () => {
      const { analyzeImageWithOpenAI } = require("../openai-vision");
      
      const highConfidenceAnalysis = {
        ...mockAnalysis,
        confidenceScore: 1.0,
        analysisNotes: "Perfect image quality, highly accurate analysis",
      };
      
      analyzeImageWithOpenAI.mockResolvedValue(highConfidenceAnalysis);

      const result = await analyzer.analyzeImage("mock-base64");
      expect(result).toEqual(highConfidenceAnalysis);
      expect(result.confidenceScore).toBe(1.0);
    });

    it("should handle analysis with missing optional fields", async () => {
      const { analyzeImageWithOpenAI } = require("../openai-vision");
      
      const minimalAnalysis = {
        foodItems: [
          {
            name: "Unknown Food",
            quantity: "1 serving",
            calories: 100,
            protein_g: 0,
            carbs_g: 0,
            fat_g: 0,
            fiber_g: 0,
          }
        ],
        totalCalories: 100,
        totalProtein: 0,
        totalCarbs: 0,
        totalFat: 0,
        totalFiber: 0,
        confidenceScore: 0.5,
        analysisNotes: "",
      };
      
      analyzeImageWithOpenAI.mockResolvedValue(minimalAnalysis);

      const result = await analyzer.analyzeImage("mock-base64");
      expect(result).toEqual(minimalAnalysis);
    });

    it("should handle analysis with empty food items array", async () => {
      const { analyzeImageWithOpenAI } = require("../openai-vision");
      
      const emptyAnalysis = {
        ...mockAnalysis,
        foodItems: [],
        totalCalories: 0,
        totalProtein: 0,
        totalCarbs: 0,
        totalFat: 0,
        totalFiber: 0,
        confidenceScore: 0.0,
        analysisNotes: "No food items detected in image",
      };
      
      analyzeImageWithOpenAI.mockResolvedValue(emptyAnalysis);

      const result = await analyzer.analyzeImage("mock-base64");
      expect(result).toEqual(emptyAnalysis);
      expect(result.foodItems).toHaveLength(0);
    });

    it("should handle analysis with fractional nutrition values", async () => {
      const { analyzeImageWithOpenAI } = require("../openai-vision");
      
      const fractionalAnalysis = {
        ...mockAnalysis,
        foodItems: [
          {
            name: "Half Apple",
            quantity: "0.5 medium",
            calories: 47.5,
            protein_g: 0.25,
            carbs_g: 12.5,
            fat_g: 0.15,
            fiber_g: 2.0,
          }
        ],
        totalCalories: 47.5,
        totalProtein: 0.25,
        totalCarbs: 12.5,
        totalFat: 0.15,
        totalFiber: 2.0,
      };
      
      analyzeImageWithOpenAI.mockResolvedValue(fractionalAnalysis);

      const result = await analyzer.analyzeImage("mock-base64");
      expect(result).toEqual(fractionalAnalysis);
      expect(result.totalCalories).toBe(47.5);
    });
  });

  describe("logging behavior", () => {
    it("should log successful analysis with provider info", async () => {
      const { analyzeImageWithOpenAI } = require("../openai-vision");
      const { info } = require("@/lib/logger");
      
      analyzeImageWithOpenAI.mockResolvedValue(mockAnalysis);

      await analyzer.analyzeImage("mock-base64");
      
      expect(info).toHaveBeenCalledWith(
        "Nutrition analysis successful",
        expect.objectContaining({
          provider: "openai",
          totalCalories: 95,
          confidenceScore: 0.9
        })
      );
    });

    it("should log provider failures with error details", async () => {
      const { analyzeImageWithOpenAI } = require("../openai-vision");
      const { analyzeImageWithGoogle } = require("../google-vision");
      const { error } = require("@/lib/logger");
      
      const testError = new Error("OpenAI API error");
      analyzeImageWithOpenAI.mockRejectedValue(testError);
      analyzeImageWithGoogle.mockResolvedValue(mockAnalysis);

      await analyzer.analyzeImage("mock-base64");
      
      expect(error).toHaveBeenCalledWith(
        "Nutrition analysis failed",
        expect.objectContaining({
          provider: "openai",
          error: testError
        })
      );
    });

    it("should log Google Vision success after OpenAI failure", async () => {
      const { analyzeImageWithOpenAI } = require("../openai-vision");
      const { analyzeImageWithGoogle } = require("../google-vision");
      const { info, error } = require("@/lib/logger");
      
      analyzeImageWithOpenAI.mockRejectedValue(new Error("OpenAI failed"));
      analyzeImageWithGoogle.mockResolvedValue(mockAnalysis);

      await analyzer.analyzeImage("mock-base64");
      
      expect(error).toHaveBeenCalledWith(
        "Nutrition analysis failed",
        expect.objectContaining({ provider: "openai" })
      );
      expect(info).toHaveBeenCalledWith(
        "Nutrition analysis successful",
        expect.objectContaining({ provider: "google" })
      );
    });
  });

  describe("performance and reliability", () => {
    it("should handle rapid successive calls", async () => {
      const { analyzeImageWithOpenAI } = require("../openai-vision");
      analyzeImageWithOpenAI.mockResolvedValue(mockAnalysis);

      const startTime = Date.now();
      
      // Make 10 rapid calls
      const promises = [];
      for (let i = 0; i < 10; i++) {
        promises.push(analyzer.analyzeImage(`mock-base64-${i}`));
      }

      const results = await Promise.all(promises);
      const endTime = Date.now();
      
      expect(results).toHaveLength(10);
      results.forEach(result => expect(result).toEqual(mockAnalysis));
      
      // Should complete reasonably quickly (less than 1 second in mock environment)
      expect(endTime - startTime).toBeLessThan(1000);
    });

    it("should maintain failure counts across multiple instances", async () => {
      const { analyzeImageWithOpenAI } = require("../openai-vision");
      const { analyzeImageWithGoogle } = require("../google-vision");
      
      analyzeImageWithOpenAI.mockRejectedValue(new Error("OpenAI failed"));
      analyzeImageWithGoogle.mockResolvedValue(mockAnalysis);

      // Fail OpenAI 3 times with first instance
      for (let i = 0; i < 3; i++) {
        try {
          await analyzer.analyzeImage("mock-base64");
        } catch (error) {
          // Expected to use Google fallback
        }
      }

      // Get a new instance (should be same singleton)
      const newAnalyzer = NutritionAnalyzer.getInstance();
      expect(newAnalyzer).toBe(analyzer);

      // Clear mocks and test that OpenAI is still skipped
      jest.clearAllMocks();
      analyzeImageWithGoogle.mockResolvedValue(mockAnalysis);

      await newAnalyzer.analyzeImage("mock-base64");
      
      expect(analyzeImageWithOpenAI).not.toHaveBeenCalled();
      expect(analyzeImageWithGoogle).toHaveBeenCalledWith("mock-base64");
    });

    it("should handle mixed success and failure scenarios", async () => {
      const { analyzeImageWithOpenAI } = require("../openai-vision");
      const { analyzeImageWithGoogle } = require("../google-vision");
      
      // First call: OpenAI fails, Google succeeds
      analyzeImageWithOpenAI.mockRejectedValueOnce(new Error("OpenAI failed"));
      analyzeImageWithGoogle.mockResolvedValueOnce(mockAnalysis);
      
      const result1 = await analyzer.analyzeImage("mock-base64-1");
      expect(result1).toEqual(mockAnalysis);
      
      // Second call: OpenAI succeeds (failure count reset)
      analyzeImageWithOpenAI.mockResolvedValueOnce(mockAnalysis);
      
      const result2 = await analyzer.analyzeImage("mock-base64-2");
      expect(result2).toEqual(mockAnalysis);
      
      // Verify both providers were called appropriately
      expect(analyzeImageWithOpenAI).toHaveBeenCalledTimes(2);
      expect(analyzeImageWithGoogle).toHaveBeenCalledTimes(1);
    });

    it("should handle provider order correctly", async () => {
      const { analyzeImageWithOpenAI } = require("../openai-vision");
      const { analyzeImageWithGoogle } = require("../google-vision");
      
      analyzeImageWithOpenAI.mockResolvedValue(mockAnalysis);
      analyzeImageWithGoogle.mockResolvedValue(mockAnalysis);
      
      await analyzer.analyzeImage("mock-base64");
      
      // OpenAI should be called first
      expect(analyzeImageWithOpenAI).toHaveBeenCalledWith("mock-base64");
      // Google should not be called if OpenAI succeeds
      expect(analyzeImageWithGoogle).not.toHaveBeenCalled();
    });
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

  describe("constructor and singleton behavior", () => {
    it("should return the same instance on multiple calls", () => {
      const instance1 = NutritionAnalyzer.getInstance();
      const instance2 = NutritionAnalyzer.getInstance();
      expect(instance1).toBe(instance2);
    });

    it("should initialize with empty failure counts", () => {
      const analyzer = NutritionAnalyzer.getInstance();
      // Test that failureCount Map is properly initialized
      expect((analyzer as any).failureCount).toBeInstanceOf(Map);
      expect((analyzer as any).failureCount.size).toBe(0);
    });

    it("should have correct MAX_FAILURES constant", () => {
      const analyzer = NutritionAnalyzer.getInstance();
      expect((analyzer as any).MAX_FAILURES).toBe(3);
    });
  });

  describe("input validation", () => {
    it("should handle empty string input", async () => {
      const { analyzeImageWithOpenAI } = require("../openai-vision");
      analyzeImageWithOpenAI.mockResolvedValue(mockAnalysis);

      const result = await analyzer.analyzeImage("");
      expect(result).toEqual(mockAnalysis);
      expect(analyzeImageWithOpenAI).toHaveBeenCalledWith("");
    });

    it("should handle null input gracefully", async () => {
      const { analyzeImageWithOpenAI } = require("../openai-vision");
      analyzeImageWithOpenAI.mockResolvedValue(mockAnalysis);

      const result = await analyzer.analyzeImage(null as any);
      expect(result).toEqual(mockAnalysis);
      expect(analyzeImageWithOpenAI).toHaveBeenCalledWith(null);
    });

    it("should handle undefined input gracefully", async () => {
      const { analyzeImageWithOpenAI } = require("../openai-vision");
      analyzeImageWithOpenAI.mockResolvedValue(mockAnalysis);

      const result = await analyzer.analyzeImage(undefined as any);
      expect(result).toEqual(mockAnalysis);
      expect(analyzeImageWithOpenAI).toHaveBeenCalledWith(undefined);
    });

    it("should handle very long base64 strings", async () => {
      const { analyzeImageWithOpenAI } = require("../openai-vision");
      analyzeImageWithOpenAI.mockResolvedValue(mockAnalysis);

      const longBase64 = "a".repeat(10000);
      const result = await analyzer.analyzeImage(longBase64);
      expect(result).toEqual(mockAnalysis);
      expect(analyzeImageWithOpenAI).toHaveBeenCalledWith(longBase64);
    });

    it("should handle special characters in base64", async () => {
      const { analyzeImageWithOpenAI } = require("../openai-vision");
      analyzeImageWithOpenAI.mockResolvedValue(mockAnalysis);

      const specialBase64 = "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD==";
      const result = await analyzer.analyzeImage(specialBase64);
      expect(result).toEqual(mockAnalysis);
      expect(analyzeImageWithOpenAI).toHaveBeenCalledWith(specialBase64);
    });
  });

  describe("error handling scenarios", () => {
    it("should handle OpenAI timeout errors specifically", async () => {
      const { analyzeImageWithOpenAI } = require("../openai-vision");
      const { analyzeImageWithGoogle } = require("../google-vision");
      
      const timeoutError = new Error("Request timeout");
      timeoutError.name = "TimeoutError";
      analyzeImageWithOpenAI.mockRejectedValue(timeoutError);
      analyzeImageWithGoogle.mockResolvedValue(mockAnalysis);

      const result = await analyzer.analyzeImage("mock-base64");
      expect(result).toEqual(mockAnalysis);
      expect(analyzeImageWithGoogle).toHaveBeenCalledWith("mock-base64");
    });

    it("should handle network errors", async () => {
      const { analyzeImageWithOpenAI } = require("../openai-vision");
      const { analyzeImageWithGoogle } = require("../google-vision");
      
      const networkError = new Error("Network error");
      networkError.name = "NetworkError";
      analyzeImageWithOpenAI.mockRejectedValue(networkError);
      analyzeImageWithGoogle.mockResolvedValue(mockAnalysis);

      const result = await analyzer.analyzeImage("mock-base64");
      expect(result).toEqual(mockAnalysis);
    });

    it("should handle rate limiting errors", async () => {
      const { analyzeImageWithOpenAI } = require("../openai-vision");
      const { analyzeImageWithGoogle } = require("../google-vision");
      
      const rateLimitError = new Error("Rate limit exceeded");
      rateLimitError.name = "RateLimitError";
      analyzeImageWithOpenAI.mockRejectedValue(rateLimitError);
      analyzeImageWithGoogle.mockResolvedValue(mockAnalysis);

      const result = await analyzer.analyzeImage("mock-base64");
      expect(result).toEqual(mockAnalysis);
    });

    it("should handle authentication errors", async () => {
      const { analyzeImageWithOpenAI } = require("../openai-vision");
      const { analyzeImageWithGoogle } = require("../google-vision");
      
      const authError = new Error("Authentication failed");
      authError.name = "AuthenticationError";
      analyzeImageWithOpenAI.mockRejectedValue(authError);
      analyzeImageWithGoogle.mockResolvedValue(mockAnalysis);

      const result = await analyzer.analyzeImage("mock-base64");
      expect(result).toEqual(mockAnalysis);
    });

    it("should handle malformed response from OpenAI", async () => {
      const { analyzeImageWithOpenAI } = require("../openai-vision");
      const { analyzeImageWithGoogle } = require("../google-vision");
      
      analyzeImageWithOpenAI.mockResolvedValue(null);
      analyzeImageWithGoogle.mockResolvedValue(mockAnalysis);

      const result = await analyzer.analyzeImage("mock-base64");
      expect(result).toEqual(mockAnalysis);
    });

    it("should handle malformed response from Google Vision", async () => {
      const { analyzeImageWithOpenAI } = require("../openai-vision");
      const { analyzeImageWithGoogle } = require("../google-vision");
      
      analyzeImageWithOpenAI.mockRejectedValue(new Error("OpenAI failed"));
      analyzeImageWithGoogle.mockResolvedValue(undefined);

      await expect(analyzer.analyzeImage("mock-base64")).rejects.toThrow("All AI providers failed to analyze the image");
    });

    it("should handle provider throwing non-Error objects", async () => {
      const { analyzeImageWithOpenAI } = require("../openai-vision");
      const { analyzeImageWithGoogle } = require("../google-vision");
      
      analyzeImageWithOpenAI.mockRejectedValue("String error");
      analyzeImageWithGoogle.mockResolvedValue(mockAnalysis);

      const result = await analyzer.analyzeImage("mock-base64");
      expect(result).toEqual(mockAnalysis);
    });
  });

  describe("provider failure tracking", () => {
    it("should track failures correctly for both providers", async () => {
      const { analyzeImageWithOpenAI } = require("../openai-vision");
      const { analyzeImageWithGoogle } = require("../google-vision");
      
      analyzeImageWithOpenAI.mockRejectedValue(new Error("OpenAI failed"));
      analyzeImageWithGoogle.mockRejectedValue(new Error("Google failed"));

      // Make multiple failed calls
      for (let i = 0; i < 5; i++) {
        try {
          await analyzer.analyzeImage("mock-base64");
        } catch (error) {
          // Expected to fail
        }
      }

      // OpenAI should be called only 3 times (max failures)
      expect(analyzeImageWithOpenAI).toHaveBeenCalledTimes(3);
      // Google should be called 5 times (not yet at max failures)
      expect(analyzeImageWithGoogle).toHaveBeenCalledTimes(5);
    });

    it("should reset failure count for specific provider after success", async () => {
      const { analyzeImageWithOpenAI } = require("../openai-vision");
      const { analyzeImageWithGoogle } = require("../google-vision");
      
      // Fail OpenAI twice
      analyzeImageWithOpenAI.mockRejectedValueOnce(new Error("OpenAI failed"));
      analyzeImageWithGoogle.mockResolvedValueOnce(mockAnalysis);
      await analyzer.analyzeImage("mock-base64");
      
      analyzeImageWithOpenAI.mockRejectedValueOnce(new Error("OpenAI failed"));
      analyzeImageWithGoogle.mockResolvedValueOnce(mockAnalysis);
      await analyzer.analyzeImage("mock-base64");

      // Clear mocks and make OpenAI succeed
      jest.clearAllMocks();
      analyzeImageWithOpenAI.mockResolvedValue(mockAnalysis);

      const result = await analyzer.analyzeImage("mock-base64");
      expect(result).toEqual(mockAnalysis);
      expect(analyzeImageWithOpenAI).toHaveBeenCalledWith("mock-base64");
    });

    it("should handle concurrent requests correctly", async () => {
      const { analyzeImageWithOpenAI } = require("../openai-vision");
      analyzeImageWithOpenAI.mockResolvedValue(mockAnalysis);

      // Make multiple concurrent requests
      const promises = [];
      for (let i = 0; i < 5; i++) {
        promises.push(analyzer.analyzeImage(`mock-base64-${i}`));
      }

      const results = await Promise.all(promises);
      expect(results).toHaveLength(5);
      results.forEach(result => expect(result).toEqual(mockAnalysis));
    });

    it("should skip both providers when both reach max failures", async () => {
      const { analyzeImageWithOpenAI } = require("../openai-vision");
      const { analyzeImageWithGoogle } = require("../google-vision");
      
      analyzeImageWithOpenAI.mockRejectedValue(new Error("OpenAI failed"));
      analyzeImageWithGoogle.mockRejectedValue(new Error("Google failed"));

      // Make enough calls to exhaust both providers
      for (let i = 0; i < 6; i++) {
        try {
          await analyzer.analyzeImage("mock-base64");
        } catch (error) {
          // Expected to fail
        }
      }

      // Clear mocks and verify neither provider is called
      jest.clearAllMocks();
      
      await expect(analyzer.analyzeImage("mock-base64")).rejects.toThrow("All AI providers failed to analyze the image");
      expect(analyzeImageWithOpenAI).not.toHaveBeenCalled();
      expect(analyzeImageWithGoogle).not.toHaveBeenCalled();
    });
  });

  describe("nutrition analysis response validation", () => {
    it("should handle analysis with multiple food items", async () => {
      const { analyzeImageWithOpenAI } = require("../openai-vision");
      
      const multiItemAnalysis = {
        ...mockAnalysis,
        foodItems: [
          {
            name: "Apple",
            quantity: "1 medium",
            calories: 95,
            protein_g: 0.5,
            carbs_g: 25,
            fat_g: 0.3,
            fiber_g: 4,
          },
          {
            name: "Banana",
            quantity: "1 large",
            calories: 121,
            protein_g: 1.5,
            carbs_g: 31,
            fat_g: 0.4,
            fiber_g: 3.1,
          }
        ],
        totalCalories: 216,
        totalProtein: 2.0,
        totalCarbs: 56,
        totalFat: 0.7,
        totalFiber: 7.1,
      };
      
      analyzeImageWithOpenAI.mockResolvedValue(multiItemAnalysis);

      const result = await analyzer.analyzeImage("mock-base64");
      expect(result).toEqual(multiItemAnalysis);
      expect(result.foodItems).toHaveLength(2);
    });

    it("should handle analysis with zero calories", async () => {
      const { analyzeImageWithOpenAI } = require("../openai-vision");
      
      const zeroCalorieAnalysis = {
        ...mockAnalysis,
        foodItems: [
          {
            name: "Water",
            quantity: "1 glass",
            calories: 0,
            protein_g: 0,
            carbs_g: 0,
            fat_g: 0,
            fiber_g: 0,
          }
        ],
        totalCalories: 0,
        totalProtein: 0,
        totalCarbs: 0,
        totalFat: 0,
        totalFiber: 0,
      };
      
      analyzeImageWithOpenAI.mockResolvedValue(zeroCalorieAnalysis);

      const result = await analyzer.analyzeImage("mock-base64");
      expect(result).toEqual(zeroCalorieAnalysis);
      expect(result.totalCalories).toBe(0);
    });

    it("should handle analysis with low confidence score", async () => {
      const { analyzeImageWithOpenAI } = require("../openai-vision");
      
      const lowConfidenceAnalysis = {
        ...mockAnalysis,
        confidenceScore: 0.1,
        analysisNotes: "Image quality is poor, analysis may be inaccurate",
      };
      
      analyzeImageWithOpenAI.mockResolvedValue(lowConfidenceAnalysis);

      const result = await analyzer.analyzeImage("mock-base64");
      expect(result).toEqual(lowConfidenceAnalysis);
      expect(result.confidenceScore).toBe(0.1);
    });

    it("should handle analysis with high confidence score", async () => {
      const { analyzeImageWithOpenAI } = require("../openai-vision");
      
      const highConfidenceAnalysis = {
        ...mockAnalysis,
        confidenceScore: 1.0,
        analysisNotes: "Perfect image quality, highly accurate analysis",
      };
      
      analyzeImageWithOpenAI.mockResolvedValue(highConfidenceAnalysis);

      const result = await analyzer.analyzeImage("mock-base64");
      expect(result).toEqual(highConfidenceAnalysis);
      expect(result.confidenceScore).toBe(1.0);
    });

    it("should handle analysis with missing optional fields", async () => {
      const { analyzeImageWithOpenAI } = require("../openai-vision");
      
      const minimalAnalysis = {
        foodItems: [
          {
            name: "Unknown Food",
            quantity: "1 serving",
            calories: 100,
            protein_g: 0,
            carbs_g: 0,
            fat_g: 0,
            fiber_g: 0,
          }
        ],
        totalCalories: 100,
        totalProtein: 0,
        totalCarbs: 0,
        totalFat: 0,
        totalFiber: 0,
        confidenceScore: 0.5,
        analysisNotes: "",
      };
      
      analyzeImageWithOpenAI.mockResolvedValue(minimalAnalysis);

      const result = await analyzer.analyzeImage("mock-base64");
      expect(result).toEqual(minimalAnalysis);
    });

    it("should handle analysis with empty food items array", async () => {
      const { analyzeImageWithOpenAI } = require("../openai-vision");
      
      const emptyAnalysis = {
        ...mockAnalysis,
        foodItems: [],
        totalCalories: 0,
        totalProtein: 0,
        totalCarbs: 0,
        totalFat: 0,
        totalFiber: 0,
        confidenceScore: 0.0,
        analysisNotes: "No food items detected in image",
      };
      
      analyzeImageWithOpenAI.mockResolvedValue(emptyAnalysis);

      const result = await analyzer.analyzeImage("mock-base64");
      expect(result).toEqual(emptyAnalysis);
      expect(result.foodItems).toHaveLength(0);
    });

    it("should handle analysis with fractional nutrition values", async () => {
      const { analyzeImageWithOpenAI } = require("../openai-vision");
      
      const fractionalAnalysis = {
        ...mockAnalysis,
        foodItems: [
          {
            name: "Half Apple",
            quantity: "0.5 medium",
            calories: 47.5,
            protein_g: 0.25,
            carbs_g: 12.5,
            fat_g: 0.15,
            fiber_g: 2.0,
          }
        ],
        totalCalories: 47.5,
        totalProtein: 0.25,
        totalCarbs: 12.5,
        totalFat: 0.15,
        totalFiber: 2.0,
      };
      
      analyzeImageWithOpenAI.mockResolvedValue(fractionalAnalysis);

      const result = await analyzer.analyzeImage("mock-base64");
      expect(result).toEqual(fractionalAnalysis);
      expect(result.totalCalories).toBe(47.5);
    });
  });

  describe("logging behavior", () => {
    it("should log successful analysis with provider info", async () => {
      const { analyzeImageWithOpenAI } = require("../openai-vision");
      const { info } = require("@/lib/logger");
      
      analyzeImageWithOpenAI.mockResolvedValue(mockAnalysis);

      await analyzer.analyzeImage("mock-base64");
      
      expect(info).toHaveBeenCalledWith(
        "Nutrition analysis successful",
        expect.objectContaining({
          provider: "openai",
          totalCalories: 95,
          confidenceScore: 0.9
        })
      );
    });

    it("should log provider failures with error details", async () => {
      const { analyzeImageWithOpenAI } = require("../openai-vision");
      const { analyzeImageWithGoogle } = require("../google-vision");
      const { error } = require("@/lib/logger");
      
      const testError = new Error("OpenAI API error");
      analyzeImageWithOpenAI.mockRejectedValue(testError);
      analyzeImageWithGoogle.mockResolvedValue(mockAnalysis);

      await analyzer.analyzeImage("mock-base64");
      
      expect(error).toHaveBeenCalledWith(
        "Nutrition analysis failed",
        expect.objectContaining({
          provider: "openai",
          error: testError
        })
      );
    });

    it("should log Google Vision success after OpenAI failure", async () => {
      const { analyzeImageWithOpenAI } = require("../openai-vision");
      const { analyzeImageWithGoogle } = require("../google-vision");
      const { info, error } = require("@/lib/logger");
      
      analyzeImageWithOpenAI.mockRejectedValue(new Error("OpenAI failed"));
      analyzeImageWithGoogle.mockResolvedValue(mockAnalysis);

      await analyzer.analyzeImage("mock-base64");
      
      expect(error).toHaveBeenCalledWith(
        "Nutrition analysis failed",
        expect.objectContaining({ provider: "openai" })
      );
      expect(info).toHaveBeenCalledWith(
        "Nutrition analysis successful",
        expect.objectContaining({ provider: "google" })
      );
    });
  });

  describe("performance and reliability", () => {
    it("should handle rapid successive calls", async () => {
      const { analyzeImageWithOpenAI } = require("../openai-vision");
      analyzeImageWithOpenAI.mockResolvedValue(mockAnalysis);

      const startTime = Date.now();
      
      // Make 10 rapid calls
      const promises = [];
      for (let i = 0; i < 10; i++) {
        promises.push(analyzer.analyzeImage(`mock-base64-${i}`));
      }

      const results = await Promise.all(promises);
      const endTime = Date.now();
      
      expect(results).toHaveLength(10);
      results.forEach(result => expect(result).toEqual(mockAnalysis));
      
      // Should complete reasonably quickly (less than 1 second in mock environment)
      expect(endTime - startTime).toBeLessThan(1000);
    });

    it("should maintain failure counts across multiple instances", async () => {
      const { analyzeImageWithOpenAI } = require("../openai-vision");
      const { analyzeImageWithGoogle } = require("../google-vision");
      
      analyzeImageWithOpenAI.mockRejectedValue(new Error("OpenAI failed"));
      analyzeImageWithGoogle.mockResolvedValue(mockAnalysis);

      // Fail OpenAI 3 times with first instance
      for (let i = 0; i < 3; i++) {
        try {
          await analyzer.analyzeImage("mock-base64");
        } catch (error) {
          // Expected to use Google fallback
        }
      }

      // Get a new instance (should be same singleton)
      const newAnalyzer = NutritionAnalyzer.getInstance();
      expect(newAnalyzer).toBe(analyzer);

      // Clear mocks and test that OpenAI is still skipped
      jest.clearAllMocks();
      analyzeImageWithGoogle.mockResolvedValue(mockAnalysis);

      await newAnalyzer.analyzeImage("mock-base64");
      
      expect(analyzeImageWithOpenAI).not.toHaveBeenCalled();
      expect(analyzeImageWithGoogle).toHaveBeenCalledWith("mock-base64");
    });

    it("should handle mixed success and failure scenarios", async () => {
      const { analyzeImageWithOpenAI } = require("../openai-vision");
      const { analyzeImageWithGoogle } = require("../google-vision");
      
      // First call: OpenAI fails, Google succeeds
      analyzeImageWithOpenAI.mockRejectedValueOnce(new Error("OpenAI failed"));
      analyzeImageWithGoogle.mockResolvedValueOnce(mockAnalysis);
      
      const result1 = await analyzer.analyzeImage("mock-base64-1");
      expect(result1).toEqual(mockAnalysis);
      
      // Second call: OpenAI succeeds (failure count reset)
      analyzeImageWithOpenAI.mockResolvedValueOnce(mockAnalysis);
      
      const result2 = await analyzer.analyzeImage("mock-base64-2");
      expect(result2).toEqual(mockAnalysis);
      
      // Verify both providers were called appropriately
      expect(analyzeImageWithOpenAI).toHaveBeenCalledTimes(2);
      expect(analyzeImageWithGoogle).toHaveBeenCalledTimes(1);
    });

    it("should handle provider order correctly", async () => {
      const { analyzeImageWithOpenAI } = require("../openai-vision");
      const { analyzeImageWithGoogle } = require("../google-vision");
      
      analyzeImageWithOpenAI.mockResolvedValue(mockAnalysis);
      analyzeImageWithGoogle.mockResolvedValue(mockAnalysis);
      
      await analyzer.analyzeImage("mock-base64");
      
      // OpenAI should be called first
      expect(analyzeImageWithOpenAI).toHaveBeenCalledWith("mock-base64");
      // Google should not be called if OpenAI succeeds
      expect(analyzeImageWithGoogle).not.toHaveBeenCalled();
    });
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

  describe("constructor and singleton behavior", () => {
    it("should return the same instance on multiple calls", () => {
      const instance1 = NutritionAnalyzer.getInstance();
      const instance2 = NutritionAnalyzer.getInstance();
      expect(instance1).toBe(instance2);
    });

    it("should initialize with empty failure counts", () => {
      const analyzer = NutritionAnalyzer.getInstance();
      // Test that failureCount Map is properly initialized
      expect((analyzer as any).failureCount).toBeInstanceOf(Map);
      expect((analyzer as any).failureCount.size).toBe(0);
    });

    it("should have correct MAX_FAILURES constant", () => {
      const analyzer = NutritionAnalyzer.getInstance();
      expect((analyzer as any).MAX_FAILURES).toBe(3);
    });
  });

  describe("input validation", () => {
    it("should handle empty string input", async () => {
      const { analyzeImageWithOpenAI } = require("../openai-vision");
      analyzeImageWithOpenAI.mockResolvedValue(mockAnalysis);

      const result = await analyzer.analyzeImage("");
      expect(result).toEqual(mockAnalysis);
      expect(analyzeImageWithOpenAI).toHaveBeenCalledWith("");
    });

    it("should handle null input gracefully", async () => {
      const { analyzeImageWithOpenAI } = require("../openai-vision");
      analyzeImageWithOpenAI.mockResolvedValue(mockAnalysis);

      const result = await analyzer.analyzeImage(null as any);
      expect(result).toEqual(mockAnalysis);
      expect(analyzeImageWithOpenAI).toHaveBeenCalledWith(null);
    });

    it("should handle undefined input gracefully", async () => {
      const { analyzeImageWithOpenAI } = require("../openai-vision");
      analyzeImageWithOpenAI.mockResolvedValue(mockAnalysis);

      const result = await analyzer.analyzeImage(undefined as any);
      expect(result).toEqual(mockAnalysis);
      expect(analyzeImageWithOpenAI).toHaveBeenCalledWith(undefined);
    });

    it("should handle very long base64 strings", async () => {
      const { analyzeImageWithOpenAI } = require("../openai-vision");
      analyzeImageWithOpenAI.mockResolvedValue(mockAnalysis);

      const longBase64 = "a".repeat(10000);
      const result = await analyzer.analyzeImage(longBase64);
      expect(result).toEqual(mockAnalysis);
      expect(analyzeImageWithOpenAI).toHaveBeenCalledWith(longBase64);
    });

    it("should handle special characters in base64", async () => {
      const { analyzeImageWithOpenAI } = require("../openai-vision");
      analyzeImageWithOpenAI.mockResolvedValue(mockAnalysis);

      const specialBase64 = "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD==";
      const result = await analyzer.analyzeImage(specialBase64);
      expect(result).toEqual(mockAnalysis);
      expect(analyzeImageWithOpenAI).toHaveBeenCalledWith(specialBase64);
    });
  });

  describe("error handling scenarios", () => {
    it("should handle OpenAI timeout errors specifically", async () => {
      const { analyzeImageWithOpenAI } = require("../openai-vision");
      const { analyzeImageWithGoogle } = require("../google-vision");
      
      const timeoutError = new Error("Request timeout");
      timeoutError.name = "TimeoutError";
      analyzeImageWithOpenAI.mockRejectedValue(timeoutError);
      analyzeImageWithGoogle.mockResolvedValue(mockAnalysis);

      const result = await analyzer.analyzeImage("mock-base64");
      expect(result).toEqual(mockAnalysis);
      expect(analyzeImageWithGoogle).toHaveBeenCalledWith("mock-base64");
    });

    it("should handle network errors", async () => {
      const { analyzeImageWithOpenAI } = require("../openai-vision");
      const { analyzeImageWithGoogle } = require("../google-vision");
      
      const networkError = new Error("Network error");
      networkError.name = "NetworkError";
      analyzeImageWithOpenAI.mockRejectedValue(networkError);
      analyzeImageWithGoogle.mockResolvedValue(mockAnalysis);

      const result = await analyzer.analyzeImage("mock-base64");
      expect(result).toEqual(mockAnalysis);
    });

    it("should handle rate limiting errors", async () => {
      const { analyzeImageWithOpenAI } = require("../openai-vision");
      const { analyzeImageWithGoogle } = require("../google-vision");
      
      const rateLimitError = new Error("Rate limit exceeded");
      rateLimitError.name = "RateLimitError";
      analyzeImageWithOpenAI.mockRejectedValue(rateLimitError);
      analyzeImageWithGoogle.mockResolvedValue(mockAnalysis);

      const result = await analyzer.analyzeImage("mock-base64");
      expect(result).toEqual(mockAnalysis);
    });

    it("should handle authentication errors", async () => {
      const { analyzeImageWithOpenAI } = require("../openai-vision");
      const { analyzeImageWithGoogle } = require("../google-vision");
      
      const authError = new Error("Authentication failed");
      authError.name = "AuthenticationError";
      analyzeImageWithOpenAI.mockRejectedValue(authError);
      analyzeImageWithGoogle.mockResolvedValue(mockAnalysis);

      const result = await analyzer.analyzeImage("mock-base64");
      expect(result).toEqual(mockAnalysis);
    });

    it("should handle malformed response from OpenAI", async () => {
      const { analyzeImageWithOpenAI } = require("../openai-vision");
      const { analyzeImageWithGoogle } = require("../google-vision");
      
      analyzeImageWithOpenAI.mockResolvedValue(null);
      analyzeImageWithGoogle.mockResolvedValue(mockAnalysis);

      const result = await analyzer.analyzeImage("mock-base64");
      expect(result).toEqual(mockAnalysis);
    });

    it("should handle malformed response from Google Vision", async () => {
      const { analyzeImageWithOpenAI } = require("../openai-vision");
      const { analyzeImageWithGoogle } = require("../google-vision");
      
      analyzeImageWithOpenAI.mockRejectedValue(new Error("OpenAI failed"));
      analyzeImageWithGoogle.mockResolvedValue(undefined);

      await expect(analyzer.analyzeImage("mock-base64")).rejects.toThrow("All AI providers failed to analyze the image");
    });

    it("should handle provider throwing non-Error objects", async () => {
      const { analyzeImageWithOpenAI } = require("../openai-vision");
      const { analyzeImageWithGoogle } = require("../google-vision");
      
      analyzeImageWithOpenAI.mockRejectedValue("String error");
      analyzeImageWithGoogle.mockResolvedValue(mockAnalysis);

      const result = await analyzer.analyzeImage("mock-base64");
      expect(result).toEqual(mockAnalysis);
    });
  });

  describe("provider failure tracking", () => {
    it("should track failures correctly for both providers", async () => {
      const { analyzeImageWithOpenAI } = require("../openai-vision");
      const { analyzeImageWithGoogle } = require("../google-vision");
      
      analyzeImageWithOpenAI.mockRejectedValue(new Error("OpenAI failed"));
      analyzeImageWithGoogle.mockRejectedValue(new Error("Google failed"));

      // Make multiple failed calls
      for (let i = 0; i < 5; i++) {
        try {
          await analyzer.analyzeImage("mock-base64");
        } catch (error) {
          // Expected to fail
        }
      }

      // OpenAI should be called only 3 times (max failures)
      expect(analyzeImageWithOpenAI).toHaveBeenCalledTimes(3);
      // Google should be called 5 times (not yet at max failures)
      expect(analyzeImageWithGoogle).toHaveBeenCalledTimes(5);
    });

    it("should reset failure count for specific provider after success", async () => {
      const { analyzeImageWithOpenAI } = require("../openai-vision");
      const { analyzeImageWithGoogle } = require("../google-vision");
      
      // Fail OpenAI twice
      analyzeImageWithOpenAI.mockRejectedValueOnce(new Error("OpenAI failed"));
      analyzeImageWithGoogle.mockResolvedValueOnce(mockAnalysis);
      await analyzer.analyzeImage("mock-base64");
      
      analyzeImageWithOpenAI.mockRejectedValueOnce(new Error("OpenAI failed"));
      analyzeImageWithGoogle.mockResolvedValueOnce(mockAnalysis);
      await analyzer.analyzeImage("mock-base64");

      // Clear mocks and make OpenAI succeed
      jest.clearAllMocks();
      analyzeImageWithOpenAI.mockResolvedValue(mockAnalysis);

      const result = await analyzer.analyzeImage("mock-base64");
      expect(result).toEqual(mockAnalysis);
      expect(analyzeImageWithOpenAI).toHaveBeenCalledWith("mock-base64");
    });

    it("should handle concurrent requests correctly", async () => {
      const { analyzeImageWithOpenAI } = require("../openai-vision");
      analyzeImageWithOpenAI.mockResolvedValue(mockAnalysis);

      // Make multiple concurrent requests
      const promises = [];
      for (let i = 0; i < 5; i++) {
        promises.push(analyzer.analyzeImage(`mock-base64-${i}`));
      }

      const results = await Promise.all(promises);
      expect(results).toHaveLength(5);
      results.forEach(result => expect(result).toEqual(mockAnalysis));
    });

    it("should skip both providers when both reach max failures", async () => {
      const { analyzeImageWithOpenAI } = require("../openai-vision");
      const { analyzeImageWithGoogle } = require("../google-vision");
      
      analyzeImageWithOpenAI.mockRejectedValue(new Error("OpenAI failed"));
      analyzeImageWithGoogle.mockRejectedValue(new Error("Google failed"));

      // Make enough calls to exhaust both providers
      for (let i = 0; i < 6; i++) {
        try {
          await analyzer.analyzeImage("mock-base64");
        } catch (error) {
          // Expected to fail
        }
      }

      // Clear mocks and verify neither provider is called
      jest.clearAllMocks();
      
      await expect(analyzer.analyzeImage("mock-base64")).rejects.toThrow("All AI providers failed to analyze the image");
      expect(analyzeImageWithOpenAI).not.toHaveBeenCalled();
      expect(analyzeImageWithGoogle).not.toHaveBeenCalled();
    });
  });

  describe("nutrition analysis response validation", () => {
    it("should handle analysis with multiple food items", async () => {
      const { analyzeImageWithOpenAI } = require("../openai-vision");
      
      const multiItemAnalysis = {
        ...mockAnalysis,
        foodItems: [
          {
            name: "Apple",
            quantity: "1 medium",
            calories: 95,
            protein_g: 0.5,
            carbs_g: 25,
            fat_g: 0.3,
            fiber_g: 4,
          },
          {
            name: "Banana",
            quantity: "1 large",
            calories: 121,
            protein_g: 1.5,
            carbs_g: 31,
            fat_g: 0.4,
            fiber_g: 3.1,
          }
        ],
        totalCalories: 216,
        totalProtein: 2.0,
        totalCarbs: 56,
        totalFat: 0.7,
        totalFiber: 7.1,
      };
      
      analyzeImageWithOpenAI.mockResolvedValue(multiItemAnalysis);

      const result = await analyzer.analyzeImage("mock-base64");
      expect(result).toEqual(multiItemAnalysis);
      expect(result.foodItems).toHaveLength(2);
    });

    it("should handle analysis with zero calories", async () => {
      const { analyzeImageWithOpenAI } = require("../openai-vision");
      
      const zeroCalorieAnalysis = {
        ...mockAnalysis,
        foodItems: [
          {
            name: "Water",
            quantity: "1 glass",
            calories: 0,
            protein_g: 0,
            carbs_g: 0,
            fat_g: 0,
            fiber_g: 0,
          }
        ],
        totalCalories: 0,
        totalProtein: 0,
        totalCarbs: 0,
        totalFat: 0,
        totalFiber: 0,
      };
      
      analyzeImageWithOpenAI.mockResolvedValue(zeroCalorieAnalysis);

      const result = await analyzer.analyzeImage("mock-base64");
      expect(result).toEqual(zeroCalorieAnalysis);
      expect(result.totalCalories).toBe(0);
    });

    it("should handle analysis with low confidence score", async () => {
      const { analyzeImageWithOpenAI } = require("../openai-vision");
      
      const lowConfidenceAnalysis = {
        ...mockAnalysis,
        confidenceScore: 0.1,
        analysisNotes: "Image quality is poor, analysis may be inaccurate",
      };
      
      analyzeImageWithOpenAI.mockResolvedValue(lowConfidenceAnalysis);

      const result = await analyzer.analyzeImage("mock-base64");
      expect(result).toEqual(lowConfidenceAnalysis);
      expect(result.confidenceScore).toBe(0.1);
    });

    it("should handle analysis with high confidence score", async () => {
      const { analyzeImageWithOpenAI } = require("../openai-vision");
      
      const highConfidenceAnalysis = {
        ...mockAnalysis,
        confidenceScore: 1.0,
        analysisNotes: "Perfect image quality, highly accurate analysis",
      };
      
      analyzeImageWithOpenAI.mockResolvedValue(highConfidenceAnalysis);

      const result = await analyzer.analyzeImage("mock-base64");
      expect(result).toEqual(highConfidenceAnalysis);
      expect(result.confidenceScore).toBe(1.0);
    });

    it("should handle analysis with missing optional fields", async () => {
      const { analyzeImageWithOpenAI } = require("../openai-vision");
      
      const minimalAnalysis = {
        foodItems: [
          {
            name: "Unknown Food",
            quantity: "1 serving",
            calories: 100,
            protein_g: 0,
            carbs_g: 0,
            fat_g: 0,
            fiber_g: 0,
          }
        ],
        totalCalories: 100,
        totalProtein: 0,
        totalCarbs: 0,
        totalFat: 0,
        totalFiber: 0,
        confidenceScore: 0.5,
        analysisNotes: "",
      };
      
      analyzeImageWithOpenAI.mockResolvedValue(minimalAnalysis);

      const result = await analyzer.analyzeImage("mock-base64");
      expect(result).toEqual(minimalAnalysis);
    });

    it("should handle analysis with empty food items array", async () => {
      const { analyzeImageWithOpenAI } = require("../openai-vision");
      
      const emptyAnalysis = {
        ...mockAnalysis,
        foodItems: [],
        totalCalories: 0,
        totalProtein: 0,
        totalCarbs: 0,
        totalFat: 0,
        totalFiber: 0,
        confidenceScore: 0.0,
        analysisNotes: "No food items detected in image",
      };
      
      analyzeImageWithOpenAI.mockResolvedValue(emptyAnalysis);

      const result = await analyzer.analyzeImage("mock-base64");
      expect(result).toEqual(emptyAnalysis);
      expect(result.foodItems).toHaveLength(0);
    });

    it("should handle analysis with fractional nutrition values", async () => {
      const { analyzeImageWithOpenAI } = require("../openai-vision");
      
      const fractionalAnalysis = {
        ...mockAnalysis,
        foodItems: [
          {
            name: "Half Apple",
            quantity: "0.5 medium",
            calories: 47.5,
            protein_g: 0.25,
            carbs_g: 12.5,
            fat_g: 0.15,
            fiber_g: 2.0,
          }
        ],
        totalCalories: 47.5,
        totalProtein: 0.25,
        totalCarbs: 12.5,
        totalFat: 0.15,
        totalFiber: 2.0,
      };
      
      analyzeImageWithOpenAI.mockResolvedValue(fractionalAnalysis);

      const result = await analyzer.analyzeImage("mock-base64");
      expect(result).toEqual(fractionalAnalysis);
      expect(result.totalCalories).toBe(47.5);
    });
  });

  describe("logging behavior", () => {
    it("should log successful analysis with provider info", async () => {
      const { analyzeImageWithOpenAI } = require("../openai-vision");
      const { info } = require("@/lib/logger");
      
      analyzeImageWithOpenAI.mockResolvedValue(mockAnalysis);

      await analyzer.analyzeImage("mock-base64");
      
      expect(info).toHaveBeenCalledWith(
        "Nutrition analysis successful",
        expect.objectContaining({
          provider: "openai",
          totalCalories: 95,
          confidenceScore: 0.9
        })
      );
    });

    it("should log provider failures with error details", async () => {
      const { analyzeImageWithOpenAI } = require("../openai-vision");
      const { analyzeImageWithGoogle } = require("../google-vision");
      const { error } = require("@/lib/logger");
      
      const testError = new Error("OpenAI API error");
      analyzeImageWithOpenAI.mockRejectedValue(testError);
      analyzeImageWithGoogle.mockResolvedValue(mockAnalysis);

      await analyzer.analyzeImage("mock-base64");
      
      expect(error).toHaveBeenCalledWith(
        "Nutrition analysis failed",
        expect.objectContaining({
          provider: "openai",
          error: testError
        })
      );
    });

    it("should log Google Vision success after OpenAI failure", async () => {
      const { analyzeImageWithOpenAI } = require("../openai-vision");
      const { analyzeImageWithGoogle } = require("../google-vision");
      const { info, error } = require("@/lib/logger");
      
      analyzeImageWithOpenAI.mockRejectedValue(new Error("OpenAI failed"));
      analyzeImageWithGoogle.mockResolvedValue(mockAnalysis);

      await analyzer.analyzeImage("mock-base64");
      
      expect(error).toHaveBeenCalledWith(
        "Nutrition analysis failed",
        expect.objectContaining({ provider: "openai" })
      );
      expect(info).toHaveBeenCalledWith(
        "Nutrition analysis successful",
        expect.objectContaining({ provider: "google" })
      );
    });
  });

  describe("performance and reliability", () => {
    it("should handle rapid successive calls", async () => {
      const { analyzeImageWithOpenAI } = require("../openai-vision");
      analyzeImageWithOpenAI.mockResolvedValue(mockAnalysis);

      const startTime = Date.now();
      
      // Make 10 rapid calls
      const promises = [];
      for (let i = 0; i < 10; i++) {
        promises.push(analyzer.analyzeImage(`mock-base64-${i}`));
      }

      const results = await Promise.all(promises);
      const endTime = Date.now();
      
      expect(results).toHaveLength(10);
      results.forEach(result => expect(result).toEqual(mockAnalysis));
      
      // Should complete reasonably quickly (less than 1 second in mock environment)
      expect(endTime - startTime).toBeLessThan(1000);
    });

    it("should maintain failure counts across multiple instances", async () => {
      const { analyzeImageWithOpenAI } = require("../openai-vision");
      const { analyzeImageWithGoogle } = require("../google-vision");
      
      analyzeImageWithOpenAI.mockRejectedValue(new Error("OpenAI failed"));
      analyzeImageWithGoogle.mockResolvedValue(mockAnalysis);

      // Fail OpenAI 3 times with first instance
      for (let i = 0; i < 3; i++) {
        try {
          await analyzer.analyzeImage("mock-base64");
        } catch (error) {
          // Expected to use Google fallback
        }
      }

      // Get a new instance (should be same singleton)
      const newAnalyzer = NutritionAnalyzer.getInstance();
      expect(newAnalyzer).toBe(analyzer);

      // Clear mocks and test that OpenAI is still skipped
      jest.clearAllMocks();
      analyzeImageWithGoogle.mockResolvedValue(mockAnalysis);

      await newAnalyzer.analyzeImage("mock-base64");
      
      expect(analyzeImageWithOpenAI).not.toHaveBeenCalled();
      expect(analyzeImageWithGoogle).toHaveBeenCalledWith("mock-base64");
    });

    it("should handle mixed success and failure scenarios", async () => {
      const { analyzeImageWithOpenAI } = require("../openai-vision");
      const { analyzeImageWithGoogle } = require("../google-vision");
      
      // First call: OpenAI fails, Google succeeds
      analyzeImageWithOpenAI.mockRejectedValueOnce(new Error("OpenAI failed"));
      analyzeImageWithGoogle.mockResolvedValueOnce(mockAnalysis);
      
      const result1 = await analyzer.analyzeImage("mock-base64-1");
      expect(result1).toEqual(mockAnalysis);
      
      // Second call: OpenAI succeeds (failure count reset)
      analyzeImageWithOpenAI.mockResolvedValueOnce(mockAnalysis);
      
      const result2 = await analyzer.analyzeImage("mock-base64-2");
      expect(result2).toEqual(mockAnalysis);
      
      // Verify both providers were called appropriately
      expect(analyzeImageWithOpenAI).toHaveBeenCalledTimes(2);
      expect(analyzeImageWithGoogle).toHaveBeenCalledTimes(1);
    });

    it("should handle provider order correctly", async () => {
      const { analyzeImageWithOpenAI } = require("../openai-vision");
      const { analyzeImageWithGoogle } = require("../google-vision");
      
      analyzeImageWithOpenAI.mockResolvedValue(mockAnalysis);
      analyzeImageWithGoogle.mockResolvedValue(mockAnalysis);
      
      await analyzer.analyzeImage("mock-base64");
      
      // OpenAI should be called first
      expect(analyzeImageWithOpenAI).toHaveBeenCalledWith("mock-base64");
      // Google should not be called if OpenAI succeeds
      expect(analyzeImageWithGoogle).not.toHaveBeenCalled();
    });
  });


  it('should throw error when all providers fail', async () => {
    const { analyzeImageWithOpenAI } = require('../openai-vision');
    const { analyzeImageWithGoogle } = require('../google-vision');
    
    analyzeImageWithOpenAI.mockRejectedValue(new Error('OpenAI failed'));
    analyzeImageWithGoogle.mockRejectedValue(new Error('Google failed'));

    await expect(analyzer.analyzeImage('mock-base64')).rejects.toThrow('All AI providers failed');
  });

  describe("constructor and singleton behavior", () => {
    it("should return the same instance on multiple calls", () => {
      const instance1 = NutritionAnalyzer.getInstance();
      const instance2 = NutritionAnalyzer.getInstance();
      expect(instance1).toBe(instance2);
    });

    it("should initialize with empty failure counts", () => {
      const analyzer = NutritionAnalyzer.getInstance();
      // Test that failureCount Map is properly initialized
      expect((analyzer as any).failureCount).toBeInstanceOf(Map);
      expect((analyzer as any).failureCount.size).toBe(0);
    });

    it("should have correct MAX_FAILURES constant", () => {
      const analyzer = NutritionAnalyzer.getInstance();
      expect((analyzer as any).MAX_FAILURES).toBe(3);
    });
  });

  describe("input validation", () => {
    it("should handle empty string input", async () => {
      const { analyzeImageWithOpenAI } = require("../openai-vision");
      analyzeImageWithOpenAI.mockResolvedValue(mockAnalysis);

      const result = await analyzer.analyzeImage("");
      expect(result).toEqual(mockAnalysis);
      expect(analyzeImageWithOpenAI).toHaveBeenCalledWith("");
    });

    it("should handle null input gracefully", async () => {
      const { analyzeImageWithOpenAI } = require("../openai-vision");
      analyzeImageWithOpenAI.mockResolvedValue(mockAnalysis);

      const result = await analyzer.analyzeImage(null as any);
      expect(result).toEqual(mockAnalysis);
      expect(analyzeImageWithOpenAI).toHaveBeenCalledWith(null);
    });

    it("should handle undefined input gracefully", async () => {
      const { analyzeImageWithOpenAI } = require("../openai-vision");
      analyzeImageWithOpenAI.mockResolvedValue(mockAnalysis);

      const result = await analyzer.analyzeImage(undefined as any);
      expect(result).toEqual(mockAnalysis);
      expect(analyzeImageWithOpenAI).toHaveBeenCalledWith(undefined);
    });

    it("should handle very long base64 strings", async () => {
      const { analyzeImageWithOpenAI } = require("../openai-vision");
      analyzeImageWithOpenAI.mockResolvedValue(mockAnalysis);

      const longBase64 = "a".repeat(10000);
      const result = await analyzer.analyzeImage(longBase64);
      expect(result).toEqual(mockAnalysis);
      expect(analyzeImageWithOpenAI).toHaveBeenCalledWith(longBase64);
    });

    it("should handle special characters in base64", async () => {
      const { analyzeImageWithOpenAI } = require("../openai-vision");
      analyzeImageWithOpenAI.mockResolvedValue(mockAnalysis);

      const specialBase64 = "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD==";
      const result = await analyzer.analyzeImage(specialBase64);
      expect(result).toEqual(mockAnalysis);
      expect(analyzeImageWithOpenAI).toHaveBeenCalledWith(specialBase64);
    });
  });

  describe("error handling scenarios", () => {
    it("should handle OpenAI timeout errors specifically", async () => {
      const { analyzeImageWithOpenAI } = require("../openai-vision");
      const { analyzeImageWithGoogle } = require("../google-vision");
      
      const timeoutError = new Error("Request timeout");
      timeoutError.name = "TimeoutError";
      analyzeImageWithOpenAI.mockRejectedValue(timeoutError);
      analyzeImageWithGoogle.mockResolvedValue(mockAnalysis);

      const result = await analyzer.analyzeImage("mock-base64");
      expect(result).toEqual(mockAnalysis);
      expect(analyzeImageWithGoogle).toHaveBeenCalledWith("mock-base64");
    });

    it("should handle network errors", async () => {
      const { analyzeImageWithOpenAI } = require("../openai-vision");
      const { analyzeImageWithGoogle } = require("../google-vision");
      
      const networkError = new Error("Network error");
      networkError.name = "NetworkError";
      analyzeImageWithOpenAI.mockRejectedValue(networkError);
      analyzeImageWithGoogle.mockResolvedValue(mockAnalysis);

      const result = await analyzer.analyzeImage("mock-base64");
      expect(result).toEqual(mockAnalysis);
    });

    it("should handle rate limiting errors", async () => {
      const { analyzeImageWithOpenAI } = require("../openai-vision");
      const { analyzeImageWithGoogle } = require("../google-vision");
      
      const rateLimitError = new Error("Rate limit exceeded");
      rateLimitError.name = "RateLimitError";
      analyzeImageWithOpenAI.mockRejectedValue(rateLimitError);
      analyzeImageWithGoogle.mockResolvedValue(mockAnalysis);

      const result = await analyzer.analyzeImage("mock-base64");
      expect(result).toEqual(mockAnalysis);
    });

    it("should handle authentication errors", async () => {
      const { analyzeImageWithOpenAI } = require("../openai-vision");
      const { analyzeImageWithGoogle } = require("../google-vision");
      
      const authError = new Error("Authentication failed");
      authError.name = "AuthenticationError";
      analyzeImageWithOpenAI.mockRejectedValue(authError);
      analyzeImageWithGoogle.mockResolvedValue(mockAnalysis);

      const result = await analyzer.analyzeImage("mock-base64");
      expect(result).toEqual(mockAnalysis);
    });

    it("should handle malformed response from OpenAI", async () => {
      const { analyzeImageWithOpenAI } = require("../openai-vision");
      const { analyzeImageWithGoogle } = require("../google-vision");
      
      analyzeImageWithOpenAI.mockResolvedValue(null);
      analyzeImageWithGoogle.mockResolvedValue(mockAnalysis);

      const result = await analyzer.analyzeImage("mock-base64");
      expect(result).toEqual(mockAnalysis);
    });

    it("should handle malformed response from Google Vision", async () => {
      const { analyzeImageWithOpenAI } = require("../openai-vision");
      const { analyzeImageWithGoogle } = require("../google-vision");
      
      analyzeImageWithOpenAI.mockRejectedValue(new Error("OpenAI failed"));
      analyzeImageWithGoogle.mockResolvedValue(undefined);

      await expect(analyzer.analyzeImage("mock-base64")).rejects.toThrow("All AI providers failed to analyze the image");
    });

    it("should handle provider throwing non-Error objects", async () => {
      const { analyzeImageWithOpenAI } = require("../openai-vision");
      const { analyzeImageWithGoogle } = require("../google-vision");
      
      analyzeImageWithOpenAI.mockRejectedValue("String error");
      analyzeImageWithGoogle.mockResolvedValue(mockAnalysis);

      const result = await analyzer.analyzeImage("mock-base64");
      expect(result).toEqual(mockAnalysis);
    });
  });

  describe("provider failure tracking", () => {
    it("should track failures correctly for both providers", async () => {
      const { analyzeImageWithOpenAI } = require("../openai-vision");
      const { analyzeImageWithGoogle } = require("../google-vision");
      
      analyzeImageWithOpenAI.mockRejectedValue(new Error("OpenAI failed"));
      analyzeImageWithGoogle.mockRejectedValue(new Error("Google failed"));

      // Make multiple failed calls
      for (let i = 0; i < 5; i++) {
        try {
          await analyzer.analyzeImage("mock-base64");
        } catch (error) {
          // Expected to fail
        }
      }

      // OpenAI should be called only 3 times (max failures)
      expect(analyzeImageWithOpenAI).toHaveBeenCalledTimes(3);
      // Google should be called 5 times (not yet at max failures)
      expect(analyzeImageWithGoogle).toHaveBeenCalledTimes(5);
    });

    it("should reset failure count for specific provider after success", async () => {
      const { analyzeImageWithOpenAI } = require("../openai-vision");
      const { analyzeImageWithGoogle } = require("../google-vision");
      
      // Fail OpenAI twice
      analyzeImageWithOpenAI.mockRejectedValueOnce(new Error("OpenAI failed"));
      analyzeImageWithGoogle.mockResolvedValueOnce(mockAnalysis);
      await analyzer.analyzeImage("mock-base64");
      
      analyzeImageWithOpenAI.mockRejectedValueOnce(new Error("OpenAI failed"));
      analyzeImageWithGoogle.mockResolvedValueOnce(mockAnalysis);
      await analyzer.analyzeImage("mock-base64");

      // Clear mocks and make OpenAI succeed
      jest.clearAllMocks();
      analyzeImageWithOpenAI.mockResolvedValue(mockAnalysis);

      const result = await analyzer.analyzeImage("mock-base64");
      expect(result).toEqual(mockAnalysis);
      expect(analyzeImageWithOpenAI).toHaveBeenCalledWith("mock-base64");
    });

    it("should handle concurrent requests correctly", async () => {
      const { analyzeImageWithOpenAI } = require("../openai-vision");
      analyzeImageWithOpenAI.mockResolvedValue(mockAnalysis);

      // Make multiple concurrent requests
      const promises = [];
      for (let i = 0; i < 5; i++) {
        promises.push(analyzer.analyzeImage(`mock-base64-${i}`));
      }

      const results = await Promise.all(promises);
      expect(results).toHaveLength(5);
      results.forEach(result => expect(result).toEqual(mockAnalysis));
    });

    it("should skip both providers when both reach max failures", async () => {
      const { analyzeImageWithOpenAI } = require("../openai-vision");
      const { analyzeImageWithGoogle } = require("../google-vision");
      
      analyzeImageWithOpenAI.mockRejectedValue(new Error("OpenAI failed"));
      analyzeImageWithGoogle.mockRejectedValue(new Error("Google failed"));

      // Make enough calls to exhaust both providers
      for (let i = 0; i < 6; i++) {
        try {
          await analyzer.analyzeImage("mock-base64");
        } catch (error) {
          // Expected to fail
        }
      }

      // Clear mocks and verify neither provider is called
      jest.clearAllMocks();
      
      await expect(analyzer.analyzeImage("mock-base64")).rejects.toThrow("All AI providers failed to analyze the image");
      expect(analyzeImageWithOpenAI).not.toHaveBeenCalled();
      expect(analyzeImageWithGoogle).not.toHaveBeenCalled();
    });
  });

  describe("nutrition analysis response validation", () => {
    it("should handle analysis with multiple food items", async () => {
      const { analyzeImageWithOpenAI } = require("../openai-vision");
      
      const multiItemAnalysis = {
        ...mockAnalysis,
        foodItems: [
          {
            name: "Apple",
            quantity: "1 medium",
            calories: 95,
            protein_g: 0.5,
            carbs_g: 25,
            fat_g: 0.3,
            fiber_g: 4,
          },
          {
            name: "Banana",
            quantity: "1 large",
            calories: 121,
            protein_g: 1.5,
            carbs_g: 31,
            fat_g: 0.4,
            fiber_g: 3.1,
          }
        ],
        totalCalories: 216,
        totalProtein: 2.0,
        totalCarbs: 56,
        totalFat: 0.7,
        totalFiber: 7.1,
      };
      
      analyzeImageWithOpenAI.mockResolvedValue(multiItemAnalysis);

      const result = await analyzer.analyzeImage("mock-base64");
      expect(result).toEqual(multiItemAnalysis);
      expect(result.foodItems).toHaveLength(2);
    });

    it("should handle analysis with zero calories", async () => {
      const { analyzeImageWithOpenAI } = require("../openai-vision");
      
      const zeroCalorieAnalysis = {
        ...mockAnalysis,
        foodItems: [
          {
            name: "Water",
            quantity: "1 glass",
            calories: 0,
            protein_g: 0,
            carbs_g: 0,
            fat_g: 0,
            fiber_g: 0,
          }
        ],
        totalCalories: 0,
        totalProtein: 0,
        totalCarbs: 0,
        totalFat: 0,
        totalFiber: 0,
      };
      
      analyzeImageWithOpenAI.mockResolvedValue(zeroCalorieAnalysis);

      const result = await analyzer.analyzeImage("mock-base64");
      expect(result).toEqual(zeroCalorieAnalysis);
      expect(result.totalCalories).toBe(0);
    });

    it("should handle analysis with low confidence score", async () => {
      const { analyzeImageWithOpenAI } = require("../openai-vision");
      
      const lowConfidenceAnalysis = {
        ...mockAnalysis,
        confidenceScore: 0.1,
        analysisNotes: "Image quality is poor, analysis may be inaccurate",
      };
      
      analyzeImageWithOpenAI.mockResolvedValue(lowConfidenceAnalysis);

      const result = await analyzer.analyzeImage("mock-base64");
      expect(result).toEqual(lowConfidenceAnalysis);
      expect(result.confidenceScore).toBe(0.1);
    });

    it("should handle analysis with high confidence score", async () => {
      const { analyzeImageWithOpenAI } = require("../openai-vision");
      
      const highConfidenceAnalysis = {
        ...mockAnalysis,
        confidenceScore: 1.0,
        analysisNotes: "Perfect image quality, highly accurate analysis",
      };
      
      analyzeImageWithOpenAI.mockResolvedValue(highConfidenceAnalysis);

      const result = await analyzer.analyzeImage("mock-base64");
      expect(result).toEqual(highConfidenceAnalysis);
      expect(result.confidenceScore).toBe(1.0);
    });

    it("should handle analysis with missing optional fields", async () => {
      const { analyzeImageWithOpenAI } = require("../openai-vision");
      
      const minimalAnalysis = {
        foodItems: [
          {
            name: "Unknown Food",
            quantity: "1 serving",
            calories: 100,
            protein_g: 0,
            carbs_g: 0,
            fat_g: 0,
            fiber_g: 0,
          }
        ],
        totalCalories: 100,
        totalProtein: 0,
        totalCarbs: 0,
        totalFat: 0,
        totalFiber: 0,
        confidenceScore: 0.5,
        analysisNotes: "",
      };
      
      analyzeImageWithOpenAI.mockResolvedValue(minimalAnalysis);

      const result = await analyzer.analyzeImage("mock-base64");
      expect(result).toEqual(minimalAnalysis);
    });

    it("should handle analysis with empty food items array", async () => {
      const { analyzeImageWithOpenAI } = require("../openai-vision");
      
      const emptyAnalysis = {
        ...mockAnalysis,
        foodItems: [],
        totalCalories: 0,
        totalProtein: 0,
        totalCarbs: 0,
        totalFat: 0,
        totalFiber: 0,
        confidenceScore: 0.0,
        analysisNotes: "No food items detected in image",
      };
      
      analyzeImageWithOpenAI.mockResolvedValue(emptyAnalysis);

      const result = await analyzer.analyzeImage("mock-base64");
      expect(result).toEqual(emptyAnalysis);
      expect(result.foodItems).toHaveLength(0);
    });

    it("should handle analysis with fractional nutrition values", async () => {
      const { analyzeImageWithOpenAI } = require("../openai-vision");
      
      const fractionalAnalysis = {
        ...mockAnalysis,
        foodItems: [
          {
            name: "Half Apple",
            quantity: "0.5 medium",
            calories: 47.5,
            protein_g: 0.25,
            carbs_g: 12.5,
            fat_g: 0.15,
            fiber_g: 2.0,
          }
        ],
        totalCalories: 47.5,
        totalProtein: 0.25,
        totalCarbs: 12.5,
        totalFat: 0.15,
        totalFiber: 2.0,
      };
      
      analyzeImageWithOpenAI.mockResolvedValue(fractionalAnalysis);

      const result = await analyzer.analyzeImage("mock-base64");
      expect(result).toEqual(fractionalAnalysis);
      expect(result.totalCalories).toBe(47.5);
    });
  });

  describe("logging behavior", () => {
    it("should log successful analysis with provider info", async () => {
      const { analyzeImageWithOpenAI } = require("../openai-vision");
      const { info } = require("@/lib/logger");
      
      analyzeImageWithOpenAI.mockResolvedValue(mockAnalysis);

      await analyzer.analyzeImage("mock-base64");
      
      expect(info).toHaveBeenCalledWith(
        "Nutrition analysis successful",
        expect.objectContaining({
          provider: "openai",
          totalCalories: 95,
          confidenceScore: 0.9
        })
      );
    });

    it("should log provider failures with error details", async () => {
      const { analyzeImageWithOpenAI } = require("../openai-vision");
      const { analyzeImageWithGoogle } = require("../google-vision");
      const { error } = require("@/lib/logger");
      
      const testError = new Error("OpenAI API error");
      analyzeImageWithOpenAI.mockRejectedValue(testError);
      analyzeImageWithGoogle.mockResolvedValue(mockAnalysis);

      await analyzer.analyzeImage("mock-base64");
      
      expect(error).toHaveBeenCalledWith(
        "Nutrition analysis failed",
        expect.objectContaining({
          provider: "openai",
          error: testError
        })
      );
    });

    it("should log Google Vision success after OpenAI failure", async () => {
      const { analyzeImageWithOpenAI } = require("../openai-vision");
      const { analyzeImageWithGoogle } = require("../google-vision");
      const { info, error } = require("@/lib/logger");
      
      analyzeImageWithOpenAI.mockRejectedValue(new Error("OpenAI failed"));
      analyzeImageWithGoogle.mockResolvedValue(mockAnalysis);

      await analyzer.analyzeImage("mock-base64");
      
      expect(error).toHaveBeenCalledWith(
        "Nutrition analysis failed",
        expect.objectContaining({ provider: "openai" })
      );
      expect(info).toHaveBeenCalledWith(
        "Nutrition analysis successful",
        expect.objectContaining({ provider: "google" })
      );
    });
  });

  describe("performance and reliability", () => {
    it("should handle rapid successive calls", async () => {
      const { analyzeImageWithOpenAI } = require("../openai-vision");
      analyzeImageWithOpenAI.mockResolvedValue(mockAnalysis);

      const startTime = Date.now();
      
      // Make 10 rapid calls
      const promises = [];
      for (let i = 0; i < 10; i++) {
        promises.push(analyzer.analyzeImage(`mock-base64-${i}`));
      }

      const results = await Promise.all(promises);
      const endTime = Date.now();
      
      expect(results).toHaveLength(10);
      results.forEach(result => expect(result).toEqual(mockAnalysis));
      
      // Should complete reasonably quickly (less than 1 second in mock environment)
      expect(endTime - startTime).toBeLessThan(1000);
    });

    it("should maintain failure counts across multiple instances", async () => {
      const { analyzeImageWithOpenAI } = require("../openai-vision");
      const { analyzeImageWithGoogle } = require("../google-vision");
      
      analyzeImageWithOpenAI.mockRejectedValue(new Error("OpenAI failed"));
      analyzeImageWithGoogle.mockResolvedValue(mockAnalysis);

      // Fail OpenAI 3 times with first instance
      for (let i = 0; i < 3; i++) {
        try {
          await analyzer.analyzeImage("mock-base64");
        } catch (error) {
          // Expected to use Google fallback
        }
      }

      // Get a new instance (should be same singleton)
      const newAnalyzer = NutritionAnalyzer.getInstance();
      expect(newAnalyzer).toBe(analyzer);

      // Clear mocks and test that OpenAI is still skipped
      jest.clearAllMocks();
      analyzeImageWithGoogle.mockResolvedValue(mockAnalysis);

      await newAnalyzer.analyzeImage("mock-base64");
      
      expect(analyzeImageWithOpenAI).not.toHaveBeenCalled();
      expect(analyzeImageWithGoogle).toHaveBeenCalledWith("mock-base64");
    });

    it("should handle mixed success and failure scenarios", async () => {
      const { analyzeImageWithOpenAI } = require("../openai-vision");
      const { analyzeImageWithGoogle } = require("../google-vision");
      
      // First call: OpenAI fails, Google succeeds
      analyzeImageWithOpenAI.mockRejectedValueOnce(new Error("OpenAI failed"));
      analyzeImageWithGoogle.mockResolvedValueOnce(mockAnalysis);
      
      const result1 = await analyzer.analyzeImage("mock-base64-1");
      expect(result1).toEqual(mockAnalysis);
      
      // Second call: OpenAI succeeds (failure count reset)
      analyzeImageWithOpenAI.mockResolvedValueOnce(mockAnalysis);
      
      const result2 = await analyzer.analyzeImage("mock-base64-2");
      expect(result2).toEqual(mockAnalysis);
      
      // Verify both providers were called appropriately
      expect(analyzeImageWithOpenAI).toHaveBeenCalledTimes(2);
      expect(analyzeImageWithGoogle).toHaveBeenCalledTimes(1);
    });

    it("should handle provider order correctly", async () => {
      const { analyzeImageWithOpenAI } = require("../openai-vision");
      const { analyzeImageWithGoogle } = require("../google-vision");
      
      analyzeImageWithOpenAI.mockResolvedValue(mockAnalysis);
      analyzeImageWithGoogle.mockResolvedValue(mockAnalysis);
      
      await analyzer.analyzeImage("mock-base64");
      
      // OpenAI should be called first
      expect(analyzeImageWithOpenAI).toHaveBeenCalledWith("mock-base64");
      // Google should not be called if OpenAI succeeds
      expect(analyzeImageWithGoogle).not.toHaveBeenCalled();
    });
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

  describe("constructor and singleton behavior", () => {
    it("should return the same instance on multiple calls", () => {
      const instance1 = NutritionAnalyzer.getInstance();
      const instance2 = NutritionAnalyzer.getInstance();
      expect(instance1).toBe(instance2);
    });

    it("should initialize with empty failure counts", () => {
      const analyzer = NutritionAnalyzer.getInstance();
      // Test that failureCount Map is properly initialized
      expect((analyzer as any).failureCount).toBeInstanceOf(Map);
      expect((analyzer as any).failureCount.size).toBe(0);
    });

    it("should have correct MAX_FAILURES constant", () => {
      const analyzer = NutritionAnalyzer.getInstance();
      expect((analyzer as any).MAX_FAILURES).toBe(3);
    });
  });

  describe("input validation", () => {
    it("should handle empty string input", async () => {
      const { analyzeImageWithOpenAI } = require("../openai-vision");
      analyzeImageWithOpenAI.mockResolvedValue(mockAnalysis);

      const result = await analyzer.analyzeImage("");
      expect(result).toEqual(mockAnalysis);
      expect(analyzeImageWithOpenAI).toHaveBeenCalledWith("");
    });

    it("should handle null input gracefully", async () => {
      const { analyzeImageWithOpenAI } = require("../openai-vision");
      analyzeImageWithOpenAI.mockResolvedValue(mockAnalysis);

      const result = await analyzer.analyzeImage(null as any);
      expect(result).toEqual(mockAnalysis);
      expect(analyzeImageWithOpenAI).toHaveBeenCalledWith(null);
    });

    it("should handle undefined input gracefully", async () => {
      const { analyzeImageWithOpenAI } = require("../openai-vision");
      analyzeImageWithOpenAI.mockResolvedValue(mockAnalysis);

      const result = await analyzer.analyzeImage(undefined as any);
      expect(result).toEqual(mockAnalysis);
      expect(analyzeImageWithOpenAI).toHaveBeenCalledWith(undefined);
    });

    it("should handle very long base64 strings", async () => {
      const { analyzeImageWithOpenAI } = require("../openai-vision");
      analyzeImageWithOpenAI.mockResolvedValue(mockAnalysis);

      const longBase64 = "a".repeat(10000);
      const result = await analyzer.analyzeImage(longBase64);
      expect(result).toEqual(mockAnalysis);
      expect(analyzeImageWithOpenAI).toHaveBeenCalledWith(longBase64);
    });

    it("should handle special characters in base64", async () => {
      const { analyzeImageWithOpenAI } = require("../openai-vision");
      analyzeImageWithOpenAI.mockResolvedValue(mockAnalysis);

      const specialBase64 = "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD==";
      const result = await analyzer.analyzeImage(specialBase64);
      expect(result).toEqual(mockAnalysis);
      expect(analyzeImageWithOpenAI).toHaveBeenCalledWith(specialBase64);
    });
  });

  describe("error handling scenarios", () => {
    it("should handle OpenAI timeout errors specifically", async () => {
      const { analyzeImageWithOpenAI } = require("../openai-vision");
      const { analyzeImageWithGoogle } = require("../google-vision");
      
      const timeoutError = new Error("Request timeout");
      timeoutError.name = "TimeoutError";
      analyzeImageWithOpenAI.mockRejectedValue(timeoutError);
      analyzeImageWithGoogle.mockResolvedValue(mockAnalysis);

      const result = await analyzer.analyzeImage("mock-base64");
      expect(result).toEqual(mockAnalysis);
      expect(analyzeImageWithGoogle).toHaveBeenCalledWith("mock-base64");
    });

    it("should handle network errors", async () => {
      const { analyzeImageWithOpenAI } = require("../openai-vision");
      const { analyzeImageWithGoogle } = require("../google-vision");
      
      const networkError = new Error("Network error");
      networkError.name = "NetworkError";
      analyzeImageWithOpenAI.mockRejectedValue(networkError);
      analyzeImageWithGoogle.mockResolvedValue(mockAnalysis);

      const result = await analyzer.analyzeImage("mock-base64");
      expect(result).toEqual(mockAnalysis);
    });

    it("should handle rate limiting errors", async () => {
      const { analyzeImageWithOpenAI } = require("../openai-vision");
      const { analyzeImageWithGoogle } = require("../google-vision");
      
      const rateLimitError = new Error("Rate limit exceeded");
      rateLimitError.name = "RateLimitError";
      analyzeImageWithOpenAI.mockRejectedValue(rateLimitError);
      analyzeImageWithGoogle.mockResolvedValue(mockAnalysis);

      const result = await analyzer.analyzeImage("mock-base64");
      expect(result).toEqual(mockAnalysis);
    });

    it("should handle authentication errors", async () => {
      const { analyzeImageWithOpenAI } = require("../openai-vision");
      const { analyzeImageWithGoogle } = require("../google-vision");
      
      const authError = new Error("Authentication failed");
      authError.name = "AuthenticationError";
      analyzeImageWithOpenAI.mockRejectedValue(authError);
      analyzeImageWithGoogle.mockResolvedValue(mockAnalysis);

      const result = await analyzer.analyzeImage("mock-base64");
      expect(result).toEqual(mockAnalysis);
    });

    it("should handle malformed response from OpenAI", async () => {
      const { analyzeImageWithOpenAI } = require("../openai-vision");
      const { analyzeImageWithGoogle } = require("../google-vision");
      
      analyzeImageWithOpenAI.mockResolvedValue(null);
      analyzeImageWithGoogle.mockResolvedValue(mockAnalysis);

      const result = await analyzer.analyzeImage("mock-base64");
      expect(result).toEqual(mockAnalysis);
    });

    it("should handle malformed response from Google Vision", async () => {
      const { analyzeImageWithOpenAI } = require("../openai-vision");
      const { analyzeImageWithGoogle } = require("../google-vision");
      
      analyzeImageWithOpenAI.mockRejectedValue(new Error("OpenAI failed"));
      analyzeImageWithGoogle.mockResolvedValue(undefined);

      await expect(analyzer.analyzeImage("mock-base64")).rejects.toThrow("All AI providers failed to analyze the image");
    });

    it("should handle provider throwing non-Error objects", async () => {
      const { analyzeImageWithOpenAI } = require("../openai-vision");
      const { analyzeImageWithGoogle } = require("../google-vision");
      
      analyzeImageWithOpenAI.mockRejectedValue("String error");
      analyzeImageWithGoogle.mockResolvedValue(mockAnalysis);

      const result = await analyzer.analyzeImage("mock-base64");
      expect(result).toEqual(mockAnalysis);
    });
  });

  describe("provider failure tracking", () => {
    it("should track failures correctly for both providers", async () => {
      const { analyzeImageWithOpenAI } = require("../openai-vision");
      const { analyzeImageWithGoogle } = require("../google-vision");
      
      analyzeImageWithOpenAI.mockRejectedValue(new Error("OpenAI failed"));
      analyzeImageWithGoogle.mockRejectedValue(new Error("Google failed"));

      // Make multiple failed calls
      for (let i = 0; i < 5; i++) {
        try {
          await analyzer.analyzeImage("mock-base64");
        } catch (error) {
          // Expected to fail
        }
      }

      // OpenAI should be called only 3 times (max failures)
      expect(analyzeImageWithOpenAI).toHaveBeenCalledTimes(3);
      // Google should be called 5 times (not yet at max failures)
      expect(analyzeImageWithGoogle).toHaveBeenCalledTimes(5);
    });

    it("should reset failure count for specific provider after success", async () => {
      const { analyzeImageWithOpenAI } = require("../openai-vision");
      const { analyzeImageWithGoogle } = require("../google-vision");
      
      // Fail OpenAI twice
      analyzeImageWithOpenAI.mockRejectedValueOnce(new Error("OpenAI failed"));
      analyzeImageWithGoogle.mockResolvedValueOnce(mockAnalysis);
      await analyzer.analyzeImage("mock-base64");
      
      analyzeImageWithOpenAI.mockRejectedValueOnce(new Error("OpenAI failed"));
      analyzeImageWithGoogle.mockResolvedValueOnce(mockAnalysis);
      await analyzer.analyzeImage("mock-base64");

      // Clear mocks and make OpenAI succeed
      jest.clearAllMocks();
      analyzeImageWithOpenAI.mockResolvedValue(mockAnalysis);

      const result = await analyzer.analyzeImage("mock-base64");
      expect(result).toEqual(mockAnalysis);
      expect(analyzeImageWithOpenAI).toHaveBeenCalledWith("mock-base64");
    });

    it("should handle concurrent requests correctly", async () => {
      const { analyzeImageWithOpenAI } = require("../openai-vision");
      analyzeImageWithOpenAI.mockResolvedValue(mockAnalysis);

      // Make multiple concurrent requests
      const promises = [];
      for (let i = 0; i < 5; i++) {
        promises.push(analyzer.analyzeImage(`mock-base64-${i}`));
      }

      const results = await Promise.all(promises);
      expect(results).toHaveLength(5);
      results.forEach(result => expect(result).toEqual(mockAnalysis));
    });

    it("should skip both providers when both reach max failures", async () => {
      const { analyzeImageWithOpenAI } = require("../openai-vision");
      const { analyzeImageWithGoogle } = require("../google-vision");
      
      analyzeImageWithOpenAI.mockRejectedValue(new Error("OpenAI failed"));
      analyzeImageWithGoogle.mockRejectedValue(new Error("Google failed"));

      // Make enough calls to exhaust both providers
      for (let i = 0; i < 6; i++) {
        try {
          await analyzer.analyzeImage("mock-base64");
        } catch (error) {
          // Expected to fail
        }
      }

      // Clear mocks and verify neither provider is called
      jest.clearAllMocks();
      
      await expect(analyzer.analyzeImage("mock-base64")).rejects.toThrow("All AI providers failed to analyze the image");
      expect(analyzeImageWithOpenAI).not.toHaveBeenCalled();
      expect(analyzeImageWithGoogle).not.toHaveBeenCalled();
    });
  });

  describe("nutrition analysis response validation", () => {
    it("should handle analysis with multiple food items", async () => {
      const { analyzeImageWithOpenAI } = require("../openai-vision");
      
      const multiItemAnalysis = {
        ...mockAnalysis,
        foodItems: [
          {
            name: "Apple",
            quantity: "1 medium",
            calories: 95,
            protein_g: 0.5,
            carbs_g: 25,
            fat_g: 0.3,
            fiber_g: 4,
          },
          {
            name: "Banana",
            quantity: "1 large",
            calories: 121,
            protein_g: 1.5,
            carbs_g: 31,
            fat_g: 0.4,
            fiber_g: 3.1,
          }
        ],
        totalCalories: 216,
        totalProtein: 2.0,
        totalCarbs: 56,
        totalFat: 0.7,
        totalFiber: 7.1,
      };
      
      analyzeImageWithOpenAI.mockResolvedValue(multiItemAnalysis);

      const result = await analyzer.analyzeImage("mock-base64");
      expect(result).toEqual(multiItemAnalysis);
      expect(result.foodItems).toHaveLength(2);
    });

    it("should handle analysis with zero calories", async () => {
      const { analyzeImageWithOpenAI } = require("../openai-vision");
      
      const zeroCalorieAnalysis = {
        ...mockAnalysis,
        foodItems: [
          {
            name: "Water",
            quantity: "1 glass",
            calories: 0,
            protein_g: 0,
            carbs_g: 0,
            fat_g: 0,
            fiber_g: 0,
          }
        ],
        totalCalories: 0,
        totalProtein: 0,
        totalCarbs: 0,
        totalFat: 0,
        totalFiber: 0,
      };
      
      analyzeImageWithOpenAI.mockResolvedValue(zeroCalorieAnalysis);

      const result = await analyzer.analyzeImage("mock-base64");
      expect(result).toEqual(zeroCalorieAnalysis);
      expect(result.totalCalories).toBe(0);
    });

    it("should handle analysis with low confidence score", async () => {
      const { analyzeImageWithOpenAI } = require("../openai-vision");
      
      const lowConfidenceAnalysis = {
        ...mockAnalysis,
        confidenceScore: 0.1,
        analysisNotes: "Image quality is poor, analysis may be inaccurate",
      };
      
      analyzeImageWithOpenAI.mockResolvedValue(lowConfidenceAnalysis);

      const result = await analyzer.analyzeImage("mock-base64");
      expect(result).toEqual(lowConfidenceAnalysis);
      expect(result.confidenceScore).toBe(0.1);
    });

    it("should handle analysis with high confidence score", async () => {
      const { analyzeImageWithOpenAI } = require("../openai-vision");
      
      const highConfidenceAnalysis = {
        ...mockAnalysis,
        confidenceScore: 1.0,
        analysisNotes: "Perfect image quality, highly accurate analysis",
      };
      
      analyzeImageWithOpenAI.mockResolvedValue(highConfidenceAnalysis);

      const result = await analyzer.analyzeImage("mock-base64");
      expect(result).toEqual(highConfidenceAnalysis);
      expect(result.confidenceScore).toBe(1.0);
    });

    it("should handle analysis with missing optional fields", async () => {
      const { analyzeImageWithOpenAI } = require("../openai-vision");
      
      const minimalAnalysis = {
        foodItems: [
          {
            name: "Unknown Food",
            quantity: "1 serving",
            calories: 100,
            protein_g: 0,
            carbs_g: 0,
            fat_g: 0,
            fiber_g: 0,
          }
        ],
        totalCalories: 100,
        totalProtein: 0,
        totalCarbs: 0,
        totalFat: 0,
        totalFiber: 0,
        confidenceScore: 0.5,
        analysisNotes: "",
      };
      
      analyzeImageWithOpenAI.mockResolvedValue(minimalAnalysis);

      const result = await analyzer.analyzeImage("mock-base64");
      expect(result).toEqual(minimalAnalysis);
    });

    it("should handle analysis with empty food items array", async () => {
      const { analyzeImageWithOpenAI } = require("../openai-vision");
      
      const emptyAnalysis = {
        ...mockAnalysis,
        foodItems: [],
        totalCalories: 0,
        totalProtein: 0,
        totalCarbs: 0,
        totalFat: 0,
        totalFiber: 0,
        confidenceScore: 0.0,
        analysisNotes: "No food items detected in image",
      };
      
      analyzeImageWithOpenAI.mockResolvedValue(emptyAnalysis);

      const result = await analyzer.analyzeImage("mock-base64");
      expect(result).toEqual(emptyAnalysis);
      expect(result.foodItems).toHaveLength(0);
    });

    it("should handle analysis with fractional nutrition values", async () => {
      const { analyzeImageWithOpenAI } = require("../openai-vision");
      
      const fractionalAnalysis = {
        ...mockAnalysis,
        foodItems: [
          {
            name: "Half Apple",
            quantity: "0.5 medium",
            calories: 47.5,
            protein_g: 0.25,
            carbs_g: 12.5,
            fat_g: 0.15,
            fiber_g: 2.0,
          }
        ],
        totalCalories: 47.5,
        totalProtein: 0.25,
        totalCarbs: 12.5,
        totalFat: 0.15,
        totalFiber: 2.0,
      };
      
      analyzeImageWithOpenAI.mockResolvedValue(fractionalAnalysis);

      const result = await analyzer.analyzeImage("mock-base64");
      expect(result).toEqual(fractionalAnalysis);
      expect(result.totalCalories).toBe(47.5);
    });
  });

  describe("logging behavior", () => {
    it("should log successful analysis with provider info", async () => {
      const { analyzeImageWithOpenAI } = require("../openai-vision");
      const { info } = require("@/lib/logger");
      
      analyzeImageWithOpenAI.mockResolvedValue(mockAnalysis);

      await analyzer.analyzeImage("mock-base64");
      
      expect(info).toHaveBeenCalledWith(
        "Nutrition analysis successful",
        expect.objectContaining({
          provider: "openai",
          totalCalories: 95,
          confidenceScore: 0.9
        })
      );
    });

    it("should log provider failures with error details", async () => {
      const { analyzeImageWithOpenAI } = require("../openai-vision");
      const { analyzeImageWithGoogle } = require("../google-vision");
      const { error } = require("@/lib/logger");
      
      const testError = new Error("OpenAI API error");
      analyzeImageWithOpenAI.mockRejectedValue(testError);
      analyzeImageWithGoogle.mockResolvedValue(mockAnalysis);

      await analyzer.analyzeImage("mock-base64");
      
      expect(error).toHaveBeenCalledWith(
        "Nutrition analysis failed",
        expect.objectContaining({
          provider: "openai",
          error: testError
        })
      );
    });

    it("should log Google Vision success after OpenAI failure", async () => {
      const { analyzeImageWithOpenAI } = require("../openai-vision");
      const { analyzeImageWithGoogle } = require("../google-vision");
      const { info, error } = require("@/lib/logger");
      
      analyzeImageWithOpenAI.mockRejectedValue(new Error("OpenAI failed"));
      analyzeImageWithGoogle.mockResolvedValue(mockAnalysis);

      await analyzer.analyzeImage("mock-base64");
      
      expect(error).toHaveBeenCalledWith(
        "Nutrition analysis failed",
        expect.objectContaining({ provider: "openai" })
      );
      expect(info).toHaveBeenCalledWith(
        "Nutrition analysis successful",
        expect.objectContaining({ provider: "google" })
      );
    });
  });

  describe("performance and reliability", () => {
    it("should handle rapid successive calls", async () => {
      const { analyzeImageWithOpenAI } = require("../openai-vision");
      analyzeImageWithOpenAI.mockResolvedValue(mockAnalysis);

      const startTime = Date.now();
      
      // Make 10 rapid calls
      const promises = [];
      for (let i = 0; i < 10; i++) {
        promises.push(analyzer.analyzeImage(`mock-base64-${i}`));
      }

      const results = await Promise.all(promises);
      const endTime = Date.now();
      
      expect(results).toHaveLength(10);
      results.forEach(result => expect(result).toEqual(mockAnalysis));
      
      // Should complete reasonably quickly (less than 1 second in mock environment)
      expect(endTime - startTime).toBeLessThan(1000);
    });

    it("should maintain failure counts across multiple instances", async () => {
      const { analyzeImageWithOpenAI } = require("../openai-vision");
      const { analyzeImageWithGoogle } = require("../google-vision");
      
      analyzeImageWithOpenAI.mockRejectedValue(new Error("OpenAI failed"));
      analyzeImageWithGoogle.mockResolvedValue(mockAnalysis);

      // Fail OpenAI 3 times with first instance
      for (let i = 0; i < 3; i++) {
        try {
          await analyzer.analyzeImage("mock-base64");
        } catch (error) {
          // Expected to use Google fallback
        }
      }

      // Get a new instance (should be same singleton)
      const newAnalyzer = NutritionAnalyzer.getInstance();
      expect(newAnalyzer).toBe(analyzer);

      // Clear mocks and test that OpenAI is still skipped
      jest.clearAllMocks();
      analyzeImageWithGoogle.mockResolvedValue(mockAnalysis);

      await newAnalyzer.analyzeImage("mock-base64");
      
      expect(analyzeImageWithOpenAI).not.toHaveBeenCalled();
      expect(analyzeImageWithGoogle).toHaveBeenCalledWith("mock-base64");
    });

    it("should handle mixed success and failure scenarios", async () => {
      const { analyzeImageWithOpenAI } = require("../openai-vision");
      const { analyzeImageWithGoogle } = require("../google-vision");
      
      // First call: OpenAI fails, Google succeeds
      analyzeImageWithOpenAI.mockRejectedValueOnce(new Error("OpenAI failed"));
      analyzeImageWithGoogle.mockResolvedValueOnce(mockAnalysis);
      
      const result1 = await analyzer.analyzeImage("mock-base64-1");
      expect(result1).toEqual(mockAnalysis);
      
      // Second call: OpenAI succeeds (failure count reset)
      analyzeImageWithOpenAI.mockResolvedValueOnce(mockAnalysis);
      
      const result2 = await analyzer.analyzeImage("mock-base64-2");
      expect(result2).toEqual(mockAnalysis);
      
      // Verify both providers were called appropriately
      expect(analyzeImageWithOpenAI).toHaveBeenCalledTimes(2);
      expect(analyzeImageWithGoogle).toHaveBeenCalledTimes(1);
    });

    it("should handle provider order correctly", async () => {
      const { analyzeImageWithOpenAI } = require("../openai-vision");
      const { analyzeImageWithGoogle } = require("../google-vision");
      
      analyzeImageWithOpenAI.mockResolvedValue(mockAnalysis);
      analyzeImageWithGoogle.mockResolvedValue(mockAnalysis);
      
      await analyzer.analyzeImage("mock-base64");
      
      // OpenAI should be called first
      expect(analyzeImageWithOpenAI).toHaveBeenCalledWith("mock-base64");
      // Google should not be called if OpenAI succeeds
      expect(analyzeImageWithGoogle).not.toHaveBeenCalled();
    });
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

  describe("constructor and singleton behavior", () => {
    it("should return the same instance on multiple calls", () => {
      const instance1 = NutritionAnalyzer.getInstance();
      const instance2 = NutritionAnalyzer.getInstance();
      expect(instance1).toBe(instance2);
    });

    it("should initialize with empty failure counts", () => {
      const analyzer = NutritionAnalyzer.getInstance();
      // Test that failureCount Map is properly initialized
      expect((analyzer as any).failureCount).toBeInstanceOf(Map);
      expect((analyzer as any).failureCount.size).toBe(0);
    });

    it("should have correct MAX_FAILURES constant", () => {
      const analyzer = NutritionAnalyzer.getInstance();
      expect((analyzer as any).MAX_FAILURES).toBe(3);
    });
  });

  describe("input validation", () => {
    it("should handle empty string input", async () => {
      const { analyzeImageWithOpenAI } = require("../openai-vision");
      analyzeImageWithOpenAI.mockResolvedValue(mockAnalysis);

      const result = await analyzer.analyzeImage("");
      expect(result).toEqual(mockAnalysis);
      expect(analyzeImageWithOpenAI).toHaveBeenCalledWith("");
    });

    it("should handle null input gracefully", async () => {
      const { analyzeImageWithOpenAI } = require("../openai-vision");
      analyzeImageWithOpenAI.mockResolvedValue(mockAnalysis);

      const result = await analyzer.analyzeImage(null as any);
      expect(result).toEqual(mockAnalysis);
      expect(analyzeImageWithOpenAI).toHaveBeenCalledWith(null);
    });

    it("should handle undefined input gracefully", async () => {
      const { analyzeImageWithOpenAI } = require("../openai-vision");
      analyzeImageWithOpenAI.mockResolvedValue(mockAnalysis);

      const result = await analyzer.analyzeImage(undefined as any);
      expect(result).toEqual(mockAnalysis);
      expect(analyzeImageWithOpenAI).toHaveBeenCalledWith(undefined);
    });

    it("should handle very long base64 strings", async () => {
      const { analyzeImageWithOpenAI } = require("../openai-vision");
      analyzeImageWithOpenAI.mockResolvedValue(mockAnalysis);

      const longBase64 = "a".repeat(10000);
      const result = await analyzer.analyzeImage(longBase64);
      expect(result).toEqual(mockAnalysis);
      expect(analyzeImageWithOpenAI).toHaveBeenCalledWith(longBase64);
    });

    it("should handle special characters in base64", async () => {
      const { analyzeImageWithOpenAI } = require("../openai-vision");
      analyzeImageWithOpenAI.mockResolvedValue(mockAnalysis);

      const specialBase64 = "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD==";
      const result = await analyzer.analyzeImage(specialBase64);
      expect(result).toEqual(mockAnalysis);
      expect(analyzeImageWithOpenAI).toHaveBeenCalledWith(specialBase64);
    });
  });

  describe("error handling scenarios", () => {
    it("should handle OpenAI timeout errors specifically", async () => {
      const { analyzeImageWithOpenAI } = require("../openai-vision");
      const { analyzeImageWithGoogle } = require("../google-vision");
      
      const timeoutError = new Error("Request timeout");
      timeoutError.name = "TimeoutError";
      analyzeImageWithOpenAI.mockRejectedValue(timeoutError);
      analyzeImageWithGoogle.mockResolvedValue(mockAnalysis);

      const result = await analyzer.analyzeImage("mock-base64");
      expect(result).toEqual(mockAnalysis);
      expect(analyzeImageWithGoogle).toHaveBeenCalledWith("mock-base64");
    });

    it("should handle network errors", async () => {
      const { analyzeImageWithOpenAI } = require("../openai-vision");
      const { analyzeImageWithGoogle } = require("../google-vision");
      
      const networkError = new Error("Network error");
      networkError.name = "NetworkError";
      analyzeImageWithOpenAI.mockRejectedValue(networkError);
      analyzeImageWithGoogle.mockResolvedValue(mockAnalysis);

      const result = await analyzer.analyzeImage("mock-base64");
      expect(result).toEqual(mockAnalysis);
    });

    it("should handle rate limiting errors", async () => {
      const { analyzeImageWithOpenAI } = require("../openai-vision");
      const { analyzeImageWithGoogle } = require("../google-vision");
      
      const rateLimitError = new Error("Rate limit exceeded");
      rateLimitError.name = "RateLimitError";
      analyzeImageWithOpenAI.mockRejectedValue(rateLimitError);
      analyzeImageWithGoogle.mockResolvedValue(mockAnalysis);

      const result = await analyzer.analyzeImage("mock-base64");
      expect(result).toEqual(mockAnalysis);
    });

    it("should handle authentication errors", async () => {
      const { analyzeImageWithOpenAI } = require("../openai-vision");
      const { analyzeImageWithGoogle } = require("../google-vision");
      
      const authError = new Error("Authentication failed");
      authError.name = "AuthenticationError";
      analyzeImageWithOpenAI.mockRejectedValue(authError);
      analyzeImageWithGoogle.mockResolvedValue(mockAnalysis);

      const result = await analyzer.analyzeImage("mock-base64");
      expect(result).toEqual(mockAnalysis);
    });

    it("should handle malformed response from OpenAI", async () => {
      const { analyzeImageWithOpenAI } = require("../openai-vision");
      const { analyzeImageWithGoogle } = require("../google-vision");
      
      analyzeImageWithOpenAI.mockResolvedValue(null);
      analyzeImageWithGoogle.mockResolvedValue(mockAnalysis);

      const result = await analyzer.analyzeImage("mock-base64");
      expect(result).toEqual(mockAnalysis);
    });

    it("should handle malformed response from Google Vision", async () => {
      const { analyzeImageWithOpenAI } = require("../openai-vision");
      const { analyzeImageWithGoogle } = require("../google-vision");
      
      analyzeImageWithOpenAI.mockRejectedValue(new Error("OpenAI failed"));
      analyzeImageWithGoogle.mockResolvedValue(undefined);

      await expect(analyzer.analyzeImage("mock-base64")).rejects.toThrow("All AI providers failed to analyze the image");
    });

    it("should handle provider throwing non-Error objects", async () => {
      const { analyzeImageWithOpenAI } = require("../openai-vision");
      const { analyzeImageWithGoogle } = require("../google-vision");
      
      analyzeImageWithOpenAI.mockRejectedValue("String error");
      analyzeImageWithGoogle.mockResolvedValue(mockAnalysis);

      const result = await analyzer.analyzeImage("mock-base64");
      expect(result).toEqual(mockAnalysis);
    });
  });

  describe("provider failure tracking", () => {
    it("should track failures correctly for both providers", async () => {
      const { analyzeImageWithOpenAI } = require("../openai-vision");
      const { analyzeImageWithGoogle } = require("../google-vision");
      
      analyzeImageWithOpenAI.mockRejectedValue(new Error("OpenAI failed"));
      analyzeImageWithGoogle.mockRejectedValue(new Error("Google failed"));

      // Make multiple failed calls
      for (let i = 0; i < 5; i++) {
        try {
          await analyzer.analyzeImage("mock-base64");
        } catch (error) {
          // Expected to fail
        }
      }

      // OpenAI should be called only 3 times (max failures)
      expect(analyzeImageWithOpenAI).toHaveBeenCalledTimes(3);
      // Google should be called 5 times (not yet at max failures)
      expect(analyzeImageWithGoogle).toHaveBeenCalledTimes(5);
    });

    it("should reset failure count for specific provider after success", async () => {
      const { analyzeImageWithOpenAI } = require("../openai-vision");
      const { analyzeImageWithGoogle } = require("../google-vision");
      
      // Fail OpenAI twice
      analyzeImageWithOpenAI.mockRejectedValueOnce(new Error("OpenAI failed"));
      analyzeImageWithGoogle.mockResolvedValueOnce(mockAnalysis);
      await analyzer.analyzeImage("mock-base64");
      
      analyzeImageWithOpenAI.mockRejectedValueOnce(new Error("OpenAI failed"));
      analyzeImageWithGoogle.mockResolvedValueOnce(mockAnalysis);
      await analyzer.analyzeImage("mock-base64");

      // Clear mocks and make OpenAI succeed
      jest.clearAllMocks();
      analyzeImageWithOpenAI.mockResolvedValue(mockAnalysis);

      const result = await analyzer.analyzeImage("mock-base64");
      expect(result).toEqual(mockAnalysis);
      expect(analyzeImageWithOpenAI).toHaveBeenCalledWith("mock-base64");
    });

    it("should handle concurrent requests correctly", async () => {
      const { analyzeImageWithOpenAI } = require("../openai-vision");
      analyzeImageWithOpenAI.mockResolvedValue(mockAnalysis);

      // Make multiple concurrent requests
      const promises = [];
      for (let i = 0; i < 5; i++) {
        promises.push(analyzer.analyzeImage(`mock-base64-${i}`));
      }

      const results = await Promise.all(promises);
      expect(results).toHaveLength(5);
      results.forEach(result => expect(result).toEqual(mockAnalysis));
    });

    it("should skip both providers when both reach max failures", async () => {
      const { analyzeImageWithOpenAI } = require("../openai-vision");
      const { analyzeImageWithGoogle } = require("../google-vision");
      
      analyzeImageWithOpenAI.mockRejectedValue(new Error("OpenAI failed"));
      analyzeImageWithGoogle.mockRejectedValue(new Error("Google failed"));

      // Make enough calls to exhaust both providers
      for (let i = 0; i < 6; i++) {
        try {
          await analyzer.analyzeImage("mock-base64");
        } catch (error) {
          // Expected to fail
        }
      }

      // Clear mocks and verify neither provider is called
      jest.clearAllMocks();
      
      await expect(analyzer.analyzeImage("mock-base64")).rejects.toThrow("All AI providers failed to analyze the image");
      expect(analyzeImageWithOpenAI).not.toHaveBeenCalled();
      expect(analyzeImageWithGoogle).not.toHaveBeenCalled();
    });
  });

  describe("nutrition analysis response validation", () => {
    it("should handle analysis with multiple food items", async () => {
      const { analyzeImageWithOpenAI } = require("../openai-vision");
      
      const multiItemAnalysis = {
        ...mockAnalysis,
        foodItems: [
          {
            name: "Apple",
            quantity: "1 medium",
            calories: 95,
            protein_g: 0.5,
            carbs_g: 25,
            fat_g: 0.3,
            fiber_g: 4,
          },
          {
            name: "Banana",
            quantity: "1 large",
            calories: 121,
            protein_g: 1.5,
            carbs_g: 31,
            fat_g: 0.4,
            fiber_g: 3.1,
          }
        ],
        totalCalories: 216,
        totalProtein: 2.0,
        totalCarbs: 56,
        totalFat: 0.7,
        totalFiber: 7.1,
      };
      
      analyzeImageWithOpenAI.mockResolvedValue(multiItemAnalysis);

      const result = await analyzer.analyzeImage("mock-base64");
      expect(result).toEqual(multiItemAnalysis);
      expect(result.foodItems).toHaveLength(2);
    });

    it("should handle analysis with zero calories", async () => {
      const { analyzeImageWithOpenAI } = require("../openai-vision");
      
      const zeroCalorieAnalysis = {
        ...mockAnalysis,
        foodItems: [
          {
            name: "Water",
            quantity: "1 glass",
            calories: 0,
            protein_g: 0,
            carbs_g: 0,
            fat_g: 0,
            fiber_g: 0,
          }
        ],
        totalCalories: 0,
        totalProtein: 0,
        totalCarbs: 0,
        totalFat: 0,
        totalFiber: 0,
      };
      
      analyzeImageWithOpenAI.mockResolvedValue(zeroCalorieAnalysis);

      const result = await analyzer.analyzeImage("mock-base64");
      expect(result).toEqual(zeroCalorieAnalysis);
      expect(result.totalCalories).toBe(0);
    });

    it("should handle analysis with low confidence score", async () => {
      const { analyzeImageWithOpenAI } = require("../openai-vision");
      
      const lowConfidenceAnalysis = {
        ...mockAnalysis,
        confidenceScore: 0.1,
        analysisNotes: "Image quality is poor, analysis may be inaccurate",
      };
      
      analyzeImageWithOpenAI.mockResolvedValue(lowConfidenceAnalysis);

      const result = await analyzer.analyzeImage("mock-base64");
      expect(result).toEqual(lowConfidenceAnalysis);
      expect(result.confidenceScore).toBe(0.1);
    });

    it("should handle analysis with high confidence score", async () => {
      const { analyzeImageWithOpenAI } = require("../openai-vision");
      
      const highConfidenceAnalysis = {
        ...mockAnalysis,
        confidenceScore: 1.0,
        analysisNotes: "Perfect image quality, highly accurate analysis",
      };
      
      analyzeImageWithOpenAI.mockResolvedValue(highConfidenceAnalysis);

      const result = await analyzer.analyzeImage("mock-base64");
      expect(result).toEqual(highConfidenceAnalysis);
      expect(result.confidenceScore).toBe(1.0);
    });

    it("should handle analysis with missing optional fields", async () => {
      const { analyzeImageWithOpenAI } = require("../openai-vision");
      
      const minimalAnalysis = {
        foodItems: [
          {
            name: "Unknown Food",
            quantity: "1 serving",
            calories: 100,
            protein_g: 0,
            carbs_g: 0,
            fat_g: 0,
            fiber_g: 0,
          }
        ],
        totalCalories: 100,
        totalProtein: 0,
        totalCarbs: 0,
        totalFat: 0,
        totalFiber: 0,
        confidenceScore: 0.5,
        analysisNotes: "",
      };
      
      analyzeImageWithOpenAI.mockResolvedValue(minimalAnalysis);

      const result = await analyzer.analyzeImage("mock-base64");
      expect(result).toEqual(minimalAnalysis);
    });

    it("should handle analysis with empty food items array", async () => {
      const { analyzeImageWithOpenAI } = require("../openai-vision");
      
      const emptyAnalysis = {
        ...mockAnalysis,
        foodItems: [],
        totalCalories: 0,
        totalProtein: 0,
        totalCarbs: 0,
        totalFat: 0,
        totalFiber: 0,
        confidenceScore: 0.0,
        analysisNotes: "No food items detected in image",
      };
      
      analyzeImageWithOpenAI.mockResolvedValue(emptyAnalysis);

      const result = await analyzer.analyzeImage("mock-base64");
      expect(result).toEqual(emptyAnalysis);
      expect(result.foodItems).toHaveLength(0);
    });

    it("should handle analysis with fractional nutrition values", async () => {
      const { analyzeImageWithOpenAI } = require("../openai-vision");
      
      const fractionalAnalysis = {
        ...mockAnalysis,
        foodItems: [
          {
            name: "Half Apple",
            quantity: "0.5 medium",
            calories: 47.5,
            protein_g: 0.25,
            carbs_g: 12.5,
            fat_g: 0.15,
            fiber_g: 2.0,
          }
        ],
        totalCalories: 47.5,
        totalProtein: 0.25,
        totalCarbs: 12.5,
        totalFat: 0.15,
        totalFiber: 2.0,
      };
      
      analyzeImageWithOpenAI.mockResolvedValue(fractionalAnalysis);

      const result = await analyzer.analyzeImage("mock-base64");
      expect(result).toEqual(fractionalAnalysis);
      expect(result.totalCalories).toBe(47.5);
    });
  });

  describe("logging behavior", () => {
    it("should log successful analysis with provider info", async () => {
      const { analyzeImageWithOpenAI } = require("../openai-vision");
      const { info } = require("@/lib/logger");
      
      analyzeImageWithOpenAI.mockResolvedValue(mockAnalysis);

      await analyzer.analyzeImage("mock-base64");
      
      expect(info).toHaveBeenCalledWith(
        "Nutrition analysis successful",
        expect.objectContaining({
          provider: "openai",
          totalCalories: 95,
          confidenceScore: 0.9
        })
      );
    });

    it("should log provider failures with error details", async () => {
      const { analyzeImageWithOpenAI } = require("../openai-vision");
      const { analyzeImageWithGoogle } = require("../google-vision");
      const { error } = require("@/lib/logger");
      
      const testError = new Error("OpenAI API error");
      analyzeImageWithOpenAI.mockRejectedValue(testError);
      analyzeImageWithGoogle.mockResolvedValue(mockAnalysis);

      await analyzer.analyzeImage("mock-base64");
      
      expect(error).toHaveBeenCalledWith(
        "Nutrition analysis failed",
        expect.objectContaining({
          provider: "openai",
          error: testError
        })
      );
    });

    it("should log Google Vision success after OpenAI failure", async () => {
      const { analyzeImageWithOpenAI } = require("../openai-vision");
      const { analyzeImageWithGoogle } = require("../google-vision");
      const { info, error } = require("@/lib/logger");
      
      analyzeImageWithOpenAI.mockRejectedValue(new Error("OpenAI failed"));
      analyzeImageWithGoogle.mockResolvedValue(mockAnalysis);

      await analyzer.analyzeImage("mock-base64");
      
      expect(error).toHaveBeenCalledWith(
        "Nutrition analysis failed",
        expect.objectContaining({ provider: "openai" })
      );
      expect(info).toHaveBeenCalledWith(
        "Nutrition analysis successful",
        expect.objectContaining({ provider: "google" })
      );
    });
  });

  describe("performance and reliability", () => {
    it("should handle rapid successive calls", async () => {
      const { analyzeImageWithOpenAI } = require("../openai-vision");
      analyzeImageWithOpenAI.mockResolvedValue(mockAnalysis);

      const startTime = Date.now();
      
      // Make 10 rapid calls
      const promises = [];
      for (let i = 0; i < 10; i++) {
        promises.push(analyzer.analyzeImage(`mock-base64-${i}`));
      }

      const results = await Promise.all(promises);
      const endTime = Date.now();
      
      expect(results).toHaveLength(10);
      results.forEach(result => expect(result).toEqual(mockAnalysis));
      
      // Should complete reasonably quickly (less than 1 second in mock environment)
      expect(endTime - startTime).toBeLessThan(1000);
    });

    it("should maintain failure counts across multiple instances", async () => {
      const { analyzeImageWithOpenAI } = require("../openai-vision");
      const { analyzeImageWithGoogle } = require("../google-vision");
      
      analyzeImageWithOpenAI.mockRejectedValue(new Error("OpenAI failed"));
      analyzeImageWithGoogle.mockResolvedValue(mockAnalysis);

      // Fail OpenAI 3 times with first instance
      for (let i = 0; i < 3; i++) {
        try {
          await analyzer.analyzeImage("mock-base64");
        } catch (error) {
          // Expected to use Google fallback
        }
      }

      // Get a new instance (should be same singleton)
      const newAnalyzer = NutritionAnalyzer.getInstance();
      expect(newAnalyzer).toBe(analyzer);

      // Clear mocks and test that OpenAI is still skipped
      jest.clearAllMocks();
      analyzeImageWithGoogle.mockResolvedValue(mockAnalysis);

      await newAnalyzer.analyzeImage("mock-base64");
      
      expect(analyzeImageWithOpenAI).not.toHaveBeenCalled();
      expect(analyzeImageWithGoogle).toHaveBeenCalledWith("mock-base64");
    });

    it("should handle mixed success and failure scenarios", async () => {
      const { analyzeImageWithOpenAI } = require("../openai-vision");
      const { analyzeImageWithGoogle } = require("../google-vision");
      
      // First call: OpenAI fails, Google succeeds
      analyzeImageWithOpenAI.mockRejectedValueOnce(new Error("OpenAI failed"));
      analyzeImageWithGoogle.mockResolvedValueOnce(mockAnalysis);
      
      const result1 = await analyzer.analyzeImage("mock-base64-1");
      expect(result1).toEqual(mockAnalysis);
      
      // Second call: OpenAI succeeds (failure count reset)
      analyzeImageWithOpenAI.mockResolvedValueOnce(mockAnalysis);
      
      const result2 = await analyzer.analyzeImage("mock-base64-2");
      expect(result2).toEqual(mockAnalysis);
      
      // Verify both providers were called appropriately
      expect(analyzeImageWithOpenAI).toHaveBeenCalledTimes(2);
      expect(analyzeImageWithGoogle).toHaveBeenCalledTimes(1);
    });

    it("should handle provider order correctly", async () => {
      const { analyzeImageWithOpenAI } = require("../openai-vision");
      const { analyzeImageWithGoogle } = require("../google-vision");
      
      analyzeImageWithOpenAI.mockResolvedValue(mockAnalysis);
      analyzeImageWithGoogle.mockResolvedValue(mockAnalysis);
      
      await analyzer.analyzeImage("mock-base64");
      
      // OpenAI should be called first
      expect(analyzeImageWithOpenAI).toHaveBeenCalledWith("mock-base64");
      // Google should not be called if OpenAI succeeds
      expect(analyzeImageWithGoogle).not.toHaveBeenCalled();
    });
  });

}); 