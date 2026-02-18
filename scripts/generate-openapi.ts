#!/usr/bin/env tsx

/**
 * OpenAPI Generation Script
 *
 * Generates OpenAPI 3.0 specification from Zod schemas
 *
 * Following IT Handbook standards:
 * - Single source of truth (schemas)
 * - Auto-generated documentation
 * - Contract-first development
 *
 * Usage:
 *   npm run generate:openapi
 *
 * Output:
 *   terraform/generated/openapi.json
 */

import { writeFileSync } from 'fs'
import { join } from 'path'
import {
  OpenAPIRegistry,
  OpenApiGeneratorV3,
  extendZodWithOpenApi
} from '@asteasolutions/zod-to-openapi'
import { z } from 'zod'

// Import endpoint definitions
import { endpoints } from '../libs/api-contracts/src'

// Extend Zod with OpenAPI support
extendZodWithOpenApi(z)

/**
 * Generate OpenAPI specification
 */
function generateOpenAPI(): void {
  console.log('🔨 Generating OpenAPI specification...')

  // Create OpenAPI registry
  const registry = new OpenAPIRegistry()

  // Register security scheme (Cognito JWT)
  registry.registerComponent('securitySchemes', 'cognitoAuth', {
    type: 'apiKey',
    in: 'header',
    name: 'Authorization',
    description: 'JWT token from AWS Cognito (format: Bearer <token>)'
  })

  // Register each endpoint
  for (const endpoint of endpoints) {
    const route = {
      method: endpoint.method,
      path: endpoint.path,
      summary: endpoint.summary,
      description: endpoint.description,
      tags: endpoint.tags,
      request: {} as Record<string, unknown>,
      responses: {
        200: {
          description: 'Successful response',
          content: {
            'application/json': {
              schema: endpoint.responseSchema
            }
          }
        }
      },
      security: endpoint.security
    }

    // Add path parameters if present
    if ('pathParamsSchema' in endpoint && endpoint.pathParamsSchema) {
      route.request.params = endpoint.pathParamsSchema
    }

    // Add request body if present
    if ('requestSchema' in endpoint && endpoint.requestSchema) {
      route.request.body = {
        content: {
          'application/json': {
            schema: endpoint.requestSchema
          }
        }
      }
    }

    // Add error responses
    if (endpoint.errorSchemas) {
      for (const [statusCode, schema] of Object.entries(endpoint.errorSchemas)) {
        route.responses[statusCode] = {
          description: getErrorDescription(parseInt(statusCode)),
          content: {
            'application/json': {
              schema
            }
          }
        }
      }
    }

    registry.registerPath(route)
  }

  // Generate OpenAPI document
  const generator = new OpenApiGeneratorV3(registry.definitions)
  const document = generator.generateDocument({
    openapi: '3.0.3',
    info: {
      title: 'Shopping Cart API',
      version: '1.0.0',
      description: `
# Shopping Cart API

Production-ready serverless shopping cart API built with:

- **Domain-Driven Design** - Clean architecture with clear separation of concerns
- **TypeScript** - Type-safe end-to-end
- **AWS Serverless** - Lambda + API Gateway + DynamoDB + Cognito
- **Contract-First** - Zod schemas with auto-generated OpenAPI
- **Security** - JWT authentication, input validation, rate limiting
- **Quality** - 80%+ test coverage, SonarQube quality gates

## Authentication

All endpoints require JWT authentication via AWS Cognito.

Include the JWT token in the Authorization header:

\`\`\`
Authorization: Bearer <your-jwt-token>
\`\`\`

## Rate Limiting

- General API: 100 requests per 15 minutes per user
- Authenticated users only (enforced via Cognito)

## Error Handling

All errors follow a consistent format:

\`\`\`json
{
  "error": {
    "code": "CART_NOT_FOUND",
    "message": "Cart with ID '...' was not found",
    "details": {}
  }
}
\`\`\`
      `.trim(),
      contact: {
        name: 'Platform Team',
        email: 'platform@bpost.be'
      },
      license: {
        name: 'Proprietary',
        url: 'https://bpost.be'
      }
    },
    servers: [
      {
        url: 'https://api.dev.bpost.be',
        description: 'Development environment'
      },
      {
        url: 'https://api.staging.bpost.be',
        description: 'Staging environment'
      },
      {
        url: 'https://api.bpost.be',
        description: 'Production environment'
      }
    ],
    tags: [
      {
        name: 'Cart Management',
        description: 'Shopping cart operations'
      }
    ]
  })

  // Write to file
  const outputPath = join(process.cwd(), 'terraform', 'generated', 'openapi.json')
  writeFileSync(outputPath, JSON.stringify(document, null, 2), 'utf-8')

  console.log(`✅ OpenAPI specification generated: ${outputPath}`)
  console.log(`📊 Endpoints: ${endpoints.length}`)
}

/**
 * Get error description for HTTP status code
 */
function getErrorDescription(statusCode: number): string {
  const descriptions: Record<number, string> = {
    400: 'Bad Request - Invalid input data',
    401: 'Unauthorized - Missing or invalid JWT token',
    403: 'Forbidden - User not authorized to access this resource',
    404: 'Not Found - Requested resource does not exist',
    409: 'Conflict - Business rule violation',
    500: 'Internal Server Error - Unexpected error occurred'
  }

  return descriptions[statusCode] || 'Error'
}

// Execute generation
try {
  generateOpenAPI()
} catch (error) {
  console.error('❌ Failed to generate OpenAPI specification:', error)
  process.exit(1)
}
