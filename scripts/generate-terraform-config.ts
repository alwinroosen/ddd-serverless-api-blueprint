#!/usr/bin/env tsx

/**
 * Terraform Configuration Generation Script
 *
 * Generates Terraform configuration from endpoint definitions
 *
 * Following IT Handbook standards:
 * - Infrastructure as Code
 * - Single source of truth (schemas)
 * - Auto-generated IAM permissions
 * - Least-privilege principle
 *
 * Usage:
 *   npm run generate:terraform
 *
 * Output:
 *   terraform/generated/endpoints-config.json
 */

import { writeFileSync } from 'fs'
import { join } from 'path'

// Import endpoint definitions
import { endpoints } from '../libs/api-contracts/src'

/**
 * Terraform endpoint configuration type
 */
interface TerraformEndpointConfig {
  functionName: string
  handler: string
  runtime: string
  timeout: number
  memorySize: number
  environment: Record<string, string>
  iamPolicyStatements: Array<{
    effect: 'Allow' | 'Deny'
    actions: string[]
    resources: string[]
  }>
  apiGateway: {
    path: string
    method: string
    authorizationType: 'COGNITO_USER_POOLS' | 'NONE'
  }
}

/**
 * Generate Terraform configuration
 */
function generateTerraformConfig(): void {
  console.log('🔨 Generating Terraform configuration...')

  const terraformConfig: Record<string, TerraformEndpointConfig> = {}

  for (const endpoint of endpoints) {
    const config: TerraformEndpointConfig = {
      functionName: endpoint.lambda.functionName,
      handler: endpoint.lambda.handler,
      runtime: endpoint.lambda.runtime,
      timeout: endpoint.lambda.timeout,
      memorySize: endpoint.lambda.memorySize,
      environment: endpoint.lambda.environment,
      iamPolicyStatements: [],
      apiGateway: {
        path: endpoint.path,
        method: endpoint.method.toUpperCase(),
        authorizationType: endpoint.security?.length ? 'COGNITO_USER_POOLS' : 'NONE'
      }
    }

    // Generate IAM policy statements from permissions
    if (endpoint.lambda.permissions) {
      // DynamoDB permissions
      if (endpoint.lambda.permissions.dynamodb) {
        for (const dynamodbPerm of endpoint.lambda.permissions.dynamodb) {
          config.iamPolicyStatements.push({
            effect: 'Allow',
            actions: dynamodbPerm.actions,
            resources: [dynamodbPerm.table]
          })
        }
      }

      // S3 permissions (if any)
      if ('s3' in endpoint.lambda.permissions && endpoint.lambda.permissions.s3) {
        for (const s3Perm of endpoint.lambda.permissions.s3) {
          config.iamPolicyStatements.push({
            effect: 'Allow',
            actions: s3Perm.actions,
            resources: [s3Perm.bucket]
          })
        }
      }

      // SQS permissions (if any)
      if ('sqs' in endpoint.lambda.permissions && endpoint.lambda.permissions.sqs) {
        for (const sqsPerm of endpoint.lambda.permissions.sqs) {
          config.iamPolicyStatements.push({
            effect: 'Allow',
            actions: sqsPerm.actions,
            resources: [sqsPerm.queue]
          })
        }
      }

      // SNS permissions (if any)
      if ('sns' in endpoint.lambda.permissions && endpoint.lambda.permissions.sns) {
        for (const snsPerm of endpoint.lambda.permissions.sns) {
          config.iamPolicyStatements.push({
            effect: 'Allow',
            actions: snsPerm.actions,
            resources: [snsPerm.topic]
          })
        }
      }
    }

    // Add CloudWatch Logs permission (required for all Lambdas)
    config.iamPolicyStatements.push({
      effect: 'Allow',
      actions: ['logs:CreateLogGroup', 'logs:CreateLogStream', 'logs:PutLogEvents'],
      resources: [`arn:aws:logs:*:*:log-group:/aws/lambda/${endpoint.lambda.functionName}:*`]
    })

    terraformConfig[endpoint.lambda.functionName] = config
  }

  // Write to file
  const outputPath = join(process.cwd(), 'terraform', 'generated', 'endpoints-config.json')
  writeFileSync(outputPath, JSON.stringify(terraformConfig, null, 2), 'utf-8')

  console.log(`✅ Terraform configuration generated: ${outputPath}`)
  console.log(`📊 Lambda functions: ${Object.keys(terraformConfig).length}`)
  console.log('\n📋 Summary:')
  for (const [name, config] of Object.entries(terraformConfig)) {
    console.log(`  - ${name}:`)
    console.log(`    • ${config.apiGateway.method} ${config.apiGateway.path}`)
    console.log(`    • Memory: ${config.memorySize}MB, Timeout: ${config.timeout}s`)
    console.log(`    • IAM Statements: ${config.iamPolicyStatements.length}`)
  }
}

// Execute generation
try {
  generateTerraformConfig()
} catch (error) {
  console.error('❌ Failed to generate Terraform configuration:', error)
  process.exit(1)
}
