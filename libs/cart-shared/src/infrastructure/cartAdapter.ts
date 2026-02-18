import type { ConfigPort } from '../application/ports/ConfigPort'
import type { CartPort } from '../application/ports/CartPort'
import type { DatabasePort } from '../application/ports/DatabasePort'
import type { Cart, CartId } from '../domain'
import { CartNotFoundError } from '../domain'
import { CartMapper, type DynamoDBCartItem } from './mappers/cart.mapper'
import { validateCartItem } from './validators/dynamodb-cart.validator'

export type CartAdapter = (
  configPort: ConfigPort,
  databasePort: DatabasePort
) => CartPort

/**
 * CartAdapter
 *
 * Adapter implementation for CartPort.
 * Implements the cart persistence logic using generic DatabasePort.
 *
 * Following IT Handbook standards:
 * - Dependency Inversion Principle (implements port interface, depends on DatabasePort)
 * - Database-agnostic domain operations
 * - Single-table design for scalability
 * - Error handling with domain errors
 * - Async/await pattern
 * - Type-first approach for clarity
 */
// eslint-disable-next-line max-lines-per-function
export const cartAdapter: CartAdapter = (configPort, databasePort) => {
  const tableName = configPort.getTableName()

  return {
    findById: async (cartId: CartId): Promise<Cart> => {
      try {
        const key = CartMapper.createKey(cartId)

        const item = await databasePort.get({
          tableName,
          key,
          consistentRead: true
        })

        if (!item) {
          throw new CartNotFoundError(cartId.value)
        }

        // Validate database response to ensure data integrity
        const validatedItem = validateCartItem(item)
        return CartMapper.toDomain(validatedItem as DynamoDBCartItem)
      } catch (error) {
        if (error instanceof CartNotFoundError) {
          throw error
        }

        throw new Error(`Failed to find cart: ${(error as Error).message}`, { cause: error })
      }
    },

    findActiveByUserId: async (userId: string): Promise<Cart[]> => {
      try {
        const gsiKey = CartMapper.createUserIndexKey(userId)

        const result = await databasePort.query({
          tableName,
          indexName: 'GSI1',
          keyConditionExpression: 'GSI1PK = :gsi1pk',
          filterExpression: '#status = :status',
          expressionAttributeNames: {
            '#status': 'status'
          },
          expressionAttributeValues: {
            ':gsi1pk': gsiKey.GSI1PK,
            ':status': 'ACTIVE'
          }
        })

        if (result.items.length === 0) {
          return []
        }

        // Validate each item before mapping to domain
        return result.items.map(item => {
          const validatedItem = validateCartItem(item)
          return CartMapper.toDomain(validatedItem as DynamoDBCartItem)
        })
      } catch (error) {
        throw new Error(`Failed to find active carts: ${(error as Error).message}`, {
          cause: error
        })
      }
    },

    save: async (cart: Cart): Promise<Cart> => {
      try {
        const item = CartMapper.toDynamoDB(cart)

        await databasePort.put({
          tableName,
          item
        })

        return cart
      } catch (error) {
        throw new Error(`Failed to save cart: ${(error as Error).message}`, { cause: error })
      }
    },

    delete: async (cartId: CartId): Promise<void> => {
      try {
        const key = CartMapper.createKey(cartId)

        await databasePort.delete({
          tableName,
          key
        })
      } catch (error) {
        throw new Error(`Failed to delete cart: ${(error as Error).message}`, { cause: error })
      }
    },

    exists: async (cartId: CartId): Promise<boolean> => {
      try {
        const key = CartMapper.createKey(cartId)

        const item = await databasePort.get({
          tableName,
          key,
          projectionExpression: 'PK'
        })

        return !!item
      } catch (error) {
        throw new Error(`Failed to check cart existence: ${(error as Error).message}`, {
          cause: error
        })
      }
    }
  }
}
