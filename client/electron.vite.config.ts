import { defineConfig } from 'electron-vite'
import { svelte } from '@sveltejs/vite-plugin-svelte'
import { resolve } from 'path'

// The desktop build is only the shell: main process, the two preloads (server tabs and the
// shell UI) and the shell UI in `src/shell`. The chat app is the web build (vite.config.web.ts),
// served by each instance.
export default defineConfig({
  main: {},
  preload: {
    build: {
      outDir: 'out/preload',
      rollupOptions: {
        input: {
          server: resolve(__dirname, 'src/preload/server.ts'),
          shell: resolve(__dirname, 'src/preload/shell.ts')
        },
        output: {
          format: 'cjs',
          entryFileNames: '[name].cjs'
        }
      }
    }
  },
  renderer: {
    root: 'src/shell',
    plugins: [svelte({ configFile: resolve(__dirname, 'svelte.config.mjs') })],
    build: {
      outDir: 'out/renderer',
      rollupOptions: {
        input: resolve(__dirname, 'src/shell/index.html')
      }
    }
  }
})
