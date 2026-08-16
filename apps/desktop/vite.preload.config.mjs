import { defineConfig } from 'vite'

// Preload bundle. `electron` is externalized by @electron-forge/plugin-vite.
// With build.rollupOptions unset, the plugin applies its standard Forge config:
// a single CommonJS bundle emitted as .vite/build/preload.js, which is required
// for the sandboxed preload (sandbox: true does not support ESM preloads).
export default defineConfig({})
