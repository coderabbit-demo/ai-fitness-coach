"use client"

import type React from "react"
import { useState, useEffect, useCallback } from "react"
import { createClient } from "@/utils/supabase/client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Loader2, User, Save, ArrowLeft, Target, Activity, Heart, AlertCircle, Scale } from "lucide-react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { 
  type WeightUnit, 
  convertFromKg, 
  convertToKg, 
  formatWeightWithConfig,
  isValidWeight 
} from "@/lib/weight-conversion"

interface UserProfile {
  id: string
  full_name: string | null
  email: string | null
  age: number | null
  gender: string | null
  height_cm: number | null
  weight_kg: number | null
  activity_level: string | null
  fitness_goals: string[] | null
  medical_conditions: string[] | null
  dietary_restrictions: string[] | null
  preferences: {
    weightUnit?: WeightUnit
    [key: string]: unknown
  }
  created_at: string
  updated_at: string
}

const GENDER_OPTIONS = [
  { value: "", label: "Select gender" },
  { value: "male", label: "Male" },
  { value: "female", label: "Female" },
  { value: "other", label: "Other" },
  { value: "prefer_not_to_say", label: "Prefer not to say" },
]

const ACTIVITY_LEVELS = [
  { value: "", label: "Select activity level" },
  { value: "sedentary", label: "Sedentary (desk job, no exercise)" },
  { value: "lightly_active", label: "Lightly active (light exercise 1-3 days/week)" },
  { value: "moderately_active", label: "Moderately active (moderate exercise 3-5 days/week)" },
  { value: "very_active", label: "Very active (hard exercise 6-7 days/week)" },
  { value: "extra_active", label: "Extra active (very hard exercise, physical job)" },
]

const FITNESS_GOALS = [
  "Weight loss",
  "Muscle gain",
  "Improved endurance",
  "Better sleep",
  "Stress reduction",
  "General fitness",
  "Athletic performance",
  "Flexibility",
  "Balance",
  "Injury recovery",
]

const COMMON_CONDITIONS = [
  "Diabetes",
  "High blood pressure",
  "Heart condition",
  "Arthritis",
  "Back problems",
  "Knee problems",
  "Asthma",
  "Other respiratory issues",
]

const DIETARY_RESTRICTIONS = [
  "Vegetarian",
  "Vegan",
  "Gluten-free",
  "Dairy-free",
  "Nut allergies",
  "Shellfish allergy",
  "Low sodium",
  "Low carb",
  "Keto",
  "Paleo",
]

const WEIGHT_UNIT_OPTIONS = [
  { value: "kg", label: "Kilograms (kg)" },
  { value: "lb", label: "Pounds (lb)" },
] as const

/**
 * Renders the user's profile page with capabilities to view, edit, and save personal, physical, and preference information.
 *
 * Fetches the authenticated user's profile from the backend, manages form state for editing, and handles unit conversions for weight. Provides validation, displays operation status messages, and redirects to login if unauthenticated. Supports multi-select fields for goals, conditions, and dietary restrictions, and visually organizes profile data into logical sections.
 *
 * @returns The profile page React component.
 */
export default function ProfilePage() {
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null)
  const [isEditing, setIsEditing] = useState(false)
  const router = useRouter()

  // Form state
  const [formData, setFormData] = useState({
    full_name: "",
    age: "",
    gender: "",
    height_cm: "",
    weight_kg: "",
    weight_display: "", // Weight in user's preferred unit for display
    activity_level: "",
    fitness_goals: [] as string[],
    medical_conditions: [] as string[],
    dietary_restrictions: [] as string[],
    weightUnit: "kg" as WeightUnit,
  })

  const fetchProfile = useCallback(async () => {
    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()

      if (!user) {
        router.push('/login')
        return
      }

      const { data, error } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('id', user.id)
        .single()

      if (error) {
        console.error('Error fetching profile:', error)
        setMessage({ type: "error", text: "Failed to load profile data" })
      } else {
        setProfile(data)
        // Get user's weight unit preference
        const userWeightUnit = (data.preferences?.weightUnit as WeightUnit) || 'kg'
        
        // Convert weight for display in user's preferred unit
        const weightInUserUnit = data.weight_kg 
          ? convertFromKg(data.weight_kg, userWeightUnit).toString()
          : ""
        
        // Populate form data
        setFormData({
          full_name: data.full_name || "",
          age: data.age?.toString() || "",
          gender: data.gender || "",
          height_cm: data.height_cm?.toString() || "",
          weight_kg: data.weight_kg?.toString() || "",
          weight_display: weightInUserUnit,
          activity_level: data.activity_level || "",
          fitness_goals: data.fitness_goals || [],
          medical_conditions: data.medical_conditions || [],
          dietary_restrictions: data.dietary_restrictions || [],
          weightUnit: userWeightUnit,
        })
      }
    } catch (error) {
      console.error('Error:', error)
      setMessage({ type: "error", text: "An unexpected error occurred" })
    } finally {
      setLoading(false)
    }
  }, [router])

  useEffect(() => {
    fetchProfile()
  }, [fetchProfile])

  const handleSave = async () => {
    setSaving(true)
    setMessage(null)

    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()

      if (!user) {
        router.push('/login')
        return
      }

      // Convert weight from user's preferred unit to kg for database storage
      let weightInKg: number | null = null
      if (formData.weight_display) {
        const weightValue = parseFloat(formData.weight_display)
        if (!isNaN(weightValue) && isValidWeight(weightValue, formData.weightUnit)) {
          weightInKg = convertToKg(weightValue, formData.weightUnit)
        }
      }

      // Prepare preferences update
      const currentPreferences = profile?.preferences || {}
      const updatedPreferences = {
        ...currentPreferences,
        weightUnit: formData.weightUnit
      }

      // Prepare update data
      const updateData = {
        full_name: formData.full_name || null,
        age: formData.age ? parseInt(formData.age) : null,
        gender: formData.gender || null,
        height_cm: formData.height_cm ? parseInt(formData.height_cm) : null,
        weight_kg: weightInKg,
        activity_level: formData.activity_level || null,
        fitness_goals: formData.fitness_goals.length > 0 ? formData.fitness_goals : null,
        medical_conditions: formData.medical_conditions.length > 0 ? formData.medical_conditions : null,
        dietary_restrictions: formData.dietary_restrictions.length > 0 ? formData.dietary_restrictions : null,
        preferences: updatedPreferences,
      }

      const { error } = await supabase
        .from('user_profiles')
        .update(updateData)
        .eq('id', user.id)

      if (error) {
        console.error('Error updating profile:', error)
        setMessage({ type: "error", text: "Failed to update profile" })
      } else {
        setMessage({ type: "success", text: "Profile updated successfully!" })
        setIsEditing(false)
        await fetchProfile() // Refresh the data
      }
    } catch (error) {
      console.error('Error:', error)
      setMessage({ type: "error", text: "An unexpected error occurred" })
    } finally {
      setSaving(false)
    }
  }

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const handleWeightUnitChange = (newUnit: WeightUnit) => {
    setFormData(prev => {
      // Convert current weight display value to new unit
      let convertedWeight = ""
      if (prev.weight_display) {
        const currentWeight = parseFloat(prev.weight_display)
        if (!isNaN(currentWeight) && isValidWeight(currentWeight, prev.weightUnit)) {
          const weightInKg = convertToKg(currentWeight, prev.weightUnit)
          const weightInNewUnit = convertFromKg(weightInKg, newUnit)
          convertedWeight = weightInNewUnit.toFixed(1)
        }
      }
      
      return {
        ...prev,
        weightUnit: newUnit,
        weight_display: convertedWeight
      }
    })
  }

  const toggleArrayItem = (field: 'fitness_goals' | 'medical_conditions' | 'dietary_restrictions', item: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: prev[field].includes(item)
        ? prev[field].filter(i => i !== item)
        : [...prev[field], item]
    }))
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
        <Card className="w-full max-w-md">
          <CardContent className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
            <span className="ml-3 text-slate-600">Loading profile...</span>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-4 mb-4">
            <Button variant="outline" size="sm" asChild>
              <Link href="/">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back
              </Link>
            </Button>
            <div className="flex items-center gap-2">
              <User className="w-6 h-6 text-blue-600" />
              <h1 className="text-3xl font-bold text-slate-900">My Profile</h1>
            </div>
          </div>
          {profile?.updated_at && (
            <p className="text-slate-600">
              Last updated: {new Date(profile.updated_at).toLocaleDateString()}
            </p>
          )}
        </div>

        {/* Messages */}
        {message && (
          <Alert className={`mb-6 ${message.type === "error" ? "border-red-200 bg-red-50" : "border-green-200 bg-green-50"}`}>
            <AlertCircle className="w-4 h-4" />
            <AlertDescription className={message.type === "error" ? "text-red-800" : "text-green-800"}>
              {message.text}
            </AlertDescription>
          </Alert>
        )}

        <div className="grid lg:grid-cols-2 xl:grid-cols-3 gap-6">
          {/* Preferences */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Scale className="w-5 h-5" />
                Preferences
              </CardTitle>
              <CardDescription>
                Your display and unit preferences
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="weight_unit">Weight Unit</Label>
                {isEditing ? (
                  <select
                    id="weight_unit"
                    value={formData.weightUnit}
                    onChange={(e) => handleWeightUnitChange(e.target.value as WeightUnit)}
                    className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                  >
                    {WEIGHT_UNIT_OPTIONS.map(option => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                ) : (
                  <Input
                    value={WEIGHT_UNIT_OPTIONS.find(u => u.value === formData.weightUnit)?.label || formData.weightUnit}
                    disabled
                  />
                )}
              </div>
            </CardContent>
          </Card>
          {/* Basic Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="w-5 h-5" />
                Basic Information
              </CardTitle>
              <CardDescription>
                Your personal details and contact information
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="full_name">Full Name</Label>
                <Input
                  id="full_name"
                  value={isEditing ? formData.full_name : (profile?.full_name || "Not set")}
                  onChange={(e) => handleInputChange("full_name", e.target.value)}
                  disabled={!isEditing}
                  placeholder="Enter your full name"
                />
              </div>

              <div>
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  value={profile?.email || "Not set"}
                  disabled
                  className="bg-slate-50"
                />
                <p className="text-xs text-slate-500 mt-1">Email cannot be changed here</p>
              </div>

              <div>
                <Label htmlFor="age">Age</Label>
                <Input
                  id="age"
                  type="number"
                  value={isEditing ? formData.age : (profile?.age?.toString() || "Not set")}
                  onChange={(e) => handleInputChange("age", e.target.value)}
                  disabled={!isEditing}
                  placeholder="Enter your age"
                  min="1"
                  max="120"
                />
              </div>

              <div>
                <Label htmlFor="gender">Gender</Label>
                {isEditing ? (
                  <select
                    id="gender"
                    value={formData.gender}
                    onChange={(e) => handleInputChange("gender", e.target.value)}
                    className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                  >
                    {GENDER_OPTIONS.map(option => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                ) : (
                  <Input
                    value={profile?.gender ? GENDER_OPTIONS.find(g => g.value === profile.gender)?.label || profile.gender : "Not set"}
                    disabled
                  />
                )}
              </div>
            </CardContent>
          </Card>

          {/* Physical Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="w-5 h-5" />
                Physical Information
              </CardTitle>
              <CardDescription>
                Your physical measurements and activity level
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="height_cm">Height (cm)</Label>
                <Input
                  id="height_cm"
                  type="number"
                  value={isEditing ? formData.height_cm : (profile?.height_cm?.toString() || "Not set")}
                  onChange={(e) => handleInputChange("height_cm", e.target.value)}
                  disabled={!isEditing}
                  placeholder="Enter your height in cm"
                  min="100"
                  max="250"
                />
              </div>

              <div>
                <Label htmlFor="weight_display">
                  Weight ({formData.weightUnit})
                </Label>
                {isEditing ? (
                  <Input
                    id="weight_display"
                    type="number"
                    step="0.1"
                    value={formData.weight_display}
                    onChange={(e) => handleInputChange("weight_display", e.target.value)}
                    placeholder={`Enter your weight in ${formData.weightUnit}`}
                    min={formData.weightUnit === 'kg' ? "30" : "66"}
                    max={formData.weightUnit === 'kg' ? "300" : "661"}
                  />
                ) : (
                  <Input
                    value={
                      profile?.weight_kg 
                        ? formatWeightWithConfig(profile.weight_kg, { 
                            unit: formData.weightUnit, 
                            precision: 1, 
                            showUnit: true 
                          })
                        : "Not set"
                    }
                    disabled
                  />
                )}
              </div>

              <div>
                <Label htmlFor="activity_level">Activity Level</Label>
                {isEditing ? (
                  <select
                    id="activity_level"
                    value={formData.activity_level}
                    onChange={(e) => handleInputChange("activity_level", e.target.value)}
                    className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                  >
                    {ACTIVITY_LEVELS.map(level => (
                      <option key={level.value} value={level.value}>
                        {level.label}
                      </option>
                    ))}
                  </select>
                ) : (
                  <Input
                    value={profile?.activity_level ? ACTIVITY_LEVELS.find(a => a.value === profile.activity_level)?.label || profile.activity_level : "Not set"}
                    disabled
                  />
                )}
              </div>
            </CardContent>
          </Card>

          {/* Fitness Goals */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="w-5 h-5" />
                Fitness Goals
              </CardTitle>
              <CardDescription>
                Select your fitness objectives
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isEditing ? (
                <div className="space-y-2">
                  {FITNESS_GOALS.map(goal => (
                    <label key={goal} className="flex items-center space-x-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.fitness_goals.includes(goal)}
                        onChange={() => toggleArrayItem('fitness_goals', goal)}
                        className="rounded border-gray-300"
                      />
                      <span className="text-sm">{goal}</span>
                    </label>
                  ))}
                </div>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {profile?.fitness_goals && profile.fitness_goals.length > 0 ? (
                    profile.fitness_goals.map(goal => (
                      <Badge key={goal} variant="outline">{goal}</Badge>
                    ))
                  ) : (
                    <p className="text-slate-500 text-sm">No goals selected</p>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Medical Conditions */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Heart className="w-5 h-5" />
                Medical Conditions
              </CardTitle>
              <CardDescription>
                Any relevant medical conditions or concerns
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isEditing ? (
                <div className="space-y-2">
                  {COMMON_CONDITIONS.map(condition => (
                    <label key={condition} className="flex items-center space-x-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.medical_conditions.includes(condition)}
                        onChange={() => toggleArrayItem('medical_conditions', condition)}
                        className="rounded border-gray-300"
                      />
                      <span className="text-sm">{condition}</span>
                    </label>
                  ))}
                </div>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {profile?.medical_conditions && profile.medical_conditions.length > 0 ? (
                    profile.medical_conditions.map(condition => (
                      <Badge key={condition} variant="outline">{condition}</Badge>
                    ))
                  ) : (
                    <p className="text-slate-500 text-sm">No conditions listed</p>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Dietary Restrictions */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Heart className="w-5 h-5" />
                Dietary Restrictions
              </CardTitle>
              <CardDescription>
                Your dietary preferences and restrictions
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isEditing ? (
                <div className="space-y-2">
                  {DIETARY_RESTRICTIONS.map(restriction => (
                    <label key={restriction} className="flex items-center space-x-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.dietary_restrictions.includes(restriction)}
                        onChange={() => toggleArrayItem('dietary_restrictions', restriction)}
                        className="rounded border-gray-300"
                      />
                      <span className="text-sm">{restriction}</span>
                    </label>
                  ))}
                </div>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {profile?.dietary_restrictions && profile.dietary_restrictions.length > 0 ? (
                    profile.dietary_restrictions.map(restriction => (
                      <Badge key={restriction} variant="outline">{restriction}</Badge>
                    ))
                  ) : (
                    <p className="text-slate-500 text-sm">No restrictions listed</p>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Action Buttons */}
          <Card className="lg:col-span-2 xl:col-span-3">
            <CardContent className="flex justify-center gap-4 py-6">
              {isEditing ? (
                <>
                  <Button onClick={handleSave} disabled={saving}>
                    {saving ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      <>
                        <Save className="w-4 h-4 mr-2" />
                        Save Changes
                      </>
                    )}
                  </Button>
                  <Button variant="outline" onClick={() => setIsEditing(false)} disabled={saving}>
                    Cancel
                  </Button>
                </>
              ) : (
                <Button onClick={() => setIsEditing(true)}>
                  Edit Profile
                </Button>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
} 