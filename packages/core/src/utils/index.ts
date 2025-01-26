/**
 * Type exports for File Architect Core
 */

// Filesystem types
export type {
  DirectoryEntry,
  FileNameReplacement,
  FileStat,
  FileSystem,
  FileSystemError,
  FileSystemOptions,
} from "../types/filesystem.js";

// Operation types
export type {
  BaseStructureOptions,
  FileOperation,
  GetStructureOptions,
  GetStructureResult,
  StructureOperation,
  StructureOperationType,
} from "./operations.js";

// Warning types
export type { MessageType, Warning, WarningType } from "./warnings.js";

// Re-export Messages const
export { Messages } from "./warnings.js";
