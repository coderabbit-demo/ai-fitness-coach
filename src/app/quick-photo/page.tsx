'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/utils/supabase/client';
import { OptimizedCamera } from '@/components/calorie-tracker/OptimizedCamera';
import { imageOptimizer } from '@/lib/image/optimizer';
import { syncService } from '@/lib/pwa/sync-service';
import { useToast } from '@/hooks/use-toast';
import type { User } from '@supabase/supabase-js';

export default function QuickPhotoPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    // Check if user is authenticated
    const checkAuth = async () => {
      try {
        const { data: { user }, error } = await supabase.auth.getUser();
        if (error || !user) {
          toast({
            title: "Authentication required",
            description: "Please log in to upload photos",
          });
          router.push('/login');
          return;
        }
        setUser(user);
      } catch (error) {
        console.error('Auth check failed:', error);
        router.push('/login');
      } finally {
        setIsLoading(false);
      }
    };
    
    checkAuth();
  }, [router, supabase.auth, toast]);

  if (isLoading) {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
  }

  if (!user) {
    return null; // Will redirect to login
  }

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
        try {
          if (syncService) {
            const signedUrl = await syncService.queuePhotoUpload({
              fileName: optimizedPhoto.name,
              base64: reader.result?.toString().split(',')[1],
              mimeType: optimizedPhoto.type,
              user_id: user.id // Use actual authenticated user ID
            });

            if (signedUrl) {
              console.log('Photo uploaded with signed URL:', signedUrl);
              toast({
                title: "Photo uploaded!",
                description: "Photo uploaded successfully and ready for processing"
              });
            } else {
              toast({
                title: "Photo queued",
                description: "Photo saved and will be uploaded when online"
              });
            }
          } else {
            throw new Error('Sync service not available');
          }
        } catch (error) {
          console.error('Failed to queue photo upload:', error);
          toast({
            title: "Upload failed",
            description: "Failed to queue photo for processing. Please try again.",
          });
        }
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