# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

### Core Commands
- `npm run dev` - Start development server
- `npm run build` - Build production application
- `npm run start` - Start production server
- `npm run lint` - Run ESLint code linting

### Testing
- Tests are located in `__tests__` directories and files ending with `.test.tsx` or `.test.ts`
- Uses Jest and React Testing Library
- Example test files: `src/components/ui/input.test.tsx`, `src/lib/logger.test.ts`
- Run tests with standard Jest commands (not specified in package.json)

### Database
- Uses Supabase as database and authentication provider
- Database migrations in `supabase/migrations/`
- Database configuration in `supabase/config.toml`

## Architecture Overview

### Tech Stack
- **Framework**: Next.js 15 with App Router
- **Database**: Supabase (PostgreSQL with RLS)
- **Authentication**: Supabase Auth
- **Styling**: Tailwind CSS
- **UI Components**: Radix UI + shadcn/ui
- **Charts**: Recharts
- **Logging**: Winston with custom privacy-conscious implementation

### Project Structure
```
src/
├── app/                    # Next.js app router pages
│   ├── login/             # Authentication pages
│   ├── profile/           # User profile management
│   └── page.tsx           # Dashboard/home page
├── components/
│   ├── ui/                # Reusable UI components (shadcn/ui)
│   └── dashboard-preview.tsx
├── lib/                   # Utility libraries
│   ├── logger.ts          # Custom logging system
│   ├── utils.ts           # General utilities
│   └── weight-conversion.ts # Health data utilities
└── utils/supabase/        # Supabase client configurations
    ├── client.ts          # Browser client
    ├── server.ts          # Server-side client
    └── middleware.ts      # Auth middleware
```

### Database Schema
The application uses five main tables:
- `user_profiles` - User demographic and preference data
- `weight_logs` - Weight tracking with source attribution
- `nutrition_logs` - Food intake with AI-analyzed nutrition data
- `mood_logs` - Mental health and wellness tracking
- `ai_recommendations` - AI-generated health recommendations

All tables use Row Level Security (RLS) with user-specific access policies.

### Authentication Flow
- Uses Supabase Auth with email/password
- Automatic user profile creation via database triggers
- Comprehensive authentication state logging for debugging
- Middleware-based route protection

### Logging System
- Custom Winston-based logging with privacy protection
- Automatically masks sensitive data (emails, passwords)
- Environment-based log levels (debug in development, info in production)
- Service-specific loggers: `authLogger`, `dbLogger`, `apiLogger`, `clientLogger`
- Log files written to `logs/` directory in development

## Key Development Practices

### Component Architecture
- Uses shadcn/ui components in `src/components/ui/`
- Follows Radix UI patterns with Tailwind CSS
- Comprehensive test coverage with Jest/React Testing Library
- TypeScript with strict type checking

### State Management
- Server-side state via Supabase queries
- Client-side state with React hooks
- Authentication state managed by Supabase Auth

### Environment Configuration
- Copy `env.example` to `.env.local` for local development
- Set `LOG_LEVEL=debug` for detailed debugging
- Supabase credentials required: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`

### Code Quality
- ESLint configuration with Next.js and TypeScript rules
- Automated testing with comprehensive component tests
- Privacy-conscious logging that automatically masks sensitive data

## Important Notes

### Health Data Privacy
This application handles sensitive health data. All data processing must respect privacy:
- User data is isolated via RLS policies
- Logging system automatically masks sensitive information
- No user data should be exposed in logs or error messages

### AI Integration
The application is designed to integrate with AI services for:
- Nutrition analysis from food images
- Personalized health recommendations
- Holistic wellness insights based on weight, nutrition, and mood data

### Development Environment
- Uses TypeScript with strict type checking
- Tailwind CSS for styling
- Next.js App Router for file-based routing
- Supabase for backend services (database, auth, storage)