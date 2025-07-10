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

describe('convertWeight', () => {
  describe('basic conversions', () => {
    test('should convert kg to lb correctly', () => {
      expect(convertWeight(1, 'kg', 'lb')).toBeCloseTo(2.20462262185, 10)
      expect(convertWeight(10, 'kg', 'lb')).toBeCloseTo(22.0462262185, 10)
      expect(convertWeight(70, 'kg', 'lb')).toBeCloseTo(154.32358352995, 10)
    })

    test('should convert lb to kg correctly', () => {
      expect(convertWeight(1, 'lb', 'kg')).toBeCloseTo(0.45359237, 8)
      expect(convertWeight(22.0462262185, 'lb', 'kg')).toBeCloseTo(10, 8)
      expect(convertWeight(154.32358352995, 'lb', 'kg')).toBeCloseTo(70, 8)
    })

    test('should return same value for same unit conversion', () => {
      expect(convertWeight(50, 'kg', 'kg')).toBe(50)
      expect(convertWeight(100, 'lb', 'lb')).toBe(100)
      expect(convertWeight(0, 'kg', 'kg')).toBe(0)
    })
  })

  describe('edge cases', () => {
    test('should handle zero weight', () => {
      expect(convertWeight(0, 'kg', 'lb')).toBe(0)
      expect(convertWeight(0, 'lb', 'kg')).toBe(0)
    })

    test('should handle negative weights', () => {
      expect(convertWeight(-10, 'kg', 'lb')).toBeCloseTo(-22.0462262185, 10)
      expect(convertWeight(-5, 'lb', 'kg')).toBeCloseTo(-2.26796185, 8)
    })

    test('should handle very large numbers', () => {
      const largeWeight = 1000000
      expect(convertWeight(largeWeight, 'kg', 'lb')).toBeCloseTo(2204622.62185, 5)
    })

    test('should handle very small decimal numbers', () => {
      expect(convertWeight(0.001, 'kg', 'lb')).toBeCloseTo(0.00220462262185, 12)
      expect(convertWeight(0.001, 'lb', 'kg')).toBeCloseTo(0.00045359237, 12)
    })

    test('should handle precise decimal values', () => {
      expect(convertWeight(1.23456789, 'kg', 'lb')).toBeCloseTo(2.72155462, 8)
      expect(convertWeight(2.72155462, 'lb', 'kg')).toBeCloseTo(1.23456789, 8)
    })
  })

  describe('error handling', () => {
    test('should throw error for invalid unit combinations', () => {
      expect(() => convertWeight(10, 'invalid' as WeightUnit, 'kg')).toThrow('Invalid conversion from invalid to kg')
      expect(() => convertWeight(10, 'kg', 'invalid' as WeightUnit)).toThrow('Invalid conversion from kg to invalid')
      expect(() => convertWeight(10, 'invalid' as WeightUnit, 'invalid' as WeightUnit)).toThrow()
    })
  })

  describe('bidirectional consistency', () => {
    test('should maintain consistency in bidirectional conversions', () => {
      const testValues = [1, 5.5, 10, 70, 100, 0.1, 1000]
      
      testValues.forEach(value => {
        const kgToLb = convertWeight(value, 'kg', 'lb')
        const lbToKg = convertWeight(kgToLb, 'lb', 'kg')
        expect(lbToKg).toBeCloseTo(value, 10)

        const lbToKgDirect = convertWeight(value, 'lb', 'kg')
        const kgToLbBack = convertWeight(lbToKgDirect, 'kg', 'lb')
        expect(kgToLbBack).toBeCloseTo(value, 10)
      })
    })
  })
})

describe('convertToKg', () => {
  test('should convert lb to kg', () => {
    expect(convertToKg(220.462262185, 'lb')).toBeCloseTo(100, 8)
    expect(convertToKg(154.32358352995, 'lb')).toBeCloseTo(70, 8)
  })

  test('should return same value for kg input', () => {
    expect(convertToKg(50, 'kg')).toBe(50)
    expect(convertToKg(0, 'kg')).toBe(0)
  })

  test('should handle edge cases', () => {
    expect(convertToKg(0, 'lb')).toBe(0)
    expect(convertToKg(-10, 'lb')).toBeCloseTo(-4.5359237, 8)
  })
})

describe('convertFromKg', () => {
  test('should convert kg to lb', () => {
    expect(convertFromKg(100, 'lb')).toBeCloseTo(220.462262185, 8)
    expect(convertFromKg(70, 'lb')).toBeCloseTo(154.32358352995, 8)
  })

  test('should return same value for kg output', () => {
    expect(convertFromKg(50, 'kg')).toBe(50)
    expect(convertFromKg(0, 'kg')).toBe(0)
  })

  test('should handle edge cases', () => {
    expect(convertFromKg(0, 'lb')).toBe(0)
    expect(convertFromKg(-10, 'kg')).toBe(-10)
  })
})

describe('formatWeight', () => {
  test('should format weight with default precision', () => {
    expect(formatWeight(70.5, 'kg')).toBe('70.5 kg')
    expect(formatWeight(154.3, 'lb')).toBe('154.3 lb')
  })

  test('should format weight with custom precision', () => {
    expect(formatWeight(70.12345, 'kg', 0)).toBe('70 kg')
    expect(formatWeight(70.12345, 'kg', 2)).toBe('70.12 kg')
    expect(formatWeight(70.12345, 'kg', 3)).toBe('70.123 kg')
  })

  test('should handle zero and negative weights', () => {
    expect(formatWeight(0, 'kg')).toBe('0.0 kg')
    expect(formatWeight(-5.5, 'lb')).toBe('-5.5 lb')
  })

  test('should handle very large numbers', () => {
    expect(formatWeight(1000000, 'kg')).toBe('1000000.0 kg')
  })

  test('should handle very small numbers', () => {
    expect(formatWeight(0.001, 'kg', 3)).toBe('0.001 kg')
  })
})

describe('getOppositeUnit', () => {
  test('should return opposite unit', () => {
    expect(getOppositeUnit('kg')).toBe('lb')
    expect(getOppositeUnit('lb')).toBe('kg')
  })

  test('should be consistent and reversible', () => {
    expect(getOppositeUnit(getOppositeUnit('kg'))).toBe('kg')
    expect(getOppositeUnit(getOppositeUnit('lb'))).toBe('lb')
  })
})

describe('isValidWeight', () => {
  describe('valid weights', () => {
    test('should accept weights within valid range in kg', () => {
      expect(isValidWeight(50, 'kg')).toBe(true)
      expect(isValidWeight(70, 'kg')).toBe(true)
      expect(isValidWeight(100, 'kg')).toBe(true)
      expect(isValidWeight(30, 'kg')).toBe(true)  // minimum
      expect(isValidWeight(300, 'kg')).toBe(true) // maximum
    })

    test('should accept weights within valid range in lb', () => {
      expect(isValidWeight(110, 'lb')).toBe(true)
      expect(isValidWeight(154, 'lb')).toBe(true)
      expect(isValidWeight(220, 'lb')).toBe(true)
      expect(isValidWeight(66.1387, 'lb')).toBe(true) // ~30 kg
      expect(isValidWeight(661.387, 'lb')).toBe(true) // ~300 kg
    })
  })

  describe('invalid weights', () => {
    test('should reject weights below minimum', () => {
      expect(isValidWeight(29, 'kg')).toBe(false)
      expect(isValidWeight(10, 'kg')).toBe(false)
      expect(isValidWeight(65, 'lb')).toBe(false) // ~29.5 kg
    })

    test('should reject weights above maximum', () => {
      expect(isValidWeight(301, 'kg')).toBe(false)
      expect(isValidWeight(500, 'kg')).toBe(false)
      expect(isValidWeight(662, 'lb')).toBe(false) // ~300.3 kg
    })

    test('should reject zero and negative weights', () => {
      expect(isValidWeight(0, 'kg')).toBe(false)
      expect(isValidWeight(-5, 'kg')).toBe(false)
      expect(isValidWeight(-10, 'lb')).toBe(false)
    })

    test('should reject NaN and infinite values', () => {
      expect(isValidWeight(NaN, 'kg')).toBe(false)
      expect(isValidWeight(Infinity, 'kg')).toBe(false)
      expect(isValidWeight(-Infinity, 'lb')).toBe(false)
    })
  })
})

describe('parseWeightString', () => {
  describe('valid inputs', () => {
    test('should parse valid weight strings with spaces', () => {
      expect(parseWeightString('70 kg')).toEqual({ value: 70, unit: 'kg' })
      expect(parseWeightString('154 lb')).toEqual({ value: 154, unit: 'lb' })
      expect(parseWeightString('50.5 kg')).toEqual({ value: 50.5, unit: 'kg' })
    })

    test('should parse valid weight strings without spaces', () => {
      expect(parseWeightString('70kg')).toEqual({ value: 70, unit: 'kg' })
      expect(parseWeightString('154lb')).toEqual({ value: 154, unit: 'lb' })
      expect(parseWeightString('50.5kg')).toEqual({ value: 50.5, unit: 'kg' })
    })

    test('should handle different whitespace', () => {
      expect(parseWeightString('  70 kg  ')).toEqual({ value: 70, unit: 'kg' })
      expect(parseWeightString('70  kg')).toEqual({ value: 70, unit: 'kg' })
    })

    test('should handle case insensitivity', () => {
      expect(parseWeightString('70 KG')).toEqual({ value: 70, unit: 'kg' })
      expect(parseWeightString('70 Kg')).toEqual({ value: 70, unit: 'kg' })
      expect(parseWeightString('154 LB')).toEqual({ value: 154, unit: 'lb' })
      expect(parseWeightString('154 Lb')).toEqual({ value: 154, unit: 'lb' })
    })

    test('should parse decimal values', () => {
      expect(parseWeightString('70.5 kg')).toEqual({ value: 70.5, unit: 'kg' })
      expect(parseWeightString('154.25 lb')).toEqual({ value: 154.25, unit: 'lb' })
    })
  })

  describe('invalid inputs', () => {
    test('should return null for invalid format', () => {
      expect(parseWeightString('invalid')).toBeNull()
      expect(parseWeightString('70')).toBeNull()
      expect(parseWeightString('kg 70')).toBeNull()
      expect(parseWeightString('70 grams')).toBeNull()
      expect(parseWeightString('')).toBeNull()
    })

    test('should return null for weights out of valid range', () => {
      expect(parseWeightString('10 kg')).toBeNull() // too low
      expect(parseWeightString('500 kg')).toBeNull() // too high
      expect(parseWeightString('50 lb')).toBeNull() // too low in lb
      expect(parseWeightString('1000 lb')).toBeNull() // too high in lb
    })

    test('should return null for negative weights', () => {
      expect(parseWeightString('-70 kg')).toBeNull()
      expect(parseWeightString('-154 lb')).toBeNull()
    })

    test('should return null for zero weight', () => {
      expect(parseWeightString('0 kg')).toBeNull()
      expect(parseWeightString('0 lb')).toBeNull()
    })
  })
})

describe('formatWeightWithConfig', () => {
  test('should format with default config', () => {
    expect(formatWeightWithConfig(70)).toBe('70.0 kg')
    expect(formatWeightWithConfig(50.5)).toBe('50.5 kg')
  })

  test('should format with custom unit', () => {
    const config: WeightDisplayConfig = { unit: 'lb', precision: 1, showUnit: true }
    expect(formatWeightWithConfig(70, config)).toBe('154.3 lb')
  })

  test('should format with custom precision', () => {
    const config: WeightDisplayConfig = { unit: 'kg', precision: 2, showUnit: true }
    expect(formatWeightWithConfig(70.12345, config)).toBe('70.12 kg')
    
    const config0: WeightDisplayConfig = { unit: 'kg', precision: 0, showUnit: true }
    expect(formatWeightWithConfig(70.7, config0)).toBe('71 kg')
  })

  test('should format without unit when showUnit is false', () => {
    const config: WeightDisplayConfig = { unit: 'kg', precision: 1, showUnit: false }
    expect(formatWeightWithConfig(70, config)).toBe('70.0')
    
    const configLb: WeightDisplayConfig = { unit: 'lb', precision: 1, showUnit: false }
    expect(formatWeightWithConfig(70, configLb)).toBe('154.3')
  })

  test('should handle edge cases', () => {
    expect(formatWeightWithConfig(0)).toBe('0.0 kg')
    
    const config: WeightDisplayConfig = { unit: 'lb', precision: 2, showUnit: true }
    expect(formatWeightWithConfig(0, config)).toBe('0.00 lb')
  })
})

describe('DEFAULT_WEIGHT_CONFIG', () => {
  test('should have correct default values', () => {
    expect(DEFAULT_WEIGHT_CONFIG.unit).toBe('kg')
    expect(DEFAULT_WEIGHT_CONFIG.precision).toBe(1)
    expect(DEFAULT_WEIGHT_CONFIG.showUnit).toBe(true)
  })
})

describe('integration tests', () => {
  test('should work together in conversion and formatting workflow', () => {
    const weightStr = '70 kg'
    const parsed = parseWeightString(weightStr)
    
    expect(parsed).not.toBeNull()
    
    if (parsed) {
      expect(isValidWeight(parsed.value, parsed.unit)).toBe(true)
      
      const converted = convertWeight(parsed.value, parsed.unit, 'lb')
      const formatted = formatWeight(converted, 'lb', 1)
      
      expect(formatted).toBe('154.3 lb')
    }
  })

  test('should handle full round-trip conversion', () => {
    const originalWeight = 75
    const originalUnit: WeightUnit = 'kg'
    
    // Convert to opposite unit
    const oppositeUnit = getOppositeUnit(originalUnit)
    const converted = convertWeight(originalWeight, originalUnit, oppositeUnit)
    
    // Convert back
    const convertedBack = convertWeight(converted, oppositeUnit, originalUnit)
    
    expect(convertedBack).toBeCloseTo(originalWeight, 10)
  })

  test('should validate and format weights consistently', () => {
    const testWeights = [
      { value: 70, unit: 'kg' as WeightUnit },
      { value: 154, unit: 'lb' as WeightUnit },
      { value: 50.5, unit: 'kg' as WeightUnit }
    ]
    
    testWeights.forEach(({ value, unit }) => {
      expect(isValidWeight(value, unit)).toBe(true)
      
      const formatted = formatWeight(value, unit, 1)
      expect(formatted).toMatch(/^\d+\.\d+ (kg|lb)$/)
      
      const parsed = parseWeightString(formatted)
      expect(parsed).toEqual({ value, unit })
    })
  })
})

describe('type safety', () => {
  test('should accept only valid WeightUnit types', () => {
    const validUnits: WeightUnit[] = ['kg', 'lb']
    
    validUnits.forEach(unit => {
      expect(() => convertWeight(70, unit, unit)).not.toThrow()
      expect(() => formatWeight(70, unit)).not.toThrow()
      expect(() => isValidWeight(70, unit)).not.toThrow()
    })
  })
})