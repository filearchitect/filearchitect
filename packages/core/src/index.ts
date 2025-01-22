// Core functionality
export { createStructureFromString } from "./create-structure.js";
export { getStructureFromString } from "./get-structure.js";
export { Messages, createMessage } from "./warnings.js";

// Filesystem implementations
export { BrowserFileSystem } from "./browser-filesystem.js";
export { NodeFileSystem } from "./node-filesystem.js";

// Types
export type {
  // Core types
  CreateStructureOptions,
  DirectoryEntry,
  // Utility types
  FileNameReplacement,
  FileOperation,
  FileStat,
  // Filesystem types
  FileSystem,
  FileSystemOptions,
  GetStructureOptions,
  LogOptions,
  // Operation types
  OperationType,
  StructureOperation,
  StructureResult,
  Warning,
} from "./types.js";
