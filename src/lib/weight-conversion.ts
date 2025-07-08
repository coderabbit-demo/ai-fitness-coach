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
 * Convert weight from one unit to another
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
 * Convert weight to kilograms (for database storage)
 */
export function convertToKg(weight: number, fromUnit: WeightUnit): number {
  return convertWeight(weight, fromUnit, 'kg')
}

/**
 * Convert weight from kilograms to desired unit (for display)
 */
export function convertFromKg(weightInKg: number, toUnit: WeightUnit): number {
  return convertWeight(weightInKg, 'kg', toUnit)
}

/**
 * Format weight for display with appropriate precision
 */
export function formatWeight(weight: number, unit: WeightUnit, precision: number = 1): string {
  const formatted = weight.toFixed(precision)
  return `${formatted} ${unit}`
}

/**
 * Get the opposite unit
 */
export function getOppositeUnit(unit: WeightUnit): WeightUnit {
  return unit === 'kg' ? 'lb' : 'kg'
}

/**
 * Validate weight value
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
 * Parse weight string and extract value and unit
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
 * Format weight with user preferences
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