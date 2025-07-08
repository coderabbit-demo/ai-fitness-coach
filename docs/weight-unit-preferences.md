# Weight Unit Preferences System

This document explains how the weight unit preferences system works in the AI Fitness Coach app, allowing users to choose between kilograms (kg) and pounds (lb) for weight displays throughout the application.

## Overview

The weight unit preferences system consists of:

1. **Weight Conversion Utility** (`src/lib/weight-conversion.ts`) - Core conversion functions
2. **Database Storage** - User preferences stored in the `user_profiles.preferences` JSONB field
3. **Profile UI** - Interface for users to set their weight unit preference
4. **Automatic Conversion** - Weight values displayed in the user's preferred unit

## How It Works

### Database Schema

Weight unit preferences are stored in the `user_profiles` table:

```sql
-- The preferences column stores user preferences as JSONB
preferences JSONB DEFAULT '{}'

-- Example data:
-- {"weightUnit": "kg"}
-- {"weightUnit": "lb"}
```

### Weight Conversion Utility

Located at `src/lib/weight-conversion.ts`, this utility provides:

```typescript
// Core conversion functions
convertWeight(weight: number, fromUnit: WeightUnit, toUnit: WeightUnit): number
convertToKg(weight: number, fromUnit: WeightUnit): number
convertFromKg(weightInKg: number, toUnit: WeightUnit): number

// Formatting functions
formatWeight(weight: number, unit: WeightUnit, precision?: number): string
formatWeightWithConfig(weightInKg: number, config?: WeightDisplayConfig): string

// Utility functions
isValidWeight(weight: number, unit: WeightUnit): boolean
parseWeightString(weightStr: string): WeightValue | null
getOppositeUnit(unit: WeightUnit): WeightUnit
```

### Database Storage Pattern

- **All weights are stored in kilograms** in the database for consistency
- **User preferences** determine display units
- **Conversion happens at the presentation layer**

## Usage Examples

### Basic Conversion

```typescript
import { convertWeight, convertFromKg, formatWeightWithConfig } from '@/lib/weight-conversion'

// Convert 70kg to pounds
const weightInPounds = convertWeight(70, 'kg', 'lb') // 154.32

// Convert from stored kg value to user's preferred unit
const userWeight = convertFromKg(70, userPreference) // 70 or 154.32

// Format for display with user preferences
const displayWeight = formatWeightWithConfig(70, {
  unit: 'lb',
  precision: 1,
  showUnit: true
}) // "154.3 lb"
```

### Profile Form Implementation

```typescript
// When loading profile data
const userWeightUnit = (profile.preferences?.weightUnit as WeightUnit) || 'kg'
const weightInUserUnit = profile.weight_kg 
  ? convertFromKg(profile.weight_kg, userWeightUnit)
  : null

// When saving profile data
const weightInKg = formData.weight_display 
  ? convertToKg(parseFloat(formData.weight_display), formData.weightUnit)
  : null

const updateData = {
  weight_kg: weightInKg,
  preferences: {
    ...currentPreferences,
    weightUnit: formData.weightUnit
  }
}
```

### Displaying Weight in Components

```typescript
// In any component that displays weight
import { formatWeightWithConfig, convertFromKg } from '@/lib/weight-conversion'

function WeightDisplay({ weightInKg, userPreferences }) {
  const displayWeight = formatWeightWithConfig(weightInKg, {
    unit: userPreferences.weightUnit || 'kg',
    precision: 1,
    showUnit: true
  })
  
  return <span>{displayWeight}</span>
}
```

## Profile UI Features

### Weight Unit Preference Selection

The profile page includes a "Preferences" card where users can:

1. **Select their preferred weight unit** (kg or lb)
2. **See weight converted in real-time** when switching units
3. **Enter weight in their preferred unit**

### Automatic Conversion

When users change their weight unit preference:

1. The current weight value is automatically converted to the new unit
2. The input field updates to show the converted value
3. The preference is saved to the database when the profile is saved

## Database Functions

The migration includes helpful SQL functions:

```sql
-- Get user's weight unit preference with fallback
SELECT public.get_user_weight_unit('user-uuid-here'); -- Returns 'kg' or 'lb'

-- Update user's weight unit preference
SELECT public.update_user_weight_unit('user-uuid-here', 'lb'); -- Returns boolean
```

## Validation

The system includes validation for weight values:

- **Minimum weight**: 30kg (~66 lbs)
- **Maximum weight**: 300kg (~661 lbs)
- **Precision**: Up to 1 decimal place for display
- **Input validation**: Ensures reasonable weight ranges in both units

## Best Practices

### 1. Always Store in Kilograms

```typescript
// ✅ DO: Store weight in kg
const profileData = {
  weight_kg: convertToKg(userInputWeight, userUnit)
}

// ❌ DON'T: Store in user's unit
const profileData = {
  weight_kg: userInputWeight // This could be in pounds!
}
```

### 2. Convert at Display Time

```typescript
// ✅ DO: Convert when displaying
const displayWeight = convertFromKg(profile.weight_kg, user.preferences.weightUnit)

// ❌ DON'T: Store converted values
const profile = {
  weight_kg: 70,
  weight_lb: 154.32 // Redundant and can become inconsistent
}
```

### 3. Handle Missing Preferences

```typescript
// ✅ DO: Provide fallback
const weightUnit = user.preferences?.weightUnit || 'kg'

// ❌ DON'T: Assume preference exists
const weightUnit = user.preferences.weightUnit // Could be undefined
```

### 4. Validate Input Values

```typescript
// ✅ DO: Validate before converting
if (isValidWeight(inputWeight, selectedUnit)) {
  const weightInKg = convertToKg(inputWeight, selectedUnit)
  // Save to database
}

// ❌ DON'T: Convert without validation
const weightInKg = convertToKg(inputWeight, selectedUnit) // Could be invalid
```

## Extending the System

### Adding Height Units

To add height unit preferences (cm/ft), follow the same pattern:

1. Add `heightUnit` to the preferences JSONB field
2. Create height conversion utilities
3. Update the profile UI
4. Apply conversions in display components

### Adding Other Unit Types

The utility pattern can be extended for:

- Distance units (km/miles)
- Temperature units (°C/°F)
- Volume units (ml/fl oz)

### Usage in Other Components

When implementing weight displays in other parts of the app:

1. **Import the conversion utilities**
2. **Get user preferences from the profile**
3. **Convert and format weights for display**
4. **Ensure input forms handle the user's preferred unit**

## Migration Information

- **Migration file**: `supabase/migrations/002_add_weight_unit_preferences.sql`
- **Default preference**: All existing users get `"weightUnit": "kg"` by default
- **Backward compatibility**: Existing weight data remains unchanged (stored in kg)

This system ensures a consistent, user-friendly experience while maintaining data integrity and supporting international users with different unit preferences. 