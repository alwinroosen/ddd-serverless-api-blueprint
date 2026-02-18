import type { APIGatewayProxyEventV2, APIGatewayProxyResultV2, Handler, Context } from 'aws-lambda'
import type { WirePort } from '../../config/wirePort'
import type { LoggerPort } from '../../application/ports/LoggerPort'
import { getStage } from '../../config/util/getStage'
import { wireConfigPort, getConfigPort } from '../../config/ports/configPort'
import { wireLoggerPort, getLoggerPort } from '../../config/ports/loggerPort'
import { wireJwtPort, getJwtPort } from '../../config/ports/jwtPort'
import { extractOrGenerateCorrelationId } from '../utils/correlation-id'
import { extractToken } from '../utils/http-request'

/**
 * LambdaContext type
 *
 * Context object passed to the handler with pre-configured utilities.
 */
export type LambdaContext = {
  /** Logger instance with correlation ID already set */
  logger: LoggerPort
  /** Correlation ID for request tracing */
  correlationId: string
  /** User ID extracted from JWT token */
  userId: string
  /** AWS Lambda context */
  awsContext: Context
}

/**
 * LambdaFunction type
 *
 * The handler function signature for HTTP API Gateway events.
 * Now receives a LambdaContext with pre-configured logger and correlation ID.
 */
type LambdaFunction = (
  event: APIGatewayProxyEventV2,
  context: LambdaContext
) => Promise<APIGatewayProxyResultV2>

/**
 * WirePorts type
 *
 * Array of wire functions to execute before handler execution.
 * Note: wireConfigPort and wireLoggerPort are automatically wired.
 */
type WirePorts = WirePort[]

/**
 * createLambdaFunction
 *
 * Creates a Lambda function handler with dependency wiring and authentication.
 *
 * Following the bpost functional DI pattern:
 * - Automatically wires ConfigPort, LoggerPort, and JwtPort (always needed)
 * - Extracts/generates correlation ID and configures logger
 * - Extracts and verifies JWT token from Authorization header
 * - Provides userId in context from verified JWT
 * - Accepts a handler function and additional wire functions
 * - Wire functions are executed before the handler
 * - Returns 401 for authentication errors
 * - Sentry integration in prod/non-prod environments
 *
 * @param handler - The Lambda handler function
 * @param wirePorts - Array of additional wire functions to execute (ConfigPort, LoggerPort, and JwtPort are automatic)
 * @returns Wrapped Lambda handler
 *
 * @example
 * ```typescript
 * export const handler = createLambdaFunction(
 *   async (event, { logger, userId }) => {
 *     const presenter = getCreateCartPresenter()
 *     const useCase = getCreateCartUseCase(presenter, [getCartPort(), logger])
 *     const input = parseEvent(event)
 *     await useCase.handle(input)
 *     return presenter.getResponse()
 *   },
 *   [
 *     () => wireDatabasePort([getConfigPort(), getLoggerPort()]),
 *     () => wireCartPort([getConfigPort(), getDatabasePort()])
 *   ]
 * )
 * ```
 */
export const createLambdaFunction = (handler: LambdaFunction, wirePorts: WirePorts = []): Handler => {
  const lambdaFunction: Handler = async (
    event: APIGatewayProxyEventV2,
    awsContext: Context,
    _callback
  ): Promise<APIGatewayProxyResultV2> => {
    // Wire base dependencies (always needed)
    wireConfigPort()
    wireLoggerPort()
    wireJwtPort([getConfigPort()])

    // Wire additional dependencies
    wirePorts.forEach(wirePort => wirePort())

    // Setup logging with correlation ID for request tracing
    const logger = getLoggerPort()
    const correlationId = extractOrGenerateCorrelationId(event)
    logger.setCorrelationId(correlationId)

    // Authenticate request and extract user ID
    try {
      const jwtPort = getJwtPort()
      const token = extractToken(event)
      const payload = await jwtPort.verify(token)
      const userId = jwtPort.getUserId(payload)

      // Create context with pre-configured utilities including userId
      const context: LambdaContext = {
        logger,
        correlationId,
        userId,
        awsContext
      }

      return handler(event, context)
    } catch (error) {
      // Return 401 for authentication errors
      logger.error('Authentication failed', { error })
      return {
        statusCode: 401,
        headers: {
          'Content-Type': 'application/json',
          'X-Request-ID': correlationId
        },
        body: JSON.stringify({
          error: {
            code: 'UNAUTHORIZED',
            message: 'Invalid or expired token'
          }
        })
      }
    }
  }

  // Note: Sentry integration can be added here in the future
  // For now, we'll keep it simple
  const stage = getStage()
  if (['prod', 'staging'].includes(stage)) {
    // In production environments, you would wrap with Sentry
    // return Sentry.wrapHandler(lambdaFunction as unknown as Handler)
    return lambdaFunction as Handler
  } else {
    return lambdaFunction as Handler
  }
}
