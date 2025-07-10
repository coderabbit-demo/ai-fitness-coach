export type WeightUnit = 'kg' | 'lb'

export interface WeightValue {
  value: number
  unit: WeightUnit
}

/**
 * Conversion constants
 */
const KG_TO_LB_FACTOR = 2.20462262185
const LB_TO_KG_FACTOR = 1 / KG_TO_LB_FACTOR

/**
 * Converts a weight value between kilograms and pounds.
 *
 * @param weight - The numeric weight to convert
 * @param fromUnit - The unit of the input weight ('kg' or 'lb')
 * @param toUnit - The desired unit for the output ('kg' or 'lb')
 * @returns The converted weight value in the target unit
 * @throws Error if an invalid unit conversion is requested
 */
export function convertWeight(weight: number, fromUnit: WeightUnit, toUnit: WeightUnit): number {
  if (fromUnit === toUnit) {
    return weight
  }

  if (fromUnit === 'kg' && toUnit === 'lb') {
    return weight * KG_TO_LB_FACTOR
  }

  if (fromUnit === 'lb' && toUnit === 'kg') {
    return weight * LB_TO_KG_FACTOR
  }

  throw new Error(`Invalid conversion from ${fromUnit} to ${toUnit}`)
}

/**
 * Converts a weight value from the specified unit to kilograms.
 *
 * @param weight - The weight value to convert
 * @param fromUnit - The unit of the input weight ('kg' or 'lb')
 * @returns The equivalent weight in kilograms
 */
export function convertToKg(weight: number, fromUnit: WeightUnit): number {
  return convertWeight(weight, fromUnit, 'kg')
}

/**
 * Converts a weight value from kilograms to the specified unit.
 *
 * @param weightInKg - The weight value in kilograms
 * @param toUnit - The unit to convert the weight to ('kg' or 'lb')
 * @returns The converted weight value in the specified unit
 */
export function convertFromKg(weightInKg: number, toUnit: WeightUnit): number {
  return convertWeight(weightInKg, 'kg', toUnit)
}

/**
 * Formats a weight value as a string with the specified decimal precision and unit.
 *
 * @param weight - The numeric weight value to format
 * @param unit - The unit to display ('kg' or 'lb')
 * @param precision - Number of decimal places to include (default is 1)
 * @returns The formatted weight string, e.g., "70.0 kg"
 */
export function formatWeight(weight: number, unit: WeightUnit, precision: number = 1): string {
  const formatted = weight.toFixed(precision)
  return `${formatted} ${unit}`
}

/**
 * Returns the opposite weight unit.
 *
 * If the input is 'kg', returns 'lb'; if the input is 'lb', returns 'kg'.
 *
 * @param unit - The current weight unit
 * @returns The opposite weight unit
 */
export function getOppositeUnit(unit: WeightUnit): WeightUnit {
  return unit === 'kg' ? 'lb' : 'kg'
}

/**
 * Checks if a weight value is a positive number within the valid human range (30 kg to 300 kg, inclusive).
 *
 * @param weight - The weight value to validate
 * @param unit - The unit of the weight value ('kg' or 'lb')
 * @returns `true` if the weight is valid and within range; otherwise, `false`
 */
export function isValidWeight(weight: number, unit: WeightUnit): boolean {
  if (isNaN(weight) || weight <= 0) {
    return false
  }

  // Reasonable weight limits
  const minKg = 30  // ~66 lbs
  const maxKg = 300 // ~661 lbs

  const weightInKg = convertToKg(weight, unit)
  return weightInKg >= minKg && weightInKg <= maxKg
}

/**
 * Parses a weight string to extract the numeric value and unit.
 *
 * Accepts strings in the format "70 kg", "154.5lb", etc. Returns a `WeightValue` object if parsing and validation succeed, or `null` if the input is invalid or out of range.
 *
 * @param weightStr - The input string representing a weight and unit
 * @returns The parsed weight value and unit, or `null` if parsing or validation fails
 */
export function parseWeightString(weightStr: string): WeightValue | null {
  const trimmed = weightStr.trim().toLowerCase()
  
  // Try to match patterns like "70 kg", "154.5 lb", "70kg", "154.5lb"
  const match = trimmed.match(/^(\d+(?:\.\d+)?)\s*(kg|lb)$/)
  
  if (!match) {
    return null
  }

  const value = parseFloat(match[1])
  const unit = match[2] as WeightUnit

  if (!isValidWeight(value, unit)) {
    return null
  }

  return { value, unit }
}

/**
 * Get weight display preferences
 */
export interface WeightDisplayConfig {
  unit: WeightUnit
  precision: number
  showUnit: boolean
}

export const DEFAULT_WEIGHT_CONFIG: WeightDisplayConfig = {
  unit: 'kg',
  precision: 1,
  showUnit: true
}

/**
 * Formats a weight value in kilograms according to display preferences.
 *
 * Converts the weight to the configured unit, applies the specified decimal precision, and optionally appends the unit string based on the provided configuration.
 *
 * @param weightInKg - The weight value in kilograms to format
 * @param config - Display preferences including unit, precision, and whether to show the unit string
 * @returns The formatted weight string according to the configuration
 */
export function formatWeightWithConfig(
  weightInKg: number, 
  config: WeightDisplayConfig = DEFAULT_WEIGHT_CONFIG
): string {
  const convertedWeight = convertFromKg(weightInKg, config.unit)
  
  if (config.showUnit) {
    return formatWeight(convertedWeight, config.unit, config.precision)
  }
  
  return convertedWeight.toFixed(config.precision)
} 