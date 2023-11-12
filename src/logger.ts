import { createConsola } from 'consola'

export const apiLogger = createConsola({
  defaults: { tag: '@efp/api' },
  formatOptions: {
    date: true,
    colors: true
  }
})

apiLogger.wrapAll()
