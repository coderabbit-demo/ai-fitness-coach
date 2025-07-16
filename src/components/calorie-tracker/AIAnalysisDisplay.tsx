'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { 
  Brain, 
  CheckCircle, 
  AlertTriangle, 
  RefreshCw,
  Eye,
  TrendingUp,
  Info
} from 'lucide-react';

interface AIAnalysisProps {
  log: {
    id: string;
    confidence_score: number;
    processing_status: string;
    food_items: Array<{
      name: string;
      quantity: string;
      calories: number;
      protein_g: number;
      carbs_g: number;
      fat_g: number;
    }>;
    notes: string;
    image_url: string;
    error_message?: string;
  };
  onReprocess?: (logId: string) => void;
  onCorrect?: (logId: string) => void;
}

export function AIAnalysisDisplay({ log, onReprocess, onCorrect }: AIAnalysisProps) {
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

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-green-500" aria-label="Analysis completed successfully" />;
      case 'processing':
        return <RefreshCw className="h-4 w-4 text-blue-500 animate-spin" aria-label="Analysis in progress" />;
      case 'failed':
        return <AlertTriangle className="h-4 w-4 text-red-500" aria-label="Analysis failed" />;
      default:
        return <RefreshCw className="h-4 w-4 text-gray-500" aria-label="Analysis status unknown" />;
    }
  };

  return (
    <Card className="border-l-4 border-l-blue-500">
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
          <div className="flex items-center gap-2 text-blue-600">
            <RefreshCw className="h-4 w-4 animate-spin" />
            <span>Analyzing image...</span>
          </div>
        )}

        {log.processing_status === 'failed' && (
          <div className="p-3 bg-red-50 rounded-lg">
            <div className="flex items-center gap-2 text-red-700 mb-2">
              <AlertTriangle className="h-4 w-4" />
              <span className="font-medium">Analysis Failed</span>
            </div>
            {log.error_message && (
              <p className="text-sm text-red-600 mb-2">{log.error_message}</p>
            )}
            <Button 
              size="sm" 
              onClick={() => onReprocess?.(log.id)}
              className="bg-red-500 hover:bg-red-600"
            >
              <RefreshCw className="h-4 w-4 mr-1" />
              Try Again
            </Button>
          </div>
        )}

        {/* Confidence Score */}
        {log.processing_status === 'completed' && (
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium">Confidence Score</span>
              <Badge className={`${getConfidenceColor(log.confidence_score)} text-white`}>
                {getConfidenceText(log.confidence_score)}
              </Badge>
            </div>
            <Progress 
              value={log.confidence_score * 100} 
              className="h-2"
            />
            <div className="text-xs text-gray-500">
              {(log.confidence_score * 100).toFixed(1)}% confidence
            </div>
          </div>
        )}

        {/* Food Items Analysis */}
        {log.food_items && log.food_items.length > 0 && (
          <div className="space-y-2">
            <h4 className="font-medium text-sm flex items-center gap-2">
              <Eye className="h-4 w-4" />
              Detected Food Items
            </h4>
            <div className="space-y-2">
              {log.food_items.map((item, index) => (
                <div key={index} className="p-2 bg-gray-50 rounded flex justify-between items-center">
                  <div>
                    <span className="font-medium">{item.name}</span>
                    <span className="text-gray-500 ml-2">({item.quantity})</span>
                  </div>
                  <div className="text-sm font-medium text-orange-600">
                    {item.calories} cal
                  </div>
                </div>
              ))}
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
            <p className="text-sm text-blue-600">{log.notes}</p>
          </div>
        )}

        {/* Action Buttons */}
        {log.processing_status === 'completed' && (
          <div className="flex gap-2 pt-2">
            <Button 
              size="sm" 
              variant="outline"
              onClick={() => onCorrect?.(log.id)}
            >
              <Eye className="h-4 w-4 mr-1" />
              Correct Analysis
            </Button>
            <Button 
              size="sm" 
              variant="outline"
              onClick={() => onReprocess?.(log.id)}
            >
              <RefreshCw className="h-4 w-4 mr-1" />
              Reprocess
            </Button>
          </div>
        )}

        {/* Confidence Tips */}
        {log.confidence_score < 0.7 && log.processing_status === 'completed' && (
          <div className="p-3 bg-yellow-50 rounded-lg">
            <div className="flex items-center gap-2 text-yellow-700 mb-2">
              <TrendingUp className="h-4 w-4" />
              <span className="font-medium">Tips for Better Results</span>
            </div>
            <ul className="text-sm text-yellow-600 space-y-1">
              <li>• Ensure good lighting when taking photos</li>
              <li>• Include the entire meal in the frame</li>
              <li>• Avoid heavily processed or mixed foods</li>
              <li>• Take photos from directly above the food</li>
            </ul>
          </div>
        )}
      </CardContent>
    </Card>
  );
} 