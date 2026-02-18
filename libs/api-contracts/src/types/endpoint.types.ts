import { z } from 'zod'

/**
 * HTTP methods supported by endpoints
 */
export type HttpMethod = 'get' | 'post' | 'put' | 'patch' | 'delete'

/**
 * Lambda runtime versions
 */
export type LambdaRuntime = 'nodejs24.x' | 'nodejs22.x' | 'nodejs20.x'

/**
 * DynamoDB permission configuration
 */
export interface DynamoDBPermission {
  table: string
  actions: string[]
}

/**
 * Lambda permissions configuration
 */
export interface LambdaPermissions {
  dynamodb?: DynamoDBPermission[]
  s3?: {
    bucket: string
    actions: string[]
  }[]
  sqs?: {
    queue: string
    actions: string[]
  }[]
}

/**
 * Lambda function configuration
 */
export interface LambdaConfig {
  functionName: string
  handler: string
  runtime: LambdaRuntime
  timeout: number
  memorySize: number
  environment: Record<string, string>
  permissions: LambdaPermissions
}

/**
 * OpenAPI security requirement
 */
export interface SecurityRequirement {
  [key: string]: string[]
}

/**
 * Endpoint definition type
 *
 * Provides type safety for endpoint configuration objects.
 * Used to define API endpoints with complete metadata for:
 * - OpenAPI specification generation
 * - Runtime validation schemas
 * - Terraform infrastructure configuration
 * - Lambda function setup
 *
 * @template TRequestSchema - Zod schema for request body (optional)
 * @template TResponseSchema - Zod schema for response body
 * @template TPathParamsSchema - Zod schema for path parameters (optional)
 * @template TQueryParamsSchema - Zod schema for query parameters (optional)
 */
export interface EndpointDefinition<
  TRequestSchema extends z.ZodTypeAny | undefined = z.ZodTypeAny | undefined,
  TResponseSchema extends z.ZodTypeAny = z.ZodTypeAny,
  TPathParamsSchema extends z.ZodTypeAny | undefined = z.ZodTypeAny | undefined,
  TQueryParamsSchema extends z.ZodTypeAny | undefined = z.ZodTypeAny | undefined
> {
  // API Gateway configuration
  path: string
  method: HttpMethod
  summary: string
  description: string
  tags: string[]
  operationId: string

  // Request/Response schemas (Zod)
  requestSchema?: TRequestSchema
  responseSchema: TResponseSchema
  pathParamsSchema?: TPathParamsSchema
  queryParamsSchema?: TQueryParamsSchema
  errorSchemas: {
    400?: z.ZodTypeAny
    401?: z.ZodTypeAny
    403?: z.ZodTypeAny
    404?: z.ZodTypeAny
    409?: z.ZodTypeAny
    500?: z.ZodTypeAny
    [key: number]: z.ZodTypeAny | undefined
  }

  // Security requirements
  security: SecurityRequirement[]

  // Lambda configuration
  lambda: LambdaConfig

  // OpenAPI examples
  examples: {
    request?: unknown
    response: unknown
    pathParams?: unknown
    queryParams?: unknown
    errors?: Record<number, unknown>
  }
}
