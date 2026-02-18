import { randomUUID } from 'crypto'

/**
 * Extract or generate correlation ID for request tracing
 *
 * Correlation IDs allow tracing a request through multiple services/logs.
 * Priority order:
 * 1. X-Correlation-ID header (if client provided)
 * 2. X-Request-ID header (API Gateway standard)
 * 3. requestContext.requestId (API Gateway generated)
 * 4. Generate new UUID v4
 *
 * @param event - API Gateway Lambda proxy event
 * @returns Correlation ID for this request
 *
 * @example
 * ```typescript
 * const correlationId = extractOrGenerateCorrelationId(event)
 * logger.setCorrelationId(correlationId)
 * // All subsequent logs will include this ID
 * ```
 */
export const extractOrGenerateCorrelationId = (event: {
  headers?: Record<string, string | undefined>
  requestContext?: { requestId?: string }
}): string => {
  // Check custom correlation ID header (case-insensitive)
  if (event.headers) {
    const correlationId =
      event.headers['X-Correlation-ID'] ||
      event.headers['x-correlation-id'] ||
      event.headers['X-Correlation-Id']

    if (correlationId) {
      return correlationId
    }
  }

  // Check API Gateway request ID header
  if (event.headers) {
    const requestId =
      event.headers['X-Request-ID'] ||
      event.headers['x-request-id'] ||
      event.headers['X-Request-Id']

    if (requestId) {
      return requestId
    }
  }

  // Check API Gateway request context
  if (event.requestContext?.requestId) {
    return event.requestContext.requestId
  }

  // Generate new UUID if no correlation ID found
  return randomUUID()
}
