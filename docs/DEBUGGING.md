# Debugging Guide for AI Fitness Coach

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

When running in development, log files are created in the `logs/` directory:

```bash
# View the latest error log
tail -f logs/error-$(date +%Y-%m-%d).log

# View the latest combined log
tail -f logs/combined-$(date +%Y-%m-%d).log

# Search for specific errors
grep -i "signup" logs/combined-$(date +%Y-%m-%d).log

# View authentication events
grep "Auth event" logs/combined-$(date +%Y-%m-%d).log
```

### Performance Considerations

The logging system is designed to be:
- **Non-blocking**: Logs don't affect application performance
- **Privacy-conscious**: Email addresses and sensitive data are masked
- **Environment-aware**: Debug logs are disabled in production
- **File rotation**: Log files are automatically rotated to prevent disk space issues

### Getting Help

If you're still experiencing issues after checking the logs:

1. Copy the relevant log entries from the time when the issue occurred
2. Include your environment configuration (without sensitive values)
3. Describe the exact steps you took when the issue occurred
4. Note any error messages displayed to the user

The comprehensive logging should help identify exactly where in the authentication flow the issue is occurring. 