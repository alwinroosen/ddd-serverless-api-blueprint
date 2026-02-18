import { CartId } from '../value-objects/cart-id.vo'
import { ProductId } from '../value-objects/product-id.vo'
import { Money } from '../value-objects/money.vo'
import { Quantity } from '../value-objects/quantity.vo'
import { CartItem } from './cart-item.entity'
import type { CartItemProps } from './cart-item.entity'
import type { CartStatus, Currency } from '../types/cart.types'
import { DOMAIN_CONSTANTS } from '../types/cart.types'
import {
  InvalidCartError,
  CartNotActiveError,
  MaxCartItemsExceededError
} from '../errors/cart.errors'

/**
 * Cart entity properties
 */
export interface CartProps {
  cartId: CartId
  userId: string
  items: CartItem[]
  status: CartStatus
  currency: Currency
  createdAt: Date
  updatedAt: Date
}

/**
 * Cart aggregate root
 *
 * The Cart is the aggregate root that manages cart items and enforces business rules.
 * All modifications to cart items must go through the Cart entity.
 *
 * Business Rules:
 * - Maximum 100 items per cart
 * - Can only modify active carts
 * - All items must have the same currency
 * - Cart total is calculated from all items
 * - Items with same product are merged (quantities added)
 *
 * Responsibilities:
 * - Add/remove/update cart items
 * - Calculate cart totals
 * - Enforce cart status transitions
 * - Maintain cart integrity
 *
 * @example
 * ```typescript
 * const cart = Cart.create({ userId: 'user-123', currency: Currency.EUR })
 *
 * const updatedCart = cart.addItem({
 *   productId: ProductId.from('PROD-001'),
 *   productName: 'Blue Widget',
 *   quantity: Quantity.from(2),
 *   unitPrice: Money.from(19.99, Currency.EUR)
 * })
 *
 * const total = updatedCart.total  // Money(39.98 EUR)
 * ```
 */
export class Cart {
  private constructor(private readonly props: CartProps) {
    Cart.validate(props)
  }

  /**
   * Create a new cart
   * @param params - Cart creation parameters
   * @returns New cart instance
   */
  public static create(params: { userId: string; currency?: Currency }): Cart {
    const now = new Date()

    return new Cart({
      cartId: CartId.generate(),
      userId: params.userId,
      items: [],
      status: 'ACTIVE',
      currency: params.currency ?? DOMAIN_CONSTANTS.DEFAULT_CURRENCY,
      createdAt: now,
      updatedAt: now
    })
  }

  /**
   * Reconstitute cart from persistence
   * @param props - Stored cart properties
   * @returns Cart instance
   */
  public static fromProps(props: CartProps): Cart {
    return new Cart(props)
  }

  /**
   * Validate cart properties
   * @param props - Properties to validate
   * @throws {InvalidCartError} If validation fails
   */
  private static validate(props: CartProps): void {
    if (!props.userId || props.userId.trim().length === 0) {
      throw new InvalidCartError('User ID is required', { cartId: props.cartId.value })
    }

    if (props.items.length > DOMAIN_CONSTANTS.MAX_CART_ITEMS) {
      throw new InvalidCartError(
        `Cart cannot have more than ${DOMAIN_CONSTANTS.MAX_CART_ITEMS} items`,
        {
          cartId: props.cartId.value,
          itemCount: props.items.length
        }
      )
    }

    // Validate all items have same currency as cart
    const invalidItems = props.items.filter(item => item.unitPrice.currency !== props.currency)
    if (invalidItems.length > 0) {
      throw new InvalidCartError('All items must have the same currency as the cart', {
        cartId: props.cartId.value,
        cartCurrency: props.currency,
        invalidItems: invalidItems.map(item => item.productId.value)
      })
    }
  }

  // Getters

  public get cartId(): CartId {
    return this.props.cartId
  }

  public get userId(): string {
    return this.props.userId
  }

  public get items(): ReadonlyArray<CartItem> {
    return [...this.props.items]
  }

  public get status(): CartStatus {
    return this.props.status
  }

  public get currency(): Currency {
    return this.props.currency
  }

  public get createdAt(): Date {
    return this.props.createdAt
  }

  public get updatedAt(): Date {
    return this.props.updatedAt
  }

  /**
   * Get cart total (sum of all line totals)
   * @returns Total price
   */
  public get total(): Money {
    if (this.props.items.length === 0) {
      return Money.zero(this.props.currency)
    }

    return this.props.items.reduce(
      (sum, item) => sum.add(item.lineTotal),
      Money.zero(this.props.currency)
    )
  }

  /**
   * Get total number of items (sum of all quantities)
   * @returns Total item count
   */
  public get itemCount(): number {
    return this.props.items.reduce((sum, item) => sum + item.quantity.value, 0)
  }

  /**
   * Check if cart is empty
   * @returns True if cart has no items
   */
  public get isEmpty(): boolean {
    return this.props.items.length === 0
  }

  /**
   * Check if cart is active
   * @returns True if status is Active
   */
  public get isActive(): boolean {
    return this.props.status === 'ACTIVE'
  }

  // Business operations

  /**
   * Add item to cart
   * If item with same product already exists, quantities are merged
   * @param itemProps - Item properties
   * @returns New cart with added item
   * @throws {CartNotActiveError} If cart is not active
   * @throws {MaxCartItemsExceededError} If adding would exceed max items
   */
  public addItem(itemProps: CartItemProps): Cart {
    this.ensureActive()

    // Validate currency matches cart currency
    if (itemProps.unitPrice.currency !== this.props.currency) {
      throw new InvalidCartError('Item currency must match cart currency', {
        cartId: this.props.cartId.value,
        cartCurrency: this.props.currency,
        itemCurrency: itemProps.unitPrice.currency
      })
    }

    const newItem = CartItem.create(itemProps)
    const existingItemIndex = this.props.items.findIndex(item =>
      item.productId.equals(newItem.productId)
    )

    let newItems: CartItem[]

    if (existingItemIndex >= 0) {
      // Merge with existing item (add quantities)
      const existingItem = this.props.items[existingItemIndex]!
      const mergedItem = existingItem.increaseQuantity(newItem.quantity)

      newItems = [
        ...this.props.items.slice(0, existingItemIndex),
        mergedItem,
        ...this.props.items.slice(existingItemIndex + 1)
      ]
    } else {
      // Add as new item
      if (this.props.items.length >= DOMAIN_CONSTANTS.MAX_CART_ITEMS) {
        throw new MaxCartItemsExceededError(DOMAIN_CONSTANTS.MAX_CART_ITEMS)
      }

      newItems = [...this.props.items, newItem]
    }

    return this.withUpdatedItems(newItems)
  }

  /**
   * Remove item from cart
   * @param productId - Product ID to remove
   * @returns New cart without the item
   * @throws {CartNotActiveError} If cart is not active
   * @throws {InvalidCartError} If item not found
   */
  public removeItem(productId: ProductId): Cart {
    this.ensureActive()

    const itemIndex = this.props.items.findIndex(item => item.productId.equals(productId))

    if (itemIndex === -1) {
      throw new InvalidCartError('Item not found in cart', {
        cartId: this.props.cartId.value,
        productId: productId.value
      })
    }

    const newItems = [
      ...this.props.items.slice(0, itemIndex),
      ...this.props.items.slice(itemIndex + 1)
    ]

    return this.withUpdatedItems(newItems)
  }

  /**
   * Update item quantity
   * @param productId - Product ID to update
   * @param newQuantity - New quantity
   * @returns New cart with updated item
   * @throws {CartNotActiveError} If cart is not active
   * @throws {InvalidCartError} If item not found
   */
  public updateItemQuantity(productId: ProductId, newQuantity: Quantity): Cart {
    this.ensureActive()

    const itemIndex = this.props.items.findIndex(item => item.productId.equals(productId))

    if (itemIndex === -1) {
      throw new InvalidCartError('Item not found in cart', {
        cartId: this.props.cartId.value,
        productId: productId.value
      })
    }

    const updatedItem = this.props.items[itemIndex]!.updateQuantity(newQuantity)

    const newItems = [
      ...this.props.items.slice(0, itemIndex),
      updatedItem,
      ...this.props.items.slice(itemIndex + 1)
    ]

    return this.withUpdatedItems(newItems)
  }

  /**
   * Clear all items from cart
   * @returns New empty cart
   * @throws {CartNotActiveError} If cart is not active
   */
  public clearItems(): Cart {
    this.ensureActive()
    return this.withUpdatedItems([])
  }

  /**
   * Mark cart as abandoned
   * @returns New cart with Abandoned status
   */
  public abandon(): Cart {
    return new Cart({
      ...this.props,
      status: 'ABANDONED',
      updatedAt: new Date()
    })
  }

  /**
   * Mark cart as checked out
   * @returns New cart with CheckedOut status
   * @throws {InvalidCartError} If cart is empty
   */
  public checkout(): Cart {
    if (this.isEmpty) {
      throw new InvalidCartError('Cannot checkout empty cart', {
        cartId: this.props.cartId.value
      })
    }

    return new Cart({
      ...this.props,
      status: 'CHECKED_OUT',
      updatedAt: new Date()
    })
  }

  // Helper methods

  /**
   * Ensure cart is active
   * @throws {CartNotActiveError} If cart is not active
   */
  private ensureActive(): void {
    if (!this.isActive) {
      throw new CartNotActiveError(this.props.cartId.value, this.props.status)
    }
  }

  /**
   * Create new cart with updated items and timestamp
   * @param newItems - New items array
   * @returns New cart instance
   */
  private withUpdatedItems(newItems: CartItem[]): Cart {
    return new Cart({
      ...this.props,
      items: newItems,
      updatedAt: new Date()
    })
  }

  /**
   * Convert to plain object for serialization
   * @returns Plain object representation
   */
  public toObject(): {
    cartId: string
    userId: string
    items: ReturnType<CartItem['toObject']>[]
    status: CartStatus
    currency: Currency
    total: { amount: number; currency: Currency }
    itemCount: number
    createdAt: string
    updatedAt: string
  } {
    return {
      cartId: this.props.cartId.value,
      userId: this.props.userId,
      items: this.props.items.map(item => item.toObject()),
      status: this.props.status,
      currency: this.props.currency,
      total: this.total.toJSON(),
      itemCount: this.itemCount,
      createdAt: this.props.createdAt.toISOString(),
      updatedAt: this.props.updatedAt.toISOString()
    }
  }
}
