import { z } from 'zod'
import { extendZodWithOpenApi } from '@asteasolutions/zod-to-openapi'
import { uuidSchema, cartSchema } from './common.schemas'

extendZodWithOpenApi(z)

/**
 * AddItemToCart path parameters schema
 */
export const addItemPathParamsSchema = z
  .object({
    cartId: uuidSchema.openapi({
      description: 'Cart ID to add item to',
      param: { in: 'path', name: 'cartId' }
    })
  })
  .openapi('AddItemPathParams')

/**
 * AddItemToCart request body schema
 *
 * SECURITY: Product name and price are intentionally NOT accepted from client.
 * These values are fetched from the backend product catalog to prevent price manipulation attacks.
 * Clients only specify which product and how many - the backend provides authoritative pricing.
 */
export const addItemRequestSchema = z
  .object({
    productId: z
      .string()
      .regex(/^[A-Z0-9-]{3,50}$/)
      .openapi({
        description:
          'Product identifier (alphanumeric with hyphens). ' +
          'Product details (name, price) will be fetched from backend catalog.',
        example: 'PROD-12345'
      }),
    quantity: z.number().int().positive().max(999).openapi({
      description: 'Quantity to add to cart',
      example: 2
    })
  })
  .openapi('AddItemRequest')

/**
 * AddItemToCart response schema
 *
 * Returns the updated cart with the new item
 */
export const addItemResponseSchema = cartSchema.openapi('AddItemResponse')
