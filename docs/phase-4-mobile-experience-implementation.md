# Phase 4: Mobile Experience - Technical Implementation Guide

## Overview

Phase 4 focuses on transforming the AI Calorie Tracker into a native-like mobile experience through Progressive Web App (PWA) features, camera optimization, and quick action workflows. This phase assumes Phases 1-3 are complete (photo upload, AI integration, and core dashboard).

## Goals & Success Metrics

### Primary Goals
- **Native-like Experience**: App feels like a native mobile app when installed
- **Offline Capability**: Core functionality works without internet connection
- **Optimized Camera**: Fast, intuitive photo capture with guidance
- **Quick Actions**: Reduce meal logging to <30 seconds
- **Performance**: <3s load time, <1s photo capture

### Success Metrics
- PWA installation rate >30%
- Photo capture completion rate >90%
- Average meal logging time <30 seconds
- Lighthouse PWA score >90

## Technical Architecture

### PWA Architecture
```
Next.js App → Service Worker → IndexedDB (offline) → Supabase (online sync)
```

### Camera Pipeline
```
Camera Stream → Optimized Capture → Image Processing → AI Analysis → Quick Edit
```

### Quick Actions System
```
Gesture/Voice → Action Router → Background Processing → UI Feedback
```

## Implementation Plan

## 1. PWA Implementation

### 1.1 Service Worker Setup

**File**: `public/sw.js`
```javascript
// Core service worker features to implement:
// - Cache API responses
// - Offline fallbacks
// - Background sync
// - Push notifications
```

**File**: `src/lib/pwa/service-worker.ts`
```typescript
// Service worker registration and lifecycle management
```

**Changes Required**:
- [ ] Create service worker with caching strategies
- [ ] Implement offline fallback pages
- [ ] Set up background sync for queued actions
- [ ] Configure push notification handlers

### 1.2 App Manifest Configuration

**File**: `public/manifest.json`
```json
{
  "name": "AI Fitness Coach - Calorie Tracker",
  "short_name": "AI Calorie Tracker",
  "description": "Smart calorie tracking with AI photo analysis",
  "start_url": "/app/calorie-tracker",
  "display": "standalone",
  "theme_color": "#000000",
  "background_color": "#ffffff",
  "icons": [
    {
      "src": "/icons/icon-192x192.png",
      "sizes": "192x192",
      "type": "image/png"
    },
    {
      "src": "/icons/icon-512x512.png",
      "sizes": "512x512",
      "type": "image/png"
    }
  ],
  "categories": ["health", "fitness", "food"],
  "shortcuts": [
    {
      "name": "Quick Photo",
      "short_name": "Photo",
      "description": "Take a quick meal photo",
      "url": "/app/calorie-tracker/quick-photo",
      "icons": [{ "src": "/icons/camera-96x96.png", "sizes": "96x96" }]
    }
  ]
}
```

**Changes Required**:
- [ ] Create app icons (192x192, 512x512, favicon variants)
- [ ] Configure manifest.json with proper metadata
- [ ] Set up shortcuts for quick actions
- [ ] Update `next.config.ts` to include manifest

### 1.3 Offline Data Management

**File**: `src/lib/pwa/offline-storage.ts`
```typescript
interface OfflineEntry {
  id: string;
  type: 'meal_log' | 'photo_upload' | 'user_action';
  data: any;
  timestamp: number;
  synced: boolean;
}

class OfflineStorage {
  private dbName = 'ai-calorie-tracker-offline';
  private version = 1;
  private db: IDBDatabase | null = null;

  async init(): Promise<void> {
    // Initialize IndexedDB
  }

  async store(entry: OfflineEntry): Promise<void> {
    // Store offline actions
  }

  async sync(): Promise<void> {
    // Sync with Supabase when online
  }
}
```

**Changes Required**:
- [ ] Set up IndexedDB for offline data storage
- [ ] Create sync mechanism with Supabase
- [ ] Handle conflict resolution for offline changes
- [ ] Implement queue system for background sync

### 1.4 Push Notifications

**File**: `src/lib/pwa/notifications.ts`
```typescript
interface NotificationConfig {
  type: 'meal_reminder' | 'analysis_complete' | 'weekly_summary';
  title: string;
  body: string;
  icon?: string;
  badge?: string;
  actions?: NotificationAction[];
}

class NotificationManager {
  async requestPermission(): Promise<boolean> {
    // Request notification permissions
  }

  async scheduleReminder(config: NotificationConfig): Promise<void> {
    // Schedule meal reminders
  }

  async showAnalysisComplete(mealData: any): Promise<void> {
    // Show when AI analysis is done
  }
}
```

**Changes Required**:
- [ ] Set up push notification service
- [ ] Create notification templates
- [ ] Implement meal reminder scheduling
- [ ] Add notification action handlers

## 2. Camera Optimization

### 2.1 Enhanced Camera Interface

**File**: `src/components/calorie-tracker/OptimizedCamera.tsx`
```typescript
interface CameraProps {
  onCapture: (image: File) => void;
  onCancel: () => void;
  showGuidelines?: boolean;
  enableBatch?: boolean;
}

const OptimizedCamera: React.FC<CameraProps> = ({
  onCapture,
  onCancel,
  showGuidelines = true,
  enableBatch = false
}) => {
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [facingMode, setFacingMode] = useState<'environment' | 'user'>('environment');
  const [flashMode, setFlashMode] = useState<'off' | 'on' | 'auto'>('auto');
  const [guidelines, setGuidelines] = useState(showGuidelines);
  
  // Advanced camera features
  const [autoFocus, setAutoFocus] = useState(true);
  const [exposureCompensation, setExposureCompensation] = useState(0);
  const [whiteBalance, setWhiteBalance] = useState('auto');
  
  // Batch processing
  const [batchPhotos, setBatchPhotos] = useState<File[]>([]);
  const [batchMode, setBatchMode] = useState(enableBatch);
  
  return (
    <div className="fixed inset-0 z-50 bg-black">
      {/* Camera stream */}
      <video
        ref={videoRef}
        autoPlay
        playsInline
        className="w-full h-full object-cover"
      />
      
      {/* Guidelines overlay */}
      {guidelines && <FoodPhotoGuidelines />}
      
      {/* Camera controls */}
      <CameraControls
        facingMode={facingMode}
        flashMode={flashMode}
        onFacingModeChange={setFacingMode}
        onFlashModeChange={setFlashMode}
        onCapture={handleCapture}
        onCancel={onCancel}
        batchMode={batchMode}
        batchCount={batchPhotos.length}
      />
      
      {/* Batch photo preview */}
      {batchMode && <BatchPhotoPreview photos={batchPhotos} />}
      
      {/* Lighting suggestions */}
      <LightingFeedback />
      
      {/* Focus indicator */}
      <FocusIndicator />
    </div>
  );
};
```

**Changes Required**:
- [ ] Implement advanced camera controls (flash, focus, exposure)
- [ ] Add real-time lighting feedback
- [ ] Create food photo guidelines overlay
- [ ] Implement batch photo capture
- [ ] Add focus indicators and auto-focus

### 2.2 Food Photo Guidelines Component

**File**: `src/components/calorie-tracker/FoodPhotoGuidelines.tsx`
```typescript
const FoodPhotoGuidelines: React.FC = () => {
  const [currentTip, setCurrentTip] = useState(0);
  
  const tips = [
    "Hold camera 12-18 inches from food",
    "Ensure good lighting - avoid shadows",
    "Include reference objects (utensils, coins)",
    "Capture the entire meal in frame",
    "Avoid blurry photos - tap to focus"
  ];
  
  return (
    <div className="absolute inset-0 pointer-events-none">
      {/* Grid overlay */}
      <div className="absolute inset-0 border-2 border-white/30">
        <div className="grid grid-cols-3 grid-rows-3 h-full">
          {Array.from({ length: 9 }).map((_, i) => (
            <div key={i} className="border border-white/20" />
          ))}
        </div>
      </div>
      
      {/* Tip overlay */}
      <div className="absolute top-4 left-4 right-4 bg-black/70 rounded-lg p-3">
        <p className="text-white text-sm font-medium">
          {tips[currentTip]}
        </p>
      </div>
      
      {/* Focus target */}
      <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
        <div className="w-20 h-20 border-2 border-white rounded-full" />
      </div>
    </div>
  );
};
```

**Changes Required**:
- [ ] Create photo guidelines overlay
- [ ] Implement grid system for composition
- [ ] Add focus target indicators
- [ ] Create rotating tips system

### 2.3 Lighting Feedback System

**File**: `src/components/calorie-tracker/LightingFeedback.tsx`
```typescript
const LightingFeedback: React.FC = () => {
  const [lightingQuality, setLightingQuality] = useState<'poor' | 'fair' | 'good'>('fair');
  const [suggestions, setSuggestions] = useState<string[]>([]);
  
  useEffect(() => {
    // Analyze lighting from camera stream
    const analyzeLighting = async () => {
      // Use canvas to analyze brightness/contrast
      // Provide real-time feedback
    };
    
    const interval = setInterval(analyzeLighting, 500);
    return () => clearInterval(interval);
  }, []);
  
  return (
    <div className="absolute bottom-20 left-4 right-4">
      <div className={`p-3 rounded-lg ${
        lightingQuality === 'good' ? 'bg-green-500/80' :
        lightingQuality === 'fair' ? 'bg-yellow-500/80' :
        'bg-red-500/80'
      }`}>
        <div className="flex items-center gap-2">
          <LightingIcon quality={lightingQuality} />
          <span className="text-white text-sm font-medium">
            {lightingQuality === 'good' && 'Perfect lighting!'}
            {lightingQuality === 'fair' && 'Lighting is OK'}
            {lightingQuality === 'poor' && 'Poor lighting detected'}
          </span>
        </div>
        
        {suggestions.length > 0 && (
          <div className="mt-2 text-xs text-white/90">
            {suggestions.map((suggestion, i) => (
              <div key={i}>• {suggestion}</div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
```

**Changes Required**:
- [ ] Implement real-time lighting analysis
- [ ] Create suggestion system for better photos
- [ ] Add visual feedback indicators
- [ ] Integrate with camera stream

### 2.4 Batch Photo Processing

**File**: `src/components/calorie-tracker/BatchPhotoProcessor.tsx`
```typescript
interface BatchPhoto {
  id: string;
  file: File;
  preview: string;
  timestamp: number;
  processed: boolean;
  analysisResult?: any;
}

const BatchPhotoProcessor: React.FC = () => {
  const [photos, setPhotos] = useState<BatchPhoto[]>([]);
  const [processing, setProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  
  const processBatch = async () => {
    setProcessing(true);
    
    for (let i = 0; i < photos.length; i++) {
      const photo = photos[i];
      
      try {
        // Upload to Supabase
        const uploadResult = await uploadPhoto(photo.file);
        
        // Trigger AI analysis
        const analysisResult = await analyzePhoto(uploadResult.path);
        
        // Update photo status
        setPhotos(prev => prev.map(p => 
          p.id === photo.id 
            ? { ...p, processed: true, analysisResult }
            : p
        ));
        
        setProgress((i + 1) / photos.length * 100);
        
      } catch (error) {
        console.error('Batch processing error:', error);
      }
    }
    
    setProcessing(false);
  };
  
  return (
    <div className="p-4">
      <div className="grid grid-cols-2 gap-4 mb-6">
        {photos.map(photo => (
          <BatchPhotoCard
            key={photo.id}
            photo={photo}
            onRemove={() => removePhoto(photo.id)}
          />
        ))}
      </div>
      
      {processing && (
        <div className="mb-4">
          <div className="bg-gray-200 rounded-full h-2">
            <div 
              className="bg-blue-500 h-2 rounded-full transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
          <p className="text-sm text-gray-600 mt-2">
            Processing {Math.round(progress)}% complete...
          </p>
        </div>
      )}
      
      <button
        onClick={processBatch}
        disabled={photos.length === 0 || processing}
        className="w-full bg-blue-500 text-white py-3 rounded-lg disabled:opacity-50"
      >
        {processing ? 'Processing...' : `Process ${photos.length} Photos`}
      </button>
    </div>
  );
};
```

**Changes Required**:
- [ ] Implement batch photo selection
- [ ] Create progress tracking for batch processing
- [ ] Add photo preview and editing
- [ ] Implement queue system for AI analysis

## 3. Quick Actions System

### 3.1 Quick Action Framework

**File**: `src/lib/quick-actions/action-router.ts`
```typescript
interface QuickAction {
  id: string;
  name: string;
  description: string;
  icon: string;
  handler: () => Promise<void>;
  shortcut?: string;
  voice?: string[];
}

class QuickActionRouter {
  private actions: Map<string, QuickAction> = new Map();
  private shortcuts: Map<string, string> = new Map();
  private voiceCommands: Map<string, string> = new Map();
  
  register(action: QuickAction): void {
    this.actions.set(action.id, action);
    
    if (action.shortcut) {
      this.shortcuts.set(action.shortcut, action.id);
    }
    
    if (action.voice) {
      action.voice.forEach(command => {
        this.voiceCommands.set(command.toLowerCase(), action.id);
      });
    }
  }
  
  async execute(actionId: string): Promise<void> {
    const action = this.actions.get(actionId);
    if (!action) throw new Error(`Action ${actionId} not found`);
    
    await action.handler();
  }
  
  handleShortcut(shortcut: string): void {
    const actionId = this.shortcuts.get(shortcut);
    if (actionId) this.execute(actionId);
  }
  
  handleVoiceCommand(command: string): void {
    const actionId = this.voiceCommands.get(command.toLowerCase());
    if (actionId) this.execute(actionId);
  }
}
```

**Changes Required**:
- [ ] Create quick action registration system
- [ ] Implement keyboard shortcuts
- [ ] Add voice command recognition
- [ ] Create action execution framework

### 3.2 Rapid Meal Logging

**File**: `src/components/calorie-tracker/RapidMealLogger.tsx`
```typescript
const RapidMealLogger: React.FC = () => {
  const [mode, setMode] = useState<'photo' | 'voice' | 'favorites'>('photo');
  const [isRecording, setIsRecording] = useState(false);
  const [quickEntry, setQuickEntry] = useState('');
  
  const quickActions = [
    { id: 'photo', label: 'Photo', icon: CameraIcon },
    { id: 'voice', label: 'Voice', icon: MicrophoneIcon },
    { id: 'favorites', label: 'Favorites', icon: HeartIcon },
  ];
  
  const handleQuickPhoto = async () => {
    // Open optimized camera
    const photo = await openQuickCamera();
    
    // Show loading state
    showLoadingToast('Analyzing photo...');
    
    // Background AI processing
    const result = await analyzePhoto(photo);
    
    // Quick confirmation
    const confirmed = await showQuickConfirmation(result);
    
    if (confirmed) {
      await saveMealLog(result);
      showSuccessToast('Meal logged!');
    }
  };
  
  const handleVoiceEntry = async () => {
    setIsRecording(true);
    
    try {
      const transcript = await startVoiceRecording();
      const parsed = await parseVoiceEntry(transcript);
      
      const confirmed = await showQuickConfirmation(parsed);
      
      if (confirmed) {
        await saveMealLog(parsed);
        showSuccessToast('Meal logged!');
      }
    } catch (error) {
      showErrorToast('Voice recording failed');
    } finally {
      setIsRecording(false);
    }
  };
  
  return (
    <div className="fixed bottom-4 right-4 z-50">
      <div className="bg-white rounded-full shadow-lg p-2">
        <div className="flex gap-2">
          {quickActions.map(action => (
            <button
              key={action.id}
              onClick={() => {
                if (action.id === 'photo') handleQuickPhoto();
                if (action.id === 'voice') handleVoiceEntry();
                if (action.id === 'favorites') openFavorites();
              }}
              className={`p-3 rounded-full transition-all ${
                mode === action.id
                  ? 'bg-blue-500 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              <action.icon className="w-5 h-5" />
            </button>
          ))}
        </div>
      </div>
      
      {isRecording && (
        <div className="absolute bottom-full mb-2 right-0 bg-red-500 text-white px-3 py-1 rounded-lg">
          Recording...
        </div>
      )}
    </div>
  );
};
```

**Changes Required**:
- [ ] Create floating quick action buttons
- [ ] Implement rapid photo capture
- [ ] Add voice-to-text meal logging
- [ ] Create favorites quick-select
- [ ] Add haptic feedback for actions

### 3.3 Favorites Management

**File**: `src/components/calorie-tracker/FavoriteFoods.tsx`
```typescript
interface FavoriteFood {
  id: string;
  name: string;
  calories: number;
  macros: {
    protein: number;
    carbs: number;
    fat: number;
    fiber: number;
  };
  imageUrl?: string;
  frequency: number;
  lastUsed: Date;
  tags: string[];
}

const FavoriteFoods: React.FC = () => {
  const [favorites, setFavorites] = useState<FavoriteFood[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  
  const filteredFavorites = favorites.filter(food => {
    const matchesSearch = food.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesTags = selectedTags.length === 0 || 
      selectedTags.some(tag => food.tags.includes(tag));
    return matchesSearch && matchesTags;
  });
  
  const handleQuickAdd = async (food: FavoriteFood) => {
    // Show portion size selector
    const portion = await showPortionSelector(food);
    
    // Calculate adjusted nutrition
    const adjustedNutrition = {
      calories: food.calories * portion,
      protein: food.macros.protein * portion,
      carbs: food.macros.carbs * portion,
      fat: food.macros.fat * portion,
      fiber: food.macros.fiber * portion,
    };
    
    // Save to meal log
    await saveMealLog({
      food_items: [{ ...food, portion }],
      total_calories: adjustedNutrition.calories,
      total_protein_g: adjustedNutrition.protein,
      total_carbs_g: adjustedNutrition.carbs,
      total_fat_g: adjustedNutrition.fat,
      total_fiber_g: adjustedNutrition.fiber,
      confidence_score: 1.0, // Manual entry
      notes: 'Added from favorites',
    });
    
    // Update frequency
    await updateFavoriteFrequency(food.id);
    
    showSuccessToast(`${food.name} added to log!`);
  };
  
  return (
    <div className="p-4">
      <div className="mb-4">
        <input
          type="text"
          placeholder="Search favorites..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full p-3 border rounded-lg"
        />
      </div>
      
      <div className="mb-4 flex flex-wrap gap-2">
        {['breakfast', 'lunch', 'dinner', 'snack'].map(tag => (
          <button
            key={tag}
            onClick={() => toggleTag(tag)}
            className={`px-3 py-1 rounded-full text-sm ${
              selectedTags.includes(tag)
                ? 'bg-blue-500 text-white'
                : 'bg-gray-200 text-gray-700'
            }`}
          >
            {tag}
          </button>
        ))}
      </div>
      
      <div className="grid grid-cols-1 gap-3">
        {filteredFavorites.map(food => (
          <div
            key={food.id}
            className="bg-white rounded-lg border p-4 flex items-center gap-3"
          >
            {food.imageUrl && (
              <img
                src={food.imageUrl}
                alt={food.name}
                className="w-12 h-12 rounded-lg object-cover"
              />
            )}
            
            <div className="flex-1">
              <h3 className="font-medium">{food.name}</h3>
              <p className="text-sm text-gray-600">
                {food.calories} cal • {food.macros.protein}g protein
              </p>
            </div>
            
            <button
              onClick={() => handleQuickAdd(food)}
              className="bg-blue-500 text-white px-4 py-2 rounded-lg"
            >
              Add
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};
```

**Changes Required**:
- [ ] Create favorites storage system
- [ ] Implement smart sorting by frequency
- [ ] Add quick portion selector
- [ ] Create tagging system for foods
- [ ] Add search and filter functionality

### 3.4 Voice Notes Integration

**File**: `src/lib/voice/voice-processor.ts`
```typescript
interface VoiceNote {
  id: string;
  transcript: string;
  audioUrl: string;
  timestamp: Date;
  mealLogId?: string;
  tags: string[];
  processed: boolean;
}

class VoiceProcessor {
  private recognition: SpeechRecognition | null = null;
  private mediaRecorder: MediaRecorder | null = null;
  
  async startRecording(): Promise<string> {
    return new Promise((resolve, reject) => {
      // Check for Speech Recognition API support
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      
      if (!SpeechRecognition) {
        reject(new Error('Speech Recognition API not supported in this browser'));
        return;
      }
      
      // Start speech recognition
      this.recognition = new SpeechRecognition();
      this.recognition.continuous = true;
      this.recognition.interimResults = true;
      
      this.recognition.onresult = (event) => {
        const transcript = event.results[event.results.length - 1][0].transcript;
        resolve(transcript);
      };
      
      this.recognition.onerror = (event) => {
        reject(event.error);
      };
      
      this.recognition.start();
    });
  }
  
  async parseVoiceEntry(transcript: string): Promise<any> {
    // Use AI to parse voice entry into nutrition data
    const prompt = `
      Parse this voice entry into nutrition data:
      "${transcript}"
      
      Return JSON with:
      - food_items: array of foods mentioned
      - estimated_calories: number
      - meal_type: breakfast/lunch/dinner/snack
      - notes: any additional context
    `;
    
    const result = await callAI(prompt);
    return JSON.parse(result);
  }
  
  async saveVoiceNote(note: VoiceNote): Promise<void> {
    // Save to database with audio file
    await supabase.from('voice_notes').insert({
      transcript: note.transcript,
      audio_url: note.audioUrl,
      timestamp: note.timestamp,
      meal_log_id: note.mealLogId,
      tags: note.tags,
      user_id: getCurrentUserId(),
    });
  }
}
```

**Changes Required**:
- [ ] Implement speech recognition
- [ ] Create voice note storage system
- [ ] Add AI parsing for voice entries
- [ ] Create voice note playback interface
- [ ] Add voice command shortcuts

## 4. Performance Optimizations

### 4.1 Image Optimization

**File**: `src/lib/image/optimizer.ts`
```typescript
interface ImageOptimizationOptions {
  maxWidth: number;
  maxHeight: number;
  quality: number;
  format: 'webp' | 'jpeg' | 'png';
}

class ImageOptimizer {
  async optimizeForUpload(file: File): Promise<File> {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();
    
    return new Promise((resolve) => {
      img.onload = () => {
        // Calculate dimensions
        const { width, height } = this.calculateDimensions(
          img.width,
          img.height,
          { maxWidth: 1024, maxHeight: 1024 }
        );
        
        canvas.width = width;
        canvas.height = height;
        
        // Draw and compress
        ctx.drawImage(img, 0, 0, width, height);
        
        canvas.toBlob(
          (blob) => {
            resolve(new File([blob], file.name, { type: 'image/webp' }));
          },
          'image/webp',
          0.85
        );
      };
      
      img.src = URL.createObjectURL(file);
    });
  }
  
  private calculateDimensions(
    originalWidth: number,
    originalHeight: number,
    options: { maxWidth: number; maxHeight: number }
  ): { width: number; height: number } {
    const ratio = Math.min(
      options.maxWidth / originalWidth,
      options.maxHeight / originalHeight
    );
    
    return {
      width: Math.round(originalWidth * ratio),
      height: Math.round(originalHeight * ratio),
    };
  }
}
```

**Changes Required**:
- [ ] Implement client-side image compression
- [ ] Add WebP format support
- [ ] Create progressive image loading
- [ ] Add image caching strategies

### 4.2 Cache Management

**File**: `src/lib/cache/cache-manager.ts`
```typescript
interface CacheEntry<T> {
  data: T;
  timestamp: number;
  expiresAt: number;
}

class CacheManager {
  private cache = new Map<string, CacheEntry<any>>();
  private readonly TTL = 5 * 60 * 1000; // 5 minutes
  
  set<T>(key: string, data: T, ttl: number = this.TTL): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      expiresAt: Date.now() + ttl,
    });
  }
  
  get<T>(key: string): T | null {
    const entry = this.cache.get(key);
    
    if (!entry) return null;
    
    if (Date.now() > entry.expiresAt) {
      this.cache.delete(key);
      return null;
    }
    
    return entry.data;
  }
  
  async getOrFetch<T>(
    key: string,
    fetcher: () => Promise<T>,
    ttl: number = this.TTL
  ): Promise<T> {
    const cached = this.get<T>(key);
    if (cached) return cached;
    
    const data = await fetcher();
    this.set(key, data, ttl);
    return data;
  }
  
  clear(): void {
    this.cache.clear();
  }
}
```

**Changes Required**:
- [ ] Implement memory caching for frequent data
- [ ] Add cache invalidation strategies
- [ ] Create cache warming for critical paths
- [ ] Add cache size limits and cleanup

## 5. Testing Strategy

### 5.1 PWA Testing

**File**: `src/__tests__/pwa/service-worker.test.ts`
```typescript
describe('Service Worker', () => {
  test('should cache critical resources', async () => {
    // Test offline capability
  });
  
  test('should handle push notifications', async () => {
    // Test notification handling
  });
  
  test('should sync offline data', async () => {
    // Test background sync
  });
});
```

### 5.2 Camera Testing

**File**: `src/__tests__/camera/camera.test.ts`
```typescript
describe('Camera Optimization', () => {
  test('should capture high-quality photos', async () => {
    // Test photo quality
  });
  
  test('should provide lighting feedback', async () => {
    // Test lighting analysis
  });
  
  test('should handle batch processing', async () => {
    // Test batch photo upload
  });
});
```

### 5.3 Performance Testing

**File**: `src/__tests__/performance/performance.test.ts`
```typescript
describe('Performance', () => {
  test('should load in under 3 seconds', async () => {
    // Test load time
  });
  
  test('should capture photos in under 1 second', async () => {
    // Test photo capture speed
  });
  
  test('should handle offline mode', async () => {
    // Test offline functionality
  });
});
```

## 6. Deployment Configuration

### 6.1 Next.js Configuration Updates

**File**: `next.config.ts`
```typescript
import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  // PWA configuration
  experimental: {
    serverActions: {
      allowedOrigins: ['localhost:3000', 'your-domain.com'],
    },
  },
  
  // Image optimization
  images: {
    domains: ['your-supabase-url.supabase.co'],
    formats: ['image/webp', 'image/avif'],
  },
  
  // Headers for PWA
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
        ],
      },
      {
        source: '/sw.js',
        headers: [
          {
            key: 'Cache-Control',
            value: 'no-cache, no-store, must-revalidate',
          },
        ],
      },
    ];
  },
};

export default nextConfig;
```

### 6.2 Vercel Configuration

**File**: `vercel.json`
```json
{
  "headers": [
    {
      "source": "/sw.js",
      "headers": [
        {
          "key": "Cache-Control",
          "value": "no-cache, no-store, must-revalidate"
        }
      ]
    },
    {
      "source": "/manifest.json",
      "headers": [
        {
          "key": "Cache-Control",
          "value": "public, max-age=31536000, immutable"
        }
      ]
    }
  ],
  "rewrites": [
    {
      "source": "/api/pwa/:path*",
      "destination": "/api/pwa/:path*"
    }
  ]
}
```

## 7. File Structure Changes

```
src/
├── components/
│   └── calorie-tracker/
│       ├── OptimizedCamera.tsx
│       ├── FoodPhotoGuidelines.tsx
│       ├── LightingFeedback.tsx
│       ├── BatchPhotoProcessor.tsx
│       ├── RapidMealLogger.tsx
│       ├── FavoriteFoods.tsx
│       └── QuickActions.tsx
├── lib/
│   ├── pwa/
│   │   ├── service-worker.ts
│   │   ├── offline-storage.ts
│   │   └── notifications.ts
│   ├── quick-actions/
│   │   └── action-router.ts
│   ├── voice/
│   │   └── voice-processor.ts
│   ├── image/
│   │   └── optimizer.ts
│   └── cache/
│       └── cache-manager.ts
└── app/
    └── calorie-tracker/
        ├── quick-photo/
        │   └── page.tsx
        └── quick-actions/
            └── page.tsx

public/
├── sw.js
├── manifest.json
└── icons/
    ├── icon-192x192.png
    ├── icon-512x512.png
    └── camera-96x96.png
```

## 8. Implementation Timeline

### Week 1: PWA Foundation
- [ ] Day 1-2: Service worker setup and basic caching
- [ ] Day 3-4: App manifest and icon creation
- [ ] Day 5-7: Offline storage and sync mechanism

### Week 2: Camera & Quick Actions
- [ ] Day 1-3: Enhanced camera interface with guidelines
- [ ] Day 4-5: Batch photo processing
- [ ] Day 6-7: Quick actions framework and voice integration

## 9. Success Metrics & Monitoring

### Key Performance Indicators
- **PWA Installation Rate**: >30% of users
- **Photo Capture Success Rate**: >90%
- **Average Meal Logging Time**: <30 seconds
- **Offline Functionality**: 100% of core features work offline
- **Lighthouse PWA Score**: >90

### Monitoring Setup
- [ ] Implement performance monitoring
- [ ] Set up error tracking for PWA features
- [ ] Create analytics for quick actions usage
- [ ] Monitor offline sync success rates

## 10. Future Enhancements

### Phase 4.1: Advanced Features
- [ ] Gesture controls for camera
- [ ] AI-powered meal suggestions
- [ ] Social sharing of meals
- [ ] Wearable device integration

### Phase 4.2: Optimization
- [ ] Machine learning for better photo guidelines
- [ ] Predictive caching for favorites
- [ ] Advanced voice command processing
- [ ] Real-time collaboration features

This comprehensive implementation guide provides the technical foundation for creating a native-like mobile experience for the AI Calorie Tracker. Each component is designed to work seamlessly together while maintaining performance and user experience standards. 