import { z } from 'zod'

/**
 * Zod schema for validating DynamoDB cart items
 *
 * PURPOSE: Runtime validation to prevent failures from unexpected DynamoDB data.
 * This ensures type safety at the boundary between external data and domain logic.
 *
 * WHEN TO USE:
 * - When reading items from DynamoDB
 * - Before mapping to domain entities
 * - To fail fast with clear error messages
 */
export const DYNAMODB_CART_ITEM_SCHEMA = z.object({
  // Primary key
  PK: z.string().startsWith('CART#'),
  SK: z.literal('METADATA'),

  // Attributes
  cartId: z.string().uuid(),
  userId: z.string().min(1).max(100),
  status: z.enum(['ACTIVE', 'CHECKED_OUT', 'ABANDONED']),
  currency: z.enum(['EUR', 'USD', 'GBP']),
  items: z.array(
    z.object({
      productId: z.string().regex(/^[A-Z0-9-]{3,50}$/),
      productName: z.string().min(1).max(200),
      quantity: z.number().int().positive(),
      unitPrice: z.object({
        amount: z.number().nonnegative(),
        currency: z.enum(['EUR', 'USD', 'GBP'])
      })
    })
  ),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),

  // GSI attributes
  GSI1PK: z.string().startsWith('USER#'),
  GSI1SK: z.string().startsWith('CART#'),

  // Entity type
  entityType: z.literal('CART')
})

/**
 * Infer TypeScript type from schema
 */
export type ValidatedDynamoDBCartItem = z.infer<typeof DYNAMODB_CART_ITEM_SCHEMA>

/**
 * Validate DynamoDB cart item
 *
 * @param data - Raw data from DynamoDB
 * @returns Validated cart item
 * @throws {z.ZodError} If validation fails with detailed error messages
 */
export const validateCartItem = (data: unknown): ValidatedDynamoDBCartItem => {
  return DYNAMODB_CART_ITEM_SCHEMA.parse(data)
}

/**
 * Safely validate DynamoDB cart item (returns result object instead of throwing)
 *
 * @param data - Raw data from DynamoDB
 * @returns Success or error result
 */
export const safeValidateCartItem = (
  data: unknown
): { success: true; data: ValidatedDynamoDBCartItem } | { success: false; error: z.ZodError } => {
  const result = DYNAMODB_CART_ITEM_SCHEMA.safeParse(data)
  return result.success
    ? { success: true, data: result.data }
    : { success: false, error: result.error }
}
