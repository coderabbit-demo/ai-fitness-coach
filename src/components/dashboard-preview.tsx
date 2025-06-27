"use client"

import { Line, LineChart, Bar, BarChart, XAxis, YAxis, ResponsiveContainer } from "recharts"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"
import { TrendingDown, Target, Moon, Smile } from "lucide-react"

// Dummy data for weight progress
const weightData = [
  { date: "Nov 1", weight: 195, target: 175 },
  { date: "Nov 8", weight: 193, target: 175 },
  { date: "Nov 15", weight: 191, target: 175 },
  { date: "Nov 22", weight: 189, target: 175 },
  { date: "Nov 29", weight: 187, target: 175 },
  { date: "Dec 6", weight: 185, target: 175 },
  { date: "Dec 13", weight: 183, target: 175 },
  { date: "Dec 20", weight: 181, target: 175 },
  { date: "Dec 27", weight: 179, target: 175 },
  { date: "Jan 3", weight: 177, target: 175 },
  { date: "Jan 10", weight: 176, target: 175 },
  { date: "Jan 17", weight: 175, target: 175 },
  { date: "Jan 24", weight: 174, target: 175 },
  { date: "Jan 31", weight: 173, target: 175 },
]

// Dummy data for calorie intake
const calorieData = [
  { day: "Mon", calories: 2100, target: 2000 },
  { day: "Tue", calories: 1950, target: 2000 },
  { day: "Wed", calories: 2200, target: 2000 },
  { day: "Thu", calories: 1850, target: 2000 },
  { day: "Fri", calories: 2050, target: 2000 },
  { day: "Sat", calories: 2300, target: 2000 },
  { day: "Sun", calories: 1900, target: 2000 },
]

// Dummy data for mood and sleep
const moodSleepData = [
  { day: "Jan 15", mood: 7, sleep: 7.2 },
  { day: "Jan 16", mood: 8, sleep: 7.8 },
  { day: "Jan 17", mood: 6, sleep: 6.5 },
  { day: "Jan 18", mood: 9, sleep: 8.2 },
  { day: "Jan 19", mood: 8, sleep: 7.5 },
  { day: "Jan 20", mood: 7, sleep: 6.8 },
  { day: "Jan 21", mood: 9, sleep: 8.5 },
  { day: "Jan 22", mood: 8, sleep: 7.9 },
  { day: "Jan 23", mood: 7, sleep: 7.1 },
  { day: "Jan 24", mood: 9, sleep: 8.3 },
  { day: "Jan 25", mood: 8, sleep: 7.6 },
  { day: "Jan 26", mood: 6, sleep: 6.2 },
  { day: "Jan 27", mood: 8, sleep: 7.8 },
  { day: "Jan 28", mood: 9, sleep: 8.1 },
]

export function WeightProgressChart() {
  return (
    <Card className="border-0 shadow-sm">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base font-medium">Weight Progress</CardTitle>
          <div className="flex items-center text-green-600 text-sm">
            <TrendingDown className="w-4 h-4 mr-1" />
            -22 lbs
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <ChartContainer
          config={{
            weight: {
              label: "Current Weight",
              color: "hsl(var(--chart-1))",
            },
            target: {
              label: "Target Weight",
              color: "hsl(var(--chart-2))",
            },
          }}
          className="h-[250px]"
        >
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={weightData}>
              <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fontSize: 12 }} />
              <YAxis
                domain={["dataMin - 2", "dataMax + 2"]}
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 12 }}
              />
              <ChartTooltip content={<ChartTooltipContent />} />
              <Line
                type="monotone"
                dataKey="weight"
                stroke="var(--color-weight)"
                strokeWidth={3}
                dot={{ fill: "var(--color-weight)", strokeWidth: 2, r: 4 }}
              />
              <Line
                type="monotone"
                dataKey="target"
                stroke="var(--color-target)"
                strokeWidth={2}
                strokeDasharray="5 5"
                dot={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </ChartContainer>
        <div className="mt-3 flex items-center justify-between text-xs text-slate-600">
          <span>Current: 173 lbs</span>
          <span className="flex items-center">
            <Target className="w-3 h-3 mr-1" />
            Target: 175 lbs
          </span>
        </div>
      </CardContent>
    </Card>
  )
}

export function CalorieIntakeChart() {
  return (
    <Card className="border-0 shadow-sm">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-medium">Weekly Calories</CardTitle>
      </CardHeader>
      <CardContent className="pt-0">
        <ChartContainer
          config={{
            calories: {
              label: "Calories",
              color: "hsl(var(--chart-3))",
            },
            target: {
              label: "Target",
              color: "hsl(var(--chart-4))",
            },
          }}
          className="h-[120px]"
        >
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={calorieData}>
              <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fontSize: 10 }} />
              <YAxis hide />
              <ChartTooltip content={<ChartTooltipContent />} />
              <Bar dataKey="calories" fill="var(--color-calories)" radius={[2, 2, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartContainer>
        <div className="mt-2 text-xs text-slate-600 text-center">Avg: 2,050 cal/day</div>
      </CardContent>
    </Card>
  )
}

export function MoodSleepChart() {
  return (
    <Card className="border-0 shadow-sm">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-medium">Mood & Sleep</CardTitle>
      </CardHeader>
      <CardContent className="pt-0">
        <ChartContainer
          config={{
            mood: {
              label: "Mood",
              color: "hsl(var(--chart-5))",
            },
            sleep: {
              label: "Sleep Hours",
              color: "hsl(var(--chart-1))",
            },
          }}
          className="h-[120px]"
        >
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={moodSleepData}>
              <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fontSize: 10 }} />
              <YAxis hide />
              <ChartTooltip content={<ChartTooltipContent />} />
              <Line
                type="monotone"
                dataKey="mood"
                stroke="var(--color-mood)"
                strokeWidth={2}
                dot={{ fill: "var(--color-mood)", strokeWidth: 2, r: 3 }}
              />
              <Line
                type="monotone"
                dataKey="sleep"
                stroke="var(--color-sleep)"
                strokeWidth={2}
                dot={{ fill: "var(--color-sleep)", strokeWidth: 2, r: 3 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </ChartContainer>
        <div className="mt-2 flex items-center justify-between text-xs text-slate-600">
          <span className="flex items-center">
            <Smile className="w-3 h-3 mr-1" />
            Mood: 7.9/10
          </span>
          <span className="flex items-center">
            <Moon className="w-3 h-3 mr-1" />
            Sleep: 7.5h
          </span>
        </div>
      </CardContent>
    </Card>
  )
}
