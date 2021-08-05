import type { ViteDevServer } from "vite";
export * from "../shared/types";
import { Telefunctions } from "../shared/types";

export type TelefuncContextUserProvided = Record<string, unknown>;
export type TelefuncContextConfig = {
  _baseUrl: string;
  _disableCache: boolean;
} & (
  | {
      _isProduction: false;
      _viteDevServer: ViteDevServer;
      _root: string;
    }
  | {
      _isProduction: true;
      _viteDevServer: undefined;
      _root?: string;
    }
);

type TelefuncFilePath = string;
export type TelefuncFiles = Record<TelefuncFilePath, Telefunctions>;
type FileExports = Record<string, unknown>;
export type TelefuncFilesUntyped = Record<TelefuncFilePath, FileExports>;
