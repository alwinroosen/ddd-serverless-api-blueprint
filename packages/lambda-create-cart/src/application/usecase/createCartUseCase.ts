import { Cart } from '@libs/cart-shared'
import type { CartPort, LoggerPort, Currency, CartStatus } from '@libs/cart-shared'
import type { Presenter, UseCase } from './types'

/**
 * CreateCart input data
 */
export type CreateCartInput = {
  userId: string
  currency?: Currency
}

/**
 * CreateCart output data
 */
export type CreateCartOutput = {
  cartId: string
  userId: string
  status: CartStatus
  currency: Currency
  items: []
  total: { amount: number; currency: Currency }
  itemCount: number
  createdAt: string
  updatedAt: string
}

/**
 * CreateCart presenter
 */
export type CreateCartPresenter = Presenter<CreateCartOutput> & {
  failedToCreateCart: (error: Error | string) => void
}

/**
 * CreateCart use case factory
 *
 * Responsibilities:
 * - Validate input
 * - Create new cart entity
 * - Persist cart via CartPort
 * - Present result via presenter
 */
export const getCreateCartUseCase: UseCase<
  CreateCartInput,
  CreateCartPresenter,
  [CartPort, LoggerPort]
> = (presenter, [cartPort, logger]) => {
  return {
    handle: async (input: CreateCartInput) => {
      try {
        // Create cart entity (domain logic)
        // Note: Input validation is handled by Zod schema at handler level
        const cart = Cart.create({
          userId: input.userId,
          currency: input.currency
        })

        // Persist cart
        const savedCart = await cartPort.save(cart)

        // Convert to output and present success
        const cartObject = savedCart.toObject()

        presenter.success({
          cartId: cartObject.cartId,
          userId: cartObject.userId,
          status: cartObject.status,
          currency: cartObject.currency,
          items: [],
          total: cartObject.total,
          itemCount: cartObject.itemCount,
          createdAt: cartObject.createdAt,
          updatedAt: cartObject.updatedAt
        })
      } catch (error) {
        // Log business context
        logger.error(
          'Failed to create cart',
          { userId: input.userId, currency: input.currency },
          error instanceof Error ? error : undefined
        )
        // Let presenter handle error presentation (HTTP status, response format)
        presenter.failedToCreateCart(error instanceof Error ? error : 'Failed to create cart')
      }
    }
  }
}
