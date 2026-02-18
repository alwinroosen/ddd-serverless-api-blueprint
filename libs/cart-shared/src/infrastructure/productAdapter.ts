import type { ConfigPort } from '../application/ports/ConfigPort'
import type { ProductPort } from '../application/ports/ProductPort'
import type { DatabasePort } from '../application/ports/DatabasePort'
import type { Product, ProductId } from '../domain'
import { ProductNotFoundError, ProductNotActiveError } from '../domain'
import { ProductMapper, type DynamoDBProductItem } from './mappers/product.mapper'
import { validateProductItem } from './validators/dynamodb-product.validator'

export type ProductAdapter = (
  configPort: ConfigPort,
  databasePort: DatabasePort
) => ProductPort

/**
 * ProductAdapter
 *
 * Adapter implementation for ProductPort.
 * Implements the product catalog logic using generic DatabasePort.
 *
 * Following IT Handbook standards:
 * - Dependency Inversion Principle (implements port interface, depends on DatabasePort)
 * - Database-agnostic domain operations
 * - Single-table design for scalability
 * - Error handling with domain errors
 * - Async/await pattern
 * - Type-first approach for clarity
 *
 * Security:
 * - Provides authoritative source for product prices
 * - Prevents price manipulation by client
 */
// eslint-disable-next-line max-lines-per-function
export const productAdapter: ProductAdapter = (configPort, databasePort) => {
  const tableName = configPort.getTableName()

  return {
    findById: async (productId: ProductId): Promise<Product> => {
      try {
        const key = ProductMapper.createKey(productId)

        const item = await databasePort.get({
          tableName,
          key,
          consistentRead: true
        })

        if (!item) {
          throw new ProductNotFoundError(productId.value)
        }

        // Validate database response to ensure data integrity
        const validatedItem = validateProductItem(item)
        const product = ProductMapper.toDomain(validatedItem as DynamoDBProductItem)

        // Check if product is active
        if (!product.isActive) {
          throw new ProductNotActiveError(productId.value)
        }

        return product
      } catch (error) {
        if (error instanceof ProductNotFoundError || error instanceof ProductNotActiveError) {
          throw error
        }

        throw new Error(`Failed to find product: ${(error as Error).message}`, { cause: error })
      }
    },

    findByIds: async (productIds: ProductId[]): Promise<Map<string, Product>> => {
      try {
        if (productIds.length === 0) {
          return new Map()
        }

        // DatabasePort batchGet has a limit of 100 items
        const batchSize = 100
        const batches: ProductId[][] = []
        for (let i = 0; i < productIds.length; i += batchSize) {
          batches.push(productIds.slice(i, i + batchSize))
        }

        const allProducts = new Map<string, Product>()

        for (const batch of batches) {
          const keys = batch.map(id => ProductMapper.createKey(id))

          const result = await databasePort.batchGet({
            tableName,
            keys,
            consistentRead: true
          })

          for (const item of result.items) {
            // Validate each item from batch get
            const validatedItem = validateProductItem(item)
            const product = ProductMapper.toDomain(validatedItem as DynamoDBProductItem)

            // Only include active products
            // eslint-disable-next-line max-depth
            if (product.isActive) {
              allProducts.set(product.productId.value, product)
            }
          }
        }

        return allProducts
      } catch (error) {
        throw new Error(`Failed to find products: ${(error as Error).message}`, { cause: error })
      }
    },

    exists: async (productId: ProductId): Promise<boolean> => {
      try {
        const key = ProductMapper.createKey(productId)

        const item = await databasePort.get({
          tableName,
          key,
          projectionExpression: 'PK, isActive'
        })

        // Product exists and is active
        return !!item && item.isActive === true
      } catch (error) {
        throw new Error(`Failed to check product existence: ${(error as Error).message}`, {
          cause: error
        })
      }
    },

    listActive: async (
      limit: number = 50,
      lastKey?: string
    ): Promise<{ products: Product[]; nextKey?: string }> => {
      try {
        const gsiKey = ProductMapper.createCatalogIndexKey()

        let exclusiveStartKey: Record<string, unknown> | undefined

        if (lastKey) {
          // Parse the pagination key
          try {
            exclusiveStartKey = JSON.parse(lastKey)
          } catch {
            throw new Error('Invalid pagination key')
          }
        }

        const result = await databasePort.query({
          tableName,
          indexName: 'GSI1',
          keyConditionExpression: 'GSI1PK = :gsi1pk',
          filterExpression: '#isActive = :isActive',
          expressionAttributeNames: {
            '#isActive': 'isActive'
          },
          expressionAttributeValues: {
            ':gsi1pk': gsiKey.GSI1PK,
            ':isActive': true
          },
          limit,
          exclusiveStartKey
        })

        if (result.items.length === 0) {
          return { products: [] }
        }

        // Validate each item from query before mapping to domain
        const products = result.items.map(item => {
          const validatedItem = validateProductItem(item)
          return ProductMapper.toDomain(validatedItem as DynamoDBProductItem)
        })

        const response: { products: Product[]; nextKey?: string } = { products }

        if (result.lastEvaluatedKey) {
          response.nextKey = JSON.stringify(result.lastEvaluatedKey)
        }

        return response
      } catch (error) {
        throw new Error(`Failed to list active products: ${(error as Error).message}`, {
          cause: error
        })
      }
    }
  }
}
