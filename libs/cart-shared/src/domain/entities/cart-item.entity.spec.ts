import { CartItem, type CartItemProps } from './cart-item.entity'
import { ProductId } from '../value-objects/product-id.vo'
import { Quantity } from '../value-objects/quantity.vo'
import { Money } from '../value-objects/money.vo'
import { Currency } from '../types/cart.types'
import { InvalidCartItemError } from '../errors/cart.errors'

describe('CartItem', () => {
  const createValidProps = (): CartItemProps => ({
    productId: ProductId.from('PROD-123'),
    productName: 'Blue Widget',
    quantity: Quantity.from(2),
    unitPrice: Money.from(19.99, 'EUR')
  })

  describe('create', () => {
    it('should create a cart item with valid properties', () => {
      const props = createValidProps()
      const cartItem = CartItem.create(props)

      expect(cartItem.productId.value).toBe('PROD-123')
      expect(cartItem.productName).toBe('Blue Widget')
      expect(cartItem.quantity.value).toBe(2)
      expect(cartItem.unitPrice.amount).toBe(19.99)
    })

    it('should throw error for empty product name', () => {
      const props = {
        ...createValidProps(),
        productName: ''
      }

      expect(() => CartItem.create(props)).toThrow(InvalidCartItemError)
      expect(() => CartItem.create(props)).toThrow('Product name cannot be empty')
    })

    it('should throw error for whitespace-only product name', () => {
      const props = {
        ...createValidProps(),
        productName: '   '
      }

      expect(() => CartItem.create(props)).toThrow(InvalidCartItemError)
      expect(() => CartItem.create(props)).toThrow('Product name cannot be empty')
    })

    it('should throw error for product name exceeding 200 characters', () => {
      const props = {
        ...createValidProps(),
        productName: 'a'.repeat(201)
      }

      expect(() => CartItem.create(props)).toThrow(InvalidCartItemError)
      expect(() => CartItem.create(props)).toThrow('Product name cannot exceed 200 characters')
    })

    it('should accept product name exactly 200 characters', () => {
      const props = {
        ...createValidProps(),
        productName: 'a'.repeat(200)
      }

      const cartItem = CartItem.create(props)
      expect(cartItem.productName.length).toBe(200)
    })

    it('should throw error for zero unit price', () => {
      const props = {
        ...createValidProps(),
        unitPrice: Money.zero('EUR')
      }

      expect(() => CartItem.create(props)).toThrow(InvalidCartItemError)
      expect(() => CartItem.create(props)).toThrow('Unit price must be greater than zero')
    })
  })

  describe('getters', () => {
    it('should return product ID', () => {
      const cartItem = CartItem.create(createValidProps())

      expect(cartItem.productId.value).toBe('PROD-123')
    })

    it('should return product name', () => {
      const cartItem = CartItem.create(createValidProps())

      expect(cartItem.productName).toBe('Blue Widget')
    })

    it('should return quantity', () => {
      const cartItem = CartItem.create(createValidProps())

      expect(cartItem.quantity.value).toBe(2)
    })

    it('should return unit price', () => {
      const cartItem = CartItem.create(createValidProps())

      expect(cartItem.unitPrice.amount).toBe(19.99)
      expect(cartItem.unitPrice.currency).toBe('EUR')
    })
  })

  describe('lineTotal', () => {
    it('should calculate line total correctly', () => {
      const cartItem = CartItem.create(createValidProps())
      const lineTotal = cartItem.lineTotal

      expect(lineTotal.amount).toBe(39.98) // 2 × 19.99
      expect(lineTotal.currency).toBe('EUR')
    })

    it('should recalculate line total when quantity changes', () => {
      const cartItem = CartItem.create(createValidProps())
      const updatedItem = cartItem.updateQuantity(Quantity.from(5))

      expect(updatedItem.lineTotal.amount).toBe(99.95) // 5 × 19.99
    })

    it('should handle quantity of 1', () => {
      const props = {
        ...createValidProps(),
        quantity: Quantity.from(1)
      }
      const cartItem = CartItem.create(props)

      expect(cartItem.lineTotal.amount).toBe(19.99)
    })
  })

  describe('updateQuantity', () => {
    it('should return new cart item with updated quantity', () => {
      const cartItem = CartItem.create(createValidProps())
      const updatedItem = cartItem.updateQuantity(Quantity.from(5))

      expect(updatedItem.quantity.value).toBe(5)
      expect(updatedItem.productId.value).toBe(cartItem.productId.value)
      expect(updatedItem.productName).toBe(cartItem.productName)
    })

    it('should be immutable - original unchanged', () => {
      const cartItem = CartItem.create(createValidProps())
      const originalQuantity = cartItem.quantity.value

      cartItem.updateQuantity(Quantity.from(5))

      expect(cartItem.quantity.value).toBe(originalQuantity)
    })

    it('should maintain all other properties', () => {
      const cartItem = CartItem.create(createValidProps())
      const updatedItem = cartItem.updateQuantity(Quantity.from(10))

      expect(updatedItem.productId.value).toBe('PROD-123')
      expect(updatedItem.productName).toBe('Blue Widget')
      expect(updatedItem.unitPrice.amount).toBe(19.99)
    })
  })

  describe('increaseQuantity', () => {
    it('should increase quantity by given amount', () => {
      const cartItem = CartItem.create(createValidProps()) // quantity: 2
      const updatedItem = cartItem.increaseQuantity(Quantity.from(3))

      expect(updatedItem.quantity.value).toBe(5)
    })

    it('should be immutable - original unchanged', () => {
      const cartItem = CartItem.create(createValidProps())
      cartItem.increaseQuantity(Quantity.from(3))

      expect(cartItem.quantity.value).toBe(2)
    })
  })

  describe('decreaseQuantity', () => {
    it('should decrease quantity by given amount', () => {
      const props = {
        ...createValidProps(),
        quantity: Quantity.from(10)
      }
      const cartItem = CartItem.create(props)
      const updatedItem = cartItem.decreaseQuantity(Quantity.from(3))

      expect(updatedItem.quantity.value).toBe(7)
    })

    it('should throw error if result would be zero or negative', () => {
      const cartItem = CartItem.create(createValidProps()) // quantity: 2

      expect(() => cartItem.decreaseQuantity(Quantity.from(2))).toThrow()
      expect(() => cartItem.decreaseQuantity(Quantity.from(5))).toThrow()
    })

    it('should be immutable - original unchanged', () => {
      const props = {
        ...createValidProps(),
        quantity: Quantity.from(10)
      }
      const cartItem = CartItem.create(props)
      cartItem.decreaseQuantity(Quantity.from(3))

      expect(cartItem.quantity.value).toBe(10)
    })
  })

  describe('equals', () => {
    it('should return true for items with same product ID', () => {
      const item1 = CartItem.create(createValidProps())
      const item2 = CartItem.create({
        ...createValidProps(),
        quantity: Quantity.from(10), // Different quantity
        productName: 'Different Name' // Different name
      })

      expect(item1.equals(item2)).toBe(true)
    })

    it('should return false for items with different product IDs', () => {
      const item1 = CartItem.create(createValidProps())
      const item2 = CartItem.create({
        ...createValidProps(),
        productId: ProductId.from('PROD-456')
      })

      expect(item1.equals(item2)).toBe(false)
    })
  })

  describe('toObject', () => {
    it('should convert to plain object with all properties', () => {
      const cartItem = CartItem.create(createValidProps())
      const obj = cartItem.toObject()

      expect(obj).toEqual({
        productId: 'PROD-123',
        productName: 'Blue Widget',
        quantity: 2,
        unitPrice: { amount: 19.99, currency: 'EUR' },
        lineTotal: { amount: 39.98, currency: 'EUR' }
      })
    })

    it('should include calculated lineTotal', () => {
      const cartItem = CartItem.create(createValidProps())
      const obj = cartItem.toObject()

      expect(obj.lineTotal).toEqual({ amount: 39.98, currency: 'EUR' })
    })
  })
})
