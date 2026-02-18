import type { ConfigPort } from '../../application/ports/ConfigPort'
import { configAdapter } from '../../infrastructure/configAdapter'
import type { WirePort } from '../wirePort'

let configPort: ConfigPort | undefined = undefined

export const wireConfigPort: WirePort = () => {
  configPort ??= configAdapter()
}

export const getConfigPort = (): ConfigPort => {
  if (!configPort) {
    throw new Error('Wiring was not done for getConfigPort!')
  }
  return configPort
}
