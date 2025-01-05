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
  exists(path: string): boolean | Promise<boolean>;
  mkdir(path: string, options?: FileSystemOptions): void | Promise<void>;
  writeFile(path: string, data: string): void | Promise<void>;
  readFile(path: string): string | Promise<string>;
  copyFile(src: string, dest: string): void | Promise<void>;
  stat(path: string): FileStat | Promise<FileStat>;
  readdir(
    path: string,
    options?: FileSystemOptions
  ): DirectoryEntry[] | Promise<DirectoryEntry[]>;
  rm(path: string, options?: FileSystemOptions): void | Promise<void>;
  unlink(path: string): void | Promise<void>;
  rename(oldPath: string, newPath: string): void | Promise<void>;
  isDirectory(path: string): Promise<boolean>;
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
