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
} from "./filesystem.js";

// Operation types
export type {
  BaseStructureOptions,
  GetStructureOptions,
  GetStructureResult,
  StructureOperation,
  StructureOperationLine,
  StructureOperationType,
} from "./operations.js";

// Warning types
export type { MessageType, Warning, WarningType } from "./warnings.js";

// Re-export Messages const
export { Messages } from "./warnings.js";
