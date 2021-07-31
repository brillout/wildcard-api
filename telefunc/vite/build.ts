import { Plugin } from "vite";

export { build };

function build(): Plugin {
  return {
    name: "telefunc:build",
    apply: "build",
    config: (config) => {
      if (!isSSR(config)) {
        return;
      }
      const viteEntry = require.resolve("./globImportTelefuncFiles.ts");
      return {
        build: {
          rollupOptions: { input: viteEntry },
        },
        ssr: { external: ["vite-plugin-ssr"] },
      };
    },
  };
}

function isSSR(config: { build?: { ssr?: boolean | string } }): boolean {
  return !!config?.build?.ssr;
}
