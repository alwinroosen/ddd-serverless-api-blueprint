import { Product, ProductId, Money } from '../../domain'
import type { Currency } from '../../domain'

/**
 * DynamoDB item structure for products
 *
 * Following IT Handbook standards:
 * - Single-table design for scalability
 * - Composite keys (PK/SK) for flexible access patterns
 * - GSI for listing all active products
 */
export interface DynamoDBProductItem {
  // Primary key
  PK: string // Format: PRODUCT#<productId>
  SK: string // Format: METADATA

  // Attributes
  productId: string
  name: string
  description?: string
  price: {
    amount: number
    currency: string
  }
  isActive: boolean
  createdAt: string // ISO 8601
  updatedAt: string // ISO 8601

  // GSI attributes for listing all products
  GSI1PK: string // Format: PRODUCT_CATALOG
  GSI1SK: string // Format: PRODUCT#<productId>

  // Entity type (for single-table design)
  entityType: 'PRODUCT'

  // Index signature for DatabasePort compatibility
  [key: string]: unknown
}

/**
 * Product mapper - converts between domain entities and DynamoDB items
 *
 * Responsibilities:
 * - Map domain Product entities to DynamoDB format
 * - Map DynamoDB items to domain Product entities
 * - Handle data format conversions
 * - Preserve domain invariants
 *
 * Following IT Handbook standards:
 * - Separation of concerns
 * - Infrastructure details don't leak into domain
 * - Explicit mapping logic
 */
export class ProductMapper {
  /**
   * Convert domain Product entity to DynamoDB item
   * @param product - Domain product entity
   * @returns DynamoDB item
   */
  public static toDynamoDB(product: Product): DynamoDBProductItem {
    const productObj = product.toObject()
    const now = new Date().toISOString()

    return {
      // Primary key
      PK: `PRODUCT#${productObj.productId}`,
      SK: 'METADATA',

      // Attributes
      productId: productObj.productId,
      name: productObj.name,
      description: productObj.description,
      price: {
        amount: productObj.price.amount,
        currency: productObj.price.currency
      },
      isActive: productObj.isActive,
      createdAt: now,
      updatedAt: now,

      // GSI for listing all products
      GSI1PK: 'PRODUCT_CATALOG',
      GSI1SK: `PRODUCT#${productObj.productId}`,

      // Entity type
      entityType: 'PRODUCT'
    }
  }

  /**
   * Convert DynamoDB item to domain Product entity
   * @param item - DynamoDB item
   * @returns Domain product entity
   */
  public static toDomain(item: DynamoDBProductItem): Product {
    return Product.create({
      productId: ProductId.from(item.productId),
      name: item.name,
      description: item.description,
      price: Money.from(item.price.amount, item.price.currency as Currency),
      isActive: item.isActive
    })
  }

  /**
   * Create primary key for product
   * @param productId - Product identifier
   * @returns DynamoDB key
   */
  public static createKey(productId: ProductId): {
    PK: string
    SK: string
  } {
    return {
      PK: `PRODUCT#${productId.value}`,
      SK: 'METADATA'
    }
  }

  /**
   * Create GSI key for product catalog listing
   * @returns DynamoDB GSI key
   */
  public static createCatalogIndexKey(): {
    GSI1PK: string
  } {
    return {
      GSI1PK: 'PRODUCT_CATALOG'
    }
  }
}
