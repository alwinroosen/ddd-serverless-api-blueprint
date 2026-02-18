import { z } from 'zod'

/**
 * Zod schema for validating DynamoDB product items
 *
 * PURPOSE: Runtime validation to prevent failures from unexpected DynamoDB data.
 * This ensures type safety at the boundary between external data and domain logic.
 */
export const DYNAMODB_PRODUCT_ITEM_SCHEMA = z.object({
  // Primary key
  PK: z.string().startsWith('PRODUCT#'),
  SK: z.literal('METADATA'),

  // Attributes
  productId: z.string().regex(/^[A-Z0-9-]{3,50}$/),
  name: z.string().min(1).max(200),
  description: z.string().max(1000).optional(),
  price: z.object({
    amount: z.number().positive(),
    currency: z.enum(['EUR', 'USD', 'GBP'])
  }),
  isActive: z.boolean(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),

  // GSI attributes
  GSI1PK: z.literal('PRODUCT_CATALOG'),
  GSI1SK: z.string().startsWith('PRODUCT#'),

  // Entity type
  entityType: z.literal('PRODUCT')
})

/**
 * Infer TypeScript type from schema
 */
export type ValidatedDynamoDBProductItem = z.infer<typeof DYNAMODB_PRODUCT_ITEM_SCHEMA>

/**
 * Validate DynamoDB product item
 *
 * @param data - Raw data from DynamoDB
 * @returns Validated product item
 * @throws {z.ZodError} If validation fails with detailed error messages
 */
export const validateProductItem = (data: unknown): ValidatedDynamoDBProductItem => {
  return DYNAMODB_PRODUCT_ITEM_SCHEMA.parse(data)
}

/**
 * Safely validate DynamoDB product item (returns result object instead of throwing)
 *
 * @param data - Raw data from DynamoDB
 * @returns Success or error result
 */
export const safeValidateProductItem = (
  data: unknown
):
  | { success: true; data: ValidatedDynamoDBProductItem }
  | { success: false; error: z.ZodError } => {
  const result = DYNAMODB_PRODUCT_ITEM_SCHEMA.safeParse(data)
  return result.success
    ? { success: true, data: result.data }
    : { success: false, error: result.error }
}
