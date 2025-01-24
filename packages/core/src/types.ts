/**
 * Consolidated type definitions for File Architect Core
 */

import { Messages } from "./warnings.js";

/* File System Types */
export interface FileSystemOptions {
  recursive?: boolean;
  withFileTypes?: boolean;
  fileNameReplacements?: FileNameReplacement[];
  folderNameReplacements?: FileNameReplacement[];
}

export interface DirectoryEntry {
  name: string;
  isDirectory: () => boolean;
}

export interface FileStat {
  isDirectory(): boolean;
  size?: number;
}

export interface FileNameReplacement {
  search: string;
  replace: string;
}

export interface FileSystemError extends Error {
  code?: string;
  path?: string;
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
}

/* Structure Operations */
export type StructureOperationType = "copy" | "move" | "included" | "create";

export interface FileOperation {
  type: StructureOperationType;
  name: string;
  sourcePath?: string;
}

export interface BaseStructureOptions {
  fs?: FileSystem;
  fileNameReplacements?: FileNameReplacement[];
  folderNameReplacements?: FileNameReplacement[];
  recursive?: boolean;
}

export interface GetStructureOptions extends BaseStructureOptions {
  rootDir: string;
}

export interface StructureOperation {
  type: StructureOperationType;
  targetPath: string;
  sourcePath?: string;
  isDirectory: boolean;
  depth: number;
  name: string;
  warning?: string;
}

export interface GetStructureResult {
  operations: StructureOperation[];
  options: Required<GetStructureOptions>;
}

/* Warnings and Messages */
export type WarningType =
  | "missing_source"
  | "operation_failed"
  | "permission_denied";

export interface Warning {
  type: WarningType;
  message: string;
  path?: string;
}

export type MessageType = keyof typeof Messages;

/* Frontmatter Types */
export interface StructureFrontmatter {
  "replace-folder"?: FileNameReplacement[];
  "replace-file"?: FileNameReplacement[];
}
