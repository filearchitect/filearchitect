/**
 * Types related to structure operations and processing
 */

import type { FileNameReplacement, FileSystem } from "./filesystem";

export type StructureOperationType = "copy" | "move" | "included" | "create";

/**
 * Represents a file operation parsed from a line in the structure file
 */
export interface FileOperation {
  /** Type of operation to perform */
  type: StructureOperationType;
  /** Target name for the file/directory */
  name: string;
  /** Source path for copy/move operations */
  sourcePath?: string;
}

/**
 * Base options shared between structure operations
 */
export interface BaseStructureOptions {
  /** Filesystem implementation to use */
  fs?: FileSystem;
  /** File name replacements */
  fileNameReplacements?: FileNameReplacement[];
  /** Folder name replacements */
  folderNameReplacements?: FileNameReplacement[];
  /** Include recursive contents of directories (default: true) */
  recursive?: boolean;
}

export interface GetStructureOptions extends BaseStructureOptions {
  /** Root directory path where structure would be created */
  rootDir: string;
}

/**
 * Represents a structure operation with target path and details
 */
export interface StructureOperation {
  /** Type of operation */
  type: StructureOperationType;
  /** Target path for the operation */
  targetPath: string;
  /** Source path for copy/move */
  sourcePath?: string;
  /** Whether this is a directory */
  isDirectory: boolean;
  /** Depth level from root (0 = root level) */
  depth: number;
  /** Name of file/directory (last path segment) */
  name: string;
  /** Warning message if any issues */
  warning?: string;
}

export interface GetStructureResult {
  /** Array of operations to perform */
  operations: StructureOperation[];
  /** Options used to generate operations */
  options: Required<GetStructureOptions>;
}
