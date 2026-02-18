import { z } from 'zod'
import { extendZodWithOpenApi } from '@asteasolutions/zod-to-openapi'
import { uuidSchema, cartSchema } from './common.schemas'

extendZodWithOpenApi(z)

/**
 * GetCart path parameters schema
 */
export const getCartPathParamsSchema = z
  .object({
    cartId: uuidSchema.openapi({
      description: 'Cart ID to retrieve',
      param: { in: 'path', name: 'cartId' }
    })
  })
  .openapi('GetCartPathParams')

/**
 * GetCart response schema
 *
 * Returns the requested cart
 */
export const getCartResponseSchema = cartSchema.openapi('GetCartResponse')
