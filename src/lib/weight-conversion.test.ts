import { describe, it, expect, beforeEach } from '@jest/globals'
import {
  convertWeight,
  convertToKg,
  convertFromKg,
  formatWeight,
  getOppositeUnit,
  isValidWeight,
  parseWeightString,
  formatWeightWithConfig,
  WeightUnit,
  WeightValue,
  WeightDisplayConfig,
  DEFAULT_WEIGHT_CONFIG
} from './weight-conversion'

describe('Weight Conversion Functions', () => {
  describe('convertWeight', () => {
    it('should convert kg to lb correctly', () => {
      expect(convertWeight(1, 'kg', 'lb')).toBeCloseTo(2.20462262185, 10)
      expect(convertWeight(10, 'kg', 'lb')).toBeCloseTo(22.0462262185, 9)
      expect(convertWeight(0.5, 'kg', 'lb')).toBeCloseTo(1.102311310925, 10)
    })

    it('should convert lb to kg correctly', () => {
      expect(convertWeight(2.20462262185, 'lb', 'kg')).toBeCloseTo(1, 10)
      expect(convertWeight(22.0462262185, 'lb', 'kg')).toBeCloseTo(10, 9)
      expect(convertWeight(1, 'lb', 'kg')).toBeCloseTo(0.45359237, 8)
    })

    it('should return same value for same unit conversion', () => {
      expect(convertWeight(5, 'kg', 'kg')).toBe(5)
      expect(convertWeight(10, 'lb', 'lb')).toBe(10)
    })

    it('should handle zero values', () => {
      expect(convertWeight(0, 'kg', 'lb')).toBe(0)
      expect(convertWeight(0, 'lb', 'kg')).toBe(0)
    })

    it('should handle negative values', () => {
      expect(convertWeight(-5, 'kg', 'lb')).toBeCloseTo(-11.02311310925, 10)
      expect(convertWeight(-10, 'lb', 'kg')).toBeCloseTo(-4.5359237, 7)
    })

    it('should throw error for invalid unit conversions', () => {
      expect(() => convertWeight(1, 'kg' as WeightUnit, 'invalid' as WeightUnit)).toThrow('Invalid conversion from kg to invalid')
      expect(() => convertWeight(1, 'invalid' as WeightUnit, 'kg' as WeightUnit)).toThrow('Invalid conversion from invalid to kg')
    })

    it('should handle very large numbers', () => {
      expect(convertWeight(1000000, 'kg', 'lb')).toBeCloseTo(2204622.62185, 5)
    })

    it('should handle very small numbers', () => {
      expect(convertWeight(0.001, 'kg', 'lb')).toBeCloseTo(0.00220462262185, 14)
    })

    it('should handle decimal precision correctly', () => {
      expect(convertWeight(2.5, 'kg', 'lb')).toBeCloseTo(5.511556554625, 12)
    })
  })

  describe('convertToKg', () => {
    it('should convert from lb to kg', () => {
      expect(convertToKg(2.20462262185, 'lb')).toBeCloseTo(1, 10)
      expect(convertToKg(1, 'lb')).toBeCloseTo(0.45359237, 8)
    })

    it('should return same value when already in kg', () => {
      expect(convertToKg(5, 'kg')).toBe(5)
      expect(convertToKg(0, 'kg')).toBe(0)
    })

    it('should handle negative values', () => {
      expect(convertToKg(-10, 'lb')).toBeCloseTo(-4.5359237, 7)
    })

    it('should handle edge cases', () => {
      expect(convertToKg(0, 'lb')).toBe(0)
      expect(convertToKg(0.1, 'lb')).toBeCloseTo(0.045359237, 9)
    })
  })

  describe('convertFromKg', () => {
    it('should convert from kg to lb', () => {
      expect(convertFromKg(1, 'lb')).toBeCloseTo(2.20462262185, 10)
      expect(convertFromKg(0.45359237, 'lb')).toBeCloseTo(1, 8)
    })

    it('should return same value when converting to kg', () => {
      expect(convertFromKg(5, 'kg')).toBe(5)
      expect(convertFromKg(0, 'kg')).toBe(0)
    })

    it('should handle negative values', () => {
      expect(convertFromKg(-4.5359237, 'lb')).toBeCloseTo(-10, 7)
    })

    it('should handle edge cases', () => {
      expect(convertFromKg(0, 'lb')).toBe(0)
      expect(convertFromKg(0.1, 'lb')).toBeCloseTo(0.220462262185, 12)
    })
  })

  describe('formatWeight', () => {
    it('should format weight with default precision', () => {
      expect(formatWeight(70.5, 'kg')).toBe('70.5 kg')
      expect(formatWeight(155.2, 'lb')).toBe('155.2 lb')
    })

    it('should format weight with custom precision', () => {
      expect(formatWeight(70.123456, 'kg', 2)).toBe('70.12 kg')
      expect(formatWeight(155.789, 'lb', 0)).toBe('156 lb')
      expect(formatWeight(70.5, 'kg', 3)).toBe('70.500 kg')
    })

    it('should handle zero values', () => {
      expect(formatWeight(0, 'kg')).toBe('0.0 kg')
      expect(formatWeight(0, 'lb', 2)).toBe('0.00 lb')
    })

    it('should handle negative values', () => {
      expect(formatWeight(-70.5, 'kg')).toBe('-70.5 kg')
      expect(formatWeight(-155.2, 'lb', 2)).toBe('-155.20 lb')
    })

    it('should handle very large numbers', () => {
      expect(formatWeight(1000000, 'kg')).toBe('1000000.0 kg')
    })

    it('should handle very small numbers', () => {
      expect(formatWeight(0.001, 'kg', 3)).toBe('0.001 kg')
    })

    it('should handle edge precision values', () => {
      expect(formatWeight(70.5, 'kg', 0)).toBe('71 kg')
      expect(formatWeight(70.4, 'kg', 0)).toBe('70 kg')
    })
  })

  describe('getOppositeUnit', () => {
    it('should return opposite unit for kg', () => {
      expect(getOppositeUnit('kg')).toBe('lb')
    })

    it('should return opposite unit for lb', () => {
      expect(getOppositeUnit('lb')).toBe('kg')
    })

    it('should handle multiple conversions', () => {
      const unit: WeightUnit = 'kg'
      const opposite = getOppositeUnit(unit)
      expect(opposite).toBe('lb')
      expect(getOppositeUnit(opposite)).toBe('kg')
    })
  })

  describe('isValidWeight', () => {
    it('should return true for valid weights in kg', () => {
      expect(isValidWeight(70, 'kg')).toBe(true)
      expect(isValidWeight(30, 'kg')).toBe(true)
      expect(isValidWeight(300, 'kg')).toBe(true)
    })

    it('should return true for valid weights in lb', () => {
      expect(isValidWeight(66, 'lb')).toBe(true) // ~30 kg
      expect(isValidWeight(154, 'lb')).toBe(true) // ~70 kg
      expect(isValidWeight(661, 'lb')).toBe(true) // ~300 kg
    })

    it('should return false for weights below minimum', () => {
      expect(isValidWeight(25, 'kg')).toBe(false)
      expect(isValidWeight(60, 'lb')).toBe(false)
    })

    it('should return false for weights above maximum', () => {
      expect(isValidWeight(350, 'kg')).toBe(false)
      expect(isValidWeight(800, 'lb')).toBe(false)
    })

    it('should return false for zero and negative values', () => {
      expect(isValidWeight(0, 'kg')).toBe(false)
      expect(isValidWeight(-5, 'kg')).toBe(false)
      expect(isValidWeight(-10, 'lb')).toBe(false)
    })

    it('should return false for NaN values', () => {
      expect(isValidWeight(NaN, 'kg')).toBe(false)
      expect(isValidWeight(NaN, 'lb')).toBe(false)
    })

    it('should handle boundary values correctly', () => {
      expect(isValidWeight(29.999, 'kg')).toBe(false)
      expect(isValidWeight(30.001, 'kg')).toBe(true)
      expect(isValidWeight(299.999, 'kg')).toBe(true)
      expect(isValidWeight(300.001, 'kg')).toBe(false)
    })
  })

  describe('parseWeightString', () => {
    it('should parse valid weight strings with spaces', () => {
      const result1 = parseWeightString('70 kg')
      expect(result1).toEqual({ value: 70, unit: 'kg' })
      
      const result2 = parseWeightString('154 lb')
      expect(result2).toEqual({ value: 154, unit: 'lb' })
    })

    it('should parse valid weight strings without spaces', () => {
      const result1 = parseWeightString('70kg')
      expect(result1).toEqual({ value: 70, unit: 'kg' })
      
      const result2 = parseWeightString('154lb')
      expect(result2).toEqual({ value: 154, unit: 'lb' })
    })

    it('should parse decimal values', () => {
      const result1 = parseWeightString('70.5 kg')
      expect(result1).toEqual({ value: 70.5, unit: 'kg' })
      
      const result2 = parseWeightString('154.25lb')
      expect(result2).toEqual({ value: 154.25, unit: 'lb' })
    })

    it('should handle case insensitive input', () => {
      const result1 = parseWeightString('70 KG')
      expect(result1).toEqual({ value: 70, unit: 'kg' })
      
      const result2 = parseWeightString('154 LB')
      expect(result2).toEqual({ value: 154, unit: 'lb' })
    })

    it('should handle whitespace around input', () => {
      const result1 = parseWeightString('  70 kg  ')
      expect(result1).toEqual({ value: 70, unit: 'kg' })
      
      const result2 = parseWeightString('\t154 lb\n')
      expect(result2).toEqual({ value: 154, unit: 'lb' })
    })

    it('should return null for invalid formats', () => {
      expect(parseWeightString('70')).toBeNull()
      expect(parseWeightString('kg 70')).toBeNull()
      expect(parseWeightString('70 pounds')).toBeNull()
      expect(parseWeightString('seventy kg')).toBeNull()
      expect(parseWeightString('')).toBeNull()
      expect(parseWeightString('abc')).toBeNull()
    })

    it('should return null for invalid weights (out of range)', () => {
      expect(parseWeightString('10 kg')).toBeNull() // Below minimum
      expect(parseWeightString('500 kg')).toBeNull() // Above maximum
      expect(parseWeightString('0 kg')).toBeNull() // Zero
      expect(parseWeightString('-70 kg')).toBeNull() // Negative
    })

    it('should handle edge cases', () => {
      expect(parseWeightString('30 kg')).toEqual({ value: 30, unit: 'kg' }) // Minimum
      expect(parseWeightString('300 kg')).toEqual({ value: 300, unit: 'kg' }) // Maximum
      expect(parseWeightString('66.1 lb')).toEqual({ value: 66.1, unit: 'lb' }) // ~30 kg
      expect(parseWeightString('661 lb')).toEqual({ value: 661, unit: 'lb' }) // ~300 kg
    })
  })

  describe('formatWeightWithConfig', () => {
    it('should format with default config', () => {
      expect(formatWeightWithConfig(70)).toBe('70.0 kg')
    })

    it('should format with custom unit', () => {
      const config: WeightDisplayConfig = {
        unit: 'lb',
        precision: 1,
        showUnit: true
      }
      expect(formatWeightWithConfig(70, config)).toBe('154.3 lb')
    })

    it('should format with custom precision', () => {
      const config: WeightDisplayConfig = {
        unit: 'kg',
        precision: 2,
        showUnit: true
      }
      expect(formatWeightWithConfig(70.123, config)).toBe('70.12 kg')
    })

    it('should format without unit when showUnit is false', () => {
      const config: WeightDisplayConfig = {
        unit: 'kg',
        precision: 1,
        showUnit: false
      }
      expect(formatWeightWithConfig(70.5, config)).toBe('70.5')
    })

    it('should handle zero values', () => {
      expect(formatWeightWithConfig(0)).toBe('0.0 kg')
    })

    it('should handle negative values', () => {
      expect(formatWeightWithConfig(-70)).toBe('-70.0 kg')
    })

    it('should convert from kg to lb correctly', () => {
      const config: WeightDisplayConfig = {
        unit: 'lb',
        precision: 2,
        showUnit: true
      }
      expect(formatWeightWithConfig(1, config)).toBe('2.20 lb')
    })

    it('should handle very precise values', () => {
      const config: WeightDisplayConfig = {
        unit: 'kg',
        precision: 5,
        showUnit: true
      }
      expect(formatWeightWithConfig(70.123456789, config)).toBe('70.12346 kg')
    })

    it('should handle zero precision', () => {
      const config: WeightDisplayConfig = {
        unit: 'kg',
        precision: 0,
        showUnit: true
      }
      expect(formatWeightWithConfig(70.8, config)).toBe('71 kg')
    })
  })

  describe('Edge Cases and Error Handling', () => {
    it('should handle Infinity values', () => {
      expect(convertWeight(Infinity, 'kg', 'lb')).toBe(Infinity)
      expect(convertWeight(-Infinity, 'kg', 'lb')).toBe(-Infinity)
    })

    it('should handle NaN values', () => {
      expect(convertWeight(NaN, 'kg', 'lb')).toBeNaN()
      expect(isValidWeight(NaN, 'kg')).toBe(false)
    })

    it('should handle very large numbers', () => {
      expect(convertWeight(Number.MAX_VALUE, 'kg', 'lb')).toBe(Number.MAX_VALUE * 2.20462262185)
    })

    it('should handle very small positive numbers', () => {
      expect(convertWeight(Number.MIN_VALUE, 'kg', 'lb')).toBeCloseTo(Number.MIN_VALUE * 2.20462262185, 20)
    })

    it('should handle scientific notation', () => {
      expect(convertWeight(1e-10, 'kg', 'lb')).toBeCloseTo(2.20462262185e-10, 20)
      expect(convertWeight(1e10, 'kg', 'lb')).toBeCloseTo(2.20462262185e10, 0)
    })
  })

  describe('Precision and Rounding', () => {
    it('should maintain precision in back-and-forth conversions', () => {
      const originalValue = 70.123456789
      const converted = convertWeight(convertWeight(originalValue, 'kg', 'lb'), 'lb', 'kg')
      expect(converted).toBeCloseTo(originalValue, 10)
    })

    it('should handle floating point precision correctly', () => {
      const result = convertWeight(0.1 + 0.2, 'kg', 'lb')
      expect(result).toBeCloseTo(0.6613868265550001, 10)
    })

    it('should round correctly in formatWeight', () => {
      expect(formatWeight(70.999, 'kg', 0)).toBe('71 kg')
      expect(formatWeight(70.499, 'kg', 0)).toBe('70 kg')
      expect(formatWeight(70.995, 'kg', 2)).toBe('71.00 kg')
    })
  })

  describe('Integration Tests', () => {
    it('should work with complete weight conversion workflow', () => {
      const inputString = '70 kg'
      const parsed = parseWeightString(inputString)
      
      expect(parsed).not.toBeNull()
      if (parsed) {
        expect(isValidWeight(parsed.value, parsed.unit)).toBe(true)
        
        const oppositeUnit = getOppositeUnit(parsed.unit)
        const converted = convertWeight(parsed.value, parsed.unit, oppositeUnit)
        const formatted = formatWeight(converted, oppositeUnit, 1)
        
        expect(formatted).toBe('154.3 lb')
      }
    })

    it('should handle configuration-based formatting workflow', () => {
      const weightInKg = 70.123
      const config: WeightDisplayConfig = {
        unit: 'lb',
        precision: 2,
        showUnit: false
      }
      
      const result = formatWeightWithConfig(weightInKg, config)
      expect(result).toBe('154.59')
    })
  })
})