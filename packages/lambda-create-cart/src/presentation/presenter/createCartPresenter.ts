import type {
  CreateCartPresenter,
  CreateCartOutput
} from '../../application/usecase/createCartUseCase'
import type { ApiGatewayResponse, WithApiGatewayResponse } from '@libs/cart-shared'
import { createApiGatewayResponse } from '@libs/cart-shared'

/**
 * CreateCartPresenter factory
 *
 * Factory function that creates a presenter using closures to store response state.
 * Following the bpost functional DI pattern.
 */
export const getCreateCartPresenter = (): CreateCartPresenter & WithApiGatewayResponse => {
  let response: ApiGatewayResponse | undefined = undefined

  return {
    success: (data: CreateCartOutput) => {
      response = createApiGatewayResponse(201, data)
    },

    failedToCreateCart: (error: Error | string) => {
      const message = error instanceof Error ? error.message : error
      response = createApiGatewayResponse(500, {
        error: 'Failed to create cart',
        message
      })
    },

    serverError: (error: Error | string) => {
      const message = error instanceof Error ? error.message : error
      response = createApiGatewayResponse(500, {
        error: 'Internal server error',
        message
      })
    },

    notFound: (message: string) => {
      response = createApiGatewayResponse(404, {
        error: 'Not found',
        message
      })
    },

    unauthorized: (message: string) => {
      response = createApiGatewayResponse(401, {
        error: 'Unauthorized',
        message
      })
    },

    badRequest: (message: string) => {
      response = createApiGatewayResponse(400, {
        error: 'Bad request',
        message
      })
    },

    getResponse: () => {
      if (!response) {
        return createApiGatewayResponse(500, {
          error: 'Internal server error',
          message: 'Use case did not present anything'
        })
      }
      return response
    }
  }
}
