/**
 * Cart status
 */
export type CartStatus = 'ACTIVE' | 'ABANDONED' | 'CHECKED_OUT'

/**
 * Supported currencies for money values
 */
export type Currency = 'EUR' | 'USD' | 'GBP'

/**
 * Domain constants
 */
export const DOMAIN_CONSTANTS = {
  /**
   * Maximum number of items allowed in a cart
   */
  MAX_CART_ITEMS: 100,

  /**
   * Maximum quantity for a single item
   */
  MAX_ITEM_QUANTITY: 999,

  /**
   * Default currency
   */
  DEFAULT_CURRENCY: 'EUR' as Currency,

  /**
   * Supported currencies
   */
  SUPPORTED_CURRENCIES: ['EUR', 'USD', 'GBP'] as const
} as const
