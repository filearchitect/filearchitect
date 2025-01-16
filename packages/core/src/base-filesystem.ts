import {
  DirectoryEntry,
  FileStat,
  FileSystem,
  FileSystemOptions,
} from "./types.js";

/**
 * Base class with shared filesystem implementations.
 */
export abstract class BaseFileSystem implements FileSystem {
  abstract exists(path: string): boolean | Promise<boolean>;
  abstract mkdir(
    path: string,
    options?: FileSystemOptions
  ): void | Promise<void>;
  abstract writeFile(path: string, data: string): void | Promise<void>;
  abstract readFile(path: string): string | Promise<string>;
  abstract copyFile(src: string, dest: string): void | Promise<void>;
  abstract copyFolder(
    src: string,
    dest: string,
    options?: FileSystemOptions
  ): Promise<void>;
  abstract moveFolder(
    src: string,
    dest: string,
    options?: FileSystemOptions
  ): Promise<void>;
  abstract stat(path: string): FileStat | Promise<FileStat>;
  abstract readdir(
    path: string,
    options?: FileSystemOptions
  ): DirectoryEntry[] | Promise<DirectoryEntry[]>;
  abstract rm(path: string, options?: FileSystemOptions): void | Promise<void>;
  abstract unlink(path: string): void | Promise<void>;
  abstract rename(oldPath: string, newPath: string): void | Promise<void>;
  abstract isDirectory(path: string): Promise<boolean>;

  /**
   * Ensures a directory exists, creating it and any necessary parent directories.
   */
  async ensureDir(path: string): Promise<void> {
    await this.mkdir(path, { recursive: true });
  }

  /**
   * Empties a directory without removing it.
   */
  async emptyDir(path: string): Promise<void> {
    try {
      await this.rm(path, { recursive: true });
    } catch (error: any) {
      // Ignore if directory doesn't exist
      if (error.code !== "ENOENT") {
        throw error;
      }
    }
    await this.mkdir(path, { recursive: true });
  }

  /**
   * Smart copy that handles both files and directories.
   */
  async copy(
    src: string,
    dest: string,
    options?: FileSystemOptions
  ): Promise<void> {
    const stat = await this.stat(src);
    if (stat.isDirectory()) {
      await this.copyFolder(src, dest, options);
    } else {
      await this.copyFile(src, dest);
    }
  }

  /**
   * Smart move that handles both files and directories.
   */
  async move(
    src: string,
    dest: string,
    options?: FileSystemOptions
  ): Promise<void> {
    const stat = await this.stat(src);
    if (stat.isDirectory()) {
      await this.moveFolder(src, dest, options);
    } else {
      await this.rename(src, dest);
    }
  }

  /**
   * Checks if a path exists and is of a specific type.
   */
  async existsAs(path: string, type: "file" | "directory"): Promise<boolean> {
    try {
      const stat = await this.stat(path);
      return type === "directory" ? stat.isDirectory() : !stat.isDirectory();
    } catch {
      return false;
    }
  }
}
