import { Money } from './money.vo'
import { Currency } from '../types/cart.types'
import { InvalidMoneyError } from '../errors/cart.errors'

describe('Money', () => {
  describe('from', () => {
    it('should create Money from decimal amount', () => {
      const money = Money.from(19.99, 'EUR')

      expect(money.amount).toBe(19.99)
      expect(money.amountInCents).toBe(1999)
      expect(money.currency).toBe('EUR')
    })

    it('should handle floating-point precision correctly', () => {
      const money = Money.from(0.1 + 0.2, 'EUR') // 0.30000000000000004

      expect(money.amount).toBe(0.3)
      expect(money.amountInCents).toBe(30)
    })

    it('should handle very large amounts without precision loss', () => {
      // Test with a very large amount (e.g., million euros)
      const money = Money.from(9999999.99, 'EUR')

      expect(money.amount).toBe(9999999.99)
      expect(money.amountInCents).toBe(999999999)
    })

    it('should handle very small amounts correctly (minimum precision)', () => {
      // Test with smallest valid amount (0.01 cents)
      const money = Money.from(0.01, 'EUR')

      expect(money.amount).toBe(0.01)
      expect(money.amountInCents).toBe(1)
    })

    it('should use default currency (EUR) when not specified', () => {
      const money = Money.from(10)

      expect(money.currency).toBe('EUR')
    })

    it('should throw error for negative amount', () => {
      expect(() => Money.from(-10, 'EUR')).toThrow(InvalidMoneyError)
    })

    it('should throw error for invalid currency', () => {
      expect(() => Money.from(10, 'INVALID' as Currency)).toThrow(InvalidMoneyError)
    })
  })

  describe('fromCents', () => {
    it('should create Money from cents', () => {
      const money = Money.fromCents(1999, 'EUR')

      expect(money.amount).toBe(19.99)
      expect(money.amountInCents).toBe(1999)
      expect(money.currency).toBe('EUR')
    })

    it('should throw error for non-integer cents', () => {
      expect(() => Money.fromCents(19.5, 'EUR')).toThrow(InvalidMoneyError)
    })

    it('should throw error for negative cents', () => {
      expect(() => Money.fromCents(-100, 'EUR')).toThrow(InvalidMoneyError)
    })
  })

  describe('zero', () => {
    it('should create zero Money', () => {
      const money = Money.zero('USD')

      expect(money.amount).toBe(0)
      expect(money.amountInCents).toBe(0)
      expect(money.currency).toBe('USD')
      expect(money.isZero()).toBe(true)
    })

    it('should use default currency when not specified', () => {
      const money = Money.zero()

      expect(money.currency).toBe('EUR')
    })
  })

  describe('add', () => {
    it('should add two money values with same currency', () => {
      const money1 = Money.from(10, 'EUR')
      const money2 = Money.from(5.5, 'EUR')
      const result = money1.add(money2)

      expect(result.amount).toBe(15.5)
      expect(result.currency).toBe('EUR')
    })

    it('should throw error when adding different currencies', () => {
      const money1 = Money.from(10, 'EUR')
      const money2 = Money.from(5, 'USD')

      expect(() => money1.add(money2)).toThrow(
        'Cannot operate on different currencies: EUR and USD'
      )
    })
  })

  describe('subtract', () => {
    it('should subtract two money values with same currency', () => {
      const money1 = Money.from(10, 'EUR')
      const money2 = Money.from(5.5, 'EUR')
      const result = money1.subtract(money2)

      expect(result.amount).toBe(4.5)
      expect(result.currency).toBe('EUR')
    })

    it('should throw error when subtracting different currencies', () => {
      const money1 = Money.from(10, 'EUR')
      const money2 = Money.from(5, 'USD')

      expect(() => money1.subtract(money2)).toThrow(
        'Cannot operate on different currencies: EUR and USD'
      )
    })

    it('should throw error when result would be negative', () => {
      const money1 = Money.from(5, 'EUR')
      const money2 = Money.from(10, 'EUR')

      expect(() => money1.subtract(money2)).toThrow(InvalidMoneyError)
    })
  })

  describe('multiply', () => {
    it('should multiply money by a factor', () => {
      const money = Money.from(10, 'EUR')
      const result = money.multiply(3)

      expect(result.amount).toBe(30)
      expect(result.currency).toBe('EUR')
    })

    it('should handle decimal multiplication correctly', () => {
      const money = Money.from(10, 'EUR')
      const result = money.multiply(0.5)

      expect(result.amount).toBe(5)
    })

    it('should round multiplication result', () => {
      const money = Money.from(10.01, 'EUR')
      const result = money.multiply(1.5)

      expect(result.amountInCents).toBe(1502) // Rounded from 1501.5
    })
  })

  describe('isGreaterThan', () => {
    it('should return true when this > other', () => {
      const money1 = Money.from(10, 'EUR')
      const money2 = Money.from(5, 'EUR')

      expect(money1.isGreaterThan(money2)).toBe(true)
    })

    it('should return false when this <= other', () => {
      const money1 = Money.from(5, 'EUR')
      const money2 = Money.from(10, 'EUR')

      expect(money1.isGreaterThan(money2)).toBe(false)
      expect(money1.isGreaterThan(money1)).toBe(false)
    })

    it('should throw error when comparing different currencies', () => {
      const money1 = Money.from(10, 'EUR')
      const money2 = Money.from(5, 'USD')

      expect(() => money1.isGreaterThan(money2)).toThrow(
        'Cannot operate on different currencies: EUR and USD'
      )
    })
  })

  describe('isLessThan', () => {
    it('should return true when this < other', () => {
      const money1 = Money.from(5, 'EUR')
      const money2 = Money.from(10, 'EUR')

      expect(money1.isLessThan(money2)).toBe(true)
    })

    it('should return false when this >= other', () => {
      const money1 = Money.from(10, 'EUR')
      const money2 = Money.from(5, 'EUR')

      expect(money1.isLessThan(money2)).toBe(false)
      expect(money1.isLessThan(money1)).toBe(false)
    })

    it('should throw error when comparing different currencies', () => {
      const money1 = Money.from(10, 'EUR')
      const money2 = Money.from(5, 'USD')

      expect(() => money1.isLessThan(money2)).toThrow(
        'Cannot operate on different currencies: EUR and USD'
      )
    })
  })

  describe('isZero', () => {
    it('should return true for zero amount', () => {
      const money = Money.zero()

      expect(money.isZero()).toBe(true)
    })

    it('should return false for non-zero amount', () => {
      const money = Money.from(0.01, 'EUR')

      expect(money.isZero()).toBe(false)
    })
  })

  describe('equals', () => {
    it('should return true for same amount and currency', () => {
      const money1 = Money.from(10, 'EUR')
      const money2 = Money.from(10, 'EUR')

      expect(money1.equals(money2)).toBe(true)
    })

    it('should return false for different amounts', () => {
      const money1 = Money.from(10, 'EUR')
      const money2 = Money.from(5, 'EUR')

      expect(money1.equals(money2)).toBe(false)
    })

    it('should return false for different currencies', () => {
      const money1 = Money.from(10, 'EUR')
      const money2 = Money.from(10, 'USD')

      expect(money1.equals(money2)).toBe(false)
    })
  })

  describe('toString', () => {
    it('should return formatted money string', () => {
      const money = Money.from(19.99, 'EUR')

      expect(money.toString()).toBe('19.99 EUR')
    })

    it('should format with two decimal places', () => {
      const money = Money.from(10, 'USD')

      expect(money.toString()).toBe('10.00 USD')
    })
  })

  describe('toJSON', () => {
    it('should return JSON representation', () => {
      const money = Money.from(19.99, 'EUR')
      const json = money.toJSON()

      expect(json).toEqual({
        amount: 19.99,
        currency: 'EUR'
      })
    })
  })
})
