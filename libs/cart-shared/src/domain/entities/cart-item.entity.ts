import { ProductId } from '../value-objects/product-id.vo'
import { Quantity } from '../value-objects/quantity.vo'
import { Money } from '../value-objects/money.vo'
import { InvalidCartItemError } from '../errors/cart.errors'
import type { Currency } from '../types/cart.types'

/**
 * CartItem entity properties
 */
export interface CartItemProps {
  productId: ProductId
  productName: string
  quantity: Quantity
  unitPrice: Money
}

/**
 * CartItem entity
 *
 * Represents an item within a shopping cart.
 * Unlike value objects, entities have identity (productId in this case).
 * Two cart items are the same if they have the same product.
 *
 * Responsibilities:
 * - Maintain cart item integrity
 * - Calculate line total (quantity × price)
 * - Update quantity while maintaining invariants
 *
 * @example
 * ```typescript
 * const item = CartItem.create({
 *   productId: ProductId.from('PROD-001'),
 *   productName: 'Blue Widget',
 *   quantity: Quantity.from(2),
 *   unitPrice: Money.from(19.99, Currency.EUR)
 * })
 *
 * const total = item.lineTotal  // Money(39.98 EUR)
 * const updated = item.updateQuantity(Quantity.from(3))  // Returns new CartItem
 * ```
 */
export class CartItem {
  private constructor(private readonly props: CartItemProps) {
    CartItem.validate(props)
  }

  /**
   * Create a new cart item
   * @param props - Cart item properties
   * @returns Cart item instance
   * @throws {InvalidCartItemError} If properties are invalid
   */
  public static create(props: CartItemProps): CartItem {
    return new CartItem(props)
  }

  /**
   * Validate cart item properties
   * @param props - Properties to validate
   * @throws {InvalidCartItemError} If validation fails
   */
  private static validate(props: CartItemProps): void {
    if (!props.productName || props.productName.trim().length === 0) {
      throw new InvalidCartItemError('Product name cannot be empty', {
        productId: props.productId.value
      })
    }

    if (props.productName.length > 200) {
      throw new InvalidCartItemError('Product name cannot exceed 200 characters', {
        productId: props.productId.value,
        productName: props.productName
      })
    }

    if (props.unitPrice.isZero()) {
      throw new InvalidCartItemError('Unit price must be greater than zero', {
        productId: props.productId.value,
        unitPrice: props.unitPrice.toJSON()
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
  public get productName(): string {
    return this.props.productName
  }

  /**
   * Get quantity
   * @returns Quantity
   */
  public get quantity(): Quantity {
    return this.props.quantity
  }

  /**
   * Get unit price
   * @returns Unit price
   */
  public get unitPrice(): Money {
    return this.props.unitPrice
  }

  /**
   * Calculate line total (quantity × unit price)
   * @returns Total price for this cart item
   */
  public get lineTotal(): Money {
    return this.props.unitPrice.multiply(this.props.quantity.value)
  }

  /**
   * Update quantity (immutable - returns new cart item)
   * @param newQuantity - New quantity
   * @returns New cart item with updated quantity
   */
  public updateQuantity(newQuantity: Quantity): CartItem {
    return CartItem.create({
      ...this.props,
      quantity: newQuantity
    })
  }

  /**
   * Increase quantity by amount (immutable)
   * @param amount - Amount to increase
   * @returns New cart item with increased quantity
   */
  public increaseQuantity(amount: Quantity): CartItem {
    const newQuantity = this.props.quantity.add(amount)
    return this.updateQuantity(newQuantity)
  }

  /**
   * Decrease quantity by amount (immutable)
   * @param amount - Amount to decrease
   * @returns New cart item with decreased quantity
   * @throws {InvalidQuantityError} If result would be <= 0
   */
  public decreaseQuantity(amount: Quantity): CartItem {
    const newQuantity = this.props.quantity.subtract(amount)
    return this.updateQuantity(newQuantity)
  }

  /**
   * Entities are compared by their identity (productId)
   * @param other - Another cart item
   * @returns True if both have the same product ID
   */
  public equals(other: CartItem): boolean {
    return this.props.productId.equals(other.props.productId)
  }

  /**
   * Convert to plain object for serialization
   * @returns Plain object representation
   */
  public toObject(): {
    productId: string
    productName: string
    quantity: number
    unitPrice: { amount: number; currency: Currency }
    lineTotal: { amount: number; currency: Currency }
  } {
    return {
      productId: this.props.productId.value,
      productName: this.props.productName,
      quantity: this.props.quantity.value,
      unitPrice: this.props.unitPrice.toJSON(),
      lineTotal: this.lineTotal.toJSON()
    }
  }
}
