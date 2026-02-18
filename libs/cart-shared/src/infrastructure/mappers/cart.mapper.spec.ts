import { CartMapper, type DynamoDBCartItem } from './cart.mapper'
import {
  Cart,
  CartItem,
  CartId,
  ProductId,
  Quantity,
  Money,
  CartStatus,
  Currency
} from '../../domain'

describe('CartMapper', () => {
  const createTestCart = (): Cart => {
    let cart = Cart.create({ userId: 'user-123', currency: 'EUR' })
    cart = cart.addItem({
      productId: ProductId.from('PROD-123'),
      productName: 'Blue Widget',
      quantity: Quantity.from(2),
      unitPrice: Money.from(19.99, 'EUR')
    })
    return cart
  }

  const createTestDynamoDBItem = (overrides?: Partial<DynamoDBCartItem>): DynamoDBCartItem => ({
    PK: 'CART#123e4567-e89b-42d3-a456-426614174000',
    SK: 'METADATA',
    cartId: '123e4567-e89b-42d3-a456-426614174000',
    userId: 'user-123',
    status: 'ACTIVE',
    currency: 'EUR',
    items: [
      {
        productId: 'PROD-123',
        productName: 'Blue Widget',
        quantity: 2,
        unitPrice: {
          amount: 19.99,
          currency: 'EUR'
        }
      }
    ],
    createdAt: '2024-01-15T10:00:00.000Z',
    updatedAt: '2024-01-15T10:00:00.000Z',
    GSI1PK: 'USER#user-123',
    GSI1SK: 'CART#2024-01-15T10:00:00.000Z',
    entityType: 'CART',
    ...overrides
  })

  describe('toDynamoDB', () => {
    it('should convert Cart to DynamoDB item with correct structure', () => {
      const cart = createTestCart()
      const dynamoItem = CartMapper.toDynamoDB(cart)

      expect(dynamoItem.PK).toMatch(/^CART#[0-9a-f-]{36}$/)
      expect(dynamoItem.SK).toBe('METADATA')
      expect(dynamoItem.cartId).toBe(cart.cartId.value)
      expect(dynamoItem.userId).toBe('user-123')
      expect(dynamoItem.status).toBe('ACTIVE')
      expect(dynamoItem.currency).toBe('EUR')
      expect(dynamoItem.entityType).toBe('CART')
    })

    it('should map cart items correctly', () => {
      const cart = createTestCart()
      const dynamoItem = CartMapper.toDynamoDB(cart)

      expect(dynamoItem.items.length).toBe(1)
      expect(dynamoItem.items[0]).toEqual({
        productId: 'PROD-123',
        productName: 'Blue Widget',
        quantity: 2,
        unitPrice: {
          amount: 19.99,
          currency: 'EUR'
        }
      })
    })

    it('should create correct GSI keys', () => {
      const cart = createTestCart()
      const dynamoItem = CartMapper.toDynamoDB(cart)

      expect(dynamoItem.GSI1PK).toBe('USER#user-123')
      expect(dynamoItem.GSI1SK).toMatch(/^CART#\d{4}-\d{2}-\d{2}T/)
    })

    it('should convert timestamps to ISO strings', () => {
      const cart = createTestCart()
      const dynamoItem = CartMapper.toDynamoDB(cart)

      expect(typeof dynamoItem.createdAt).toBe('string')
      expect(typeof dynamoItem.updatedAt).toBe('string')
      expect(dynamoItem.createdAt).toMatch(/^\d{4}-\d{2}-\d{2}T/)
      expect(dynamoItem.updatedAt).toMatch(/^\d{4}-\d{2}-\d{2}T/)
    })

    it('should handle empty cart', () => {
      const cart = Cart.create({ userId: 'user-123' })
      const dynamoItem = CartMapper.toDynamoDB(cart)

      expect(dynamoItem.items).toEqual([])
      expect(dynamoItem.status).toBe('ACTIVE')
    })

    it('should handle different cart statuses', () => {
      let cart = createTestCart()
      cart = cart.abandon()
      const dynamoItem = CartMapper.toDynamoDB(cart)

      expect(dynamoItem.status).toBe('ABANDONED')
    })

    it('should handle different currencies', () => {
      let cart = Cart.create({ userId: 'user-123', currency: 'USD' })
      cart = cart.addItem({
        productId: ProductId.from('PROD-123'),
        productName: 'Product',
        quantity: Quantity.from(1),
        unitPrice: Money.from(10, 'USD')
      })
      const dynamoItem = CartMapper.toDynamoDB(cart)

      expect(dynamoItem.currency).toBe('USD')
      expect(dynamoItem.items[0]!.unitPrice.currency).toBe('USD')
    })
  })

  describe('toDomain', () => {
    it('should convert DynamoDB item to Cart entity', () => {
      const dynamoItem = createTestDynamoDBItem()
      const cart = CartMapper.toDomain(dynamoItem)

      expect(cart.cartId.value).toBe('123e4567-e89b-42d3-a456-426614174000')
      expect(cart.userId).toBe('user-123')
      expect(cart.status).toBe('ACTIVE')
      expect(cart.currency).toBe('EUR')
    })

    it('should reconstruct cart items correctly', () => {
      const dynamoItem = createTestDynamoDBItem()
      const cart = CartMapper.toDomain(dynamoItem)

      expect(cart.items.length).toBe(1)
      expect(cart.items[0]!.productId.value).toBe('PROD-123')
      expect(cart.items[0]!.productName).toBe('Blue Widget')
      expect(cart.items[0]!.quantity.value).toBe(2)
      expect(cart.items[0]!.unitPrice.amount).toBe(19.99)
    })

    it('should parse timestamps correctly', () => {
      const dynamoItem = createTestDynamoDBItem({
        createdAt: '2024-01-15T10:00:00.000Z',
        updatedAt: '2024-01-15T11:00:00.000Z'
      })
      const cart = CartMapper.toDomain(dynamoItem)

      expect(cart.createdAt.toISOString()).toBe('2024-01-15T10:00:00.000Z')
      expect(cart.updatedAt.toISOString()).toBe('2024-01-15T11:00:00.000Z')
    })

    it('should handle empty items array', () => {
      const dynamoItem = createTestDynamoDBItem({ items: [] })
      const cart = CartMapper.toDomain(dynamoItem)

      expect(cart.items.length).toBe(0)
      expect(cart.isEmpty).toBe(true)
    })

    it('should handle different statuses', () => {
      const dynamoItem = createTestDynamoDBItem({ status: 'ABANDONED' })
      const cart = CartMapper.toDomain(dynamoItem)

      expect(cart.status).toBe('ABANDONED')
      expect(cart.isActive).toBe(false)
    })

    it('should handle different currencies', () => {
      const dynamoItem = createTestDynamoDBItem({
        currency: 'USD',
        items: [
          {
            productId: 'PROD-123',
            productName: 'Product',
            quantity: 1,
            unitPrice: { amount: 10, currency: 'USD' }
          }
        ]
      })
      const cart = CartMapper.toDomain(dynamoItem)

      expect(cart.currency).toBe('USD')
      expect(cart.items[0]!.unitPrice.currency).toBe('USD')
    })

    it('should handle multiple items', () => {
      const dynamoItem = createTestDynamoDBItem({
        items: [
          {
            productId: 'PROD-1',
            productName: 'Product 1',
            quantity: 2,
            unitPrice: { amount: 10, currency: 'EUR' }
          },
          {
            productId: 'PROD-2',
            productName: 'Product 2',
            quantity: 3,
            unitPrice: { amount: 20, currency: 'EUR' }
          }
        ]
      })
      const cart = CartMapper.toDomain(dynamoItem)

      expect(cart.items.length).toBe(2)
      expect(cart.itemCount).toBe(5) // 2 + 3
      expect(cart.total.amount).toBe(80) // (2 * 10) + (3 * 20)
    })
  })

  describe('roundtrip mapping', () => {
    it('should preserve cart data through roundtrip conversion', () => {
      const originalCart = createTestCart()
      const dynamoItem = CartMapper.toDynamoDB(originalCart)
      const reconstructedCart = CartMapper.toDomain(dynamoItem)

      expect(reconstructedCart.cartId.value).toBe(originalCart.cartId.value)
      expect(reconstructedCart.userId).toBe(originalCart.userId)
      expect(reconstructedCart.status).toBe(originalCart.status)
      expect(reconstructedCart.currency).toBe(originalCart.currency)
      expect(reconstructedCart.items.length).toBe(originalCart.items.length)
      expect(reconstructedCart.total.amount).toBe(originalCart.total.amount)
    })
  })

  describe('createKey', () => {
    it('should create correct DynamoDB key', () => {
      const cartId = CartId.from('123e4567-e89b-42d3-a456-426614174000')
      const key = CartMapper.createKey(cartId)

      expect(key).toEqual({
        PK: 'CART#123e4567-e89b-42d3-a456-426614174000',
        SK: 'METADATA'
      })
    })

    it('should handle different cart IDs', () => {
      const cartId1 = CartId.generate()
      const cartId2 = CartId.generate()

      const key1 = CartMapper.createKey(cartId1)
      const key2 = CartMapper.createKey(cartId2)

      expect(key1.PK).not.toBe(key2.PK)
      expect(key1.PK).toMatch(/^CART#/)
      expect(key2.PK).toMatch(/^CART#/)
    })
  })

  describe('createUserIndexKey', () => {
    it('should create correct GSI key', () => {
      const key = CartMapper.createUserIndexKey('user-123')

      expect(key).toEqual({
        GSI1PK: 'USER#user-123'
      })
    })

    it('should handle different user IDs', () => {
      const key1 = CartMapper.createUserIndexKey('user-1')
      const key2 = CartMapper.createUserIndexKey('user-2')

      expect(key1.GSI1PK).toBe('USER#user-1')
      expect(key2.GSI1PK).toBe('USER#user-2')
      expect(key1.GSI1PK).not.toBe(key2.GSI1PK)
    })
  })
})
