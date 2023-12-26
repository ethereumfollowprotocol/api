import type { Services } from '#/service'
import type { Environment } from '#/types'
import type { Hono } from 'hono'
import { validator } from 'hono/validator'

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
      const token_id = BigInt(context.req.param().token_id)
      const includeTags = context.req.query('includeTags')

      const records =
        includeTags === 'false'
          ? await services.efp(context.env).getListRecords(token_id)
          : await services.efp(context.env).getListRecordsWithTags(token_id)

      const formattedRecords = records.map(({ version, recordType, data, tags }) => ({
        version,
        record_type: recordType === 1 ? 'address' : `${recordType}`,
        data: data.toString('hex'),
        ...(includeTags !== 'false' && { tags })
      }))

      return context.json({ records: formattedRecords }, 200)
    }
  )
}
