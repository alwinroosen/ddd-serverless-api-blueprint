import { z } from 'zod'
import { extendZodWithOpenApi } from '@asteasolutions/zod-to-openapi'

// Extend Zod with OpenAPI support
extendZodWithOpenApi(z)

/**
 * Common schemas used across multiple endpoints
 *
 * Following IT Handbook standards:
 * - Single source of truth for validation
 * - Runtime validation with Zod
 * - OpenAPI generation from schemas
 * - Reusable across endpoints
 */

/**
 * UUID v4 schema with OpenAPI metadata
 */
export const uuidSchema = z.string().uuid().openapi({
  description: 'UUID v4 identifier',
  example: '123e4567-e89b-12d3-a456-426614174000'
})

/**
 * Currency enum schema
 */
export const currencySchema = z.enum(['EUR', 'USD', 'GBP'] as const).openapi({
  description: 'ISO 4217 currency code',
  example: 'EUR'
})

/**
 * Cart status enum schema
 */
export const cartStatusSchema = z.enum(['ACTIVE', 'ABANDONED', 'CHECKED_OUT'] as const).openapi({
  description: 'Current status of the shopping cart',
  example: 'ACTIVE'
})

/**
 * Money value object schema
 */
export const moneySchema = z
  .object({
    amount: z.number().nonnegative().openapi({
      description: 'Amount in major currency units (e.g., euros, not cents)',
      example: 19.99
    }),
    currency: currencySchema
  })
  .openapi('Money')

/**
 * Cart item schema
 */
export const cartItemSchema = z
  .object({
    productId: z
      .string()
      .regex(/^[A-Z0-9-]{3,50}$/)
      .openapi({
        description: 'Product identifier (alphanumeric with hyphens)',
        example: 'PROD-12345'
      }),
    productName: z.string().min(1).max(200).openapi({
      description: 'Human-readable product name',
      example: 'Blue Widget'
    }),
    quantity: z.number().int().positive().max(999).openapi({
      description: 'Quantity of this product in the cart',
      example: 2
    }),
    unitPrice: moneySchema.openapi({
      description: 'Price per unit of this product'
    }),
    lineTotal: moneySchema.openapi({
      description: 'Total price for this line item (quantity × unitPrice)'
    })
  })
  .openapi('CartItem')

/**
 * Cart schema (full representation)
 */
export const cartSchema = z
  .object({
    cartId: uuidSchema.openapi({
      description: 'Unique cart identifier'
    }),
    userId: z.string().min(1).max(100).openapi({
      description: 'User identifier who owns this cart',
      example: 'user-123'
    }),
    status: cartStatusSchema,
    currency: currencySchema,
    items: z.array(cartItemSchema).openapi({
      description: 'List of items in the cart'
    }),
    total: moneySchema.openapi({
      description: 'Total price of all items in the cart'
    }),
    itemCount: z.number().int().nonnegative().openapi({
      description: 'Total number of items (sum of all quantities)',
      example: 3
    }),
    createdAt: z.string().datetime().openapi({
      description: 'ISO 8601 timestamp when cart was created',
      example: '2024-01-15T10:30:00Z'
    }),
    updatedAt: z.string().datetime().openapi({
      description: 'ISO 8601 timestamp when cart was last updated',
      example: '2024-01-15T10:35:00Z'
    })
  })
  .openapi('Cart')

/**
 * Error response schema
 */
export const errorResponseSchema = z
  .object({
    error: z.object({
      code: z.string().openapi({
        description: 'Machine-readable error code',
        example: 'CART_NOT_FOUND'
      }),
      message: z.string().openapi({
        description: 'Human-readable error message',
        example: 'Cart with ID "..." was not found'
      }),
      details: z
        .record(z.unknown())
        .optional()
        .openapi({
          description: 'Additional error context (excluded in production)',
          example: { cartId: '123e4567-e89b-12d3-a456-426614174000' }
        })
    })
  })
  .openapi('ErrorResponse')
