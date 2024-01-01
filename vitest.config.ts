import { defineConfig } from 'vitest/config'

export default defineConfig({
  resolve: {
    alias: {
      '#': './src'
    }
  },
  test: {
    globalSetup: ['./tests/global-setup.ts']
  }
})
