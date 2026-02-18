/**
 * DatabasePort
 *
 * Generic database operations abstraction.
 * Allows domain adapters to be database-agnostic.
 *
 * Following IT Handbook standards:
 * - Dependency Inversion Principle
 * - Database implementation details hidden from domain adapters
 * - Facilitates testing with mocks
 * - Enables swapping database implementations
 */

/**
 * Parameters for get operation
 */
export interface GetParams {
  tableName: string
  key: Record<string, unknown>
  consistentRead?: boolean
  projectionExpression?: string
}

/**
 * Parameters for put operation
 */
export interface PutParams {
  tableName: string
  item: Record<string, unknown>
}

/**
 * Parameters for delete operation
 */
export interface DeleteParams {
  tableName: string
  key: Record<string, unknown>
}

/**
 * Parameters for query operation
 */
export interface QueryParams {
  tableName: string
  indexName?: string
  keyConditionExpression: string
  filterExpression?: string
  expressionAttributeNames?: Record<string, string>
  expressionAttributeValues: Record<string, unknown>
  limit?: number
  exclusiveStartKey?: Record<string, unknown>
}

/**
 * Result from query operation
 */
export interface QueryResult {
  items: Record<string, unknown>[]
  lastEvaluatedKey?: Record<string, unknown>
}

/**
 * Parameters for batch get operation
 */
export interface BatchGetParams {
  tableName: string
  keys: Record<string, unknown>[]
  consistentRead?: boolean
}

/**
 * Result from batch get operation
 */
export interface BatchGetResult {
  items: Record<string, unknown>[]
}

/**
 * DatabasePort interface
 *
 * Provides generic database operations.
 * Implementation should handle specific database client details.
 */
export interface DatabasePort {
  /**
   * Get a single item by key
   */
  get(params: GetParams): Promise<Record<string, unknown> | undefined>

  /**
   * Put (create or update) an item
   */
  put(params: PutParams): Promise<void>

  /**
   * Delete an item by key
   */
  delete(params: DeleteParams): Promise<void>

  /**
   * Query items using key condition
   */
  query(params: QueryParams): Promise<QueryResult>

  /**
   * Batch get multiple items by keys
   */
  batchGet(params: BatchGetParams): Promise<BatchGetResult>
}
