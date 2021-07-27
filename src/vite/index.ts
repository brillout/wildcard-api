import { Plugin } from "vite";
import { init, parse } from "es-module-lexer";

export default plugin;

function plugin(): Plugin {
  return {
    name: "telefunc",
    config: () => ({
      ssr: { external: ['telefunc'] },
      optimizeDeps: { include: ["telefunc/client"] },
    }),
    async transform(src: string, id: string, ssr: boolean) {
      if (ssr) {
        return;
      }
      if (id.includes(".telefunc.")) {
        await init;
        const exports = parse(src)[1];
        return {
          code: getCode(exports),
          map: null,
        };
      }
    },
  };
}

function getCode(exports: readonly string[]) {
  let code = `import { server } from 'telefunc/client';

`;
  exports.forEach((exportName) => {
    code += `export const ${exportName} = server['${exportName}'];\n`;
  });
  return code;
}
