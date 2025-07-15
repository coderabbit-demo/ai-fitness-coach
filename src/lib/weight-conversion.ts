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
 * Converts a numeric weight value between kilograms and pounds.
 *
 * @param weight - The weight value to convert
 * @param fromUnit - The current unit of the weight ('kg' or 'lb')
 * @param toUnit - The unit to convert the weight to ('kg' or 'lb')
 * @returns The weight value converted to the target unit
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
 * Converts a weight from the specified unit to its equivalent in kilograms.
 *
 * @param weight - The numeric weight value to convert
 * @param fromUnit - The unit of the input weight ('kg' or 'lb')
 * @returns The weight converted to kilograms
 */
export function convertToKg(weight: number, fromUnit: WeightUnit): number {
  return convertWeight(weight, fromUnit, 'kg')
}

/**
 * Converts a weight value in kilograms to either kilograms or pounds.
 *
 * @param weightInKg - The weight value in kilograms
 * @param toUnit - The target unit for conversion ('kg' or 'lb')
 * @returns The weight value converted to the specified unit
 */
export function convertFromKg(weightInKg: number, toUnit: WeightUnit): number {
  return convertWeight(weightInKg, 'kg', toUnit)
}

/**
 * Returns a string representation of a weight value with specified decimal precision and unit.
 *
 * @param weight - The numeric weight value to format
 * @param unit - The unit to display ('kg' or 'lb')
 * @param precision - Number of decimal places to include (default is 1)
 * @returns The formatted weight string, such as "70.0 kg"
 */
export function formatWeight(weight: number, unit: WeightUnit, precision: number = 1): string {
  const formatted = weight.toFixed(precision)
  return `${formatted} ${unit}`
}

/**
 * Returns the opposite weight unit ('kg' for 'lb', and 'lb' for 'kg').
 *
 * @param unit - The weight unit to invert
 * @returns The opposite weight unit
 */
export function getOppositeUnit(unit: WeightUnit): WeightUnit {
  return unit === 'kg' ? 'lb' : 'kg'
}

/**
 * Determines whether a weight value is a positive number within the valid human range (30 kg to 300 kg inclusive), regardless of input unit.
 *
 * @param weight - The weight value to check
 * @param unit - The unit of the weight value ('kg' or 'lb')
 * @returns `true` if the weight is positive and within the valid range; otherwise, `false`
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
 * Parses a string representing a weight and unit, returning a structured weight object if valid.
 *
 * Accepts input in formats like "70 kg", "154.5lb", etc. Returns a `WeightValue` object if the string is successfully parsed and the weight is within valid human limits; otherwise, returns `null`.
 *
 * @param weightStr - The input string containing a numeric weight and unit
 * @returns A `WeightValue` object if parsing and validation succeed, or `null` if the input is invalid or out of range
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
 * Formats a weight value in kilograms according to the specified display configuration.
 *
 * Converts the input weight to the configured unit, applies the desired decimal precision, and optionally includes the unit label in the output string.
 *
 * @param weightInKg - The weight value in kilograms to format
 * @param config - Display configuration specifying unit, precision, and whether to show the unit label
 * @returns The formatted weight string based on the provided configuration
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