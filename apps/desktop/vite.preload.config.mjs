import { defineConfig } from 'vite'

// Preload bundle. The sandboxed preload must remain CommonJS, so it is emitted
// as preload.cjs regardless of the package "type": "module". The Forge plugin's
// default output.format ('cjs') is preserved; only the file name is fixed.
export default defineConfig({
  build: {
    rollupOptions: {
      output: {
        entryFileNames: 'preload.cjs',
        chunkFileNames: 'preload.cjs',
        assetFileNames: '[name].[ext]',
      },
    },
  },
})
