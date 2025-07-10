import { describe, it, expect, test } from 'vitest'
import {
  convertWeight,
  convertToKg,
  convertFromKg,
  formatWeight,
  getOppositeUnit,
  isValidWeight,
  parseWeightString,
  formatWeightWithConfig,
  DEFAULT_WEIGHT_CONFIG,
  type WeightUnit,
  type WeightValue,
  type WeightDisplayConfig
} from './weight-conversion'

describe('Weight Conversion Library', () => {
  describe('convertWeight - Core Functionality', () => {
    // Happy path tests
    it('should convert kilograms to pounds correctly', () => {
      expect(convertWeight(1, 'kg', 'lb')).toBeCloseTo(2.20462262185, 10)
      expect(convertWeight(10, 'kg', 'lb')).toBeCloseTo(22.0462262185, 9)
      expect(convertWeight(0.5, 'kg', 'lb')).toBeCloseTo(1.102311310925, 10)
    })

    it('should convert pounds to kilograms correctly', () => {
      expect(convertWeight(1, 'lb', 'kg')).toBeCloseTo(0.45359237, 7)
      expect(convertWeight(10, 'lb', 'kg')).toBeCloseTo(4.5359237, 6)
      expect(convertWeight(2.20462262185, 'lb', 'kg')).toBeCloseTo(1, 10)
    })

    it('should handle same unit conversion', () => {
      expect(convertWeight(5, 'kg', 'kg')).toBe(5)
      expect(convertWeight(10, 'lb', 'lb')).toBe(10)
      expect(convertWeight(0, 'kg', 'kg')).toBe(0)
    })

    it('should handle zero weight', () => {
      expect(convertWeight(0, 'kg', 'lb')).toBe(0)
      expect(convertWeight(0, 'lb', 'kg')).toBe(0)
    })

    it('should handle decimal weights', () => {
      expect(convertWeight(1.5, 'kg', 'lb')).toBeCloseTo(3.306933932775, 10)
      expect(convertWeight(2.5, 'lb', 'kg')).toBeCloseTo(1.134309, 6)
    })

    it('should handle large weights', () => {
      expect(convertWeight(1000, 'kg', 'lb')).toBeCloseTo(2204.62262185, 8)
      expect(convertWeight(1000, 'lb', 'kg')).toBeCloseTo(453.59237, 5)
    })

    it('should handle very small weights', () => {
      expect(convertWeight(0.001, 'kg', 'lb')).toBeCloseTo(0.00220462262185, 14)
      expect(convertWeight(0.001, 'lb', 'kg')).toBeCloseTo(0.00045359237, 11)
    })

    it('should throw error for invalid unit combinations', () => {
      expect(() => convertWeight(1, 'invalid' as WeightUnit, 'lb')).toThrow('Invalid conversion from invalid to lb')
      expect(() => convertWeight(1, 'kg', 'invalid' as WeightUnit)).toThrow('Invalid conversion from kg to invalid')
    })
  })

  describe('convertWeight - Edge Cases and Error Handling', () => {
    it('should handle negative weights', () => {
      expect(convertWeight(-1, 'kg', 'lb')).toBeCloseTo(-2.20462262185, 10)
      expect(convertWeight(-5, 'lb', 'kg')).toBeCloseTo(-2.2679618, 6)
    })

    it('should handle NaN weight', () => {
      expect(convertWeight(NaN, 'kg', 'lb')).toBeNaN()
      expect(convertWeight(NaN, 'lb', 'kg')).toBeNaN()
    })

    it('should handle Infinity weight', () => {
      expect(convertWeight(Infinity, 'kg', 'lb')).toBe(Infinity)
      expect(convertWeight(-Infinity, 'lb', 'kg')).toBe(-Infinity)
    })

    it('should handle very large numbers without overflow', () => {
      const largeNumber = Number.MAX_SAFE_INTEGER / 1000000
      expect(() => convertWeight(largeNumber, 'kg', 'lb')).not.toThrow()
      expect(convertWeight(largeNumber, 'kg', 'lb')).toBeGreaterThan(largeNumber)
    })

    it('should handle very small numbers without underflow', () => {
      const smallNumber = Number.MIN_VALUE * 1000000
      expect(() => convertWeight(smallNumber, 'kg', 'lb')).not.toThrow()
      expect(convertWeight(smallNumber, 'kg', 'lb')).toBeGreaterThan(0)
    })
  })

  describe('convertToKg', () => {
    it('should convert pounds to kilograms', () => {
      expect(convertToKg(1, 'lb')).toBeCloseTo(0.45359237, 7)
      expect(convertToKg(10, 'lb')).toBeCloseTo(4.5359237, 6)
      expect(convertToKg(220.462262185, 'lb')).toBeCloseTo(100, 8)
    })

    it('should return same value for kilograms', () => {
      expect(convertToKg(5, 'kg')).toBe(5)
      expect(convertToKg(0, 'kg')).toBe(0)
      expect(convertToKg(100.5, 'kg')).toBe(100.5)
    })

    it('should handle edge cases', () => {
      expect(convertToKg(0, 'lb')).toBe(0)
      expect(convertToKg(NaN, 'lb')).toBeNaN()
      expect(convertToKg(Infinity, 'lb')).toBe(Infinity)
    })
  })

  describe('convertFromKg', () => {
    it('should convert kilograms to pounds', () => {
      expect(convertFromKg(1, 'lb')).toBeCloseTo(2.20462262185, 10)
      expect(convertFromKg(10, 'lb')).toBeCloseTo(22.0462262185, 9)
      expect(convertFromKg(100, 'lb')).toBeCloseTo(220.462262185, 8)
    })

    it('should return same value for kilograms', () => {
      expect(convertFromKg(5, 'kg')).toBe(5)
      expect(convertFromKg(0, 'kg')).toBe(0)
      expect(convertFromKg(100.5, 'kg')).toBe(100.5)
    })

    it('should handle edge cases', () => {
      expect(convertFromKg(0, 'lb')).toBe(0)
      expect(convertFromKg(NaN, 'lb')).toBeNaN()
      expect(convertFromKg(Infinity, 'lb')).toBe(Infinity)
    })
  })

  describe('formatWeight', () => {
    it('should format weight with default precision', () => {
      expect(formatWeight(70, 'kg')).toBe('70.0 kg')
      expect(formatWeight(154.5, 'lb')).toBe('154.5 lb')
    })

    it('should format weight with custom precision', () => {
      expect(formatWeight(70.123456, 'kg', 2)).toBe('70.12 kg')
      expect(formatWeight(154.789, 'lb', 0)).toBe('155 lb')
      expect(formatWeight(70.123456, 'kg', 4)).toBe('70.1235 kg')
    })

    it('should handle zero weight', () => {
      expect(formatWeight(0, 'kg')).toBe('0.0 kg')
      expect(formatWeight(0, 'lb', 2)).toBe('0.00 lb')
    })

    it('should handle negative weights', () => {
      expect(formatWeight(-70, 'kg')).toBe('-70.0 kg')
      expect(formatWeight(-154.5, 'lb', 2)).toBe('-154.50 lb')
    })

    it('should handle very large numbers', () => {
      expect(formatWeight(999999.999, 'kg', 1)).toBe('1000000.0 kg')
      expect(formatWeight(1000000, 'lb', 0)).toBe('1000000 lb')
    })

    it('should handle very small numbers', () => {
      expect(formatWeight(0.001, 'kg', 3)).toBe('0.001 kg')
      expect(formatWeight(0.0001, 'lb', 4)).toBe('0.0001 lb')
    })
  })

  describe('getOppositeUnit', () => {
    it('should return opposite unit for kg', () => {
      expect(getOppositeUnit('kg')).toBe('lb')
    })

    it('should return opposite unit for lb', () => {
      expect(getOppositeUnit('lb')).toBe('kg')
    })

    it('should handle type safety', () => {
      const unit1: WeightUnit = 'kg'
      const unit2: WeightUnit = 'lb'
      
      expect(getOppositeUnit(unit1)).toBe('lb')
      expect(getOppositeUnit(unit2)).toBe('kg')
    })
  })

  describe('isValidWeight', () => {
    it('should validate weights within normal range', () => {
      expect(isValidWeight(70, 'kg')).toBe(true)
      expect(isValidWeight(154, 'lb')).toBe(true)
      expect(isValidWeight(50, 'kg')).toBe(true)
      expect(isValidWeight(200, 'lb')).toBe(true)
    })

    it('should validate boundary values', () => {
      expect(isValidWeight(30, 'kg')).toBe(true)  // Min kg
      expect(isValidWeight(300, 'kg')).toBe(true) // Max kg
      expect(isValidWeight(66.1387, 'lb')).toBe(true) // ~30 kg in lb
      expect(isValidWeight(661.387, 'lb')).toBe(true) // ~300 kg in lb
    })

    it('should invalidate weights outside normal range', () => {
      expect(isValidWeight(29, 'kg')).toBe(false)   // Below min
      expect(isValidWeight(301, 'kg')).toBe(false)  // Above max
      expect(isValidWeight(65, 'lb')).toBe(false)   // Below min in lb
      expect(isValidWeight(662, 'lb')).toBe(false)  // Above max in lb
    })

    it('should invalidate zero and negative weights', () => {
      expect(isValidWeight(0, 'kg')).toBe(false)
      expect(isValidWeight(-1, 'kg')).toBe(false)
      expect(isValidWeight(-10, 'lb')).toBe(false)
    })

    it('should invalidate invalid numbers', () => {
      expect(isValidWeight(NaN, 'kg')).toBe(false)
      expect(isValidWeight(Infinity, 'lb')).toBe(false)
      expect(isValidWeight(-Infinity, 'kg')).toBe(false)
    })
  })

  describe('parseWeightString', () => {
    it('should parse valid weight strings with spaces', () => {
      expect(parseWeightString('70 kg')).toEqual({ value: 70, unit: 'kg' })
      expect(parseWeightString('154 lb')).toEqual({ value: 154, unit: 'lb' })
      expect(parseWeightString('  80  kg  ')).toEqual({ value: 80, unit: 'kg' })
    })

    it('should parse valid weight strings without spaces', () => {
      expect(parseWeightString('70kg')).toEqual({ value: 70, unit: 'kg' })
      expect(parseWeightString('154lb')).toEqual({ value: 154, unit: 'lb' })
      expect(parseWeightString('75.5kg')).toEqual({ value: 75.5, unit: 'kg' })
    })

    it('should parse decimal weights', () => {
      expect(parseWeightString('70.5 kg')).toEqual({ value: 70.5, unit: 'kg' })
      expect(parseWeightString('154.25 lb')).toEqual({ value: 154.25, unit: 'lb' })
    })

    it('should handle case insensitivity', () => {
      expect(parseWeightString('70 KG')).toEqual({ value: 70, unit: 'kg' })
      expect(parseWeightString('154 LB')).toEqual({ value: 154, unit: 'lb' })
      expect(parseWeightString('80 Kg')).toEqual({ value: 80, unit: 'kg' })
    })

    it('should return null for invalid formats', () => {
      expect(parseWeightString('70')).toBeNull()
      expect(parseWeightString('kg 70')).toBeNull()
      expect(parseWeightString('70 kilograms')).toBeNull()
      expect(parseWeightString('seventy kg')).toBeNull()
      expect(parseWeightString('')).toBeNull()
      expect(parseWeightString('   ')).toBeNull()
    })

    it('should return null for weights outside valid range', () => {
      expect(parseWeightString('10 kg')).toBeNull()  // Below min
      expect(parseWeightString('400 kg')).toBeNull() // Above max
      expect(parseWeightString('20 lb')).toBeNull()  // Below min in lb
      expect(parseWeightString('700 lb')).toBeNull() // Above max in lb
    })

    it('should return null for zero and negative weights', () => {
      expect(parseWeightString('0 kg')).toBeNull()
      expect(parseWeightString('-70 kg')).toBeNull()
      expect(parseWeightString('-154 lb')).toBeNull()
    })
  })

  describe('formatWeightWithConfig', () => {
    it('should format with default config', () => {
      expect(formatWeightWithConfig(70)).toBe('70.0 kg')
      expect(formatWeightWithConfig(100)).toBe('100.0 kg')
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
      expect(formatWeightWithConfig(70)).toBe('70.0 kg') // Default config
      expect(formatWeightWithConfig(70, config)).toBe('70.0')
    })

    it('should format pounds without unit', () => {
      const config: WeightDisplayConfig = {
        unit: 'lb',
        precision: 0,
        showUnit: false
      }
      expect(formatWeightWithConfig(70, config)).toBe('154')
    })

    it('should handle edge cases', () => {
      expect(formatWeightWithConfig(0)).toBe('0.0 kg')
      
      const config: WeightDisplayConfig = {
        unit: 'lb',
        precision: 3,
        showUnit: true
      }
      expect(formatWeightWithConfig(0, config)).toBe('0.000 lb')
    })
  })

  describe('DEFAULT_WEIGHT_CONFIG', () => {
    it('should have correct default values', () => {
      expect(DEFAULT_WEIGHT_CONFIG.unit).toBe('kg')
      expect(DEFAULT_WEIGHT_CONFIG.precision).toBe(1)
      expect(DEFAULT_WEIGHT_CONFIG.showUnit).toBe(true)
    })
  })

  describe('Performance and Precision Tests', () => {
    it('should handle rapid successive conversions', () => {
      const startTime = performance.now()
      
      for (let i = 0; i < 1000; i++) {
        convertWeight(i, 'kg', 'lb')
      }
      
      const endTime = performance.now()
      expect(endTime - startTime).toBeLessThan(100) // Should complete within 100ms
    })

    it('should maintain precision across multiple conversions', () => {
      const original = 1
      const converted = convertWeight(original, 'kg', 'lb')
      const backConverted = convertWeight(converted, 'lb', 'kg')
      
      expect(backConverted).toBeCloseTo(original, 10)
    })

    it('should handle conversion chains accurately', () => {
      const weight = 70
      const kgToLb = convertWeight(weight, 'kg', 'lb')
      const lbToKg = convertWeight(kgToLb, 'lb', 'kg')
      
      expect(lbToKg).toBeCloseTo(weight, 10)
    })
  })

  describe('Integration Tests', () => {
    it('should work with parsing and formatting together', () => {
      const weightStr = '70.5 kg'
      const parsed = parseWeightString(weightStr)
      
      expect(parsed).not.toBeNull()
      if (parsed) {
        const formatted = formatWeight(parsed.value, parsed.unit)
        expect(formatted).toBe('70.5 kg')
      }
    })

    it('should work with conversion and formatting together', () => {
      const weightInKg = 70
      const weightInLb = convertWeight(weightInKg, 'kg', 'lb')
      const formatted = formatWeight(weightInLb, 'lb', 1)
      
      expect(formatted).toBe('154.3 lb')
    })

    it('should work with validation and conversion together', () => {
      const weight = 70
      const unit: WeightUnit = 'kg'
      
      expect(isValidWeight(weight, unit)).toBe(true)
      
      const converted = convertWeight(weight, unit, 'lb')
      expect(isValidWeight(converted, 'lb')).toBe(true)
    })
  })

  describe('Type Safety Tests', () => {
    it('should maintain type safety for WeightUnit', () => {
      const validUnits: WeightUnit[] = ['kg', 'lb']
      
      validUnits.forEach(unit => {
        expect(() => convertWeight(70, unit, 'kg')).not.toThrow()
        expect(() => convertWeight(70, 'kg', unit)).not.toThrow()
      })
    })

    it('should maintain type safety for WeightValue interface', () => {
      const weightValue: WeightValue = { value: 70, unit: 'kg' }
      
      expect(weightValue.value).toBe(70)
      expect(weightValue.unit).toBe('kg')
      expect(typeof weightValue.value).toBe('number')
      expect(typeof weightValue.unit).toBe('string')
    })

    it('should maintain type safety for WeightDisplayConfig interface', () => {
      const config: WeightDisplayConfig = {
        unit: 'lb',
        precision: 2,
        showUnit: false
      }
      
      expect(config.unit).toBe('lb')
      expect(config.precision).toBe(2)
      expect(config.showUnit).toBe(false)
    })
  })
})