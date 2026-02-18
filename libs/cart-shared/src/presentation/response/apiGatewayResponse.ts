/**
 * API Gateway HTTP response structure
 */
export type ApiGatewayResponse = {
  statusCode: number
  headers?: Record<string, string>
  body: string
}

/**
 * Interface for objects that can return an API Gateway response
 */
export type WithApiGatewayResponse = {
  getResponse: () => ApiGatewayResponse
}

/**
 * Create standard API Gateway response with CORS headers and security headers
 *
 * @param statusCode - HTTP status code
 * @param body - Response body (will be JSON stringified)
 * @param options - Optional configuration for origin validation and request ID
 * @returns API Gateway response with proper headers
 */
export const createApiGatewayResponse = (
  statusCode: number,
  body: unknown,
  options?: {
    /** Request origin header for CORS validation */
    origin?: string
    /** Allowed CORS origins (if not provided, defaults to first allowed origin) */
    allowedOrigins?: string[]
    /** Request ID for correlation/tracing */
    requestId?: string
  }
): ApiGatewayResponse => {
  // Determine CORS origin
  let allowOrigin = options?.allowedOrigins?.[0] || 'http://localhost:3000'
  if (options?.origin && options?.allowedOrigins) {
    // Validate origin against allowlist
    if (options.allowedOrigins.includes(options.origin)) {
      allowOrigin = options.origin
    }
  }

  const headers: Record<string, string> = {
    // Content
    'Content-Type': 'application/json',

    // CORS headers
    'Access-Control-Allow-Origin': allowOrigin,
    'Access-Control-Allow-Credentials': 'true',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',

    // Security headers
    'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',
    'X-Content-Type-Options': 'nosniff',
    'X-Frame-Options': 'DENY',
    'X-XSS-Protection': '1; mode=block',
    'Referrer-Policy': 'strict-origin-when-cross-origin'
  }

  // Add request ID for tracing if provided
  if (options?.requestId) {
    headers['X-Request-ID'] = options.requestId
  }

  return {
    statusCode,
    headers,
    body: JSON.stringify(body)
  }
}
