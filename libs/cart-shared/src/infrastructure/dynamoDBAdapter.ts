import { DynamoDBClient } from '@aws-sdk/client-dynamodb'
import {
  DynamoDBDocumentClient,
  GetCommand,
  PutCommand,
  DeleteCommand,
  QueryCommand,
  BatchGetCommand
} from '@aws-sdk/lib-dynamodb'
import type { ConfigPort } from '../application/ports/ConfigPort'
import type { LoggerPort } from '../application/ports/LoggerPort'
import type {
  DatabasePort,
  GetParams,
  PutParams,
  DeleteParams,
  QueryParams,
  QueryResult,
  BatchGetParams,
  BatchGetResult
} from '../application/ports/DatabasePort'

export type DynamoDBAdapter = (configPort: ConfigPort, loggerPort: LoggerPort) => DatabasePort

/**
 * Creates DynamoDB client configuration with optional local endpoint support
 */
type DynamoDBConfig = NonNullable<ConstructorParameters<typeof DynamoDBClient>[0]>
const createDynamoDBConfig = (region: string): DynamoDBConfig => {
  const config: DynamoDBConfig = { region }

  if (process.env.DYNAMODB_ENDPOINT) {
    config.endpoint = process.env.DYNAMODB_ENDPOINT
  }

  return config
}

/**
 * Creates DynamoDB Document Client with standardized marshalling options
 */
const createDocumentClient = (client: DynamoDBClient): DynamoDBDocumentClient => {
  return DynamoDBDocumentClient.from(client, {
    marshallOptions: {
      removeUndefinedValues: true,
      convertClassInstanceToMap: false
    },
    unmarshallOptions: {
      wrapNumbers: false
    }
  })
}

/**
 * DynamoDBAdapter
 *
 * Adapter implementation for DatabasePort using AWS DynamoDB.
 * Encapsulates all DynamoDB-specific implementation details.
 *
 * Following IT Handbook standards:
 * - Dependency Inversion Principle (implements port interface)
 * - Single-table design for scalability
 * - Async/await pattern
 * - Type-first approach for clarity
 * - Structured logging
 */
// eslint-disable-next-line max-lines-per-function
export const dynamoDBAdapter: DynamoDBAdapter = (configPort, loggerPort) => {
  const region = configPort.getRegion()
  const client = new DynamoDBClient(createDynamoDBConfig(region))
  const docClient = createDocumentClient(client)

  // Log DynamoDB configuration for debugging
  if (process.env.DYNAMODB_ENDPOINT) {
    loggerPort.info('Using DynamoDB Local endpoint', {
      endpoint: process.env.DYNAMODB_ENDPOINT,
      region
    })
  }

  return {
    get: async (params: GetParams): Promise<Record<string, unknown> | undefined> => {
      try {
        const command = new GetCommand({
          TableName: params.tableName,
          Key: params.key,
          ConsistentRead: params.consistentRead,
          ProjectionExpression: params.projectionExpression
        })

        const result = await docClient.send(command)
        return result.Item as Record<string, unknown> | undefined
      } catch (error) {
        throw new Error(
          `Failed to get item from DynamoDB: ${(error as Error).message}`,
          { cause: error }
        )
      }
    },

    put: async (params: PutParams): Promise<void> => {
      try {
        const command = new PutCommand({
          TableName: params.tableName,
          Item: params.item
        })

        await docClient.send(command)
      } catch (error) {
        throw new Error(
          `Failed to put item to DynamoDB: ${(error as Error).message}`,
          { cause: error }
        )
      }
    },

    delete: async (params: DeleteParams): Promise<void> => {
      try {
        const command = new DeleteCommand({
          TableName: params.tableName,
          Key: params.key
        })

        await docClient.send(command)
      } catch (error) {
        throw new Error(
          `Failed to delete item from DynamoDB: ${(error as Error).message}`,
          { cause: error }
        )
      }
    },

    query: async (params: QueryParams): Promise<QueryResult> => {
      try {
        const command = new QueryCommand({
          TableName: params.tableName,
          IndexName: params.indexName,
          KeyConditionExpression: params.keyConditionExpression,
          FilterExpression: params.filterExpression,
          ExpressionAttributeNames: params.expressionAttributeNames,
          ExpressionAttributeValues: params.expressionAttributeValues,
          Limit: params.limit,
          ExclusiveStartKey: params.exclusiveStartKey
        })

        const result = await docClient.send(command)

        return {
          items: (result.Items || []) as Record<string, unknown>[],
          lastEvaluatedKey: result.LastEvaluatedKey as Record<string, unknown> | undefined
        }
      } catch (error) {
        throw new Error(
          `Failed to query DynamoDB: ${(error as Error).message}`,
          { cause: error }
        )
      }
    },

    batchGet: async (params: BatchGetParams): Promise<BatchGetResult> => {
      try {
        const command = new BatchGetCommand({
          RequestItems: {
            [params.tableName]: {
              Keys: params.keys,
              ConsistentRead: params.consistentRead
            }
          }
        })

        const result = await docClient.send(command)

        const items = result.Responses?.[params.tableName] || []
        return {
          items: items as Record<string, unknown>[]
        }
      } catch (error) {
        throw new Error(
          `Failed to batch get from DynamoDB: ${(error as Error).message}`,
          { cause: error }
        )
      }
    }
  }
}
