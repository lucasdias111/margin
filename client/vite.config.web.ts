import { defineConfig } from 'vite'
import { svelte } from '@sveltejs/vite-plugin-svelte'
import path from 'path'

export default defineConfig({
  root: 'src/renderer',
  plugins: [svelte()],
  server: { port: 5274 },
  resolve: {
    alias: {
      $src: path.resolve(__dirname, 'src/renderer/src'),
      $lib: path.resolve(__dirname, 'src/renderer/src/lib'),
      $components: path.resolve(__dirname, 'src/renderer/src/components'),
      $services: path.resolve(__dirname, 'src/renderer/src/services'),
      $interfaces: path.resolve(__dirname, 'src/renderer/src/interfaces'),
      $states: path.resolve(__dirname, 'src/renderer/src/states')
    }
  },
  base: '/app/',
  build: {
    outDir: path.resolve(__dirname, 'out/web'),
    emptyOutDir: true
  }
})
