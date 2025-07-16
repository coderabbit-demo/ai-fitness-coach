# PWA Features - AI Calorie Tracker

## Overview

The AI Calorie Tracker has been enhanced with Progressive Web App (PWA) capabilities to provide a native-like mobile experience with offline functionality, quick actions, and optimized performance.

## Key Features Implemented

### 1. Progressive Web App (PWA)
- **Service Worker**: Enables offline functionality and background sync
- **App Manifest**: Allows installation on mobile devices
- **Offline Storage**: IndexedDB for storing data when offline
- **Auto-sync**: Automatically syncs data when connection is restored

### 2. Optimized Camera Experience
- **Guidelines Overlay**: Grid and tips for better food photos
- **Lighting Feedback**: Real-time analysis of photo lighting conditions
- **Flash Control**: Toggle flash for low-light situations
- **Batch Capture**: Take multiple photos for complete meals

### 3. Rapid Meal Logging
- **Floating Action Button**: Quick access to logging features
- **Voice Input**: Speak your meal details (browser-dependent)
- **Favorite Foods**: Quick-select frequently eaten meals
- **Keyboard Shortcuts**: Ctrl+P (photo), Ctrl+V (voice), Ctrl+F (favorites)

### 4. Image Optimization
- **Automatic Compression**: Reduces file size while maintaining quality
- **WebP Conversion**: Modern format for faster uploads
- **Thumbnail Generation**: Quick previews for meal history

### 5. Offline Capabilities
- **Offline Page**: Custom fallback when offline
- **Data Caching**: Recent meals cached for offline viewing
- **Queue System**: Actions queued and synced when online
- **Favorite Foods**: Available even without connection

## Installation Instructions

### Installing on Mobile

#### iOS (Safari)
1. Open the app in Safari
2. Tap the Share button (square with arrow)
3. Scroll down and tap "Add to Home Screen"
4. Name the app and tap "Add"

#### Android (Chrome)
1. Open the app in Chrome
2. You'll see an "Install" prompt after 1 minute
3. Tap "Install" to add to home screen
4. Or tap the menu (3 dots) → "Install app"

### Desktop Installation

#### Chrome/Edge
1. Look for the install icon in the address bar
2. Click "Install"
3. The app will open in its own window

## Using Quick Actions

### Camera Quick Capture
- Tap the floating action button (+)
- Select camera icon
- Follow on-screen guidelines for best results
- Photo will be automatically analyzed

### Voice Logging
- Tap the floating action button (+)
- Select microphone icon
- Speak your meal details clearly
- Example: "I had chicken salad with ranch dressing"

### Favorite Foods
- Frequently logged meals appear in favorites
- Access via floating action button
- Quick-add with customizable portions

## Offline Usage

When offline, you can:
- Take photos (will upload when online)
- View cached meal history
- Access favorite foods
- Log meals manually

All offline actions will sync automatically when connection is restored.

## Performance Tips

1. **Enable Notifications**: Get reminders and sync updates
2. **Keep App Updated**: Service worker auto-updates in background
3. **Clear Cache Periodically**: Settings → Clear Cache
4. **Use Quick Actions**: Faster than navigating menus

## Troubleshooting

### App Won't Install
- Ensure you're using HTTPS
- Clear browser cache and try again
- Check if PWA is already installed

### Camera Not Working
- Grant camera permissions in browser settings
- Ensure no other apps are using camera
- Try refreshing the page

### Offline Sync Issues
- Check internet connection
- Look for sync indicator in app
- Manually trigger sync in settings

## Browser Support

| Feature | Chrome | Safari | Firefox | Edge |
|---------|--------|--------|---------|------|
| PWA Install | ✅ | ✅ | ⚠️ | ✅ |
| Offline Mode | ✅ | ✅ | ✅ | ✅ |
| Camera | ✅ | ✅ | ✅ | ✅ |
| Voice Input | ✅ | ⚠️ | ⚠️ | ✅ |
| Push Notifications | ✅ | ⚠️ | ✅ | ✅ |

✅ Full support
⚠️ Partial support

## Future Enhancements

- Gesture controls for camera
- AI-powered meal suggestions
- Wearable device integration
- Social sharing features
- Advanced voice commands