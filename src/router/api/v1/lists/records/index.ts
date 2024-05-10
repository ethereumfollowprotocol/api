import type { Hono } from 'hono'
import { env } from 'hono/adapter'
import { validator } from 'hono/validator'
import type { Services } from '#/service'
import type { Environment } from '#/types'
import type { ListRecord, TaggedListRecord } from '#/types/list-record'

export function records(users: Hono<{ Bindings: Environment }>, services: Services) {
  users.get(
    '/:token_id/records',
    validator('query', value => {
      const { includeTags } = <Record<'includeTags', string | undefined>>value
      if (includeTags !== undefined && includeTags !== 'true' && includeTags !== 'false') {
        throw new Error('Accepted format: ?includeTags=true or ?includeTags=false')
      }
      return value
    }),
    async context => {
      const tokenId = BigInt(context.req.param().token_id)
      const includeTags = context.req.query('includeTags')

      const records: ListRecord[] =
        includeTags === 'false'
          ? await services.efp(env(context)).getListRecords(tokenId)
          : await services.efp(env(context)).getListRecordsWithTags(tokenId)

      const formattedRecords = records.map((record: ListRecord) => ({
        version: record.version,
        record_type: record.recordType === 1 ? 'address' : `${record.recordType}`,
        data: `0x${record.data.toString('hex')}`,
        ...(includeTags !== 'false' && { tags: (record as TaggedListRecord).tags })
      }))

      return context.json({ records: formattedRecords }, 200)
    }
  )
}
