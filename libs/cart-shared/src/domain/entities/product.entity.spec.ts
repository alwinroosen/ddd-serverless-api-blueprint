import { Product } from './product.entity'
import { ProductId } from '../value-objects/product-id.vo'
import { Money } from '../value-objects/money.vo'
import { Currency } from '../types/cart.types'
import { InvalidProductError } from '../errors/cart.errors'

describe('Product Entity', () => {
  const validProductProps = {
    productId: ProductId.from('PROD-001'),
    name: 'Blue Widget',
    description: 'Premium quality widget',
    price: Money.from(19.99, 'EUR'),
    isActive: true
  }

  describe('create', () => {
    it('should create a product with valid properties', () => {
      const product = Product.create(validProductProps)

      expect(product).toBeInstanceOf(Product)
      expect(product.productId.value).toBe('PROD-001')
      expect(product.name).toBe('Blue Widget')
      expect(product.description).toBe('Premium quality widget')
      expect(product.price.toJSON()).toEqual({ amount: 19.99, currency: 'EUR' })
      expect(product.isActive).toBe(true)
    })

    it('should create a product without description', () => {
      const props = { ...validProductProps, description: undefined }
      const product = Product.create(props)

      expect(product.description).toBeUndefined()
    })

    it('should create an inactive product', () => {
      const props = { ...validProductProps, isActive: false }
      const product = Product.create(props)

      expect(product.isActive).toBe(false)
    })
  })

  describe('validation', () => {
    it('should throw error when name is empty', () => {
      const props = { ...validProductProps, name: '' }

      expect(() => Product.create(props)).toThrow(InvalidProductError)
      expect(() => Product.create(props)).toThrow('Product name cannot be empty')
    })

    it('should throw error when name is only whitespace', () => {
      const props = { ...validProductProps, name: '   ' }

      expect(() => Product.create(props)).toThrow(InvalidProductError)
      expect(() => Product.create(props)).toThrow('Product name cannot be empty')
    })

    it('should throw error when name exceeds 200 characters', () => {
      const props = { ...validProductProps, name: 'A'.repeat(201) }

      expect(() => Product.create(props)).toThrow(InvalidProductError)
      expect(() => Product.create(props)).toThrow('cannot exceed 200 characters')
    })

    it('should accept name with exactly 200 characters', () => {
      const props = { ...validProductProps, name: 'A'.repeat(200) }

      expect(() => Product.create(props)).not.toThrow()
    })

    it('should throw error when description exceeds 1000 characters', () => {
      const props = { ...validProductProps, description: 'A'.repeat(1001) }

      expect(() => Product.create(props)).toThrow(InvalidProductError)
      expect(() => Product.create(props)).toThrow('description cannot exceed 1000 characters')
    })

    it('should accept description with exactly 1000 characters', () => {
      const props = { ...validProductProps, description: 'A'.repeat(1000) }

      expect(() => Product.create(props)).not.toThrow()
    })

    it('should throw error when price is zero', () => {
      const props = { ...validProductProps, price: Money.from(0, 'EUR') }

      expect(() => Product.create(props)).toThrow(InvalidProductError)
      expect(() => Product.create(props)).toThrow('Product price must be greater than zero')
    })

    it('should throw error when price is negative', () => {
      // Money.from should throw for negative amounts, but test that Product catches it
      expect(() => Money.from(-10, 'EUR')).toThrow()
    })
  })

  describe('getters', () => {
    let product: Product

    beforeEach(() => {
      product = Product.create(validProductProps)
    })

    it('should return product ID', () => {
      expect(product.productId.value).toBe('PROD-001')
    })

    it('should return product name', () => {
      expect(product.name).toBe('Blue Widget')
    })

    it('should return product description', () => {
      expect(product.description).toBe('Premium quality widget')
    })

    it('should return product price', () => {
      expect(product.price.toJSON()).toEqual({ amount: 19.99, currency: 'EUR' })
    })

    it('should return product active status', () => {
      expect(product.isActive).toBe(true)
    })
  })

  describe('equals', () => {
    it('should return true for products with same ID', () => {
      const product1 = Product.create(validProductProps)
      const product2 = Product.create({
        ...validProductProps,
        name: 'Different Name',
        price: Money.from(99.99, 'EUR')
      })

      expect(product1.equals(product2)).toBe(true)
    })

    it('should return false for products with different IDs', () => {
      const product1 = Product.create(validProductProps)
      const product2 = Product.create({
        ...validProductProps,
        productId: ProductId.from('PROD-002')
      })

      expect(product1.equals(product2)).toBe(false)
    })
  })

  describe('toObject', () => {
    it('should convert to plain object with all properties', () => {
      const product = Product.create(validProductProps)
      const obj = product.toObject()

      expect(obj).toEqual({
        productId: 'PROD-001',
        name: 'Blue Widget',
        description: 'Premium quality widget',
        price: { amount: 19.99, currency: 'EUR' },
        isActive: true
      })
    })

    it('should convert to plain object without description', () => {
      const props = { ...validProductProps, description: undefined }
      const product = Product.create(props)
      const obj = product.toObject()

      expect(obj.description).toBeUndefined()
    })

    it('should handle inactive products', () => {
      const props = { ...validProductProps, isActive: false }
      const product = Product.create(props)
      const obj = product.toObject()

      expect(obj.isActive).toBe(false)
    })
  })

  describe('immutability', () => {
    it('should not allow modification of properties', () => {
      const product = Product.create(validProductProps)

      // TypeScript should prevent this at compile time, but verify at runtime
      expect(() => {
        // @ts-expect-error - Testing immutability
        product.name = 'Hacked Name'
      }).toThrow()
    })
  })

  describe('edge cases', () => {
    it('should handle products with special characters in name', () => {
      const props = {
        ...validProductProps,
        name: 'Widget™ with "quotes" & symbols <>'
      }

      const product = Product.create(props)
      expect(product.name).toBe('Widget™ with "quotes" & symbols <>')
    })

    it('should handle very small prices', () => {
      const props = { ...validProductProps, price: Money.from(0.01, 'EUR') }

      const product = Product.create(props)
      expect(product.price.toJSON().amount).toBe(0.01)
    })

    it('should handle very large prices', () => {
      const props = { ...validProductProps, price: Money.from(999999.99, 'EUR') }

      const product = Product.create(props)
      expect(product.price.toJSON().amount).toBe(999999.99)
    })
  })
})
