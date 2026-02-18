import type { ConfigPort } from '../../application/ports/ConfigPort'
import type { DatabasePort } from '../../application/ports/DatabasePort'
import type { ProductPort } from '../../application/ports/ProductPort'
import { productAdapter } from '../../infrastructure/productAdapter'
import type { WirePort } from '../wirePort'

let productPort: ProductPort | undefined = undefined

export const wireProductPort: WirePort<[ConfigPort, DatabasePort]> = props => {
  if (!props) {
    throw new Error('ConfigPort and DatabasePort are required for wiring ProductPort')
  }
  const [configPort, databasePort] = props
  productPort ??= productAdapter(configPort, databasePort)
}

export const getProductPort = (): ProductPort => {
  if (!productPort) {
    throw new Error('Wiring was not done for getProductPort!')
  }
  return productPort
}
