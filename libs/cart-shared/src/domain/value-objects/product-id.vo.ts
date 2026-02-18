/**
 * Branded type for Product ID
 */
declare const BRAND_SYMBOL: unique symbol
type Brand<T, TBrand extends string> = T & { readonly [BRAND_SYMBOL]: TBrand }

export type ProductIdValue = Brand<string, 'ProductId'>

/**
 * Product identifier value object
 *
 * Responsibilities:
 * - Validate product ID format
 * - Provide type-safe product ID handling
 * - Prevent mixing with other string IDs
 *
 * @example
 * ```typescript
 * const productId = ProductId.from('PROD-12345')
 * ```
 */
export class ProductId {
  private constructor(private readonly _value: ProductIdValue) {}

  /**
   * Create product ID from string value
   * @param value - Product ID string (alphanumeric with hyphens)
   * @returns Product ID instance
   * @throws {Error} If value is invalid
   */
  public static from(value: string): ProductId {
    if (!ProductId.isValid(value)) {
      throw new Error(
        `Invalid product ID format: ${value}. Must be alphanumeric with hyphens, 3-50 characters.`
      )
    }
    return new ProductId(value as ProductIdValue)
  }

  /**
   * Validate product ID format
   * - Alphanumeric characters and hyphens only
   * - 3-50 characters length
   * @param value - String to validate
   * @returns True if valid
   */
  private static isValid(value: string): boolean {
    const productIdRegex = /^[A-Z0-9-]{3,50}$/
    return productIdRegex.test(value)
  }

  /**
   * Get the raw string value
   * @returns Product ID string
   */
  public get value(): string {
    return this._value
  }

  /**
   * Value objects are compared by their values
   * @param other - Another product ID
   * @returns True if both have the same value
   */
  public equals(other: ProductId): boolean {
    return this._value === other._value
  }

  /**
   * String representation
   * @returns Product ID string
   */
  public toString(): string {
    return this._value
  }
}
