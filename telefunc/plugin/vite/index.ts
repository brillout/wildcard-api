import { Plugin } from 'vite'
import { transform } from './transform'
import { build } from './build'
import { importBuild } from 'vite-plugin-import-build'
import { getImportBuildCode } from './getImportBuildCode'

export default plugin

function plugin(): Plugin[] {
  return [
    {
      name: 'telefunc:config',
      config: () => ({
        ssr: { external: ['telefunc'] },
        optimizeDeps: { include: ['telefunc/client'] },
      }),
    },
    transform(),
    build(),
    importBuild(getImportBuildCode()),
  ]
}
