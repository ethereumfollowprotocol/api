import { Hono } from 'hono'
import { env } from 'hono/adapter'
import type { Services } from '#/service'
import type { Environment } from '#/types'

export function serviceHealth(services: Services): Hono<{ Bindings: Environment }> {
  const serviceHealth = new Hono<{ Bindings: Environment }>()

  serviceHealth.get('/', async context => {
    try{
        const cacheService = services.cache(env(context))
        const cacheTarget = `serviceHealth`
        await cacheService.put(cacheTarget, JSON.stringify('ok'))
        const cacheHit = await cacheService.get(cacheTarget)    
        if(!cacheHit){
            return context.json({ response: 'No Response from Cache Service' }, 500)
        }
    } catch (e) {
      console.log(e)
      return context.json({ response: 'No Response from Cache Service' }, 500)
    }

    try{
        const response = await fetch(`${env(context).ENS_API_URL}/u/efp.eth`)
        if(!response.ok){
            return context.json({ response: 'No Response from ENS Service' }, 500)
        }
    } catch (e) {
      console.log(e)
      return context.json({ response: 'No Response from ENS Service' }, 500)
    }

    return context.text('ok')
  })
  return serviceHealth
}