/* istanbul ignore file */
import {
  createLambdaFunction,
  wireCartPort,
  wireDatabasePort,
  getConfigPort,
  getCartPort,
  getLoggerPort,
  getDatabasePort,
  parseBody
} from '@libs/cart-shared'
import { createCartRequestSchema } from '@bpost/api-contracts'

import { getCreateCartUseCase } from './application/usecase/createCartUseCase'
import { getCreateCartPresenter } from './presentation/presenter/createCartPresenter'

/**
 * Lambda handler for creating shopping carts
 *
 * Following the bpost functional DI pattern:
 * - Dependency wiring via wire/get functions
 * - Presenters use closures for response state
 * - Use cases are factory functions
 * - Clean separation of concerns
 */
export const handler = createLambdaFunction(
  async (event, { logger, userId }) => {
    // Create presenter
    const presenter = getCreateCartPresenter()

    // Create use case with dependencies (including logger)
    const useCase = getCreateCartUseCase(presenter, [getCartPort(), logger])

    try {
      // Parse request body
      const body = parseBody(event.body) as Record<string, unknown>

      // Validate request with safeParse (IT Handbook recommendation)
      const validation = createCartRequestSchema.safeParse({
        ...body,
        userId // Override userId from JWT (provided by middleware)
      })

      if (!validation.success) {
        // Return 400 for validation errors
        presenter.badRequest(JSON.stringify(validation.error.errors))
        return presenter.getResponse()
      }

      // Execute use case with validated data
      await useCase.handle(validation.data)
    } catch (error) {
      // Handle unexpected errors
      presenter.serverError(error instanceof Error ? error : 'Unknown error')
    }

    return presenter.getResponse()
  },
  [
    () => wireDatabasePort([getConfigPort(), getLoggerPort()]),
    () => wireCartPort([getConfigPort(), getDatabasePort()])
  ]
)
