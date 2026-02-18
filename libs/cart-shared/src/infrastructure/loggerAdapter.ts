import type { LoggerPort } from '../application/ports/LoggerPort'

/**
 * Log level type
 */
type LogLevel = 'error' | 'warn' | 'info' | 'debug'

/**
 * Structured log entry format
 */
interface LogEntry {
  timestamp: string
  level: LogLevel
  message: string
  correlationId?: string
  context?: Record<string, unknown>
  error?: {
    name: string
    message: string
    stack?: string
  }
}

export type LoggerAdapter = (logLevel?: string) => LoggerPort

/**
 * LoggerAdapter
 *
 * Adapter implementation for LoggerPort using structured JSON logging.
 * Optimized for AWS CloudWatch Logs with Lambda.
 *
 * Following IT Handbook standards:
 * - Structured JSON logs for easy parsing
 * - Correlation IDs for request tracing
 * - Error stack traces for debugging
 * - Log level filtering by environment
 * - Type-first approach for clarity
 *
 * NOTE: This is a lightweight implementation. For production with high volume,
 * consider Winston or Pino for better performance and features.
 */
// eslint-disable-next-line max-lines-per-function
export const loggerAdapter: LoggerAdapter = (logLevel = 'info') => {
  // Store correlation ID in closure (per Lambda container)
  let correlationId: string | undefined

  /**
   * Determine if log level should be output
   */
  const shouldLog = (level: LogLevel): boolean => {
    const levels: LogLevel[] = ['error', 'warn', 'info', 'debug']
    const currentLevelIndex = levels.indexOf(logLevel as LogLevel)
    const requestedLevelIndex = levels.indexOf(level)

    // Log if requested level is equal or higher priority than current level
    return requestedLevelIndex <= currentLevelIndex
  }

  /**
   * Write structured log entry to stdout
   */
  const writeLog = (
    level: LogLevel,
    message: string,
    context?: Record<string, unknown>,
    error?: Error
  ): void => {
    if (!shouldLog(level)) {
      return
    }

    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level,
      message,
      correlationId,
      context
    }

    // Add error details if provided
    if (error) {
      entry.error = {
        name: error.name,
        message: error.message,
        stack: error.stack
      }
    }

    // Output as JSON for CloudWatch Logs
    // CloudWatch will parse JSON and make fields searchable
    // eslint-disable-next-line no-console
    console.log(JSON.stringify(entry))
  }

  return {
    error: (message: string, context?: Record<string, unknown>, error?: Error) => {
      writeLog('error', message, context, error)
    },

    warn: (message: string, context?: Record<string, unknown>) => {
      writeLog('warn', message, context)
    },

    info: (message: string, context?: Record<string, unknown>) => {
      writeLog('info', message, context)
    },

    debug: (message: string, context?: Record<string, unknown>) => {
      writeLog('debug', message, context)
    },

    setCorrelationId: (id: string) => {
      correlationId = id
    },

    getCorrelationId: () => {
      return correlationId
    }
  }
}
