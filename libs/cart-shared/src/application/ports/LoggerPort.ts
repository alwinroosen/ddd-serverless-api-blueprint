/**
 * LoggerPort
 *
 * Port (interface) for structured logging operations.
 * Following hexagonal architecture - application layer defines the port,
 * infrastructure layer provides the adapter implementation.
 *
 * PURPOSE:
 * - Structured logging with correlation IDs for request tracing
 * - Supports multiple log levels
 * - Context-aware logging with metadata
 * - Production-ready for CloudWatch Logs
 */
export type LoggerPort = {
  /**
   * Log error message with context
   * Use for: Exceptions, failures, errors that need immediate attention
   *
   * @param message - Error message
   * @param context - Additional context (userId, cartId, etc.)
   * @param error - Optional Error object for stack traces
   */
  error: (message: string, context?: Record<string, unknown>, error?: Error) => void

  /**
   * Log warning message with context
   * Use for: Degraded functionality, deprecated features, recoverable errors
   *
   * @param message - Warning message
   * @param context - Additional context
   */
  warn: (message: string, context?: Record<string, unknown>) => void

  /**
   * Log info message with context
   * Use for: Important business events, key operations
   *
   * @param message - Info message
   * @param context - Additional context
   */
  info: (message: string, context?: Record<string, unknown>) => void

  /**
   * Log debug message with context
   * Use for: Detailed diagnostic information (disabled in production)
   *
   * @param message - Debug message
   * @param context - Additional context
   */
  debug: (message: string, context?: Record<string, unknown>) => void

  /**
   * Set correlation ID for request tracing
   * Should be called at the start of each request
   *
   * @param correlationId - Unique request identifier (UUID)
   */
  setCorrelationId: (correlationId: string) => void

  /**
   * Get current correlation ID
   * @returns Current correlation ID or undefined
   */
  getCorrelationId: () => string | undefined
}
