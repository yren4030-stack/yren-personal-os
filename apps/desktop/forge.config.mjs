import { VitePlugin } from '@electron-forge/plugin-vite'
import { MakerZIP } from '@electron-forge/maker-zip'

export default {
  packagerConfig: {},
  rebuildConfig: {},
  makers: [new MakerZIP({})],
  plugins: [
    new VitePlugin({
      build: [
        { entry: 'electron/main.mjs', config: 'vite.main.config.mjs', target: 'main' },
        { entry: 'electron/preload.mjs', config: 'vite.preload.config.mjs', target: 'preload' },
      ],
      renderer: [{ name: 'main_window', config: 'vite.renderer.config.mjs' }],
    }),
  ],
}
