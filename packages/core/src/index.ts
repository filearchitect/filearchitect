// Core functionality
export { createStructureFromString } from "./create-structure.js";
export { getStructureFromString } from "./get-structure.js";
export { Messages, createMessage } from "./warnings.js";

// Filesystem implementations
export { BrowserFileSystem } from "./browser-filesystem.js";
export { NodeFileSystem } from "./node-filesystem.js";

// Types
export type {
  BaseStructureOptions,
  CreateOptions,
  CreateStructureOptions,
  DirectoryEntry,
  FileNameReplacement,
  FileOperation,
  FileStat,
  FileSystem,
  FileSystemError,
  FileSystemOptions,
  GetStructureOptions,
  GetStructureResult,
  LogOptions,
  OperationResult,
  OperationType,
  StructureFrontmatter,
  StructureOperation,
  Warning,
} from "./types.js";
