import type { ConfigPort } from '../../application/ports/ConfigPort'
import type { LoggerPort } from '../../application/ports/LoggerPort'
import type { DatabasePort } from '../../application/ports/DatabasePort'
import { dynamoDBAdapter } from '../../infrastructure/dynamoDBAdapter'
import type { WirePort } from '../wirePort'

let databasePort: DatabasePort | undefined = undefined

export const wireDatabasePort: WirePort<[ConfigPort, LoggerPort]> = props => {
  if (!props) {
    throw new Error('ConfigPort and LoggerPort are required for wiring DatabasePort')
  }
  const [configPort, loggerPort] = props
  databasePort ??= dynamoDBAdapter(configPort, loggerPort)
}

export const getDatabasePort = (): DatabasePort => {
  if (!databasePort) {
    throw new Error('Wiring was not done for getDatabasePort!')
  }
  return databasePort
}
