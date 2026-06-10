export const BODY_FAT_PERCENTAGE_MIN = 2
export const BODY_FAT_PERCENTAGE_MAX = 75

/**
 * Checks whether a body fat percentage falls inside a reasonable human range.
 *
 * @param value - The body fat percentage to validate
 * @returns `true` when the value is numeric and within the supported range
 */
export function isValidBodyFatPercentage(value: number): boolean {
  return !Number.isNaN(value) && value >= BODY_FAT_PERCENTAGE_MIN && value <= BODY_FAT_PERCENTAGE_MAX
}

/**
 * Formats a body fat percentage with a fixed precision.
 *
 * @param value - The body fat percentage to format
 * @param precision - Decimal places to include
 * @returns A formatted percentage string
 */
export function formatBodyFatPercentage(value: number, precision: number = 1): string {
  return `${value.toFixed(precision)}%`
}

/**
 * Calculates the signed delta between two body fat readings.
 *
 * @param current - The latest body fat percentage
 * @param previous - The previous body fat percentage
 * @returns The signed percentage-point change
 */
export function getBodyFatChange(current: number, previous: number): number {
  return Number((current - previous).toFixed(2))
}
