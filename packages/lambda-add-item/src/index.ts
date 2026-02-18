/* istanbul ignore file */
import {
  createLambdaFunction,
  wireCartPort,
  wireProductPort,
  wireDatabasePort,
  getConfigPort,
  getCartPort,
  getProductPort,
  getLoggerPort,
  getDatabasePort,
  parseBody
} from '@libs/cart-shared'
import { addItemPathParamsSchema, addItemRequestSchema } from '@bpost/api-contracts'

import { getAddItemToCartUseCase } from './application/usecase/addItemToCartUseCase'
import { getAddItemToCartPresenter } from './presentation/presenter/addItemToCartPresenter'

/**
 * Lambda handler for adding items to shopping carts
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
    const presenter = getAddItemToCartPresenter()

    // Create use case with dependencies (includes ProductPort for fetching prices and logger)
    const useCase = getAddItemToCartUseCase(presenter, [getCartPort(), getProductPort(), logger])

    try {
      // Validate path parameters with safeParse (IT Handbook recommendation)
      const pathValidation = addItemPathParamsSchema.safeParse(event.pathParameters)

      if (!pathValidation.success) {
        // Return 400 for validation errors
        presenter.badRequest(JSON.stringify(pathValidation.error.errors))
        return presenter.getResponse()
      }

      // Parse and validate request body
      const body = parseBody(event.body)
      const bodyValidation = addItemRequestSchema.safeParse(body)

      if (!bodyValidation.success) {
        // Return 400 for validation errors
        presenter.badRequest(JSON.stringify(bodyValidation.error.errors))
        return presenter.getResponse()
      }

      // Execute use case with validated data
      // SECURITY: Price and product name come from backend, not client
      await useCase.handle({
        cartId: pathValidation.data.cartId,
        userId, // Provided by middleware
        productId: bodyValidation.data.productId,
        quantity: bodyValidation.data.quantity
      })
    } catch (error) {
      // Handle unexpected errors
      presenter.serverError(error instanceof Error ? error : 'Unknown error')
    }

    return presenter.getResponse()
  },
  [
    () => wireDatabasePort([getConfigPort(), getLoggerPort()]),
    () => wireCartPort([getConfigPort(), getDatabasePort()]),
    () => wireProductPort([getConfigPort(), getDatabasePort()])
  ]
)
