import { defineConfig } from 'vite'

// Electron Main process bundle. `electron` and Node built-ins are externalized
// by @electron-forge/plugin-vite, so this config stays minimal. With build.lib
// unset, the plugin applies its standard Forge config: CommonJS output emitted
// as .vite/build/main.js (package scope is CommonJS, not "type": "module").
export default defineConfig({})
