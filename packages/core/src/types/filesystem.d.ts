/**
 * File system interfaces and related types
 */

export interface FileSystemOptions {
  recursive?: boolean;
  withFileTypes?: boolean;
  fileNameReplacements?: FileNameReplacement[];
  folderNameReplacements?: FileNameReplacement[];
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

  // ... rest of FileSystem methods remain the same ...
}
