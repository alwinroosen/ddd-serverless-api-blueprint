/* istanbul ignore file */
import {
  createLambdaFunction,
  wireCartPort,
  wireDatabasePort,
  getConfigPort,
  getCartPort,
  getLoggerPort,
  getDatabasePort
} from '@libs/cart-shared'
import { getCartPathParamsSchema } from '@bpost/api-contracts'

import { getGetCartUseCase } from './application/usecase/getCartUseCase'
import { getGetCartPresenter } from './presentation/presenter/getCartPresenter'

/**
 * Lambda handler for retrieving shopping carts
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
    const presenter = getGetCartPresenter()

    // Create use case with dependencies (including logger)
    const useCase = getGetCartUseCase(presenter, [getCartPort(), logger])

    try {
      // Validate path parameters with safeParse (IT Handbook recommendation)
      const validation = getCartPathParamsSchema.safeParse(event.pathParameters)

      if (!validation.success) {
        // Return 400 for validation errors
        presenter.badRequest(JSON.stringify(validation.error.errors))
        return presenter.getResponse()
      }

      // Execute use case with validated data
      await useCase.handle({
        cartId: validation.data.cartId,
        userId // Provided by middleware
      })
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
