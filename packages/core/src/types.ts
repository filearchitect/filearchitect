/**
 * Consolidated type definitions for File Architect Core
 */

import type { FileNameReplacement, FileSystem } from "./types/filesystem.d.ts";
import type { ZipOptions, ZipOutput } from "./zip-archiver.js";

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

export interface CreateStructureOptions {
  fs?: FileSystem;
  replacements?: {
    files?: FileNameReplacement[];
    folders?: FileNameReplacement[];
    all?: FileNameReplacement[];
  };
  rootDir: string;
}

export type { ZipOptions, ZipOutput };
