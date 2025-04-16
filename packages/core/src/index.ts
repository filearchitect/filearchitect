// Core functionality
export { createStructure } from "./create-structure.js";
export { getStructure } from "./get-structure.js";
export { createMessage, Messages } from "./warnings.js";
export { ZipArchiver } from "./zip-archiver.js";

// Path utilities
export {
  getBasename,
  getDirname,
  hasFileExtension,
  joinPaths,
  pathSeparator,
  resolveTildePath,
} from "./path-utils.js";

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
  ZipOptions,
  ZipOutput,
} from "./types.js";
