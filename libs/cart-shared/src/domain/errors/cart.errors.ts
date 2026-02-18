import { DomainError } from './domain.error'

/**
 * Error thrown when a cart is not found
 */
export class CartNotFoundError extends DomainError {
  constructor(cartId: string, cause?: Error) {
    super(`Cart with ID '${cartId}' was not found`, 'CART_NOT_FOUND', { cartId }, cause)
  }
}

/**
 * Error thrown when cart validation fails
 */
export class InvalidCartError extends DomainError {
  constructor(message: string, context?: Record<string, unknown>, cause?: Error) {
    super(message, 'INVALID_CART', context, cause)
  }
}

/**
 * Error thrown when cart item validation fails
 */
export class InvalidCartItemError extends DomainError {
  constructor(message: string, context?: Record<string, unknown>, cause?: Error) {
    super(message, 'INVALID_CART_ITEM', context, cause)
  }
}

/**
 * Error thrown when quantity validation fails
 */
export class InvalidQuantityError extends DomainError {
  constructor(quantity: number, cause?: Error) {
    super(
      `Invalid quantity: ${quantity}. Must be a positive integer.`,
      'INVALID_QUANTITY',
      { quantity },
      cause
    )
  }
}

/**
 * Error thrown when money amount validation fails
 */
export class InvalidMoneyError extends DomainError {
  constructor(amount: number, currency: string, cause?: Error) {
    super(
      `Invalid money: ${amount} ${currency}. Amount must be non-negative.`,
      'INVALID_MONEY',
      { amount, currency },
      cause
    )
  }
}

/**
 * Error thrown when maximum cart items limit is exceeded
 */
export class MaxCartItemsExceededError extends DomainError {
  constructor(maxItems: number, cause?: Error) {
    super(
      `Cannot add more items. Maximum ${maxItems} items allowed per cart.`,
      'MAX_CART_ITEMS_EXCEEDED',
      { maxItems },
      cause
    )
  }
}

/**
 * Error thrown when attempting to modify an inactive cart
 */
export class CartNotActiveError extends DomainError {
  constructor(cartId: string, status: string, cause?: Error) {
    super(
      `Cannot modify cart '${cartId}' with status '${status}'. Cart must be active.`,
      'CART_NOT_ACTIVE',
      { cartId, status },
      cause
    )
  }
}

/**
 * Error thrown when a product is not found
 */
export class ProductNotFoundError extends DomainError {
  constructor(productId: string, cause?: Error) {
    super(`Product with ID '${productId}' was not found`, 'PRODUCT_NOT_FOUND', { productId }, cause)
  }
}

/**
 * Error thrown when product validation fails
 */
export class InvalidProductError extends DomainError {
  constructor(message: string, context?: Record<string, unknown>, cause?: Error) {
    super(message, 'INVALID_PRODUCT', context, cause)
  }
}

/**
 * Error thrown when attempting to add an inactive product to cart
 */
export class ProductNotActiveError extends DomainError {
  constructor(productId: string, cause?: Error) {
    super(
      `Cannot add product '${productId}' to cart. Product is not active.`,
      'PRODUCT_NOT_ACTIVE',
      { productId },
      cause
    )
  }
}
