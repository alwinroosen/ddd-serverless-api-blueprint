import {
  addItemPathParamsSchema,
  addItemRequestSchema,
  addItemResponseSchema
} from '../schemas/add-item.schemas'
import { errorResponseSchema } from '../schemas/common.schemas'
import type { EndpointDefinition } from '../types/endpoint.types'

/**
 * AddItemToCart endpoint definition
 */
export const addItemToCartEndpoint: EndpointDefinition<
  typeof addItemRequestSchema,
  typeof addItemResponseSchema,
  typeof addItemPathParamsSchema
> = {
  /**
   * API Gateway configuration
   */
  path: '/api/v1/cart/{cartId}/items',
  method: 'post' as const,
  summary: 'Add item to cart',
  description:
    'Adds a product to an existing shopping cart. ' +
    'Product details (name, price) are fetched from the backend catalog - clients only specify product ID and quantity. ' +
    'This prevents price manipulation attacks.',
  tags: ['Cart Management'],
  operationId: 'addItemToCart',

  /**
   * Request/Response schemas (Zod)
   */
  pathParamsSchema: addItemPathParamsSchema,
  requestSchema: addItemRequestSchema,
  responseSchema: addItemResponseSchema,
  errorSchemas: {
    400: errorResponseSchema, // Validation error / Product not active / Currency mismatch
    401: errorResponseSchema, // Not authenticated
    403: errorResponseSchema, // Not authorized (cart doesn't belong to user)
    404: errorResponseSchema, // Cart or product not found
    409: errorResponseSchema, // Conflict (e.g., max items exceeded)
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
    functionName: 'lambda-add-item',
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
          actions: ['dynamodb:GetItem', 'dynamodb:PutItem', 'dynamodb:UpdateItem']
        },
        {
          table: '${products_table}',
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
    request: {
      productId: 'PROD-12345',
      quantity: 2
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
          code: 'PRODUCT_NOT_FOUND',
          message: "Product with ID 'PROD-99999' was not found"
        }
      },
      409: {
        error: {
          code: 'MAX_CART_ITEMS_EXCEEDED',
          message: 'Cannot add more items. Maximum 100 items allowed per cart.'
        }
      }
    }
  }
} as const
