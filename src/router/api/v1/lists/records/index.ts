import type { Services } from '#/service'
import type { Environment } from '#/types'
import type { Hono } from 'hono'

export function records(users: Hono<{ Bindings: Environment }>, services: Services) {
  users.get('/:token_id/records', async context => {
    return context.json(
      {
        records: (await services.efp(context.env).getListRecords(BigInt(context.req.param().token_id))).map(
          ({ version, recordType, data }) => ({
            version,
            record_type: recordType === 1 ? 'address' : `${recordType}`,
            data: data.toString('hex')
          })
        )
      },
      200
    )
  })
}
