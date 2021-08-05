export * from "../shared/types";
import { Telefunctions } from "../shared/types";

export type TelefuncContextUserProvided = Record<string, unknown>;

type TelefuncFilePath = string;
export type TelefuncFiles = Record<TelefuncFilePath, Telefunctions>;
type FileExports = Record<string, unknown>;
export type TelefuncFilesUntyped = Record<TelefuncFilePath, FileExports>;
