/**
 * Base class for all domain errors
 *
 * Following IT Handbook standards:
 * - Custom error classes for application errors
 * - Use Error.cause (ES2022+) to preserve error chains
 * - Never expose stack traces in production
 */
export abstract class DomainError extends Error {
  /**
   * Machine-readable error code for client handling
   * @example 'CART_NOT_FOUND', 'INVALID_QUANTITY'
   */
  public readonly code: string

  /**
   * Additional context about the error
   */
  public readonly context?: Record<string, unknown>

  constructor(message: string, code: string, context?: Record<string, unknown>, cause?: Error) {
    super(message, { cause })
    this.code = code
    this.context = context
    this.name = this.constructor.name

    // Maintains proper stack trace for where error was thrown (V8 only)
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, this.constructor)
    }
  }

  /**
   * Convert error to safe JSON format (no stack traces)
   * @returns Safe error representation for API responses
   */
  public toJSON(): Record<string, unknown> {
    return {
      name: this.name,
      message: this.message,
      code: this.code,
      context: this.context
    }
  }
}
