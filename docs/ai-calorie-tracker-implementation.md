# AI Calorie Tracker - Project Overview & Implementation Plan

## Project Vision

**Core Concept**: Build the simplest, most effective calorie tracking experience by leveraging AI to analyze food photos and automatically log nutritional information. Focus on habit formation through minimal friction rather than complex manual logging.

### Key Principles
- **Minimal Friction**: Take a photo → AI estimates calories → Auto-logged
- **Privacy First**: Multi-tenant, self-hostable, user data isolation
- **Statistical Accuracy**: Ranges and approximations are sufficient for effectiveness
- **Mobile-First**: Optimized for smartphone camera usage
- **Habit Formation**: Focus on consistency over precision

## Current State Analysis

### ✅ Existing Infrastructure
- **Authentication**: Supabase Auth with email/password
- **Database**: PostgreSQL with Row Level Security (RLS)
- **Frontend**: Next.js 15 with App Router, Tailwind CSS, shadcn/ui
- **Testing**: Jest + React Testing Library
- **Logging**: Custom Winston-based system with privacy masking

### ✅ Database Schema (Ready)
- `nutrition_logs` table with fields for:
  - `food_items` (JSONB)
  - `total_calories`, `total_protein_g`, `total_carbs_g`, `total_fat_g`, `total_fiber_g`
  - `image_url` (TEXT)
  - `confidence_score` (DECIMAL)
  - `notes` (TEXT)
  - User isolation via RLS policies

### ✅ UI Components
- Landing page with calorie tracking feature highlighted
- Dashboard preview components (CalorieIntakeChart)
- Comprehensive UI component library (shadcn/ui)
- Mobile-responsive design

### ❌ Missing Core Features
- **Photo Upload Component**: Camera integration and image handling
- **AI Processing Pipeline**: Food recognition and nutritional analysis
- **Inngest Integration**: Background processing for AI analysis
- **Calorie Tracking Dashboard**: Real-time nutrition display
- **Mobile Camera Optimization**: PWA features for native-like experience

## Technical Architecture

### AI Processing Pipeline
```
User Photo → Upload to Supabase Storage → Inngest Function → AI Model → Nutrition Analysis → Database Storage
```

### Technology Stack
- **Frontend**: Next.js 15, React, Tailwind CSS
- **Backend**: Supabase (Database, Auth, Storage)
- **AI Processing**: Inngest functions + TBD AI model
- **Image Storage**: Supabase Storage with CDN
- **Deployment**: Vercel (Frontend) + Supabase (Backend)

## Implementation Plan

### Phase 1: Core Photo Upload (Week 1-2)
#### Tasks:
1. **Create Photo Upload Component**
   - [ ] Mobile camera integration
   - [ ] Image preview and confirmation
   - [ ] File size optimization
   - [ ] Error handling

2. **Set Up Supabase Storage**
   - [ ] Configure image storage bucket
   - [ ] Set up RLS policies for user images
   - [ ] Implement image upload API

3. **Basic Nutrition Entry Form**
   - [ ] Manual calorie entry as fallback
   - [ ] Simple form validation
   - [ ] Save to nutrition_logs table

### Phase 2: AI Integration Setup (Week 3-4)
#### Tasks:
1. **Inngest Configuration**
   - [ ] Set up Inngest account and environment
   - [ ] Configure Next.js integration
   - [ ] Create basic function structure

2. **AI Model Integration (OpenAI Vision + Google Cloud Vision)**
   - [ ] Set up OpenAI Vision API integration
   - [ ] Set up Google Cloud Vision API integration
   - [ ] Create prompt engineering for nutrition estimation
   - [ ] Implement fallback between models

3. **Background Processing Pipeline**
   - [ ] Image processing function
   - [ ] Nutrition analysis workflow
   - [ ] Database update automation

### Phase 3: Core Calorie Tracking (Week 5-6)
#### Tasks:
1. **Calorie Dashboard**
   - [ ] Daily calorie summary
   - [ ] Weekly trends visualization
   - [ ] Macro breakdown charts

2. **Food Log Management**
   - [ ] View logged meals with images
   - [ ] Edit/delete entries
   - [ ] Search and filter functionality

3. **AI Analysis Display**
   - [ ] Confidence score indicators
   - [ ] Nutritional breakdown
   - [ ] Suggested corrections

### Phase 4: Mobile Experience (Week 7-8)
#### Tasks:
1. **PWA Implementation**
   - [ ] Service worker for offline support
   - [ ] App manifest for home screen installation
   - [ ] Push notifications for meal reminders

2. **Camera Optimization**
   - [ ] Optimized camera interface
   - [ ] Auto-focus and lighting suggestions
   - [ ] Batch photo processing

3. **Quick Actions**
   - [ ] Rapid meal logging
   - [ ] Favorite foods shortcuts
   - [ ] Voice notes integration

### Phase 5: Advanced Features (Week 9-10)
#### Tasks:
1. **Statistical Analysis**
   - [ ] Calorie range predictions
   - [ ] Confidence intervals
   - [ ] Trend analysis

2. **Integration Preparation**
   - [ ] API endpoints for weight data
   - [ ] Sleep/mood correlation hooks
   - [ ] Data export functionality

3. **Multi-tenant Features**
   - [ ] Family sharing options
   - [ ] Privacy controls
   - [ ] Data isolation verification

### Phase 6: Protected UI Integration (Week 11-12)
#### Tasks:
1. **Protected Route Structure**
   - [ ] Create `/app/*` protected route structure
   - [ ] Move `/profile` to `/app/profile`
   - [ ] Set up authentication middleware for `/app/*`

2. **Calorie Tracker Dashboard**
   - [ ] Create `/app/calorie-tracker` main dashboard
   - [ ] Integrate all components into cohesive UI
   - [ ] Add navigation between features

3. **User Experience Integration**
   - [ ] Combine weight tracking with calorie data
   - [ ] Add meal logging to dashboard
   - [ ] Create unified health insights view

## Detailed Implementation Steps

### Step 1: Photo Upload Component
**File**: `src/components/calorie-tracker/PhotoUpload.tsx`

```typescript
// Features to implement:
```
- [ ] Camera access via navigator.mediaDevices
- [ ] Image preview with crop/rotate options
- [ ] File size compression
- [ ] Upload progress indicator
- [ ] Error handling for permissions

**Database Changes**: None required (existing nutrition_logs table)

### Step 2: Supabase Storage Setup
**Configuration**:
- [ ] Create `meal-images` bucket in Supabase Storage
- [ ] Set up RLS policies for user-specific access
- [ ] Configure image optimization settings

**API Routes**:
- [ ] `POST /api/upload-meal-image` - Handle image uploads
- [ ] `GET /api/meal-images/[id]` - Retrieve user images

### Step 3: Inngest Integration
**Setup**:
- [ ] Install Inngest SDK: `npm install inngest`
- [ ] Create `src/inngest/` directory structure
- [ ] Configure environment variables

**Functions**:
- [ ] `analyzeFood` - Process uploaded images
- [ ] `updateNutritionData` - Store AI analysis results
- [ ] `generateInsights` - Create personalized recommendations

### Step 4: AI Model Integration
**Implementation** (OpenAI Vision + Google Cloud Vision):
- [ ] Set up OpenAI Vision API credentials
- [ ] Set up Google Cloud Vision API credentials
- [ ] Create prompt engineering for nutrition estimation
- [ ] Implement model fallback logic (OpenAI primary, Google secondary)
- [ ] Error handling for unclear images
- [ ] Confidence scoring system

### Step 5: Calorie Dashboard Components
**Components**:
- [ ] `CalorieTracker.tsx` - Main dashboard
- [ ] `MealLog.tsx` - Individual meal entries
- [ ] `NutritionSummary.tsx` - Daily/weekly summaries
- [ ] `ProgressChart.tsx` - Trend visualization

### Step 6: Protected UI Integration
**Protected Route Structure**:
- [ ] Create `/app` layout with authentication check
- [ ] Move `/profile` to `/app/profile`
- [ ] Create `/app/calorie-tracker` main page
- [ ] Set up navigation between protected routes

**UI Integration**:
- [ ] Integrate photo upload component
- [ ] Connect AI analysis display
- [ ] Combine with existing weight tracking
- [ ] Create unified dashboard experience



## Risk Mitigation

### Technical Risks
- **AI Model Accuracy**: Implement confidence scoring and manual override
- **Image Processing Costs**: Set up usage limits and optimization
- **Mobile Performance**: Implement progressive loading and caching

### User Experience Risks
- **Complex Interface**: Focus on single-action workflows
- **Privacy Concerns**: Clear data usage policies and self-hosting options
- **Habit Formation**: Implement gentle reminders and streak tracking

## Next Steps

1. **Week 1**: Start with Photo Upload Component development
2. **Week 2**: Set up Supabase Storage and basic image handling
3. **Week 3**: Configure Inngest and begin AI integration
4. **Week 4**: Implement core calorie tracking dashboard
5. **Week 5**: Mobile optimization and PWA features
6. **Week 6**: Protected UI integration and `/app/*` route structure

