import { createCartRequestSchema, createCartResponseSchema } from '../schemas/create-cart.schemas'
import { errorResponseSchema } from '../schemas/common.schemas'
import type { EndpointDefinition } from '../types/endpoint.types'

/**
 * CreateCart endpoint definition
 *
 * Single source of truth for:
 * - OpenAPI specification
 * - Runtime validation (Zod)
 * - Terraform configuration (Lambda + IAM)
 * - API Gateway integration
 *
 * Following IT Handbook contract-first pattern:
 * - Define once, generate everything
 * - Schemas drive infrastructure
 * - Type-safe end-to-end
 */
export const createCartEndpoint: EndpointDefinition<
  typeof createCartRequestSchema,
  typeof createCartResponseSchema
> = {
  /**
   * API Gateway configuration
   */
  path: '/api/v1/cart',
  method: 'post' as const,
  summary: 'Create a new shopping cart',
  description: 'Creates a new empty shopping cart for a user',
  tags: ['Cart Management'],
  operationId: 'createCart',

  /**
   * Request/Response schemas (Zod)
   */
  requestSchema: createCartRequestSchema,
  responseSchema: createCartResponseSchema,
  errorSchemas: {
    400: errorResponseSchema,
    401: errorResponseSchema,
    500: errorResponseSchema
  },

  /**
   * Security requirements
   */
  security: [
    {
      cognitoAuth: []
    }
  ],

  /**
   * Lambda configuration
   */
  lambda: {
    functionName: 'lambda-create-cart',
    handler: 'index.handler',
    runtime: 'nodejs24.x' as const,
    timeout: 30,
    memorySize: 512,
    environment: {
      DYNAMODB_TABLE_NAME: '${carts_table_name}',
      NODE_ENV: '${environment}',
      LOG_LEVEL: 'info'
    },

    /**
     * IAM permissions (auto-generated Terraform)
     */
    permissions: {
      dynamodb: [
        {
          table: '${carts_table}',
          actions: ['dynamodb:PutItem', 'dynamodb:GetItem']
        }
      ]
    }
  },

  /**
   * OpenAPI examples
   */
  examples: {
    request: {
      userId: 'user-123',
      currency: 'EUR'
    },
    response: {
      cartId: '123e4567-e89b-12d3-a456-426614174000',
      userId: 'user-123',
      status: 'ACTIVE',
      currency: 'EUR',
      items: [],
      total: { amount: 0, currency: 'EUR' },
      itemCount: 0,
      createdAt: '2024-01-15T10:30:00Z',
      updatedAt: '2024-01-15T10:30:00Z'
    }
  }
} as const
