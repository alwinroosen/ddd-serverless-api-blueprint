import { InvalidMoneyError } from '../errors/cart.errors'
import type { Currency } from '../types/cart.types'
import { DOMAIN_CONSTANTS } from '../types/cart.types'

/**
 * Money value object
 *
 * Encapsulates monetary amount with currency:
 * - Amount must be non-negative
 * - Amount is stored as integer (cents/smallest currency unit)
 * - Prevents floating-point arithmetic errors
 * - Currency must be supported
 * - Provides arithmetic operations with same currency
 *
 * @example
 * ```typescript
 * const price = Money.from(19.99, Currency.EUR)  // Stored as 1999 cents
 * const total = price.multiply(3)  // Returns Money(5997 cents = 59.97 EUR)
 * ```
 */
export class Money {
  /**
   * Amount in smallest currency unit (cents for EUR/USD/GBP)
   */
  private readonly _amountInCents: number

  private constructor(
    amountInCents: number,
    private readonly _currency: Currency
  ) {
    this._amountInCents = amountInCents
    // Invariant: amount must always be valid
    Money.validate(amountInCents, _currency)
  }

  /**
   * Create money from decimal amount
   * @param amount - Amount in major currency units (e.g., 19.99 euros)
   * @param currency - Currency code
   * @returns Money instance
   * @throws {InvalidMoneyError} If amount or currency is invalid
   */
  public static from(
    amount: number,
    currency: Currency = DOMAIN_CONSTANTS.DEFAULT_CURRENCY
  ): Money {
    // Convert to cents to avoid floating-point errors
    const amountInCents = Math.round(amount * 100)
    return new Money(amountInCents, currency)
  }

  /**
   * Create money from cents
   * @param cents - Amount in cents
   * @param currency - Currency code
   * @returns Money instance
   * @throws {InvalidMoneyError} If amount or currency is invalid
   */
  public static fromCents(
    cents: number,
    currency: Currency = DOMAIN_CONSTANTS.DEFAULT_CURRENCY
  ): Money {
    return new Money(cents, currency)
  }

  /**
   * Create zero money
   * @param currency - Currency code
   * @returns Money instance with zero amount
   */
  public static zero(currency: Currency = DOMAIN_CONSTANTS.DEFAULT_CURRENCY): Money {
    return new Money(0, currency)
  }

  /**
   * Validate money value
   * @param amountInCents - Amount in cents
   * @param currency - Currency code
   * @throws {InvalidMoneyError} If validation fails
   */
  private static validate(amountInCents: number, currency: Currency): void {
    if (!Number.isInteger(amountInCents)) {
      throw new InvalidMoneyError(amountInCents / 100, currency)
    }

    if (amountInCents < 0) {
      throw new InvalidMoneyError(amountInCents / 100, currency)
    }

    if (!DOMAIN_CONSTANTS.SUPPORTED_CURRENCIES.includes(currency as never)) {
      throw new InvalidMoneyError(amountInCents / 100, currency)
    }
  }

  /**
   * Get amount in major currency units (e.g., euros)
   * @returns Amount as decimal number
   */
  public get amount(): number {
    return this._amountInCents / 100
  }

  /**
   * Get amount in smallest currency unit (cents)
   * @returns Amount in cents
   */
  public get amountInCents(): number {
    return this._amountInCents
  }

  /**
   * Get currency code
   * @returns Currency
   */
  public get currency(): Currency {
    return this._currency
  }

  /**
   * Add money (must have same currency)
   * @param other - Money to add
   * @returns New money with sum
   * @throws {Error} If currencies don't match
   */
  public add(other: Money): Money {
    this.ensureSameCurrency(other)
    return Money.fromCents(this._amountInCents + other._amountInCents, this._currency)
  }

  /**
   * Subtract money (must have same currency)
   * @param other - Money to subtract
   * @returns New money with difference
   * @throws {Error} If currencies don't match
   * @throws {InvalidMoneyError} If result would be negative
   */
  public subtract(other: Money): Money {
    this.ensureSameCurrency(other)
    return Money.fromCents(this._amountInCents - other._amountInCents, this._currency)
  }

  /**
   * Multiply money by a factor
   * @param factor - Multiplication factor
   * @returns New money with product
   */
  public multiply(factor: number): Money {
    const result = Math.round(this._amountInCents * factor)
    return Money.fromCents(result, this._currency)
  }

  /**
   * Check if this amount is greater than another
   * @param other - Money to compare
   * @returns True if this > other
   * @throws {Error} If currencies don't match
   */
  public isGreaterThan(other: Money): boolean {
    this.ensureSameCurrency(other)
    return this._amountInCents > other._amountInCents
  }

  /**
   * Check if this amount is less than another
   * @param other - Money to compare
   * @returns True if this < other
   * @throws {Error} If currencies don't match
   */
  public isLessThan(other: Money): boolean {
    this.ensureSameCurrency(other)
    return this._amountInCents < other._amountInCents
  }

  /**
   * Check if amount is zero
   * @returns True if amount is zero
   */
  public isZero(): boolean {
    return this._amountInCents === 0
  }

  /**
   * Ensure two money values have the same currency
   * @param other - Money to compare
   * @throws {Error} If currencies don't match
   */
  private ensureSameCurrency(other: Money): void {
    if (this._currency !== other._currency) {
      throw new Error(
        `Cannot operate on different currencies: ${this._currency} and ${other._currency}`
      )
    }
  }

  /**
   * Value objects are compared by their values
   * @param other - Another money value
   * @returns True if both have the same amount and currency
   */
  public equals(other: Money): boolean {
    return this._amountInCents === other._amountInCents && this._currency === other._currency
  }

  /**
   * String representation
   * @returns Formatted money string (e.g., "19.99 EUR")
   */
  public toString(): string {
    return `${this.amount.toFixed(2)} ${this._currency}`
  }

  /**
   * JSON representation
   * @returns Object with amount and currency
   */
  public toJSON(): { amount: number; currency: Currency } {
    return {
      amount: this.amount,
      currency: this._currency
    }
  }
}
