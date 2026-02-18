import { randomUUID } from 'crypto'

/**
 * Branded type for Cart ID to prevent accidental mixing with other string IDs
 *
 * Following IT Handbook standards:
 * - Use branded types for domain-critical identifiers
 * - Prevents passing wrong ID type to functions
 * - Zero runtime overhead (compile-time only)
 */
declare const BRAND_SYMBOL: unique symbol
type Brand<T, TBrand extends string> = T & { readonly [BRAND_SYMBOL]: TBrand }

export type CartIdValue = Brand<string, 'CartId'>

/**
 * Cart identifier value object
 *
 * Responsibilities:
 * - Generate unique cart IDs
 * - Validate cart ID format (UUID v4)
 * - Provide type-safe cart ID handling
 *
 * @example
 * ```typescript
 * const cartId = CartId.generate()
 * const existingId = CartId.from('123e4567-e89b-12d3-a456-426614174000')
 * ```
 */
export class CartId {
  private constructor(private readonly _value: CartIdValue) {}

  /**
   * Generate a new cart ID using UUID v4
   * @returns New cart ID instance
   */
  public static generate(): CartId {
    return new CartId(randomUUID() as CartIdValue)
  }

  /**
   * Create cart ID from existing string value
   * @param value - UUID string
   * @returns Cart ID instance
   * @throws {Error} If value is not a valid UUID v4
   */
  public static from(value: string): CartId {
    if (!CartId.isValid(value)) {
      throw new Error(`Invalid cart ID format: ${value}. Must be a valid UUID v4.`)
    }
    return new CartId(value as CartIdValue)
  }

  /**
   * Validate UUID v4 format
   * @param value - String to validate
   * @returns True if value is a valid UUID v4
   */
  private static isValid(value: string): boolean {
    const uuidV4Regex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
    return uuidV4Regex.test(value)
  }

  /**
   * Get the raw string value
   * @returns UUID string
   */
  public get value(): string {
    return this._value
  }

  /**
   * Value objects are compared by their values, not identity
   * @param other - Another cart ID to compare
   * @returns True if both cart IDs have the same value
   */
  public equals(other: CartId): boolean {
    return this._value === other._value
  }

  /**
   * String representation for logging and serialization
   * @returns UUID string
   */
  public toString(): string {
    return this._value
  }
}
