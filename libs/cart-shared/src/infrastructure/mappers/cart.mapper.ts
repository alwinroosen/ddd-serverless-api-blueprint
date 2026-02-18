import {
  Cart,
  CartId,
  ProductId,
  Quantity,
  Money,
  CartItem
} from '../../domain'
import type { CartStatus, Currency } from '../../domain'

/**
 * DynamoDB item structure
 *
 * Following IT Handbook standards:
 * - Single-table design for scalability
 * - Composite keys (PK/SK) for flexible access patterns
 * - GSI for querying by userId
 */
export interface DynamoDBCartItem {
  // Primary key
  PK: string // Format: CART#<cartId>
  SK: string // Format: METADATA

  // Attributes
  cartId: string
  userId: string
  status: string
  currency: string
  items: Array<{
    productId: string
    productName: string
    quantity: number
    unitPrice: {
      amount: number
      currency: string
    }
  }>
  createdAt: string // ISO 8601
  updatedAt: string // ISO 8601

  // GSI attributes for querying by userId
  GSI1PK: string // Format: USER#<userId>
  GSI1SK: string // Format: CART#<createdAt>

  // Entity type (for single-table design)
  entityType: 'CART'

  // Index signature for DatabasePort compatibility
  [key: string]: unknown
}

/**
 * Cart mapper - converts between domain entities and DynamoDB items
 *
 * Responsibilities:
 * - Map domain entities to DynamoDB format
 * - Map DynamoDB items to domain entities
 * - Handle data format conversions
 * - Preserve domain invariants
 *
 * Following IT Handbook standards:
 * - Separation of concerns
 * - Infrastructure details don't leak into domain
 * - Explicit mapping logic
 */
export class CartMapper {
  /**
   * Convert domain Cart entity to DynamoDB item
   * @param cart - Domain cart entity
   * @returns DynamoDB item
   */
  public static toDynamoDB(cart: Cart): DynamoDBCartItem {
    const cartObj = cart.toObject()

    return {
      // Primary key
      PK: `CART#${cartObj.cartId}`,
      SK: 'METADATA',

      // Attributes
      cartId: cartObj.cartId,
      userId: cartObj.userId,
      status: cartObj.status,
      currency: cartObj.currency,
      items: cartObj.items.map(
        (item: {
          productId: string
          productName: string
          quantity: number
          unitPrice: { amount: number; currency: string }
        }) => ({
          productId: item.productId,
          productName: item.productName,
          quantity: item.quantity,
          unitPrice: {
            amount: item.unitPrice.amount,
            currency: item.unitPrice.currency
          }
        })
      ),
      createdAt: cartObj.createdAt,
      updatedAt: cartObj.updatedAt,

      // GSI for querying by userId
      GSI1PK: `USER#${cartObj.userId}`,
      GSI1SK: `CART#${cartObj.createdAt}`,

      // Entity type
      entityType: 'CART'
    }
  }

  /**
   * Convert DynamoDB item to domain Cart entity
   * @param item - DynamoDB item
   * @returns Domain cart entity
   * @throws {Error} If item is invalid
   */
  public static toDomain(item: DynamoDBCartItem): Cart {
    // Reconstruct value objects
    const cartId = CartId.from(item.cartId)
    const currency = item.currency as Currency
    const status = item.status as CartStatus

    // Reconstruct cart items
    const cartItems = item.items.map(itemData =>
      CartItem.create({
        productId: ProductId.from(itemData.productId),
        productName: itemData.productName,
        quantity: Quantity.from(itemData.quantity),
        unitPrice: Money.from(itemData.unitPrice.amount, itemData.unitPrice.currency as Currency)
      })
    )

    // Reconstruct cart from props
    return Cart.fromProps({
      cartId,
      userId: item.userId,
      items: cartItems,
      status,
      currency,
      createdAt: new Date(item.createdAt),
      updatedAt: new Date(item.updatedAt)
    })
  }

  /**
   * Create key for GetItem/DeleteItem operations
   * @param cartId - Cart identifier
   * @returns DynamoDB key
   */
  public static createKey(cartId: CartId): { PK: string; SK: string } {
    return {
      PK: `CART#${cartId.value}`,
      SK: 'METADATA'
    }
  }

  /**
   * Create GSI key for querying by userId
   * @param userId - User identifier
   * @returns DynamoDB GSI key
   */
  public static createUserIndexKey(userId: string): { GSI1PK: string } {
    return {
      GSI1PK: `USER#${userId}`
    }
  }
}
