import type { ConfigPort } from '../application/ports/ConfigPort'

export type ConfigAdapter = () => ConfigPort

/**
 * ConfigAdapter
 *
 * Adapter implementation for ConfigPort.
 * Reads configuration from environment variables.
 *
 * Following IT Handbook standards:
 * - Environment variables for runtime configuration
 * - Fail fast if required config is missing
 * - Clear error messages
 * - Type-first approach for clarity
 */
export const configAdapter: ConfigAdapter = () => {
  return {
    getTableName: () => {
      const tableName = process.env.DYNAMODB_TABLE_NAME
      if (!tableName) {
        throw new Error('Environment variable DYNAMODB_TABLE_NAME is required')
      }
      return tableName
    },

    getRegion: () => {
      return process.env.AWS_REGION || 'eu-west-1'
    },

    getUserPoolId: () => {
      const userPoolId = process.env.COGNITO_USER_POOL_ID
      if (!userPoolId) {
        throw new Error('Environment variable COGNITO_USER_POOL_ID is required')
      }
      return userPoolId
    },

    getClientId: () => {
      const clientId = process.env.COGNITO_CLIENT_ID
      if (!clientId) {
        throw new Error('Environment variable COGNITO_CLIENT_ID is required')
      }
      return clientId
    },

    getStage: () => {
      return process.env.STAGE || 'dev'
    },

    getAllowedOrigins: () => {
      const originsEnv = process.env.ALLOWED_ORIGINS
      if (!originsEnv) {
        // Default origins for development
        return ['http://localhost:3000', 'http://localhost:4200']
      }
      // Parse comma-separated list of origins
      return originsEnv.split(',').map(origin => origin.trim())
    }
  }
}
