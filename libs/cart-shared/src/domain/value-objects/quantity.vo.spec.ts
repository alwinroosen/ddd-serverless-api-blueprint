import { Quantity } from './quantity.vo'
import { InvalidQuantityError } from '../errors/cart.errors'
import { DOMAIN_CONSTANTS } from '../types/cart.types'

describe('Quantity', () => {
  describe('from', () => {
    it('should create Quantity from positive integer', () => {
      const quantity = Quantity.from(5)

      expect(quantity.value).toBe(5)
    })

    it('should accept quantity of 1', () => {
      const quantity = Quantity.from(1)

      expect(quantity.value).toBe(1)
    })

    it('should accept maximum quantity', () => {
      const quantity = Quantity.from(DOMAIN_CONSTANTS.MAX_ITEM_QUANTITY)

      expect(quantity.value).toBe(DOMAIN_CONSTANTS.MAX_ITEM_QUANTITY)
    })

    it('should throw error for zero', () => {
      expect(() => Quantity.from(0)).toThrow(InvalidQuantityError)
    })

    it('should throw error for negative number', () => {
      expect(() => Quantity.from(-5)).toThrow(InvalidQuantityError)
    })

    it('should throw error for decimal number', () => {
      expect(() => Quantity.from(5.5)).toThrow(InvalidQuantityError)
    })

    it('should throw error for quantity exceeding maximum', () => {
      expect(() => Quantity.from(DOMAIN_CONSTANTS.MAX_ITEM_QUANTITY + 1)).toThrow(
        InvalidQuantityError
      )
    })
  })

  describe('value', () => {
    it('should return the raw quantity number', () => {
      const quantity = Quantity.from(5)

      expect(quantity.value).toBe(5)
    })
  })

  describe('add', () => {
    it('should add two quantities', () => {
      const qty1 = Quantity.from(5)
      const qty2 = Quantity.from(3)
      const result = qty1.add(qty2)

      expect(result.value).toBe(8)
    })

    it('should throw error if sum exceeds maximum', () => {
      const qty1 = Quantity.from(DOMAIN_CONSTANTS.MAX_ITEM_QUANTITY - 5)
      const qty2 = Quantity.from(10)

      expect(() => qty1.add(qty2)).toThrow(InvalidQuantityError)
    })

    it('should be immutable', () => {
      const qty1 = Quantity.from(5)
      const qty2 = Quantity.from(3)
      qty1.add(qty2)

      expect(qty1.value).toBe(5) // Original unchanged
      expect(qty2.value).toBe(3) // Original unchanged
    })
  })

  describe('subtract', () => {
    it('should subtract two quantities', () => {
      const qty1 = Quantity.from(10)
      const qty2 = Quantity.from(3)
      const result = qty1.subtract(qty2)

      expect(result.value).toBe(7)
    })

    it('should throw error if result would be zero', () => {
      const qty1 = Quantity.from(5)
      const qty2 = Quantity.from(5)

      expect(() => qty1.subtract(qty2)).toThrow(InvalidQuantityError)
    })

    it('should throw error if result would be negative', () => {
      const qty1 = Quantity.from(3)
      const qty2 = Quantity.from(10)

      expect(() => qty1.subtract(qty2)).toThrow(InvalidQuantityError)
    })

    it('should be immutable', () => {
      const qty1 = Quantity.from(10)
      const qty2 = Quantity.from(3)
      qty1.subtract(qty2)

      expect(qty1.value).toBe(10) // Original unchanged
      expect(qty2.value).toBe(3) // Original unchanged
    })
  })

  describe('isGreaterThan', () => {
    it('should return true when this > other', () => {
      const qty1 = Quantity.from(10)
      const qty2 = Quantity.from(5)

      expect(qty1.isGreaterThan(qty2)).toBe(true)
    })

    it('should return false when this <= other', () => {
      const qty1 = Quantity.from(5)
      const qty2 = Quantity.from(10)

      expect(qty1.isGreaterThan(qty2)).toBe(false)
      expect(qty1.isGreaterThan(qty1)).toBe(false)
    })
  })

  describe('isLessThan', () => {
    it('should return true when this < other', () => {
      const qty1 = Quantity.from(5)
      const qty2 = Quantity.from(10)

      expect(qty1.isLessThan(qty2)).toBe(true)
    })

    it('should return false when this >= other', () => {
      const qty1 = Quantity.from(10)
      const qty2 = Quantity.from(5)

      expect(qty1.isLessThan(qty2)).toBe(false)
      expect(qty1.isLessThan(qty1)).toBe(false)
    })
  })

  describe('equals', () => {
    it('should return true for same quantity values', () => {
      const qty1 = Quantity.from(5)
      const qty2 = Quantity.from(5)

      expect(qty1.equals(qty2)).toBe(true)
    })

    it('should return false for different quantity values', () => {
      const qty1 = Quantity.from(5)
      const qty2 = Quantity.from(10)

      expect(qty1.equals(qty2)).toBe(false)
    })
  })

  describe('toString', () => {
    it('should return the quantity as string', () => {
      const quantity = Quantity.from(5)

      expect(quantity.toString()).toBe('5')
    })
  })
})
