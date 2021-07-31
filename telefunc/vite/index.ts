import { Plugin } from "vite";
import { transform } from "./transform";
import { build } from "./build";

export default plugin;

function plugin(): Plugin[] {
  return [
    {
      name: "telefunc:config",
      config: () => ({
        ssr: { external: ["telefunc"] },
        optimizeDeps: { include: ["telefunc/client"] },
      }),
    },
    transform(),
    build(),
  ];
}
