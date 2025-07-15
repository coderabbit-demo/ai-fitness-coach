'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { OptimizedCamera } from '@/components/calorie-tracker/OptimizedCamera';
import { imageOptimizer } from '@/lib/image/optimizer';
import { syncService } from '@/lib/pwa/sync-service';
import { useToast } from '@/hooks/use-toast';

export default function QuickPhotoPage() {
  const router = useRouter();
  const { toast } = useToast();

  useEffect(() => {
    // Check if user is authenticated
    // In a real app, you'd check authentication here
  }, []);

  const handlePhotoCapture = async (photo: File) => {
    try {
      // Optimize the image
      const optimizedPhoto = await imageOptimizer.optimizeForUpload(photo);
      
      toast({
        title: "Processing photo...",
        description: "AI is analyzing your meal"
      });

      // Queue for processing
      const reader = new FileReader();
      reader.onloadend = async () => {
        await syncService.queuePhotoUpload({
          fileName: optimizedPhoto.name,
          base64: reader.result?.toString().split(',')[1],
          mimeType: optimizedPhoto.type,
          user_id: 'current-user-id' // Replace with actual user ID
        });
      };
      reader.readAsDataURL(optimizedPhoto);

      // Navigate to dashboard
      router.push('/');
      
      toast({
        title: "Photo uploaded!",
        description: "Your meal is being analyzed"
      });
    } catch {
      toast({
        title: "Error",
        description: "Failed to process photo",
        variant: "destructive"
      });
    }
  };

  const handleCancel = () => {
    router.push('/');
  };

  return (
    <OptimizedCamera
      onCapture={handlePhotoCapture}
      onCancel={handleCancel}
      showGuidelines={true}
    />
  );
}