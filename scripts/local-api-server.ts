#!/usr/bin/env tsx
import express, { Request, Response, NextFunction } from 'express'
import { APIGatewayProxyEvent, APIGatewayProxyResult, Context } from 'aws-lambda'
import cors from 'cors'

/**
 * Local API Gateway Simulator
 *
 * Runs a local Express server that simulates AWS API Gateway,
 * allowing you to test Lambda functions via HTTP requests (e.g., Postman).
 *
 * Features:
 * - Converts HTTP requests to API Gateway events
 * - Handles CORS for frontend development
 * - Supports path parameters, query strings, headers
 * - Mock JWT authentication for local testing
 *
 * Usage:
 *   npm run local:api
 *
 * Then test with Postman:
 *   POST http://localhost:3000/api/v1/cart
 *   GET http://localhost:3000/api/v1/cart/:id
 *   POST http://localhost:3000/api/v1/cart/:id/items
 */

const PORT = process.env.PORT || 3000
const API_BASE_PATH = '/api/v1'

// Set environment variables for local development
process.env.DYNAMODB_TABLE_NAME = process.env.DYNAMODB_TABLE_NAME || 'serverless-api-local'
process.env.AWS_REGION = process.env.AWS_REGION || 'us-east-1'
process.env.DYNAMODB_ENDPOINT = process.env.DYNAMODB_ENDPOINT || 'http://localhost:8000'
process.env.AWS_ACCESS_KEY_ID = process.env.AWS_ACCESS_KEY_ID || 'local'
process.env.AWS_SECRET_ACCESS_KEY = process.env.AWS_SECRET_ACCESS_KEY || 'local'
process.env.NODE_ENV = 'local'

// Disable JWT verification for local development (uses mock payload)
process.env.DISABLE_JWT_VERIFICATION = process.env.DISABLE_JWT_VERIFICATION || 'true'

// Mock Cognito config (required even though verification is disabled)
process.env.COGNITO_USER_POOL_ID = process.env.COGNITO_USER_POOL_ID || 'us-east-1_local'
process.env.COGNITO_CLIENT_ID = process.env.COGNITO_CLIENT_ID || 'local-client-id'

// Mock JWT settings (for local development only)
const MOCK_JWT_ENABLED = process.env.MOCK_JWT_ENABLED !== 'false'
const MOCK_USER_ID = process.env.MOCK_USER_ID || 'test-user-123'

// Dynamically import Lambda handlers
let createCartHandler: any
let getCartHandler: any
let addItemHandler: any

async function loadHandlers() {
  try {
    // Import compiled Lambda handlers
    const createCartModule = await import('../packages/lambda-create-cart/dist/index.js')
    const getCartModule = await import('../packages/lambda-get-cart/dist/index.js')
    const addItemModule = await import('../packages/lambda-add-item/dist/index.js')

    createCartHandler = createCartModule.handler
    getCartHandler = getCartModule.handler
    addItemHandler = addItemModule.handler

    console.log('✅ Lambda handlers loaded successfully')
  } catch (error) {
    console.error('❌ Failed to load Lambda handlers. Did you run `npm run build`?')
    console.error(error)
    process.exit(1)
  }
}

/**
 * Convert Express request to API Gateway Lambda event
 */
function createApiGatewayEvent(req: Request, pathParams: Record<string, string> = {}): APIGatewayProxyEvent {
  // Extract headers
  const headers: Record<string, string> = {}
  Object.entries(req.headers).forEach(([key, value]) => {
    if (typeof value === 'string') {
      headers[key] = value
    } else if (Array.isArray(value)) {
      headers[key] = value[0]
    }
  })

  // Mock JWT token for local development
  if (MOCK_JWT_ENABLED && !headers.authorization && !headers.Authorization) {
    headers.authorization = 'Bearer mock-local-token'
  }

  return {
    httpMethod: req.method,
    path: req.path,
    pathParameters: Object.keys(pathParams).length > 0 ? pathParams : null,
    queryStringParameters: Object.keys(req.query).length > 0 ? (req.query as Record<string, string>) : null,
    headers,
    body: req.body ? JSON.stringify(req.body) : null,
    isBase64Encoded: false,
    multiValueHeaders: {},
    multiValueQueryStringParameters: null,
    requestContext: {
      accountId: 'local',
      apiId: 'local-api',
      protocol: 'HTTP/1.1',
      httpMethod: req.method,
      path: req.path,
      stage: 'local',
      requestId: `local-${Date.now()}-${Math.random().toString(36).substring(7)}`,
      requestTime: new Date().toISOString(),
      requestTimeEpoch: Date.now(),
      identity: {
        sourceIp: req.ip || '127.0.0.1',
        userAgent: req.headers['user-agent'] || 'local-api-server',
        cognitoIdentityPoolId: null,
        accountId: null,
        cognitoIdentityId: null,
        caller: null,
        apiKey: null,
        apiKeyId: null,
        accessKey: null,
        cognitoAuthenticationType: null,
        cognitoAuthenticationProvider: null,
        userArn: null,
        user: null,
        principalOrgId: null,
        clientCert: null
      },
      domainName: `localhost:${PORT}`,
      domainPrefix: 'local',
      resourceId: 'local',
      resourcePath: req.route?.path || req.path,
      authorizer: null
    },
    resource: req.route?.path || req.path,
    stageVariables: null
  }
}

/**
 * Create mock Lambda context
 */
function createLambdaContext(): Context {
  return {
    callbackWaitsForEmptyEventLoop: false,
    functionName: 'local-function',
    functionVersion: '$LATEST',
    invokedFunctionArn: 'arn:aws:lambda:local:000000000000:function:local-function',
    memoryLimitInMB: '512',
    awsRequestId: `local-${Date.now()}-${Math.random().toString(36).substring(7)}`,
    logGroupName: '/aws/lambda/local-function',
    logStreamName: 'local',
    getRemainingTimeInMillis: () => 30000,
    done: () => {},
    fail: () => {},
    succeed: () => {}
  }
}

/**
 * Middleware to invoke Lambda handler and send response
 */
function invokeLambda(handler: any) {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const pathParams: Record<string, string> = req.params || {}
      const event = createApiGatewayEvent(req, pathParams)
      const context = createLambdaContext()

      console.log(`📨 ${req.method} ${req.path}`)

      // Invoke Lambda handler
      const result: APIGatewayProxyResult = await handler(event, context)

      // Send response
      res.status(result.statusCode)

      // Set response headers
      if (result.headers) {
        Object.entries(result.headers).forEach(([key, value]) => {
          res.setHeader(key, String(value))
        })
      }

      // Send body
      if (result.body) {
        try {
          const body = JSON.parse(result.body)
          res.json(body)
        } catch {
          res.send(result.body)
        }
      } else {
        res.end()
      }
    } catch (error) {
      console.error('❌ Lambda invocation error:', error)
      next(error)
    }
  }
}

/**
 * Start Express server
 */
async function startServer() {
  await loadHandlers()

  const app = express()

  // Middleware
  app.use(cors())
  app.use(express.json())
  app.use(express.urlencoded({ extended: true }))

  // Request logging
  app.use((req, res, next) => {
    console.log(`\n🔵 ${new Date().toISOString()} - ${req.method} ${req.path}`)
    next()
  })

  // Health check endpoint
  app.get('/health', (req, res) => {
    res.json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      environment: 'local',
      jwtVerificationDisabled: true,
      testUserId: MOCK_USER_ID
    })
  })

  // API Routes
  app.post(`${API_BASE_PATH}/cart`, invokeLambda(createCartHandler))
  app.get(`${API_BASE_PATH}/cart/:cartId`, invokeLambda(getCartHandler))
  app.post(`${API_BASE_PATH}/cart/:cartId/items`, invokeLambda(addItemHandler))

  // 404 handler
  app.use((req, res) => {
    res.status(404).json({
      error: {
        code: 'NOT_FOUND',
        message: `Route ${req.method} ${req.path} not found`
      }
    })
  })

  // Error handler
  app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
    console.error('❌ Server error:', err)
    res.status(500).json({
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: err.message || 'An unexpected error occurred'
      }
    })
  })

  // Start listening
  app.listen(PORT, () => {
    console.log('\n' + '='.repeat(60))
    console.log('🚀 Local API Gateway Server Started')
    console.log('='.repeat(60))
    console.log(`📍 Server:        http://localhost:${PORT}`)
    console.log(`🗄️  DynamoDB:      ${process.env.DYNAMODB_ENDPOINT}`)
    console.log(`🔓 JWT Verify:    Disabled (local mode)`)
    console.log(`👤 Test User:     ${MOCK_USER_ID}`)
    console.log('\n📚 Available Endpoints:')
    console.log(`   POST   http://localhost:${PORT}${API_BASE_PATH}/cart`)
    console.log(`   GET    http://localhost:${PORT}${API_BASE_PATH}/cart/:cartId`)
    console.log(`   POST   http://localhost:${PORT}${API_BASE_PATH}/cart/:cartId/items`)
    console.log(`   GET    http://localhost:${PORT}/health`)
    console.log('\n💡 Test with Postman, curl, or your frontend application')
    console.log('='.repeat(60) + '\n')
  })
}

// Handle shutdown gracefully
process.on('SIGTERM', () => {
  console.log('\n👋 Shutting down gracefully...')
  process.exit(0)
})

process.on('SIGINT', () => {
  console.log('\n👋 Shutting down gracefully...')
  process.exit(0)
})

// Start the server
startServer().catch(error => {
  console.error('❌ Failed to start server:', error)
  process.exit(1)
})
