import type {
  DirectoryEntry,
  FileStat,
  FileSystem,
  FileSystemOptions,
  Warning,
} from "./types.js";
import * as pathUtils from "./path-utils.js"; // Import path utils
import { handleOperationError } from "./utils/error-utils.js";
import { applyReplacements } from "./utils/replacements.js";
import { createMessage } from "./warnings.js";

/**
 * Base class with shared filesystem implementations.
 */
export abstract class BaseFileSystem implements FileSystem {
  protected onWarning?: (warning: Warning) => void;

  /**
   * Sets the warning handler for this filesystem
   */
  setWarningHandler(handler: (warning: Warning) => void) {
    this.onWarning = handler;
  }

  /**
   * Emits a warning through the warning handler if one is set
   */
  emitWarning(warning: Warning): void {
    this.onWarning?.(warning);
  }

  abstract exists(path: string): Promise<boolean>;
  abstract mkdir(path: string, options?: FileSystemOptions): Promise<void>;
  abstract writeFile(path: string, data: string): Promise<void>;
  abstract readFile(path: string): Promise<string>;
  abstract copyFile(src: string, dest: string): Promise<void>;
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
  abstract stat(path: string): Promise<FileStat>;
  abstract readdir(
    path: string,
    options?: FileSystemOptions
  ): Promise<DirectoryEntry[]>;
  abstract rm(path: string, options?: FileSystemOptions): Promise<void>;
  abstract unlink(path: string): Promise<void>;
  abstract rename(oldPath: string, newPath: string): Promise<void>;
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
    try {
      const stat = await this.stat(src);
      if (stat.isDirectory()) {
        await this.copyFolder(src, dest, options);
      } else {
        await this.copyFile(src, dest);
      }
    } catch (error: any) {
      if (error.code === "ENOENT") {
        this.emitWarning({
          type: "missing_source",
          message: createMessage("SOURCE_NOT_FOUND", src),
          path: src,
        });
      }
      throw error;
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
    try {
      const stat = await this.stat(src);
      if (stat.isDirectory()) {
        await this.moveFolder(src, dest, options);
      } else {
        await this.rename(src, dest);
      }
    } catch (error: any) {
      if (error.code === "ENOENT") {
        this.emitWarning({
          type: "missing_source",
          message: createMessage("SOURCE_EMPTY", src),
          path: src,
        });
      }
      throw error;
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

  /**
   * Ensures a file exists, creating it if it doesn't.
   * If the file exists, it won't be modified.
   */
  async ensureFile(path: string): Promise<void> {
    try {
      await this.stat(path);
    } catch {
      // Create parent directory if needed
      const parentDir = pathUtils.getDirname(path); // Use pathUtils.getDirname (assuming this is the exported name)
      if (parentDir && parentDir !== '.') { // Check if parentDir is valid
        await this.ensureDir(parentDir);
      }
      await this.writeFile(path, ""); // Create empty file
    }
  }

  /**
   * Removes a file or directory and all its contents.
   * Does not throw if the path doesn't exist.
   */
  async remove(path: string): Promise<void> {
    try {
      const stat = await this.stat(path);
      if (stat.isDirectory()) {
        await this.rm(path, { recursive: true });
      } else {
        await this.unlink(path);
      }
    } catch (error: any) {
      // Ignore if path doesn't exist
      if (error.code !== "ENOENT") {
        throw error;
      }
    }
  }

  /**
   * Checks if a directory is empty.
   */
  async isEmptyDir(path: string): Promise<boolean> {
    try {
      const entries = await this.readdir(path, { withFileTypes: true });
      return entries.length === 0;
    } catch {
      return false;
    }
  }

  /**
   * Reads a file if it exists, returns default content if it doesn't.
   */
  async readFileOrDefault(
    path: string,
    defaultContent: string = ""
  ): Promise<string> {
    try {
      return await this.readFile(path);
    } catch {
      return defaultContent;
    }
  }

  /**
   * Ensures a directory exists and is empty.
   */
  async ensureEmptyDir(path: string): Promise<void> {
    await this.emptyDir(path);
    await this.ensureDir(path);
  }

  /**
   * Copies a file or directory only if the destination doesn't exist.
   * Returns true if copied, false if destination already exists.
   */
  async copyIfNotExists(
    src: string,
    dest: string,
    options?: FileSystemOptions
  ): Promise<boolean> {
    if (await this.exists(dest)) {
      return false;
    }
    await this.copy(src, dest, options);
    return true;
  }

  /**
   * Moves a file or directory only if the destination doesn't exist.
   * Returns true if moved, false if destination already exists.
   */
  async moveIfNotExists(
    src: string,
    dest: string,
    options?: FileSystemOptions
  ): Promise<boolean> {
    if (await this.exists(dest)) {
      return false;
    }
    await this.move(src, dest, options);
    return true;
  }

  /*
   * Note: Methods getAllFiles, getAllDirectories, getRelativePath, glob, matchesPattern, getCommonParent
   * have been moved to path-utils.ts
   */
  protected async copyFolderWithReplacements(
    src: string,
    dest: string,
    options: FileSystemOptions = {}
  ): Promise<void> {
    const { recursive = true } = options;
    const fileNameReplacements = options.replacements?.files || [];
    const folderNameReplacements = options.replacements?.folders || [];

    // Create the destination directory
    await this.mkdir(dest, { recursive: true });

    // Read the source directory
    let entries: DirectoryEntry[];
     try {
        entries = await this.readdir(src, { withFileTypes: true });
     } catch (error: any) {
         if (error.code === 'ENOENT') {
             this.emitWarning({
                 type: 'missing_source',
                 message: createMessage('SOURCE_NOT_FOUND', src),
                 path: src,
             });
             return; // Stop if source doesn't exist
         }
         throw error; // Re-throw other errors
     }


    // Copy each entry
    for (const entry of entries) {
      const srcPath = pathUtils.joinPaths(src, entry.name); // Use pathUtils.joinPaths
      const isDirectory = entry.isDirectory();

      // Apply replacements based on whether it's a file or directory
      const replacedName = applyReplacements(
        entry.name,
        isDirectory ? folderNameReplacements : fileNameReplacements
      );

      const destPath = pathUtils.joinPaths(dest, replacedName); // Use pathUtils.joinPaths

      if (isDirectory) {
        // Only recurse if the recursive option is true (it defaults to true)
        if (recursive) {
          // Recursively copy subdirectory
          await this.copyFolderWithReplacements(srcPath, destPath, options);
        }
        // If not recursive, we might still need to create the empty dir structure?
        // Current logic assumes if recursive=false, we only copy top-level files.
        // Let's stick to this interpretation for now. If recursive is false, subdirs are ignored.

      } else {
        // Copy file
        await this.copyFile(srcPath, destPath);
      }
    }
  }

  protected async handleFileOperation<T>(
    operation: () => Promise<T>,
    path: string,
    fallbackType: "file" | "directory"
  ): Promise<T> {
    try {
      return await operation();
    } catch (error) {
      const fsError = handleOperationError(error, path, fallbackType, this);
      this.emitWarning({
        type: "operation_failed",
        message: fsError.message,
        path,
      });
      throw fsError;
    }
  }
}
