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

import { LogOptions } from "./messages.js";

export interface FileNameReplacement {
  search: string;
  replace: string;
}

export interface CreateStructureOptions extends LogOptions {
  fs: FileSystem;
  fileNameReplacements?: FileNameReplacement[];
}
