import bun from 'bun'
import { apiLogger } from '#/logger.ts'

/**
 * We use drizzle orm in the indexer which handles type generation for our database.
 * We can fetch the exact file from github and write it to `./src/types/generated/database.ts`
 */

const INDEXER_DATABASE_TYPES_URL =
  'https://raw.githubusercontent.com/ethereumfollowprotocol/indexer/develop/drizzle/schema.ts'

const LOCAL_DATABASE_TYPES_PATH = './src/types/generated/database.ts'

apiLogger.info('Generating database types:')
apiLogger.box(`From: ${INDEXER_DATABASE_TYPES_URL}\nWriting to: ${LOCAL_DATABASE_TYPES_PATH}`)

main().catch(error => {
  apiLogger.error(error)
  process.exit(1)
})

async function main() {
  const response = await fetch(INDEXER_DATABASE_TYPES_URL, { method: 'GET' })

  if (!response.ok) throw new Error(`Failed to fetch ${INDEXER_DATABASE_TYPES_URL}`)
  const text = await response.text()

  const writeResult = await bun.write(LOCAL_DATABASE_TYPES_PATH, text)
  if (writeResult < 0) throw new Error(`Failed to write ${LOCAL_DATABASE_TYPES_PATH}`)

  apiLogger.success(`Successfully wrote ${LOCAL_DATABASE_TYPES_PATH}`)
}
