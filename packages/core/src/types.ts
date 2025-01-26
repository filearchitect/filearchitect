/**
 * Consolidated type definitions for File Architect Core
 */

import type { FileNameReplacement, FileSystem } from "./types/filesystem.d.ts";
import type { BaseStructureOptions } from "./types/operations.d.ts";

export type {
  DirectoryEntry,
  FileNameReplacement,
  FileStat,
  FileSystem,
  FileSystemError,
  FileSystemOptions,
} from "./types/filesystem.d.ts";

export type {
  BaseStructureOptions,
  GetStructureOptions,
  GetStructureResult,
  StructureOperation,
  StructureOperationLine,
  StructureOperationType,
} from "./types/operations.d.ts";

export type { MessageType, Warning, WarningType } from "./types/warnings.d.ts";

export { Messages } from "./warnings.js";

export interface StructureFrontmatter {
  replacements?: {
    folders?: FileNameReplacement[];
    files?: FileNameReplacement[];
    all?: FileNameReplacement[];
  };
}

export interface CreateStructureOptions extends BaseStructureOptions {
  fs?: FileSystem;
}
