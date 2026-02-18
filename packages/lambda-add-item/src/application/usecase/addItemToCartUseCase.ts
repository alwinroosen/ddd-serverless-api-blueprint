import {
  CartId,
  ProductId,
  Quantity,
  CartNotFoundError,
  ProductNotFoundError,
  ProductNotActiveError
} from '@libs/cart-shared'
import type { CartPort, ProductPort, LoggerPort, Currency, CartStatus } from '@libs/cart-shared'
import type { Presenter, UseCase } from './types'

/**
 * AddItemToCart input data
 *
 * SECURITY: Price and product name are fetched from backend, not accepted from client.
 * This prevents price manipulation attacks.
 */
export type AddItemToCartInput = {
  cartId: string
  userId: string
  productId: string
  quantity: number
}

/**
 * AddItemToCart output data
 */
export type AddItemToCartOutput = {
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
 * AddItemToCart presenter
 */
export type AddItemToCartPresenter = Presenter<AddItemToCartOutput> & {
  failedToAddItem: (error: Error | string) => void
}

/**
 * AddItemToCart use case factory
 *
 * Responsibilities:
 * - Validate input (minimal - most validation in domain layer)
 * - Fetch product details (name, price) from ProductPort (prevents price manipulation)
 * - Retrieve cart from CartPort
 * - Verify user authorization
 * - Add item to cart (domain logic)
 * - Persist updated cart
 * - Present result via presenter
 *
 * SECURITY:
 * - Product prices come from backend ProductPort, never from client request
 * - This prevents price manipulation attacks where client could set prices to $0.01
 */
export const getAddItemToCartUseCase: UseCase<
  AddItemToCartInput,
  AddItemToCartPresenter,
  [CartPort, ProductPort, LoggerPort]
  // eslint-disable-next-line max-lines-per-function
> = (presenter, [cartPort, productPort, logger]) => {
  return {
    // eslint-disable-next-line max-lines-per-function
    handle: async (input: AddItemToCartInput) => {
      try {
        // Create value objects from input (will throw domain errors if invalid)
        const cartId = CartId.from(input.cartId)
        const productId = ProductId.from(input.productId)
        const quantity = Quantity.from(input.quantity)

        // Fetch product details from backend (authoritative source for price/name)
        // This prevents clients from manipulating prices
        const product = await productPort.findById(productId)

        // Retrieve cart
        const cart = await cartPort.findById(cartId)

        // Authorization: verify cart belongs to user
        if (cart.userId !== input.userId) {
          presenter.unauthorized('User is not authorized to modify this cart')
          return
        }

        // Verify product currency matches cart currency
        if (product.price.currency !== cart.currency) {
          presenter.badRequest(
            `Product currency (${product.price.currency}) does not match cart currency (${cart.currency})`
          )
          return
        }

        // Add item to cart (domain logic - may throw domain errors)
        // Price comes from product entity (backend), not from client request
        const updatedCart = cart.addItem({
          productId,
          productName: product.name,
          quantity,
          unitPrice: product.price
        })

        // Persist updated cart
        const savedCart = await cartPort.save(updatedCart)

        // Convert to output and present success
        const cartObject = savedCart.toObject()

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

        if (error instanceof ProductNotFoundError) {
          presenter.notFound(error.message)
          return
        }

        if (error instanceof ProductNotActiveError) {
          presenter.badRequest(error.message)
          return
        }

        // Log business context
        logger.error(
          'Failed to add item to cart',
          {
            cartId: input.cartId,
            productId: input.productId,
            quantity: input.quantity,
            userId: input.userId
          },
          error instanceof Error ? error : undefined
        )
        // Let presenter handle error presentation (HTTP status, response format)
        presenter.failedToAddItem(error instanceof Error ? error : 'Failed to add item to cart')
      }
    }
  }
}
