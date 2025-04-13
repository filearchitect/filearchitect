/**
 * File system interfaces and related types
 */

import type { Warning } from "./warnings.js";

export interface FileSystemOptions {
  recursive?: boolean;
  withFileTypes?: boolean;
  replacements?: {
    all?: FileNameReplacement[];
    files?: FileNameReplacement[];
    folders?: FileNameReplacement[];
  };
  force?: boolean;
}

export interface DirectoryEntry {
  /** Name of the directory entry */
  name: string;
  /** Whether the entry is a directory */
  isDirectory: () => boolean;
}

export interface FileStat {
  /** Check if the path is a directory */
  isDirectory(): boolean;
  /** File size in bytes (optional as directories may not have size) */
  size?: number;
}

export interface FileNameReplacement {
  /** String to search for in file/directory names */
  search: string;
  /** Replacement string */
  replace: string;
}

export interface FileSystemError extends Error {
  /** Error code identifier (e.g. ENOENT, EACCES) */
  code?: string;
  /** Path that caused the error */
  path?: string;
}

/**
 * Core filesystem operations interface.
 * Implemented by NodeFileSystem, BrowserFileSystem, etc.
 */
export interface FileSystem {
  // Core operations
  exists(path: string): Promise<boolean>;
  mkdir(path: string, options?: FileSystemOptions): Promise<void>;
  writeFile(path: string, data: string): Promise<void>;
  readFile(path: string): Promise<string>;
  stat(path: string): Promise<FileStat>;
  readdir(path: string, options?: FileSystemOptions): Promise<DirectoryEntry[]>;
  rm(path: string, options?: FileSystemOptions): Promise<void>;
  unlink(path: string): Promise<void>;
  rename(oldPath: string, newPath: string): Promise<void>;

  // Extended operations
  copyFile(src: string, dest: string): Promise<void>;
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
  // Note: getAllFiles, getAllDirectories moved to path-utils

  // Warning emission
  emitWarning?(warning: Warning): void;
}
