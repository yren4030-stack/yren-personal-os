import { defineConfig } from 'vite'

// Electron Main process bundle. `electron` and Node built-ins are externalized
// by @electron-forge/plugin-vite, so this config stays minimal.
export default defineConfig({})
