import { ProductId } from '../value-objects/product-id.vo'
import { Money } from '../value-objects/money.vo'
import { InvalidProductError } from '../errors/cart.errors'

/**
 * Product entity properties
 */
export interface ProductProps {
  productId: ProductId
  name: string
  description?: string
  price: Money
  isActive: boolean
}

/**
 * Product entity
 *
 * Represents a product in the catalog with its pricing information.
 * This is the authoritative source for product details and prices.
 *
 * Responsibilities:
 * - Maintain product data integrity
 * - Provide immutable product information
 * - Validate product properties
 *
 * Security:
 * - Prices come from backend (this entity), never from client requests
 * - Prevents price manipulation attacks
 *
 * @example
 * ```typescript
 * const product = Product.create({
 *   productId: ProductId.from('PROD-001'),
 *   name: 'Blue Widget',
 *   description: 'Premium quality widget',
 *   price: Money.from(19.99, Currency.EUR),
 *   isActive: true
 * })
 * ```
 */
export class Product {
  private constructor(private readonly props: ProductProps) {
    Product.validate(props)
  }

  /**
   * Create a new product
   * @param props - Product properties
   * @returns Product instance
   * @throws {InvalidProductError} If properties are invalid
   */
  public static create(props: ProductProps): Product {
    return new Product(props)
  }

  /**
   * Validate product properties
   * @param props - Properties to validate
   * @throws {InvalidProductError} If validation fails
   */
  private static validate(props: ProductProps): void {
    if (!props.name || props.name.trim().length === 0) {
      throw new InvalidProductError('Product name cannot be empty', {
        productId: props.productId.value
      })
    }

    if (props.name.length > 200) {
      throw new InvalidProductError('Product name cannot exceed 200 characters', {
        productId: props.productId.value,
        name: props.name
      })
    }

    if (props.description && props.description.length > 1000) {
      throw new InvalidProductError('Product description cannot exceed 1000 characters', {
        productId: props.productId.value
      })
    }

    if (props.price.isZero()) {
      throw new InvalidProductError('Product price must be greater than zero', {
        productId: props.productId.value,
        price: props.price.toJSON()
      })
    }
  }

  /**
   * Get product ID (entity identifier)
   * @returns Product ID
   */
  public get productId(): ProductId {
    return this.props.productId
  }

  /**
   * Get product name
   * @returns Product name
   */
  public get name(): string {
    return this.props.name
  }

  /**
   * Get product description
   * @returns Product description
   */
  public get description(): string | undefined {
    return this.props.description
  }

  /**
   * Get product price
   * @returns Product price (authoritative pricing from backend)
   */
  public get price(): Money {
    return this.props.price
  }

  /**
   * Check if product is active
   * @returns True if product is available for purchase
   */
  public get isActive(): boolean {
    return this.props.isActive
  }

  /**
   * Entities are compared by their identity (productId)
   * @param other - Another product
   * @returns True if both have the same product ID
   */
  public equals(other: Product): boolean {
    return this.props.productId.equals(other.props.productId)
  }

  /**
   * Convert to plain object for serialization
   * @returns Plain object representation
   */
  public toObject(): {
    productId: string
    name: string
    description?: string
    price: { amount: number; currency: string }
    isActive: boolean
  } {
    return {
      productId: this.props.productId.value,
      name: this.props.name,
      description: this.props.description,
      price: this.props.price.toJSON(),
      isActive: this.props.isActive
    }
  }
}
