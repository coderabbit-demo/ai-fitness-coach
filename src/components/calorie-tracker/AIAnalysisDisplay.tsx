'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Brain, 
  CheckCircle, 
  AlertTriangle, 
  RefreshCw,
  Eye,
  Info,
  Lightbulb,
  Camera,
  Zap
} from 'lucide-react';

interface FoodItem {
  name: string;
  quantity: string;
  calories: number;
  protein_g: number;
  carbs_g: number;
  fat_g: number;
}

interface AIAnalysisLog {
  id: string;
  confidence_score: number;
  processing_status: string;
  food_items: FoodItem[];
  total_calories: number;
  notes: string;
  image_url: string;
  error_message?: string;
  created_at: string;
}

interface AIAnalysisDisplayProps {
  log: AIAnalysisLog;
  isCompact?: boolean;
  onReprocess?: (logId: string) => void;
  onCorrect?: (logId: string) => void;
  className?: string;
}

/**
 * Displays AI analysis results with confidence scoring and feedback options.
 *
 * Shows processing status, confidence indicators, detected food items,
 * error handling, and improvement suggestions. Provides options for
 * reprocessing failed analyses and manual corrections.
 *
 * @param log - The nutrition log with AI analysis data
 * @param isCompact - Whether to show a compact version
 * @param onReprocess - Callback to reprocess the analysis
 * @param onCorrect - Callback to manually correct the analysis
 * @param className - Optional CSS class for styling
 */
export function AIAnalysisDisplay({
  log,
  isCompact = false,
  onReprocess,
  onCorrect,
  className
}: AIAnalysisDisplayProps) {
  const [isReprocessing, setIsReprocessing] = useState(false);

  const getConfidenceColor = (score: number) => {
    if (score >= 0.8) return 'bg-green-500';
    if (score >= 0.6) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  const getConfidenceText = (score: number) => {
    if (score >= 0.8) return 'High Confidence';
    if (score >= 0.6) return 'Medium Confidence';
    return 'Low Confidence';
  };

  const getConfidenceDescription = (score: number) => {
    if (score >= 0.8) return 'The AI is very confident in this analysis';
    if (score >= 0.6) return 'The AI has moderate confidence - consider reviewing';
    return 'The AI has low confidence - manual review recommended';
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'processing':
        return <RefreshCw className="h-4 w-4 text-blue-500 animate-spin" />;
      case 'failed':
        return <AlertTriangle className="h-4 w-4 text-red-500" />;
      default:
        return <RefreshCw className="h-4 w-4 text-gray-500" />;
    }
  };

  const handleReprocess = async () => {
    if (!onReprocess) return;
    
    setIsReprocessing(true);
    try {
      await onReprocess(log.id);
    } catch (error) {
      console.error('Reprocess failed:', error);
    } finally {
      setIsReprocessing(false);
    }
  };

  const getTips = (score: number, hasError: boolean) => {
    if (hasError) return [];
    
    if (score < 0.7) {
      return [
        'Ensure good lighting when taking photos',
        'Include the entire meal in the frame',
        'Avoid heavily processed or mixed foods',
        'Take photos from directly above the food',
        'Remove packaging or plates that obscure the food'
      ];
    }
    return [];
  };

  // Compact version for dashboard views
  if (isCompact) {
    return (
      <div className={`flex items-center gap-2 ${className}`}>
        <Brain className="h-4 w-4 text-blue-600" />
        {log.processing_status === 'completed' && (
          <>
            <Badge 
              className={`${getConfidenceColor(log.confidence_score)} text-white text-xs`}
              variant="secondary"
            >
              {(log.confidence_score * 100).toFixed(0)}%
            </Badge>
            <span className="text-xs text-gray-500">AI Confidence</span>
          </>
        )}
        {log.processing_status === 'processing' && (
          <Badge variant="outline" className="text-blue-600">
            <RefreshCw className="h-3 w-3 mr-1 animate-spin" />
            Processing
          </Badge>
        )}
        {log.processing_status === 'failed' && (
          <Badge variant="outline" className="text-red-600">
            <AlertTriangle className="h-3 w-3 mr-1" />
            Failed
          </Badge>
        )}
      </div>
    );
  }

  const tips = getTips(log.confidence_score, !!log.error_message);

  return (
    <Card className={`border-l-4 border-l-blue-500 ${className}`}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Brain className="h-5 w-5 text-blue-600" />
          AI Analysis
          {getStatusIcon(log.processing_status)}
        </CardTitle>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Processing Status */}
        {log.processing_status === 'processing' && (
          <Alert>
            <RefreshCw className="h-4 w-4 animate-spin" />
            <AlertDescription className="text-blue-700">
              <div className="flex items-center gap-2">
                <Zap className="h-4 w-4" />
                <span>Analyzing your meal photo with AI...</span>
              </div>
              <div className="text-sm mt-1">
                This usually takes 10-30 seconds
              </div>
            </AlertDescription>
          </Alert>
        )}

        {/* Failed Status */}
        {log.processing_status === 'failed' && (
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              <div className="font-medium mb-2">Analysis Failed</div>
              {log.error_message && (
                <p className="text-sm mb-2">{log.error_message}</p>
              )}
              <Button 
                size="sm" 
                onClick={handleReprocess}
                disabled={isReprocessing}
                className="bg-red-600 hover:bg-red-700"
              >
                {isReprocessing ? (
                  <RefreshCw className="h-4 w-4 mr-1 animate-spin" />
                ) : (
                  <RefreshCw className="h-4 w-4 mr-1" />
                )}
                Try Again
              </Button>
            </AlertDescription>
          </Alert>
        )}

        {/* Completed Analysis */}
        {log.processing_status === 'completed' && (
          <>
            {/* Confidence Score */}
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">Analysis Confidence</span>
                <Badge className={`${getConfidenceColor(log.confidence_score)} text-white`}>
                  {getConfidenceText(log.confidence_score)}
                </Badge>
              </div>
              
              <Progress 
                value={log.confidence_score * 100} 
                className="h-3"
              />
              
              <div className="flex justify-between items-center text-sm">
                <span className="text-gray-600">
                  {getConfidenceDescription(log.confidence_score)}
                </span>
                <span className="font-medium">
                  {(log.confidence_score * 100).toFixed(1)}%
                </span>
              </div>
            </div>

            {/* Food Items Analysis */}
            {log.food_items && log.food_items.length > 0 && (
              <div className="space-y-2">
                <h4 className="font-medium text-sm flex items-center gap-2">
                  <Eye className="h-4 w-4" />
                  Detected Food Items ({log.food_items.length})
                </h4>
                
                <div className="space-y-2">
                  {log.food_items.map((item, index) => (
                    <div key={index} className="p-3 bg-gray-50 rounded-lg">
                      <div className="flex justify-between items-start">
                        <div>
                          <span className="font-medium text-gray-900">{item.name}</span>
                          <span className="text-gray-500 ml-2">({item.quantity})</span>
                        </div>
                        <div className="text-lg font-bold text-orange-600">
                          {item.calories} cal
                        </div>
                      </div>
                      <div className="mt-2 text-sm text-gray-600 grid grid-cols-3 gap-4">
                        <div>Protein: {item.protein_g}g</div>
                        <div>Carbs: {item.carbs_g}g</div>
                        <div>Fat: {item.fat_g}g</div>
                      </div>
                    </div>
                  ))}
                </div>
                
                {/* Total Summary */}
                <div className="pt-2 border-t bg-orange-50 p-3 rounded-lg">
                  <div className="flex justify-between items-center">
                    <span className="font-medium text-gray-700">Total Estimated</span>
                    <span className="text-xl font-bold text-orange-600">
                      {Math.round(log.total_calories)} calories
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* Analysis Notes */}
            {log.notes && (
              <div className="p-3 bg-blue-50 rounded-lg">
                <div className="flex items-center gap-2 text-blue-700 mb-2">
                  <Info className="h-4 w-4" />
                  <span className="font-medium">AI Notes</span>
                </div>
                <p className="text-sm text-blue-700">{log.notes}</p>
              </div>
            )}

            {/* Image Reference */}
            {log.image_url && (
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Camera className="h-4 w-4" />
                <span>Analysis based on uploaded image</span>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => window.open(log.image_url, '_blank')}
                  className="text-blue-600 hover:text-blue-800 p-0 h-auto"
                >
                  View Image
                </Button>
              </div>
            )}
          </>
        )}

        {/* Action Buttons */}
        {log.processing_status === 'completed' && (
          <div className="flex gap-2 pt-2 border-t">
            {onCorrect && (
              <Button 
                size="sm" 
                variant="outline"
                onClick={() => onCorrect(log.id)}
              >
                <Eye className="h-4 w-4 mr-1" />
                Review & Correct
              </Button>
            )}
            {onReprocess && (
              <Button 
                size="sm" 
                variant="outline"
                onClick={handleReprocess}
                disabled={isReprocessing}
              >
                {isReprocessing ? (
                  <RefreshCw className="h-4 w-4 mr-1 animate-spin" />
                ) : (
                  <RefreshCw className="h-4 w-4 mr-1" />
                )}
                Reanalyze
              </Button>
            )}
          </div>
        )}

        {/* Improvement Tips */}
        {tips.length > 0 && (
          <div className="p-3 bg-yellow-50 rounded-lg">
            <div className="flex items-center gap-2 text-yellow-700 mb-2">
              <Lightbulb className="h-4 w-4" />
              <span className="font-medium">Tips for Better AI Analysis</span>
            </div>
            <ul className="text-sm text-yellow-700 space-y-1">
              {tips.map((tip, index) => (
                <li key={index}>• {tip}</li>
              ))}
            </ul>
          </div>
        )}
      </CardContent>
    </Card>
  );
}