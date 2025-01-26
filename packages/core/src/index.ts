// Core functionality
export { createStructure } from "./create-structure.js";
export { getStructure } from "./get-structure.js";
export { Messages, createMessage } from "./warnings.js";

// Filesystem implementations
export { BrowserFileSystem } from "./browser-filesystem.js";
export { NodeFileSystem } from "./node-filesystem.js";

// Types
export type {
  BaseStructureOptions,
  CreateStructureOptions,
  DirectoryEntry,
  FileNameReplacement,
  FileStat,
  FileSystem,
  FileSystemError,
  FileSystemOptions,
  GetStructureOptions,
  GetStructureResult,
  StructureFrontmatter,
  StructureOperation,
  StructureOperationLine,
  Warning,
} from "./types.js";
