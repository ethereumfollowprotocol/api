import type { IEFPIndexerService } from '#/service/efp-indexer/service'
import type { IENSMetadataService } from '#/service/ens-metadata/service'
import type { Environment } from '#/types'

export interface Services {
  ens: (env: Environment) => IENSMetadataService
  efp: (env: Environment) => IEFPIndexerService
}
