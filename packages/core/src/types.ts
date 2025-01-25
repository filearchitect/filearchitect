/**
 * Consolidated type definitions for File Architect Core
 */

import type { FileNameReplacement, FileSystem } from "./types/filesystem.js";
import type { BaseStructureOptions } from "./types/operations.js";

export type {
  DirectoryEntry,
  FileNameReplacement,
  FileStat,
  FileSystem,
  FileSystemError,
  FileSystemOptions,
} from "./types/filesystem.js";

export type {
  BaseStructureOptions,
  FileOperation,
  GetStructureOptions,
  GetStructureResult,
  StructureOperation,
  StructureOperationType,
} from "./types/operations.js";

export type { MessageType, Warning, WarningType } from "./types/warnings.js";

export { Messages } from "./warnings.js";

export interface StructureFrontmatter {
  folderReplacements?: FileNameReplacement[];
  fileReplacements?: FileNameReplacement[];
}

export interface CreateStructureOptions extends BaseStructureOptions {
  fs?: FileSystem;
}
