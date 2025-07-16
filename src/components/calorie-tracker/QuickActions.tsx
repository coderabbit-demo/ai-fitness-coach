'use client';

import { Button } from '@/components/ui/button';
import { Camera, Plus, Settings, FileText } from 'lucide-react';
import { useRouter } from 'next/navigation';

export function QuickActions() {
  const router = useRouter();

  const handleAddMeal = () => {
    // Navigate to photo upload page or trigger modal
    router.push('/calorie-tracker?view=add');
  };

  const handleViewLogs = () => {
    // Navigate to food log management page
    router.push('/calorie-tracker/logs');
  };

  const handleSettings = () => {
    // Navigate to nutrition goals settings
    router.push('/calorie-tracker/settings');
  };

  const handleTakePhoto = () => {
    // Navigate directly to camera
    router.push('/calorie-tracker?camera=true');
  };

  return (
    <div className="flex gap-2">
      <Button 
        onClick={handleTakePhoto}
        size="sm"
        className="bg-blue-600 hover:bg-blue-700"
      >
        <Camera className="h-4 w-4 mr-2" />
        Quick Photo
      </Button>
      
      <Button 
        onClick={handleAddMeal}
        size="sm"
        variant="outline"
      >
        <Plus className="h-4 w-4 mr-2" />
        Add Meal
      </Button>
      
      <Button 
        onClick={handleViewLogs}
        size="sm"
        variant="outline"
      >
        <FileText className="h-4 w-4 mr-2" />
        View Logs
      </Button>
      
      <Button 
        onClick={handleSettings}
        size="sm"
        variant="outline"
      >
        <Settings className="h-4 w-4 mr-2" />
        Settings
      </Button>
    </div>
  );
} 