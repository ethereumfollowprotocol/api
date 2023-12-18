import type { IEFPIndexerService } from '#/service/efp-indexer/service'
import type { IENSMetadataService } from '#/service/ens-metadata/service'

export interface Services {
  ens: () => IENSMetadataService
  efp: (env: Env) => IEFPIndexerService
}
