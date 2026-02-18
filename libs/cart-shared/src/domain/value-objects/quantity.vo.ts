import { InvalidQuantityError } from '../errors/cart.errors'
import { DOMAIN_CONSTANTS } from '../types/cart.types'

/**
 * Quantity value object
 *
 * Encapsulates quantity validation rules:
 * - Must be a positive integer
 * - Cannot exceed maximum allowed quantity
 * - Provides arithmetic operations while maintaining invariants
 *
 * @example
 * ```typescript
 * const qty = Quantity.from(5)
 * const increased = qty.add(3)  // Returns new Quantity(8)
 * const decreased = qty.subtract(2)  // Returns new Quantity(3)
 * ```
 */
export class Quantity {
  private constructor(private readonly _value: number) {
    // Invariant: quantity must always be valid
    Quantity.validate(_value)
  }

  /**
   * Create quantity from number
   * @param value - Quantity value
   * @returns Quantity instance
   * @throws {InvalidQuantityError} If value is invalid
   */
  public static from(value: number): Quantity {
    return new Quantity(value)
  }

  /**
   * Validate quantity value
   * @param value - Value to validate
   * @throws {InvalidQuantityError} If validation fails
   */
  private static validate(value: number): void {
    if (!Number.isInteger(value)) {
      throw new InvalidQuantityError(value)
    }

    if (value <= 0) {
      throw new InvalidQuantityError(value)
    }

    if (value > DOMAIN_CONSTANTS.MAX_ITEM_QUANTITY) {
      throw new InvalidQuantityError(value)
    }
  }

  /**
   * Get the raw number value
   * @returns Quantity as number
   */
  public get value(): number {
    return this._value
  }

  /**
   * Add quantity (immutable - returns new instance)
   * @param other - Quantity to add
   * @returns New quantity with sum
   */
  public add(other: Quantity): Quantity {
    return Quantity.from(this._value + other._value)
  }

  /**
   * Subtract quantity (immutable - returns new instance)
   * @param other - Quantity to subtract
   * @returns New quantity with difference
   * @throws {InvalidQuantityError} If result would be <= 0
   */
  public subtract(other: Quantity): Quantity {
    return Quantity.from(this._value - other._value)
  }

  /**
   * Check if this quantity is greater than another
   * @param other - Quantity to compare
   * @returns True if this > other
   */
  public isGreaterThan(other: Quantity): boolean {
    return this._value > other._value
  }

  /**
   * Check if this quantity is less than another
   * @param other - Quantity to compare
   * @returns True if this < other
   */
  public isLessThan(other: Quantity): boolean {
    return this._value < other._value
  }

  /**
   * Value objects are compared by their values
   * @param other - Another quantity
   * @returns True if both have the same value
   */
  public equals(other: Quantity): boolean {
    return this._value === other._value
  }

  /**
   * String representation
   * @returns Quantity as string
   */
  public toString(): string {
    return this._value.toString()
  }
}
