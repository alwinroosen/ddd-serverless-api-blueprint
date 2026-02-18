import { CartId, CartNotFoundError } from '@libs/cart-shared'
import type { CartPort, LoggerPort, Currency, CartStatus } from '@libs/cart-shared'
import type { Presenter, UseCase } from './types'

/**
 * GetCart input data
 */
export type GetCartInput = {
  cartId: string
  userId: string
}

/**
 * GetCart output data
 */
export type GetCartOutput = {
  cartId: string
  userId: string
  status: CartStatus
  currency: Currency
  items: Array<{
    productId: string
    productName: string
    quantity: number
    unitPrice: { amount: number; currency: Currency }
    lineTotal: { amount: number; currency: Currency }
  }>
  total: { amount: number; currency: Currency }
  itemCount: number
  createdAt: string
  updatedAt: string
}

/**
 * GetCart presenter
 */
export type GetCartPresenter = Presenter<GetCartOutput> & {
  failedToRetrieveCart: (error: Error | string) => void
}

/**
 * GetCart use case factory
 *
 * Responsibilities:
 * - Validate input
 * - Retrieve cart from CartPort
 * - Verify user authorization (cart belongs to user)
 * - Present result via presenter
 */
// eslint-disable-next-line max-lines-per-function
export const getGetCartUseCase: UseCase<GetCartInput, GetCartPresenter, [CartPort, LoggerPort]> = (
  presenter,
  [cartPort, logger]
) => {
  return {
    // eslint-disable-next-line complexity
    handle: async (input: GetCartInput) => {
      try {
        // Note: Input validation is handled by Zod schema at handler level
        // userId is validated by JWT middleware

        // Create CartId value object - may throw for invalid UUID format
        let cartId: CartId
        try {
          cartId = CartId.from(input.cartId)
        } catch (validationError) {
          // CartId validation error (e.g., null UUID, invalid v4 format)
          presenter.badRequest(
            validationError instanceof Error ? validationError.message : 'Invalid cart ID'
          )
          return
        }

        // Retrieve cart
        const cart = await cartPort.findById(cartId)

        // Authorization: verify cart belongs to user
        if (cart.userId !== input.userId) {
          presenter.unauthorized('User is not authorized to access this cart')
          return
        }

        // Convert to output and present success
        const cartObject = cart.toObject()

        presenter.success({
          cartId: cartObject.cartId,
          userId: cartObject.userId,
          status: cartObject.status,
          currency: cartObject.currency,
          items: cartObject.items,
          total: cartObject.total,
          itemCount: cartObject.itemCount,
          createdAt: cartObject.createdAt,
          updatedAt: cartObject.updatedAt
        })
      } catch (error) {
        if (error instanceof CartNotFoundError) {
          presenter.notFound(error.message)
          return
        }

        // Log business context
        logger.error(
          'Failed to retrieve cart',
          { cartId: input.cartId, userId: input.userId },
          error instanceof Error ? error : undefined
        )
        // Let presenter handle error presentation (HTTP status, response format)
        presenter.failedToRetrieveCart(error instanceof Error ? error : 'Failed to retrieve cart')
      }
    }
  }
}
