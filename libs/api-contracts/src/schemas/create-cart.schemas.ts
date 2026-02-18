import { z } from 'zod'
import { extendZodWithOpenApi } from '@asteasolutions/zod-to-openapi'
import { currencySchema, cartSchema } from './common.schemas'

extendZodWithOpenApi(z)

/**
 * CreateCart request body schema
 */
export const createCartRequestSchema = z
  .object({
    userId: z.string().min(1).max(100).openapi({
      description: 'User identifier who will own the cart',
      example: 'user-123'
    }),
    currency: currencySchema.optional().openapi({
      description: 'Preferred currency for the cart (defaults to EUR)',
      example: 'EUR'
    })
  })
  .openapi('CreateCartRequest')

/**
 * CreateCart response schema
 *
 * Returns the newly created cart
 */
export const createCartResponseSchema = cartSchema.openapi('CreateCartResponse')
