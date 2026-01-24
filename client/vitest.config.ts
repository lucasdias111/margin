import { defineConfig } from 'vitest/config'
import { svelte } from '@sveltejs/vite-plugin-svelte'
import path from 'path'

export default defineConfig({
  plugins: [
    svelte({
      compilerOptions: {
        hmr: !process.env.VITEST
      }
    })
  ],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./vitest.setup.ts']
  },
  resolve: {
    alias: {
      $src: path.resolve(__dirname, './src/renderer/src')
    },
    conditions: ['browser']
  }
})
