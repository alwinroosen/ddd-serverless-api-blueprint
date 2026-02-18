import type { Cart, CartId } from '../../domain'

/**
 * CartPort
 *
 * Port (interface) for cart persistence operations.
 * Following hexagonal architecture - application layer defines the port,
 * infrastructure layer provides the adapter implementation.
 */
export type CartPort = {
  /**
   * Find cart by ID
   * @param cartId - Cart identifier
   * @returns Cart if found
   * @throws {CartNotFoundError} If cart doesn't exist
   */
  findById: (cartId: CartId) => Promise<Cart>

  /**
   * Find all active carts for a user
   * @param userId - User identifier
   * @returns Array of active carts (may be empty)
   */
  findActiveByUserId: (userId: string) => Promise<Cart[]>

  /**
   * Save cart (create or update)
   * @param cart - Cart to save
   * @returns Saved cart
   * @throws {Error} If save operation fails
   */
  save: (cart: Cart) => Promise<Cart>

  /**
   * Delete cart
   * @param cartId - Cart identifier
   * @throws {CartNotFoundError} If cart doesn't exist
   */
  delete: (cartId: CartId) => Promise<void>

  /**
   * Check if cart exists
   * @param cartId - Cart identifier
   * @returns True if cart exists
   */
  exists: (cartId: CartId) => Promise<boolean>
}
