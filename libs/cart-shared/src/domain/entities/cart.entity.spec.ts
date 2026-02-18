import { Cart, type CartProps } from './cart.entity'
import { CartItem, type CartItemProps } from './cart-item.entity'
import { CartId } from '../value-objects/cart-id.vo'
import { ProductId } from '../value-objects/product-id.vo'
import { Quantity } from '../value-objects/quantity.vo'
import { Money } from '../value-objects/money.vo'
import { CartStatus, Currency, DOMAIN_CONSTANTS } from '../types/cart.types'
import {
  InvalidCartError,
  CartNotActiveError,
  MaxCartItemsExceededError
} from '../errors/cart.errors'

describe('Cart', () => {
  const createItemProps = (overrides?: Partial<CartItemProps>): CartItemProps => ({
    productId: ProductId.from('PROD-123'),
    productName: 'Blue Widget',
    quantity: Quantity.from(2),
    unitPrice: Money.from(19.99, 'EUR'),
    ...overrides
  })

  describe('create', () => {
    it('should create a new active cart with default currency', () => {
      const cart = Cart.create({ userId: 'user-123' })

      expect(cart.userId).toBe('user-123')
      expect(cart.status).toBe('ACTIVE')
      expect(cart.currency).toBe('EUR')
      expect(cart.items.length).toBe(0)
      expect(cart.isEmpty).toBe(true)
    })

    it('should create cart with specified currency', () => {
      const cart = Cart.create({ userId: 'user-123', currency: 'USD' })

      expect(cart.currency).toBe('USD')
    })

    it('should generate unique cart ID', () => {
      const cart1 = Cart.create({ userId: 'user-123' })
      const cart2 = Cart.create({ userId: 'user-123' })

      expect(cart1.cartId.value).not.toBe(cart2.cartId.value)
    })

    it('should set createdAt and updatedAt to current time', () => {
      const before = new Date()
      const cart = Cart.create({ userId: 'user-123' })
      const after = new Date()

      expect(cart.createdAt.getTime()).toBeGreaterThanOrEqual(before.getTime())
      expect(cart.createdAt.getTime()).toBeLessThanOrEqual(after.getTime())
      expect(cart.updatedAt).toEqual(cart.createdAt)
    })
  })

  describe('fromProps', () => {
    it('should reconstitute cart from props', () => {
      const cartId = CartId.generate()
      const now = new Date()
      const props: CartProps = {
        cartId,
        userId: 'user-123',
        items: [],
        status: 'ACTIVE',
        currency: 'EUR',
        createdAt: now,
        updatedAt: now
      }

      const cart = Cart.fromProps(props)

      expect(cart.cartId.value).toBe(cartId.value)
      expect(cart.userId).toBe('user-123')
      expect(cart.status).toBe('ACTIVE')
    })
  })

  describe('validation', () => {
    it('should throw error for empty user ID', () => {
      expect(() =>
        Cart.fromProps({
          cartId: CartId.generate(),
          userId: '',
          items: [],
          status: 'ACTIVE',
          currency: 'EUR',
          createdAt: new Date(),
          updatedAt: new Date()
        })
      ).toThrow(InvalidCartError)
      expect(() =>
        Cart.fromProps({
          cartId: CartId.generate(),
          userId: '  ',
          items: [],
          status: 'ACTIVE',
          currency: 'EUR',
          createdAt: new Date(),
          updatedAt: new Date()
        })
      ).toThrow('User ID is required')
    })

    it('should throw error when items exceed maximum', () => {
      const items = Array.from({ length: DOMAIN_CONSTANTS.MAX_CART_ITEMS + 1 }, (_, i) =>
        CartItem.create({
          productId: ProductId.from(`PROD-${i}`),
          productName: 'Product',
          quantity: Quantity.from(1),
          unitPrice: Money.from(10, 'EUR')
        })
      )

      expect(() =>
        Cart.fromProps({
          cartId: CartId.generate(),
          userId: 'user-123',
          items,
          status: 'ACTIVE',
          currency: 'EUR',
          createdAt: new Date(),
          updatedAt: new Date()
        })
      ).toThrow(InvalidCartError)
      expect(() =>
        Cart.fromProps({
          cartId: CartId.generate(),
          userId: 'user-123',
          items,
          status: 'ACTIVE',
          currency: 'EUR',
          createdAt: new Date(),
          updatedAt: new Date()
        })
      ).toThrow(`Cart cannot have more than ${DOMAIN_CONSTANTS.MAX_CART_ITEMS} items`)
    })

    it('should throw error when items have different currency than cart', () => {
      const items = [
        CartItem.create({
          productId: ProductId.from('PROD-1'),
          productName: 'Product',
          quantity: Quantity.from(1),
          unitPrice: Money.from(10, 'USD') // Different from cart currency
        })
      ]

      expect(() =>
        Cart.fromProps({
          cartId: CartId.generate(),
          userId: 'user-123',
          items,
          status: 'ACTIVE',
          currency: 'EUR',
          createdAt: new Date(),
          updatedAt: new Date()
        })
      ).toThrow(InvalidCartError)
      expect(() =>
        Cart.fromProps({
          cartId: CartId.generate(),
          userId: 'user-123',
          items,
          status: 'ACTIVE',
          currency: 'EUR',
          createdAt: new Date(),
          updatedAt: new Date()
        })
      ).toThrow('All items must have the same currency as the cart')
    })
  })

  describe('getters', () => {
    it('should return cart properties', () => {
      const cart = Cart.create({ userId: 'user-123', currency: 'USD' })

      expect(cart.userId).toBe('user-123')
      expect(cart.currency).toBe('USD')
      expect(cart.status).toBe('ACTIVE')
      expect(cart.isActive).toBe(true)
    })

    it('should return readonly array of items', () => {
      const cart = Cart.create({ userId: 'user-123' })
      const updatedCart = cart.addItem(createItemProps())

      const items = updatedCart.items
      expect(items.length).toBe(1)
    })
  })

  describe('total', () => {
    it('should return zero for empty cart', () => {
      const cart = Cart.create({ userId: 'user-123' })

      expect(cart.total.amount).toBe(0)
      expect(cart.total.currency).toBe('EUR')
    })

    it('should calculate total from all items', () => {
      let cart = Cart.create({ userId: 'user-123' })
      cart = cart.addItem(
        createItemProps({ unitPrice: Money.from(10, 'EUR'), quantity: Quantity.from(2) })
      )
      cart = cart.addItem(
        createItemProps({
          productId: ProductId.from('PROD-456'),
          unitPrice: Money.from(5, 'EUR'),
          quantity: Quantity.from(3)
        })
      )

      expect(cart.total.amount).toBe(35) // (10 × 2) + (5 × 3)
    })

    it('should handle very large totals without precision loss', () => {
      // Test with large prices to ensure no overflow or precision issues
      let cart = Cart.create({ userId: 'user-123' })
      cart = cart.addItem(
        createItemProps({
          productId: ProductId.from('PROD-EXPENSIVE-1'),
          unitPrice: Money.from(999999.99, 'EUR'),
          quantity: Quantity.from(5)
        })
      )
      cart = cart.addItem(
        createItemProps({
          productId: ProductId.from('PROD-EXPENSIVE-2'),
          unitPrice: Money.from(500000, 'EUR'),
          quantity: Quantity.from(3)
        })
      )

      // Total: (999999.99 × 5) + (500000 × 3) = 4999999.95 + 1500000 = 6499999.95
      expect(cart.total.amount).toBe(6499999.95)
      expect(cart.total.amountInCents).toBe(649999995)
    })
  })

  describe('itemCount', () => {
    it('should return 0 for empty cart', () => {
      const cart = Cart.create({ userId: 'user-123' })

      expect(cart.itemCount).toBe(0)
    })

    it('should return sum of all item quantities', () => {
      let cart = Cart.create({ userId: 'user-123' })
      cart = cart.addItem(createItemProps({ quantity: Quantity.from(2) }))
      cart = cart.addItem(
        createItemProps({ productId: ProductId.from('PROD-456'), quantity: Quantity.from(3) })
      )

      expect(cart.itemCount).toBe(5) // 2 + 3
    })
  })

  describe('isEmpty', () => {
    it('should return true for cart with no items', () => {
      const cart = Cart.create({ userId: 'user-123' })

      expect(cart.isEmpty).toBe(true)
    })

    it('should return false for cart with items', () => {
      let cart = Cart.create({ userId: 'user-123' })
      cart = cart.addItem(createItemProps())

      expect(cart.isEmpty).toBe(false)
    })
  })

  describe('isActive', () => {
    it('should return true for active cart', () => {
      const cart = Cart.create({ userId: 'user-123' })

      expect(cart.isActive).toBe(true)
    })

    it('should return false for abandoned cart', () => {
      const cart = Cart.create({ userId: 'user-123' })
      const abandonedCart = cart.abandon()

      expect(abandonedCart.isActive).toBe(false)
    })

    it('should return false for checked out cart', () => {
      let cart = Cart.create({ userId: 'user-123' })
      cart = cart.addItem(createItemProps())
      const checkedOutCart = cart.checkout()

      expect(checkedOutCart.isActive).toBe(false)
    })
  })

  describe('addItem', () => {
    it('should add item to empty cart', () => {
      const cart = Cart.create({ userId: 'user-123' })
      const updatedCart = cart.addItem(createItemProps())

      expect(updatedCart.items.length).toBe(1)
      expect(updatedCart.items[0]!.productId.value).toBe('PROD-123')
    })

    it('should merge items with same product ID', () => {
      const cart = Cart.create({ userId: 'user-123' })
      const itemProps = createItemProps({ quantity: Quantity.from(2) })

      const cart1 = cart.addItem(itemProps)
      const cart2 = cart1.addItem(itemProps)

      expect(cart2.items.length).toBe(1)
      expect(cart2.items[0]!.quantity.value).toBe(4) // 2 + 2
    })

    it('should add different items separately', () => {
      let cart = Cart.create({ userId: 'user-123' })
      cart = cart.addItem(createItemProps({ productId: ProductId.from('PROD-1') }))
      cart = cart.addItem(createItemProps({ productId: ProductId.from('PROD-2') }))

      expect(cart.items.length).toBe(2)
    })

    it('should update updatedAt timestamp', () => {
      const cart = Cart.create({ userId: 'user-123' })
      const originalUpdatedAt = cart.updatedAt

      // Small delay to ensure timestamp difference
      const updatedCart = cart.addItem(createItemProps())

      expect(updatedCart.updatedAt.getTime()).toBeGreaterThanOrEqual(originalUpdatedAt.getTime())
    })

    it('should throw error when cart is not active', () => {
      const cart = Cart.create({ userId: 'user-123' })
      const abandonedCart = cart.abandon()

      expect(() => abandonedCart.addItem(createItemProps())).toThrow(CartNotActiveError)
    })

    it('should throw error when item currency does not match cart currency', () => {
      const cart = Cart.create({ userId: 'user-123', currency: 'EUR' })
      const itemProps = createItemProps({ unitPrice: Money.from(10, 'USD') })

      expect(() => cart.addItem(itemProps)).toThrow(InvalidCartError)
      expect(() => cart.addItem(itemProps)).toThrow('Item currency must match cart currency')
    })

    it('should throw error when adding would exceed max items', () => {
      let cart = Cart.create({ userId: 'user-123' })

      // Add max items
      for (let i = 0; i < DOMAIN_CONSTANTS.MAX_CART_ITEMS; i++) {
        cart = cart.addItem(
          createItemProps({
            productId: ProductId.from(`PROD-${i}`),
            quantity: Quantity.from(1)
          })
        )
      }

      // Try to add one more
      expect(() =>
        cart.addItem(createItemProps({ productId: ProductId.from('PROD-EXTRA') }))
      ).toThrow(MaxCartItemsExceededError)
    })

    it('should successfully add exactly MAX_CART_ITEMS items (boundary test)', () => {
      let cart = Cart.create({ userId: 'user-123' })

      // Add exactly MAX_CART_ITEMS (100) items - this should succeed
      for (let i = 0; i < DOMAIN_CONSTANTS.MAX_CART_ITEMS; i++) {
        cart = cart.addItem(
          createItemProps({
            productId: ProductId.from(`PROD-${i}`),
            quantity: Quantity.from(1),
            unitPrice: Money.from(1, 'EUR')
          })
        )
      }

      expect(cart.items.length).toBe(DOMAIN_CONSTANTS.MAX_CART_ITEMS)
      expect(cart.itemCount).toBe(DOMAIN_CONSTANTS.MAX_CART_ITEMS)
    })

    it('should be immutable - original cart unchanged', () => {
      const cart = Cart.create({ userId: 'user-123' })
      cart.addItem(createItemProps())

      expect(cart.items.length).toBe(0)
    })
  })

  describe('removeItem', () => {
    it('should remove item from cart', () => {
      let cart = Cart.create({ userId: 'user-123' })
      cart = cart.addItem(createItemProps())

      const updatedCart = cart.removeItem(ProductId.from('PROD-123'))

      expect(updatedCart.items.length).toBe(0)
    })

    it('should throw error when cart is not active', () => {
      let cart = Cart.create({ userId: 'user-123' })
      cart = cart.addItem(createItemProps())
      const abandonedCart = cart.abandon()

      expect(() => abandonedCart.removeItem(ProductId.from('PROD-123'))).toThrow(CartNotActiveError)
    })

    it('should throw error when item not found', () => {
      const cart = Cart.create({ userId: 'user-123' })

      expect(() => cart.removeItem(ProductId.from('PROD-999'))).toThrow(InvalidCartError)
      expect(() => cart.removeItem(ProductId.from('PROD-999'))).toThrow('Item not found in cart')
    })

    it('should be immutable - original cart unchanged', () => {
      let cart = Cart.create({ userId: 'user-123' })
      cart = cart.addItem(createItemProps())

      cart.removeItem(ProductId.from('PROD-123'))

      expect(cart.items.length).toBe(1)
    })
  })

  describe('updateItemQuantity', () => {
    it('should update item quantity', () => {
      let cart = Cart.create({ userId: 'user-123' })
      cart = cart.addItem(createItemProps({ quantity: Quantity.from(2) }))

      const updatedCart = cart.updateItemQuantity(ProductId.from('PROD-123'), Quantity.from(5))

      expect(updatedCart.items[0]!.quantity.value).toBe(5)
    })

    it('should throw error when cart is not active', () => {
      let cart = Cart.create({ userId: 'user-123' })
      cart = cart.addItem(createItemProps())
      const abandonedCart = cart.abandon()

      expect(() =>
        abandonedCart.updateItemQuantity(ProductId.from('PROD-123'), Quantity.from(5))
      ).toThrow(CartNotActiveError)
    })

    it('should throw error when item not found', () => {
      const cart = Cart.create({ userId: 'user-123' })

      expect(() => cart.updateItemQuantity(ProductId.from('PROD-999'), Quantity.from(5))).toThrow(
        InvalidCartError
      )
    })

    it('should be immutable - original cart unchanged', () => {
      let cart = Cart.create({ userId: 'user-123' })
      cart = cart.addItem(createItemProps({ quantity: Quantity.from(2) }))

      cart.updateItemQuantity(ProductId.from('PROD-123'), Quantity.from(5))

      expect(cart.items[0]!.quantity.value).toBe(2)
    })
  })

  describe('clearItems', () => {
    it('should remove all items from cart', () => {
      let cart = Cart.create({ userId: 'user-123' })
      cart = cart.addItem(createItemProps({ productId: ProductId.from('PROD-1') }))
      cart = cart.addItem(createItemProps({ productId: ProductId.from('PROD-2') }))

      const clearedCart = cart.clearItems()

      expect(clearedCart.items.length).toBe(0)
      expect(clearedCart.isEmpty).toBe(true)
    })

    it('should throw error when cart is not active', () => {
      const cart = Cart.create({ userId: 'user-123' })
      const abandonedCart = cart.abandon()

      expect(() => abandonedCart.clearItems()).toThrow(CartNotActiveError)
    })
  })

  describe('abandon', () => {
    it('should change status to Abandoned', () => {
      const cart = Cart.create({ userId: 'user-123' })
      const abandonedCart = cart.abandon()

      expect(abandonedCart.status).toBe('ABANDONED')
      expect(abandonedCart.isActive).toBe(false)
    })

    it('should update updatedAt timestamp', () => {
      const cart = Cart.create({ userId: 'user-123' })
      const originalUpdatedAt = cart.updatedAt

      const abandonedCart = cart.abandon()

      expect(abandonedCart.updatedAt.getTime()).toBeGreaterThanOrEqual(originalUpdatedAt.getTime())
    })

    it('should be immutable - original cart unchanged', () => {
      const cart = Cart.create({ userId: 'user-123' })
      cart.abandon()

      expect(cart.status).toBe('ACTIVE')
    })
  })

  describe('checkout', () => {
    it('should change status to CheckedOut', () => {
      let cart = Cart.create({ userId: 'user-123' })
      cart = cart.addItem(createItemProps())

      const checkedOutCart = cart.checkout()

      expect(checkedOutCart.status).toBe('CHECKED_OUT')
      expect(checkedOutCart.isActive).toBe(false)
    })

    it('should throw error for empty cart', () => {
      const cart = Cart.create({ userId: 'user-123' })

      expect(() => cart.checkout()).toThrow(InvalidCartError)
      expect(() => cart.checkout()).toThrow('Cannot checkout empty cart')
    })

    it('should update updatedAt timestamp', () => {
      let cart = Cart.create({ userId: 'user-123' })
      cart = cart.addItem(createItemProps())
      const originalUpdatedAt = cart.updatedAt

      const checkedOutCart = cart.checkout()

      expect(checkedOutCart.updatedAt.getTime()).toBeGreaterThanOrEqual(originalUpdatedAt.getTime())
    })

    it('should be immutable - original cart unchanged', () => {
      let cart = Cart.create({ userId: 'user-123' })
      cart = cart.addItem(createItemProps())

      cart.checkout()

      expect(cart.status).toBe('ACTIVE')
    })
  })

  describe('toObject', () => {
    it('should convert to plain object', () => {
      let cart = Cart.create({ userId: 'user-123', currency: 'EUR' })
      cart = cart.addItem(
        createItemProps({ quantity: Quantity.from(2), unitPrice: Money.from(10, 'EUR') })
      )

      const obj = cart.toObject()

      expect(obj.userId).toBe('user-123')
      expect(obj.status).toBe('ACTIVE')
      expect(obj.currency).toBe('EUR')
      expect(obj.items.length).toBe(1)
      expect(obj.total).toEqual({ amount: 20, currency: 'EUR' })
      expect(obj.itemCount).toBe(2)
      expect(typeof obj.createdAt).toBe('string')
      expect(typeof obj.updatedAt).toBe('string')
    })
  })
})
