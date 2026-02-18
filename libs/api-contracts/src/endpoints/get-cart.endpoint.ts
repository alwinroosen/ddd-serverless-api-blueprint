import { getCartPathParamsSchema, getCartResponseSchema } from '../schemas/get-cart.schemas'
import { errorResponseSchema } from '../schemas/common.schemas'
import type { EndpointDefinition } from '../types/endpoint.types'

/**
 * GetCart endpoint definition
 */
export const getCartEndpoint: EndpointDefinition<
  undefined,
  typeof getCartResponseSchema,
  typeof getCartPathParamsSchema
> = {
  /**
   * API Gateway configuration
   */
  path: '/api/v1/cart/{cartId}',
  method: 'get' as const,
  summary: 'Get cart by ID',
  description: 'Retrieves a shopping cart by its unique identifier',
  tags: ['Cart Management'],
  operationId: 'getCart',

  /**
   * Request/Response schemas (Zod)
   */
  pathParamsSchema: getCartPathParamsSchema,
  responseSchema: getCartResponseSchema,
  errorSchemas: {
    400: errorResponseSchema,
    401: errorResponseSchema,
    403: errorResponseSchema, // Unauthorized access to cart
    404: errorResponseSchema, // Cart not found
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
    functionName: 'lambda-get-cart',
    handler: 'index.handler',
    runtime: 'nodejs24.x' as const,
    timeout: 30,
    memorySize: 256, // Less memory needed for read operation
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
          actions: ['dynamodb:GetItem']
        }
      ]
    }
  },

  /**
   * OpenAPI examples
   */
  examples: {
    pathParams: {
      cartId: '123e4567-e89b-12d3-a456-426614174000'
    },
    response: {
      cartId: '123e4567-e89b-12d3-a456-426614174000',
      userId: 'user-123',
      status: 'ACTIVE',
      currency: 'EUR',
      items: [
        {
          productId: 'PROD-12345',
          productName: 'Blue Widget',
          quantity: 2,
          unitPrice: { amount: 19.99, currency: 'EUR' },
          lineTotal: { amount: 39.98, currency: 'EUR' }
        }
      ],
      total: { amount: 39.98, currency: 'EUR' },
      itemCount: 2,
      createdAt: '2024-01-15T10:30:00Z',
      updatedAt: '2024-01-15T10:35:00Z'
    },
    errors: {
      404: {
        error: {
          code: 'CART_NOT_FOUND',
          message: 'Cart with ID "123e4567-e89b-12d3-a456-426614174000" was not found'
        }
      }
    }
  }
} as const
