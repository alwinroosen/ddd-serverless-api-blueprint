import type { Product, ProductId } from '../../domain'

/**
 * ProductPort
 *
 * Port (interface) for product catalog operations.
 * Following hexagonal architecture - application layer defines the port,
 * infrastructure layer provides the adapter implementation.
 *
 * Purpose:
 * - Provides authoritative product information (names, prices, etc.)
 * - Prevents price manipulation by ensuring prices come from backend
 * - Supports product availability checking
 */
export type ProductPort = {
  /**
   * Find product by ID
   * @param productId - Product identifier
   * @returns Product if found and active
   * @throws {ProductNotFoundError} If product doesn't exist
   * @throws {ProductNotActiveError} If product exists but is inactive
   */
  findById: (productId: ProductId) => Promise<Product>

  /**
   * Find multiple products by IDs
   * @param productIds - Array of product identifiers
   * @returns Map of productId to Product (only active products)
   * @note Missing or inactive products are not included in result
   */
  findByIds: (productIds: ProductId[]) => Promise<Map<string, Product>>

  /**
   * Check if product exists and is active
   * @param productId - Product identifier
   * @returns True if product exists and is active
   */
  exists: (productId: ProductId) => Promise<boolean>

  /**
   * List all active products (for catalog browsing)
   * @param limit - Maximum number of products to return
   * @param lastKey - Pagination key from previous request
   * @returns Array of active products and optional next page key
   */
  listActive: (
    limit?: number,
    lastKey?: string
  ) => Promise<{ products: Product[]; nextKey?: string }>
}
