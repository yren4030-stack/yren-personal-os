import { defineConfig } from 'vite'

// Electron Main process bundle, emitted as ESM (.mjs) to match the package
// "type": "module". The Forge plugin only applies its CJS default when
// build.lib is unset, so this config opts into ESM explicitly.
export default defineConfig({
  build: {
    lib: {
      formats: ['es'],
      fileName: () => 'main.mjs',
    },
  },
})
