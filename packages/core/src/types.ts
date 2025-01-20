/**
 * File system related types
 */
export interface FileSystemOptions {
  recursive?: boolean;
  withFileTypes?: boolean;
}

export interface DirectoryEntry {
  name: string;
  isDirectory: () => boolean;
}

export interface FileStat {
  isDirectory(): boolean;
  size?: number;
}

export interface FileSystem {
  // Basic operations
  exists(path: string): boolean | Promise<boolean>;
  mkdir(path: string, options?: FileSystemOptions): void | Promise<void>;
  writeFile(path: string, data: string): void | Promise<void>;
  readFile(path: string): string | Promise<string>;
  stat(path: string): FileStat | Promise<FileStat>;
  readdir(
    path: string,
    options?: FileSystemOptions
  ): DirectoryEntry[] | Promise<DirectoryEntry[]>;
  rm(path: string, options?: FileSystemOptions): void | Promise<void>;
  unlink(path: string): void | Promise<void>;
  rename(oldPath: string, newPath: string): void | Promise<void>;
  isDirectory(path: string): Promise<boolean>;

  // High-level operations
  copyFile(src: string, dest: string): void | Promise<void>;
  copyFolder(
    src: string,
    dest: string,
    options?: FileSystemOptions
  ): Promise<void>;
  moveFolder(
    src: string,
    dest: string,
    options?: FileSystemOptions
  ): Promise<void>;

  // Convenience methods
  ensureDir(path: string): Promise<void>;
  emptyDir(path: string): Promise<void>;
  copy(src: string, dest: string, options?: FileSystemOptions): Promise<void>;
  move(src: string, dest: string, options?: FileSystemOptions): Promise<void>;
  existsAs(path: string, type: "file" | "directory"): Promise<boolean>;
  ensureFile(path: string): Promise<void>;
  remove(path: string): Promise<void>;
  isEmptyDir(path: string): Promise<boolean>;
  readFileOrDefault(path: string, defaultContent?: string): Promise<string>;
  ensureEmptyDir(path: string): Promise<void>;
  copyIfNotExists(
    src: string,
    dest: string,
    options?: FileSystemOptions
  ): Promise<boolean>;
  moveIfNotExists(
    src: string,
    dest: string,
    options?: FileSystemOptions
  ): Promise<boolean>;
  getAllFiles(dirPath: string): Promise<string[]>;
  getAllDirectories(dirPath: string): Promise<string[]>;

  // Path manipulation and watching
  getRelativePath(from: string, to: string): Promise<string>;
  glob(pattern: string): Promise<string[]>;
  watch(
    path: string,
    callback: (eventType: "add" | "change" | "unlink", path: string) => void
  ): Promise<() => void>;
  matchesPattern(path: string, pattern: string): boolean;
  getCommonParent(...paths: string[]): string;

  /** Emits a warning during filesystem operations */
  emitWarning?(warning: Warning): void;
}

/**
 * Operation related types
 */
export type OperationType = "file" | "directory" | "copy" | "move";

export interface FileOperation {
  type: OperationType;
  name: string;
  sourcePath?: string;
}

export interface CreateOptions {
  fs?: FileSystem;
  recursive?: boolean;
}

export interface FileSystemError extends Error {
  code?: string;
  path?: string;
}

export interface OperationResult {
  success: boolean;
  error?: FileSystemError;
  path?: string;
}

/**
 * Represents a warning that occurred during a filesystem operation
 */
export interface Warning {
  /** The type of warning */
  type: "missing_source" | "operation_failed" | "permission_denied" | "other";
  /** A descriptive message about the warning */
  message: string;
  /** The path related to the warning */
  path?: string;
}

import { LogOptions } from "./messages.js";

export interface FileNameReplacement {
  search: string;
  replace: string;
}

export interface CreateStructureOptions extends LogOptions {
  fs: FileSystem;
  fileNameReplacements?: FileNameReplacement[];
  /** Callback for handling warnings */
  onWarning?: (warning: Warning) => void;
  /** Whether to emit verbose warnings */
  verbose?: boolean;
}

/**
 * Represents a structure operation with its target path and details
 */
export interface StructureOperation {
  /** The type of operation (file, directory, copy, move) */
  type: OperationType;
  /** The target path where the operation will be performed */
  targetPath: string;
  /** The source path for copy/move operations */
  sourcePath?: string;
  /** Whether this is a directory operation */
  isDirectory: boolean;
  /** The depth level from the root directory (0 = root level) */
  depth: number;
}

/**
 * Options for getting structure operations
 */
export interface GetStructureOptions {
  /** The root directory path where the structure would be created */
  rootDir: string;
  /** Optional file name replacements to apply */
  fileNameReplacements?: FileNameReplacement[];
}
