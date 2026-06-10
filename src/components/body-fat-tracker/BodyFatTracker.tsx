"use client"

import { useEffect, useState } from "react"
import { Line, LineChart, CartesianGrid, XAxis, YAxis } from "recharts"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { formatBodyFatPercentage, getBodyFatChange, isValidBodyFatPercentage } from "@/lib/body-fat"
import { convertFromKg, convertToKg, formatWeightWithConfig, isValidWeight, type WeightUnit } from "@/lib/weight-conversion"
import { logError } from "@/lib/logger"
import { createClient } from "@/utils/supabase/client"
import { Activity, CalendarDays, Droplets, Loader2, Scale, TrendingDown, TrendingUp } from "lucide-react"

interface UserProfileSummary {
  weight_kg: number | null
  preferences: {
    weightUnit?: WeightUnit
    [key: string]: unknown
  } | null
}

interface WeightLogRecord {
  id: string
  weight_kg: number
  body_fat_percentage: number | null
  recorded_at: string
  source: string
  created_at: string
}

interface FormState {
  bodyFatPercentage: string
  weightDisplay: string
  recordedAt: string
}

const DEFAULT_WEIGHT_UNIT: WeightUnit = "kg"

function getLocalDateTimeValue(date: Date): string {
  const timezoneOffsetMs = date.getTimezoneOffset() * 60 * 1000
  return new Date(date.getTime() - timezoneOffsetMs).toISOString().slice(0, 16)
}

function formatSource(source: string): string {
  return source
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ")
}

export default function BodyFatTracker() {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [profile, setProfile] = useState<UserProfileSummary | null>(null)
  const [weightUnit, setWeightUnit] = useState<WeightUnit>(DEFAULT_WEIGHT_UNIT)
  const [logs, setLogs] = useState<WeightLogRecord[]>([])
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null)
  const [formState, setFormState] = useState<FormState>({
    bodyFatPercentage: "",
    weightDisplay: "",
    recordedAt: getLocalDateTimeValue(new Date()),
  })

  useEffect(() => {
    const loadData = async () => {
      try {
        const supabase = createClient()
        const {
          data: { user },
        } = await supabase.auth.getUser()

        if (!user) {
          setMessage({ type: "error", text: "You need to be signed in to track body fat." })
          return
        }

        const [{ data: profileData, error: profileError }, { data: logData, error: logErrorResult }] =
          await Promise.all([
            supabase
              .from("user_profiles")
              .select("weight_kg, preferences")
              .eq("id", user.id)
              .single(),
            supabase
              .from("weight_logs")
              .select("id, weight_kg, body_fat_percentage, recorded_at, source, created_at")
              .eq("user_id", user.id)
              .not("body_fat_percentage", "is", null)
              .order("recorded_at", { ascending: false })
              .limit(12),
          ])

        if (profileError) {
          logError(profileError, "body_fat_profile_load")
        }

        if (logErrorResult) {
          logError(logErrorResult, "body_fat_logs_load")
          setMessage({ type: "error", text: "Failed to load body fat history." })
        }

        const nextWeightUnit = (profileData?.preferences?.weightUnit as WeightUnit) || DEFAULT_WEIGHT_UNIT
        const nextWeightDisplay = profileData?.weight_kg
          ? convertFromKg(profileData.weight_kg, nextWeightUnit).toFixed(1)
          : ""

        setProfile(profileData ?? null)
        setWeightUnit(nextWeightUnit)
        setLogs((logData as WeightLogRecord[] | null) ?? [])
        setFormState({
          bodyFatPercentage: "",
          weightDisplay: nextWeightDisplay,
          recordedAt: getLocalDateTimeValue(new Date()),
        })
      } catch (error) {
        logError(error, "body_fat_module_load")
        setMessage({ type: "error", text: "An unexpected error occurred while loading the tracker." })
      } finally {
        setLoading(false)
      }
    }

    void loadData()
  }, [])

  const handleWeightUnitChange = (newUnit: WeightUnit) => {
    setWeightUnit(newUnit)
    setFormState((current) => {
      const currentWeight = Number.parseFloat(current.weightDisplay)

      if (!current.weightDisplay || Number.isNaN(currentWeight) || !isValidWeight(currentWeight, weightUnit)) {
        return current
      }

      const weightInKg = convertToKg(currentWeight, weightUnit)
      return {
        ...current,
        weightDisplay: convertFromKg(weightInKg, newUnit).toFixed(1),
      }
    })
  }

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setSaving(true)
    setMessage(null)

    try {
      const bodyFatValue = Number.parseFloat(formState.bodyFatPercentage)
      const weightValue = Number.parseFloat(formState.weightDisplay)

      if (!isValidBodyFatPercentage(bodyFatValue)) {
        setMessage({ type: "error", text: "Enter a body fat percentage between 2% and 75%." })
        return
      }

      if (!isValidWeight(weightValue, weightUnit)) {
        setMessage({ type: "error", text: `Enter a valid weight in ${weightUnit}.` })
        return
      }

      if (!formState.recordedAt) {
        setMessage({ type: "error", text: "Pick a recorded date and time." })
        return
      }

      const recordedAtDate = new Date(formState.recordedAt)
      if (Number.isNaN(recordedAtDate.getTime())) {
        setMessage({ type: "error", text: "Recorded date is invalid." })
        return
      }

      const supabase = createClient()
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        setMessage({ type: "error", text: "You need to be signed in to save a reading." })
        return
      }

      const weightInKg = Number(convertToKg(weightValue, weightUnit).toFixed(2))
      const bodyFatPercentage = Number(bodyFatValue.toFixed(2))

      const { data: insertedLog, error: insertError } = await supabase
        .from("weight_logs")
        .insert({
          user_id: user.id,
          weight_kg: weightInKg,
          body_fat_percentage: bodyFatPercentage,
          recorded_at: recordedAtDate.toISOString(),
          source: "manual",
        })
        .select("id, weight_kg, body_fat_percentage, recorded_at, source, created_at")
        .single()

      if (insertError) {
        logError(insertError, "body_fat_log_insert")
        setMessage({ type: "error", text: "Failed to save your body fat reading." })
        return
      }

      const { error: profileUpdateError } = await supabase
        .from("user_profiles")
        .update({ weight_kg: weightInKg })
        .eq("id", user.id)

      if (profileUpdateError) {
        logError(profileUpdateError, "body_fat_profile_weight_sync")
      } else {
        setProfile((current) => (current ? { ...current, weight_kg: weightInKg } : current))
      }

      setLogs((current) => [insertedLog as WeightLogRecord, ...current].slice(0, 12))
      setFormState((current) => ({
        ...current,
        bodyFatPercentage: "",
        weightDisplay: convertFromKg(weightInKg, weightUnit).toFixed(1),
        recordedAt: getLocalDateTimeValue(new Date()),
      }))
      setMessage({ type: "success", text: "Body fat reading saved." })
    } catch (error) {
      logError(error, "body_fat_log_submit")
      setMessage({ type: "error", text: "An unexpected error occurred while saving the reading." })
    } finally {
      setSaving(false)
    }
  }

  const latestLog = logs[0]
  const previousLog = logs[1]
  const bodyFatValues = logs
    .map((log) => log.body_fat_percentage)
    .filter((value): value is number => typeof value === "number")
  const averageBodyFat = bodyFatValues.length
    ? bodyFatValues.reduce((sum, value) => sum + value, 0) / bodyFatValues.length
    : null
  const latestChange =
    latestLog?.body_fat_percentage != null && previousLog?.body_fat_percentage != null
      ? getBodyFatChange(latestLog.body_fat_percentage, previousLog.body_fat_percentage)
      : null

  const chartData = [...logs]
    .reverse()
    .filter((log): log is WeightLogRecord & { body_fat_percentage: number } => typeof log.body_fat_percentage === "number")
    .map((log) => ({
      id: log.id,
      dateLabel: new Date(log.recorded_at).toLocaleDateString(undefined, { month: "short", day: "numeric" }),
      bodyFat: log.body_fat_percentage,
    }))

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="mr-3 h-6 w-6 animate-spin text-blue-600" />
          <span className="text-slate-600">Loading body fat tracker...</span>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {message && (
        <Alert className={message.type === "error" ? "border-red-200 bg-red-50" : "border-green-200 bg-green-50"}>
          <AlertDescription className={message.type === "error" ? "text-red-800" : "text-green-800"}>
            {message.text}
          </AlertDescription>
        </Alert>
      )}

      <div className="grid gap-6 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Droplets className="h-5 w-5 text-blue-600" />
              Latest Reading
            </CardTitle>
            <CardDescription>Your most recent body fat entry</CardDescription>
          </CardHeader>
          <CardContent>
            {latestLog?.body_fat_percentage != null ? (
              <div className="space-y-2">
                <div className="text-3xl font-semibold text-slate-900">
                  {formatBodyFatPercentage(latestLog.body_fat_percentage)}
                </div>
                <p className="text-sm text-slate-600">
                  {new Date(latestLog.recorded_at).toLocaleString()}
                </p>
                <p className="text-sm text-slate-600">
                  Weight:{" "}
                  {formatWeightWithConfig(latestLog.weight_kg, {
                    unit: weightUnit,
                    precision: 1,
                    showUnit: true,
                  })}
                </p>
              </div>
            ) : (
              <p className="text-sm text-slate-600">No body fat readings yet.</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {latestChange != null && latestChange <= 0 ? (
                <TrendingDown className="h-5 w-5 text-emerald-600" />
              ) : (
                <TrendingUp className="h-5 w-5 text-orange-600" />
              )}
              Change vs Previous
            </CardTitle>
            <CardDescription>Difference from the prior logged reading</CardDescription>
          </CardHeader>
          <CardContent>
            {latestChange != null ? (
              <div className="space-y-2">
                <div className="text-3xl font-semibold text-slate-900">
                  {latestChange > 0 ? "+" : ""}
                  {formatBodyFatPercentage(latestChange)}
                </div>
                <p className="text-sm text-slate-600">
                  Based on your last two saved entries
                </p>
              </div>
            ) : (
              <p className="text-sm text-slate-600">Add two readings to unlock trend deltas.</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5 text-violet-600" />
              Average
            </CardTitle>
            <CardDescription>Average across your recent saved history</CardDescription>
          </CardHeader>
          <CardContent>
            {averageBodyFat != null ? (
              <div className="space-y-2">
                <div className="text-3xl font-semibold text-slate-900">
                  {formatBodyFatPercentage(averageBodyFat)}
                </div>
                <p className="text-sm text-slate-600">
                  {bodyFatValues.length} reading{bodyFatValues.length === 1 ? "" : "s"} in view
                </p>
              </div>
            ) : (
              <p className="text-sm text-slate-600">Average will appear after your first reading.</p>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <Card>
          <CardHeader>
            <CardTitle>Body Fat Trend</CardTitle>
            <CardDescription>Recent readings from your manual tracking history</CardDescription>
          </CardHeader>
          <CardContent>
            {chartData.length > 0 ? (
              <ChartContainer
                config={{
                  bodyFat: {
                    label: "Body Fat %",
                    color: "hsl(217 91% 60%)",
                  },
                }}
                className="h-[280px]"
              >
                <LineChart data={chartData}>
                  <CartesianGrid vertical={false} />
                  <XAxis dataKey="dateLabel" tickLine={false} axisLine={false} />
                  <YAxis
                    tickLine={false}
                    axisLine={false}
                    width={44}
                    domain={["dataMin - 1", "dataMax + 1"]}
                    tickFormatter={(value) => `${value}%`}
                  />
                  <ChartTooltip
                    content={
                      <ChartTooltipContent
                        formatter={(value) => `${value}%`}
                        labelFormatter={(value) => `Recorded ${value}`}
                      />
                    }
                  />
                  <Line
                    type="monotone"
                    dataKey="bodyFat"
                    stroke="var(--color-bodyFat)"
                    strokeWidth={3}
                    dot={{ fill: "var(--color-bodyFat)", r: 4 }}
                    activeDot={{ r: 6 }}
                  />
                </LineChart>
              </ChartContainer>
            ) : (
              <div className="rounded-lg border border-dashed border-slate-300 px-6 py-12 text-center text-sm text-slate-600">
                Save your first reading to build a trend line.
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Add Reading</CardTitle>
            <CardDescription>
              Save a manual body fat reading using your preferred weight unit.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form className="space-y-4" onSubmit={handleSubmit}>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="bodyFatPercentage">Body Fat %</Label>
                  <Input
                    id="bodyFatPercentage"
                    type="number"
                    step="0.1"
                    min="2"
                    max="75"
                    value={formState.bodyFatPercentage}
                    onChange={(event) =>
                      setFormState((current) => ({ ...current, bodyFatPercentage: event.target.value }))
                    }
                    placeholder="18.4"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="recordedAt">Recorded At</Label>
                  <Input
                    id="recordedAt"
                    type="datetime-local"
                    value={formState.recordedAt}
                    onChange={(event) =>
                      setFormState((current) => ({ ...current, recordedAt: event.target.value }))
                    }
                  />
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-[0.7fr_0.3fr]">
                <div className="space-y-2">
                  <Label htmlFor="weightDisplay">Weight ({weightUnit})</Label>
                  <Input
                    id="weightDisplay"
                    type="number"
                    step="0.1"
                    min={weightUnit === "kg" ? "30" : "66"}
                    max={weightUnit === "kg" ? "300" : "661"}
                    value={formState.weightDisplay}
                    onChange={(event) =>
                      setFormState((current) => ({ ...current, weightDisplay: event.target.value }))
                    }
                    placeholder={`Enter your weight in ${weightUnit}`}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="weightUnit">Weight Unit</Label>
                  <select
                    id="weightUnit"
                    value={weightUnit}
                    onChange={(event) => handleWeightUnitChange(event.target.value as WeightUnit)}
                    className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                  >
                    <option value="kg">Kilograms</option>
                    <option value="lb">Pounds</option>
                  </select>
                </div>
              </div>

              {profile?.weight_kg != null && (
                <p className="text-xs text-slate-500">
                  Current profile weight:{" "}
                  {formatWeightWithConfig(profile.weight_kg, {
                    unit: weightUnit,
                    precision: 1,
                    showUnit: true,
                  })}
                </p>
              )}

              <Button type="submit" disabled={saving} className="w-full">
                {saving ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving reading...
                  </>
                ) : (
                  "Save Reading"
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CalendarDays className="h-5 w-5 text-slate-700" />
            Recent Readings
          </CardTitle>
          <CardDescription>Latest manual and imported body fat entries</CardDescription>
        </CardHeader>
        <CardContent>
          {logs.length > 0 ? (
            <div className="space-y-3">
              {logs.map((log) => (
                <div
                  key={log.id}
                  className="flex flex-col gap-3 rounded-lg border border-slate-200 px-4 py-3 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div>
                    <p className="font-medium text-slate-900">
                      {log.body_fat_percentage != null ? formatBodyFatPercentage(log.body_fat_percentage) : "No reading"}
                    </p>
                    <p className="text-sm text-slate-600">
                      {new Date(log.recorded_at).toLocaleString()}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="text-sm text-slate-600">
                      <span className="font-medium text-slate-900">Weight:</span>{" "}
                      {formatWeightWithConfig(log.weight_kg, {
                        unit: weightUnit,
                        precision: 1,
                        showUnit: true,
                      })}
                    </div>
                    <Badge variant="outline">
                      <Scale className="mr-1 h-3.5 w-3.5" />
                      {formatSource(log.source)}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="rounded-lg border border-dashed border-slate-300 px-6 py-12 text-center text-sm text-slate-600">
              No body fat readings yet. Your history will show up here after the first save.
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
