import { describe, expect, it } from '@jest/globals'

import {
  BODY_FAT_PERCENTAGE_MAX,
  BODY_FAT_PERCENTAGE_MIN,
  formatBodyFatPercentage,
  getBodyFatChange,
  isValidBodyFatPercentage,
} from './body-fat'

describe('body-fat utilities', () => {
  describe('isValidBodyFatPercentage', () => {
    it('accepts values inside the supported range', () => {
      expect(isValidBodyFatPercentage(BODY_FAT_PERCENTAGE_MIN)).toBe(true)
      expect(isValidBodyFatPercentage(18.4)).toBe(true)
      expect(isValidBodyFatPercentage(BODY_FAT_PERCENTAGE_MAX)).toBe(true)
    })

    it('rejects values outside the supported range', () => {
      expect(isValidBodyFatPercentage(BODY_FAT_PERCENTAGE_MIN - 0.1)).toBe(false)
      expect(isValidBodyFatPercentage(BODY_FAT_PERCENTAGE_MAX + 0.1)).toBe(false)
      expect(isValidBodyFatPercentage(Number.NaN)).toBe(false)
    })
  })

  describe('formatBodyFatPercentage', () => {
    it('formats percentages with the default precision', () => {
      expect(formatBodyFatPercentage(18.37)).toBe('18.4%')
    })

    it('supports custom precision', () => {
      expect(formatBodyFatPercentage(18.37, 2)).toBe('18.37%')
    })
  })

  describe('getBodyFatChange', () => {
    it('returns positive change when the latest reading is higher', () => {
      expect(getBodyFatChange(19.3, 18.1)).toBe(1.2)
    })

    it('returns negative change when the latest reading is lower', () => {
      expect(getBodyFatChange(17.8, 18.4)).toBe(-0.6)
    })
  })
})
