"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { createClient } from "@/utils/supabase/client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Loader2, User, Lock, Mail, Eye, EyeOff } from "lucide-react"
import { useRouter } from "next/navigation"
import { clientLogger, logError, logAuthEvent } from "@/lib/logger"

type AuthMode = "login" | "signup"

/**
 * Displays a user authentication page with login, signup, and password reset features integrated with Supabase.
 *
 * Provides forms for users to sign in, create an account, or request a password reset. Includes client-side validation for email, password, and full name, manages UI state for loading and feedback messages, and handles authentication flows. Redirects users to their profile page upon successful login and prompts email confirmation after signup.
 */
export default function LoginPage() {
  const [mode, setMode] = useState<AuthMode>("login")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [fullName, setFullName] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null)
  const router = useRouter()

  // Log page initialization
  useEffect(() => {
    clientLogger.info('Login page initialized', { 
      userAgent: navigator.userAgent,
      timestamp: new Date().toISOString(),
      currentMode: mode
    })
  }, [mode])

  const validatePassword = (pwd: string): string | null => {
    clientLogger.debug('Validating password', { 
      passwordLength: pwd.length,
      hasLowercase: /[a-z]/.test(pwd),
      hasUppercase: /[A-Z]/.test(pwd),
      hasNumber: /[0-9]/.test(pwd)
    })

    if (pwd.length < 8) {
      clientLogger.warn('Password validation failed: too short', { length: pwd.length })
      return "Password must be at least 8 characters long"
    }
    if (!/[a-z]/.test(pwd)) {
      clientLogger.warn('Password validation failed: missing lowercase')
      return "Password must contain at least one lowercase letter"
    }
    if (!/[A-Z]/.test(pwd)) {
      clientLogger.warn('Password validation failed: missing uppercase')
      return "Password must contain at least one uppercase letter"
    }
    if (!/[0-9]/.test(pwd)) {
      clientLogger.warn('Password validation failed: missing number')
      return "Password must contain at least one number"
    }
    
    clientLogger.debug('Password validation passed')
    return null
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setMessage(null)

    clientLogger.info(`Starting ${mode} process`, {
      email: email ? `${email.substring(0, 3)}***@${email.split('@')[1] || 'unknown'}` : 'empty',
      hasPassword: !!password,
      hasConfirmPassword: mode === 'signup' ? !!confirmPassword : 'N/A',
      hasFullName: mode === 'signup' ? !!fullName : 'N/A',
      mode
    })

    try {
      const supabase = createClient()
      clientLogger.debug('Supabase client created successfully')

      if (mode === "signup") {
        clientLogger.info('Processing signup request')
        
        // Validate password requirements
        const passwordError = validatePassword(password)
        if (passwordError) {
          clientLogger.error('Signup failed: password validation error', { error: passwordError })
          setMessage({ type: "error", text: passwordError })
          setLoading(false)
          return
        }

        // Check if passwords match
        if (password !== confirmPassword) {
          clientLogger.error('Signup failed: passwords do not match')
          setMessage({ type: "error", text: "Passwords do not match" })
          setLoading(false)
          return
        }

        // Log signup attempt
        logAuthEvent('signup_attempt', undefined, {
          email: email ? `${email.substring(0, 3)}***@${email.split('@')[1]}` : 'empty',
          hasFullName: !!fullName,
          fullNameLength: fullName?.length || 0
        })

        clientLogger.debug('Calling Supabase signUp', {
          email: email ? `${email.substring(0, 3)}***@${email.split('@')[1]}` : 'empty',
          hasPassword: !!password,
          passwordLength: password.length,
          fullName: fullName ? `${fullName.substring(0, 3)}***` : 'empty',
          redirectUrl: `${window.location.origin}/profile`
        })

        // Sign up user
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              full_name: fullName,
            },
            emailRedirectTo: `${window.location.origin}/profile`,
          },
        })

        clientLogger.debug('Supabase signUp response received', {
          hasData: !!data,
          hasUser: !!data?.user,
          userId: data?.user?.id,
          userEmail: data?.user?.email ? `${data.user.email.substring(0, 3)}***@${data.user.email.split('@')[1]}` : 'unknown',
          hasError: !!error,
          errorMessage: error?.message,
          errorCode: error?.code,
          needsConfirmation: !data?.user?.email_confirmed_at
        })

        if (error) {
          logError(error, 'signup', {
            email: email ? `${email.substring(0, 3)}***@${email.split('@')[1]}` : 'empty',
            errorCode: error.code,
            errorMessage: error.message
          })
          clientLogger.error('Signup failed with Supabase error', {
            errorMessage: error.message,
            errorCode: error.code,
            errorName: error.name
          })
          setMessage({ type: "error", text: error.message })
        } else {
          logAuthEvent('signup_success', data?.user?.id, {
            email: data?.user?.email ? `${data.user.email.substring(0, 3)}***@${data.user.email.split('@')[1]}` : 'unknown',
            needsConfirmation: !data?.user?.email_confirmed_at
          })
          clientLogger.info('Signup successful', {
            userId: data?.user?.id,
            needsEmailConfirmation: !data?.user?.email_confirmed_at
          })
          setMessage({
            type: "success",
            text: "Account created successfully! Please check your email to confirm your account before signing in.",
          })
          // Clear form
          setEmail("")
          setPassword("")
          setConfirmPassword("")
          setFullName("")
          // Switch to login mode
          setMode("login")
          clientLogger.info('Switched to login mode after successful signup')
        }
      } else {
        clientLogger.info('Processing login request')
        
        logAuthEvent('login_attempt', undefined, {
          email: email ? `${email.substring(0, 3)}***@${email.split('@')[1]}` : 'empty'
        })

        clientLogger.debug('Calling Supabase signInWithPassword', {
          email: email ? `${email.substring(0, 3)}***@${email.split('@')[1]}` : 'empty',
          hasPassword: !!password,
          passwordLength: password.length
        })

        // Sign in user
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password,
        })

        clientLogger.debug('Supabase signInWithPassword response received', {
          hasData: !!data,
          hasUser: !!data?.user,
          userId: data?.user?.id,
          userEmail: data?.user?.email ? `${data.user.email.substring(0, 3)}***@${data.user.email.split('@')[1]}` : 'unknown',
          hasSession: !!data?.session,
          hasError: !!error,
          errorMessage: error?.message,
          errorCode: error?.code
        })

        if (error) {
          logError(error, 'login', {
            email: email ? `${email.substring(0, 3)}***@${email.split('@')[1]}` : 'empty',
            errorCode: error.code,
            errorMessage: error.message
          })
          clientLogger.error('Login failed with Supabase error', {
            errorMessage: error.message,
            errorCode: error.code,
            errorName: error.name
          })
          setMessage({ type: "error", text: error.message })
        } else {
          logAuthEvent('login_success', data?.user?.id, {
            email: data?.user?.email ? `${data.user.email.substring(0, 3)}***@${data.user.email.split('@')[1]}` : 'unknown',
            sessionId: data?.session?.access_token ? 'present' : 'missing'
          })
          clientLogger.info('Login successful, redirecting to profile', {
            userId: data?.user?.id,
            hasSession: !!data?.session
          })
          // Redirect to profile on successful login
          router.push("/profile")
        }
      }
    } catch (error) {
      logError(error, `${mode}_unexpected`, {
        email: email ? `${email.substring(0, 3)}***@${email.split('@')[1]}` : 'empty',
        mode,
        formData: {
          hasEmail: !!email,
          hasPassword: !!password,
          hasConfirmPassword: mode === 'signup' ? !!confirmPassword : 'N/A',
          hasFullName: mode === 'signup' ? !!fullName : 'N/A'
        }
      })
      clientLogger.error(`Unexpected error during ${mode}`, {
        error: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined,
        mode
      })
      setMessage({
        type: "error",
        text: "An unexpected error occurred. Please try again.",
      })
    } finally {
      setLoading(false)
      clientLogger.debug(`${mode} process completed`, { mode })
    }
  }

  const handleForgotPassword = async () => {
    if (!email) {
      clientLogger.warn('Forgot password attempted without email')
      setMessage({ type: "error", text: "Please enter your email address first" })
      return
    }

    setLoading(true)
    setMessage(null)

    clientLogger.info('Processing password reset request', {
      email: email ? `${email.substring(0, 3)}***@${email.split('@')[1]}` : 'empty'
    })

    try {
      const supabase = createClient()
      
      logAuthEvent('password_reset_attempt', undefined, {
        email: email ? `${email.substring(0, 3)}***@${email.split('@')[1]}` : 'empty'
      })

      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      })

      clientLogger.debug('Supabase resetPasswordForEmail response', {
        hasError: !!error,
        errorMessage: error?.message,
        errorCode: error?.code
      })

      if (error) {
        logError(error, 'password_reset', {
          email: email ? `${email.substring(0, 3)}***@${email.split('@')[1]}` : 'empty',
          errorCode: error.code
        })
        clientLogger.error('Password reset failed', {
          errorMessage: error.message,
          errorCode: error.code
        })
        setMessage({ type: "error", text: error.message })
      } else {
        logAuthEvent('password_reset_success', undefined, {
          email: email ? `${email.substring(0, 3)}***@${email.split('@')[1]}` : 'empty'
        })
        clientLogger.info('Password reset email sent successfully')
        setMessage({
          type: "success",
          text: "Password reset email sent! Check your inbox for instructions.",
        })
      }
    } catch (error) {
      logError(error, 'password_reset_unexpected', {
        email: email ? `${email.substring(0, 3)}***@${email.split('@')[1]}` : 'empty'
      })
      clientLogger.error('Unexpected error during password reset', {
        error: error instanceof Error ? error.message : 'Unknown error'
      })
      setMessage({
        type: "error",
        text: "Failed to send password reset email. Please try again.",
      })
    } finally {
      setLoading(false)
      clientLogger.debug('Password reset process completed')
    }
  }

  const isFormValid = () => {
    const valid = mode === "signup" 
      ? email.trim() && password && confirmPassword && fullName.trim()
      : email.trim() && password
    
    clientLogger.debug('Form validation check', {
      mode,
      isValid: valid,
      hasEmail: !!email.trim(),
      hasPassword: !!password,
      hasConfirmPassword: mode === 'signup' ? !!confirmPassword : 'N/A',
      hasFullName: mode === 'signup' ? !!fullName.trim() : 'N/A'
    })
    
    return valid
  }

  // Log mode changes
  const handleModeChange = (newMode: AuthMode) => {
    clientLogger.info('Switching authentication mode', {
      from: mode,
      to: newMode
    })
    setMode(newMode)
    setMessage(null)
    setPassword("")
    setConfirmPassword("")
    if (newMode === 'login') {
      setFullName("")
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1 text-center">
          <div className="flex justify-center mb-4">
            <div className="w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center">
              <User className="w-6 h-6 text-white" />
            </div>
          </div>
          <CardTitle className="text-2xl font-bold">
            {mode === "login" ? "Welcome Back" : "Create Account"}
          </CardTitle>
          <CardDescription>
            {mode === "login"
              ? "Sign in to your AI Fitness Coach account"
              : "Join AI Fitness Coach and start your fitness journey"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === "signup" && (
              <div className="space-y-2">
                <Label htmlFor="fullName">Full Name</Label>
                <div className="relative">
                  <User className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    id="fullName"
                    type="text"
                    placeholder="Enter your full name"
                    value={fullName}
                    onChange={(e) => {
                      setFullName(e.target.value)
                      clientLogger.debug('Full name field updated', { hasValue: !!e.target.value })
                    }}
                    required
                    disabled={loading}
                    className="pl-10"
                  />
                </div>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="email">Email address</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  id="email"
                  type="email"
                  placeholder="Enter your email"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value)
                    clientLogger.debug('Email field updated', { 
                      hasValue: !!e.target.value,
                      isValidFormat: /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e.target.value)
                    })
                  }}
                  required
                  disabled={loading}
                  className="pl-10"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder={mode === "signup" ? "Create a password" : "Enter your password"}
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value)
                    clientLogger.debug('Password field updated', { 
                      hasValue: !!e.target.value,
                      length: e.target.value.length,
                      meetsMinLength: e.target.value.length >= 8
                    })
                  }}
                  required
                  disabled={loading}
                  className="pl-10 pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-3 text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {mode === "signup" && (
                <p className="text-xs text-gray-600">
                  Password must be at least 8 characters with uppercase, lowercase letters and numbers
                </p>
              )}
            </div>

            {mode === "signup" && (
              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirm Password</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    id="confirmPassword"
                    type={showConfirmPassword ? "text" : "password"}
                    placeholder="Confirm your password"
                    value={confirmPassword}
                    onChange={(e) => {
                      setConfirmPassword(e.target.value)
                      clientLogger.debug('Confirm password field updated', { 
                        hasValue: !!e.target.value,
                        matchesPassword: e.target.value === password
                      })
                    }}
                    required
                    disabled={loading}
                    className="pl-10 pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-3 text-gray-400 hover:text-gray-600"
                  >
                    {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>
            )}

            <Button type="submit" className="w-full" disabled={loading || !isFormValid()}>
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  {mode === "signup" ? "Creating account..." : "Signing in..."}
                </>
              ) : (
                mode === "signup" ? "Create Account" : "Sign In"
              )}
            </Button>
          </form>

          {message && (
            <Alert
              className={`mt-4 ${
                message.type === "error" ? "border-red-200 bg-red-50" : "border-green-200 bg-green-50"
              }`}
            >
              <AlertDescription className={message.type === "error" ? "text-red-800" : "text-green-800"}>
                {message.text}
              </AlertDescription>
            </Alert>
          )}

          <div className="mt-6 space-y-4">
            {mode === "login" && (
              <div className="text-center">
                <button
                  type="button"
                  onClick={handleForgotPassword}
                  disabled={loading}
                  className="text-sm text-blue-600 hover:text-blue-800 hover:underline"
                >
                  Forgot your password?
                </button>
              </div>
            )}

            <div className="text-center text-sm text-gray-600">
              {mode === "login" ? (
                <>
                  Don&apos;t have an account?{" "}
                  <button
                    type="button"
                    onClick={() => handleModeChange("signup")}
                    className="text-blue-600 hover:text-blue-800 hover:underline font-medium"
                  >
                    Sign up
                  </button>
                </>
              ) : (
                <>
                  Already have an account?{" "}
                  <button
                    type="button"
                    onClick={() => handleModeChange("login")}
                    className="text-blue-600 hover:text-blue-800 hover:underline font-medium"
                  >
                    Sign in
                  </button>
                </>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
