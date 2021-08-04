import type { ViteDevServer } from "vite";
export type TelefuncContextUserProvided = Record<string, unknown>;
export type TelefuncContextEnv =
  | {
      _isProduction: false;
      _viteDevServer: ViteDevServer;
      _root: string;
    }
  | {
      _isProduction: true;
      _viteDevServer: undefined;
      _root?: string;
    };
