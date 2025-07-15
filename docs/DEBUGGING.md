# AI Fitness Coach - Debugging Guide

## API Key Management & Graceful Degradation

### Overview
The application is designed to build and run successfully even when AI API keys are missing. This allows for public deployments and development environments without requiring expensive API keys.

### How It Works

**🔄 Lazy Initialization Pattern:**
- AI clients (OpenAI, Google Vision) are only initialized when environment variables are present
- Missing API keys are logged as warnings, not errors
- The build process continues successfully regardless of missing keys

**🎯 Fallback Strategy:**
- **Primary**: OpenAI Vision API (for food image analysis)
- **Fallback**: Google Cloud Vision API
- **Graceful Failure**: Clear error messages when both are unavailable

**📝 Developer Logging:**
```bash
# Successful initialization
INFO: OpenAI client initialized successfully
INFO: Google Vision client initialized successfully

# Missing API keys (warnings, not errors)
WARN: OPENAI_API_KEY environment variable is missing - OpenAI functionality will be disabled
WARN: Google Vision client not initialized - missing environment variables: GOOGLE_APPLICATION_CREDENTIALS, GOOGLE_CLOUD_PROJECT_ID
```

### Setting Up API Keys (Optional)

**For Local Development:**
1. Copy `env.example` to `.env.local`
2. Add your API keys:
```bash
# Required only if you want AI nutrition analysis
OPENAI_API_KEY=sk-your-key-here

# Optional - fallback for nutrition analysis
GOOGLE_APPLICATION_CREDENTIALS=path/to/service-account.json
GOOGLE_CLOUD_PROJECT_ID=your-project-id
```

**For Production/Vercel:**
1. Add environment variables in your deployment platform
2. The app will automatically detect and use available services

### Testing Without API Keys

**Build Test:**
```bash
# This should succeed even without API keys
npm run build
```

**Runtime Behavior:**
- ✅ App loads and functions normally
- ✅ Non-AI features work completely
- ⚠️ AI nutrition analysis will show appropriate error messages
- 📊 All other features (auth, manual logging, etc.) work normally

### Best Practices for Public Apps

1. **Never commit API keys** to version control
2. **Design for graceful degradation** - core features should work without AI
3. **Provide clear user feedback** when AI features are unavailable
4. **Use environment-specific configurations** for different deployment stages
5. **Monitor logs** to understand which services are available in each environment

### Troubleshooting

**Build Fails with "OPENAI_API_KEY missing":**
- ✅ **Fixed!** - The app now handles this gracefully
- Check that you're using the latest code with lazy initialization

**AI Features Not Working:**
1. Check logs for initialization status
2. Verify environment variables are set correctly  
3. Ensure API keys have proper permissions
4. Test with one provider at a time to isolate issues

**Example Error Handling:**
```typescript
// The app will show users clear messages like:
"AI nutrition analysis is temporarily unavailable. Please enter your meal details manually."
```

This approach ensures your app is production-ready and user-friendly, even when AI services are unavailable.

## Authentication Issues Debugging

This guide helps you debug authentication problems using the comprehensive logging system we've set up.

### Setup

1. **Environment Variables**: Ensure you have the following environment variables set in your `.env.local` file:
   ```bash
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   LOG_LEVEL=debug
   NODE_ENV=development
   ```

2. **Start Development Server**:
   ```bash
   npm run dev
   ```

### Logging Locations

1. **Browser Console**: Real-time logging for client-side events
2. **Terminal/Console**: Server-side and client-side logging combined
3. **Log Files** (when in server environment):
   - `logs/error-YYYY-MM-DD.log` - Error logs only
   - `logs/combined-YYYY-MM-DD.log` - All logs
   - `logs/debug-YYYY-MM-DD.log` - Debug logs (development only)

### Common Issues and Debugging Steps

#### 1. Signup Not Working

**Check the logs for these events:**

1. **Page Initialization**:
   ```
   [AUTH INFO]: Login page initialized
   ```

2. **Form Validation**:
   ```
   [AUTH DEBUG]: Validating password
   [AUTH DEBUG]: Form validation check
   ```

3. **Signup Attempt**:
   ```
   [AUTH INFO]: Auth event: signup_attempt
   [AUTH DEBUG]: Calling Supabase signUp
   [AUTH DEBUG]: Supabase signUp response received
   ```

4. **Common Error Patterns**:
   - **Missing Environment Variables**:
     ```
     [ERROR]: Missing NEXT_PUBLIC_SUPABASE_URL environment variable
     ```
   - **Password Validation Failures**:
     ```
     [AUTH WARN]: Password validation failed: too short
     ```
   - **Supabase Errors**:
     ```
     [AUTH ERROR]: Signup failed with Supabase error
     ```

#### 2. Login Not Working

**Check for these log patterns:**

1. **Login Attempt**:
   ```
   [AUTH INFO]: Auth event: login_attempt
   [AUTH DEBUG]: Calling Supabase signInWithPassword
   ```

2. **Authentication State Changes**:
   ```
   [AUTH INFO]: Supabase auth state changed { event: 'SIGNED_IN' }
   ```

#### 3. Environment Issues

**Verify these log entries:**

1. **Supabase Client Creation**:
   ```
   [AUTH DEBUG]: Creating Supabase client
   [AUTH INFO]: Supabase client created successfully
   ```

### Debugging Checklist

When debugging authentication issues, check these items in order:

- [ ] **Environment Variables**: Are `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` set correctly?
- [ ] **Network Connection**: Can you reach your Supabase project?
- [ ] **Supabase Project Status**: Is your Supabase project active and properly configured?
- [ ] **Email Configuration**: Is email authentication enabled in your Supabase project?
- [ ] **Form Validation**: Are all required fields filled correctly?
- [ ] **Password Requirements**: Does the password meet the strength requirements?
- [ ] **Browser Console**: Are there any JavaScript errors blocking execution?

### Log Levels

- **ERROR**: Critical issues that prevent functionality
- **WARN**: Warning conditions that might cause issues
- **INFO**: General information about application flow
- **DEBUG**: Detailed information for debugging (includes form field changes, validation steps)

### Useful Debug Commands

1. **Check current auth state**:
   ```javascript
   // In browser console
   const { data: { user } } = await supabase.auth.getUser()
   console.log('Current user:', user)
   ```

2. **Check Supabase connection**:
   ```javascript
   // In browser console
   const { data, error } = await supabase.auth.getSession()
   console.log('Session:', data, 'Error:', error)
   ```

3. **Clear all auth data**:
   ```javascript
   // In browser console
   await supabase.auth.signOut()
   localStorage.clear()
   sessionStorage.clear()
   ```

### Reading Log Files

When running in development, log files are created in the `logs/`