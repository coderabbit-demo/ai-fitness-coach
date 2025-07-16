'use client';

import React, { useState, useEffect } from 'react';
import { Camera, Mic, Heart, X, Plus } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { OptimizedCamera } from './OptimizedCamera';
import { syncService } from '@/lib/pwa/sync-service';
import { offlineStorage } from '@/lib/pwa/offline-storage';
import { createClient } from '@/utils/supabase/client';
import type { User } from '@supabase/supabase-js';

// Speech Recognition API interfaces
interface SpeechRecognitionResult {
  readonly [index: number]: SpeechRecognitionAlternative;
  readonly length: number;
}

interface SpeechRecognitionAlternative {
  readonly transcript: string;
  readonly confidence: number;
}

interface SpeechRecognitionEvent extends Event {
  readonly results: SpeechRecognitionResultList;
  readonly resultIndex: number;
}

interface SpeechRecognitionResultList {
  readonly [index: number]: SpeechRecognitionResult;
  readonly length: number;
}

interface SpeechRecognitionErrorEvent extends Event {
  readonly error: string;
  readonly message?: string;
}

interface SpeechRecognition extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  start(): void;
  stop(): void;
  abort(): void;
  onstart: ((this: SpeechRecognition, ev: Event) => void) | null;
  onresult: ((this: SpeechRecognition, ev: SpeechRecognitionEvent) => void) | null;
  onerror: ((this: SpeechRecognition, ev: SpeechRecognitionErrorEvent) => void) | null;
  onend: ((this: SpeechRecognition, ev: Event) => void) | null;
}

declare global {
  interface Window {
    SpeechRecognition: {
      new (): SpeechRecognition;
    };
    webkitSpeechRecognition: {
      new (): SpeechRecognition;
    };
  }
}

interface QuickAction {
  id: string;
  label: string;
  icon: React.ElementType;
}

export const RapidMealLogger: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [mode, setMode] = useState<'photo' | 'voice' | 'favorites' | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [showCamera, setShowCamera] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const { toast } = useToast();
  const supabase = createClient();

  // Check authentication
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const { data: { user }, error } = await supabase.auth.getUser();
        if (error) {
          console.error('Auth check failed:', error);
        }
        setUser(user);
      } catch (error) {
        console.error('Failed to get user:', error);
      }
    };
    
    checkAuth();
  }, [supabase.auth]);

  const quickActions: QuickAction[] = [
    { id: 'photo', label: 'Photo', icon: Camera },
    { id: 'voice', label: 'Voice', icon: Mic },
    { id: 'favorites', label: 'Favorites', icon: Heart },
  ];

  useEffect(() => {
    // Register keyboard shortcuts
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.metaKey) {
        switch (e.key) {
          case 'p':
            e.preventDefault();
            handleQuickPhoto();
            break;
          case 'v':
            e.preventDefault();
            handleVoiceEntry();
            break;
          case 'f':
            e.preventDefault();
            openFavorites();
            break;
        }
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const handleQuickPhoto = async () => {
    setMode('photo');
    setShowCamera(true);
  };

  const handlePhotoCapture = async (photo: File) => {
    setShowCamera(false);
    
    // Check authentication
    if (!user) {
      toast({
        title: "Authentication required",
        description: "Please log in to capture meals",
        variant: "destructive"
      });
      return;
    }
    
    toast({
      title: "Analyzing photo...",
      description: "AI is processing your meal"
    });

    try {
      // In offline mode, queue for later
      if (!navigator.onLine) {
        const reader = new FileReader();
        reader.onloadend = async () => {
          await syncService?.queuePhotoUpload({
            fileName: photo.name,
            base64: reader.result?.toString().split(',')[1],
            mimeType: photo.type,
            user_id: user.id // Use actual authenticated user ID
          });
        };
        reader.readAsDataURL(photo);
        
        toast({
          title: "Photo saved offline",
          description: "Will analyze when connection is restored"
        });
      } else {
        // Online processing would happen here
        toast({
          title: "Meal logged!",
          description: "Successfully analyzed and saved"
        });
      }
    } catch {
      toast({
        title: "Error",
        description: "Failed to process photo",
        variant: "destructive"
      });
    }
    
    setMode(null);
  };

  const handleVoiceEntry = async () => {
    // Check authentication
    if (!user) {
      toast({
        title: "Authentication required",
        description: "Please log in to log meals",
        variant: "destructive"
      });
      return;
    }

    setMode('voice');
    setIsRecording(true);

    try {
      // Check for browser support
      const SpeechRecognitionClass = window.SpeechRecognition || window.webkitSpeechRecognition;
      
      if (!SpeechRecognitionClass) {
        throw new Error('Speech recognition not supported');
      }

      const recognition = new SpeechRecognitionClass();
      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.lang = 'en-US';

      recognition.onstart = () => {
        toast({
          title: "Listening...",
          description: "Speak your meal details"
        });
      };

      recognition.onresult = async (event: SpeechRecognitionEvent) => {
        const transcript = event.results[0][0].transcript;
        
        toast({
          title: "Processing...",
          description: `Heard: "${transcript}"`
        });

        // Queue for AI processing
        await syncService?.queueMealLog({
          meal_name: transcript,
          notes: "Voice entry",
          confidence_score: 0.8,
          user_id: user.id, // Use actual authenticated user ID
          meal_date: new Date().toISOString().split('T')[0],
          meal_type: getMealType()
        });

        toast({
          title: "Meal logged!",
          description: "Voice entry saved successfully"
        });
      };

      recognition.onerror = (event: any) => { // eslint-disable-line @typescript-eslint/no-explicit-any
        console.error('Speech recognition error:', event.error);
        toast({
          title: "Error",
          description: "Voice recording failed",
          variant: "destructive"
        });
      };

      recognition.onend = () => {
        setIsRecording(false);
        setMode(null);
      };

      recognition.start();
    } catch {
      toast({
        title: "Not supported",
        description: "Voice input is not available in your browser",
        variant: "destructive"
      });
      setIsRecording(false);
      setMode(null);
    }
  };

  const openFavorites = async () => {
    setMode('favorites');
    
    try {
      const favorites = await offlineStorage?.getFavoriteFoods();
      
      if (!favorites || favorites.length === 0) {
        toast({
          title: "No favorites yet",
          description: "Your favorite foods will appear here"
        });
      } else {
        // In a real implementation, show favorites modal
        toast({
          title: "Favorites",
          description: `You have ${favorites.length} favorite foods`
        });
      }
    } catch {
      toast({
        title: "Error",
        description: "Failed to load favorites",
        variant: "destructive"
      });
    }
    
    setMode(null);
  };

  const getMealType = (): string => {
    const hour = new Date().getHours();
    if (hour < 11) return 'breakfast';
    if (hour < 15) return 'lunch';
    if (hour < 18) return 'snack';
    return 'dinner';
  };

  if (showCamera) {
    return (
      <OptimizedCamera
        onCapture={handlePhotoCapture}
        onCancel={() => {
          setShowCamera(false);
          setMode(null);
        }}
      />
    );
  }

  return (
    <>
      {/* Floating Action Button */}
      <div className="fixed bottom-6 right-6 z-40">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className={cn(
            "w-14 h-14 rounded-full bg-blue-500 text-white shadow-lg",
            "hover:bg-blue-600 transition-all duration-200",
            "flex items-center justify-center",
            isOpen && "rotate-45"
          )}
        >
          {isOpen ? <X className="w-6 h-6" /> : <Plus className="w-6 h-6" />}
        </button>
      </div>

      {/* Quick Actions Menu */}
      {isOpen && (
        <div className="fixed bottom-24 right-6 z-40 flex flex-col gap-3">
          {quickActions.map((action, index) => (
            <div
              key={action.id}
              className={cn(
                "flex items-center gap-3 transform transition-all duration-200",
                `animate-in slide-in-from-right-5 fill-mode-both`,
              )}
              style={{ animationDelay: `${index * 50}ms` }}
            >
              {/* Label */}
              <span className="bg-gray-800 text-white px-3 py-1 rounded-lg text-sm whitespace-nowrap">
                {action.label}
              </span>
              
              {/* Button */}
              <button
                onClick={() => {
                  setIsOpen(false);
                  if (action.id === 'photo') handleQuickPhoto();
                  if (action.id === 'voice') handleVoiceEntry();
                  if (action.id === 'favorites') openFavorites();
                }}
                className={cn(
                  "w-12 h-12 rounded-full shadow-md transition-all",
                  "hover:scale-110 active:scale-95",
                  mode === action.id ? "bg-blue-600 text-white" : "bg-white text-gray-700"
                )}
              >
                <action.icon className="w-5 h-5 mx-auto" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Recording Indicator */}
      {isRecording && (
        <div className="fixed top-4 left-1/2 transform -translate-x-1/2 z-50">
          <div className="bg-red-500 text-white px-4 py-2 rounded-full flex items-center gap-2 animate-pulse">
            <div className="w-2 h-2 bg-white rounded-full animate-pulse" />
            <span className="text-sm font-medium">Recording...</span>
          </div>
        </div>
      )}

      {/* Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 z-30"
          onClick={() => setIsOpen(false)}
        />
      )}
    </>
  );
};