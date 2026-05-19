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
    setupFiles: ['./vitest.setup.ts'],
    exclude: ['**/node_modules/**', '**/dist/**', 'e2e/**']
  },
  resolve: {
    alias: {
      $src: path.resolve(__dirname, './src/renderer/src')
    },
    conditions: ['browser']
  }
})
