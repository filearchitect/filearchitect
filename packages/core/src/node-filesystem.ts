import { watch as fsWatch } from "node:fs";
import * as fsPromises from "node:fs/promises";
import * as pathPromises from "node:path";
import { BaseFileSystem } from "./base-filesystem.js";
import { FSError } from "./errors.js";
import { resolveTildePath } from "./path-utils.js";
import type {
  DirectoryEntry,
  FileStat,
  FileSystem,
  FileSystemOptions,
} from "./types.js";

/**
 * Node.js filesystem implementation
 */
export class NodeFileSystem extends BaseFileSystem {
  async exists(path: string): Promise<boolean> {
    try {
      await fsPromises.access(resolveTildePath(path));
      return true;
    } catch {
      return false;
    }
  }

  async mkdir(path: string, options: FileSystemOptions): Promise<void> {
    const resolvedPath = resolveTildePath(path);
    try {
      await fsPromises.mkdir(resolvedPath, { recursive: options.recursive });
    } catch (error: any) {
      if (error.code === "EEXIST") {
        throw FSError.alreadyExists(path);
      }
      if (error.code === "EACCES") {
        throw FSError.permissionDenied(path);
      }
      throw FSError.operationFailed(error.message, path);
    }
  }

  async writeFile(path: string, data: string): Promise<void> {
    const resolvedPath = resolveTildePath(path);
    try {
      await fsPromises.writeFile(resolvedPath, data);
    } catch (error: any) {
      if (error.code === "EISDIR") {
        throw FSError.isDirectory(path);
      }
      if (error.code === "EACCES") {
        throw FSError.permissionDenied(path);
      }
      throw FSError.operationFailed(error.message, path);
    }
  }

  async readFile(path: string): Promise<string> {
    const resolvedPath = resolveTildePath(path);
    try {
      return await fsPromises.readFile(resolvedPath, "utf-8");
    } catch (error: any) {
      if (error.code === "ENOENT") {
        throw FSError.notFound(path);
      }
      if (error.code === "EISDIR") {
        throw FSError.isDirectory(path);
      }
      if (error.code === "EACCES") {
        throw FSError.permissionDenied(path);
      }
      throw FSError.operationFailed(error.message, path);
    }
  }

  async copyFile(src: string, dest: string): Promise<void> {
    const resolvedSrc = resolveTildePath(src);
    const resolvedDest = resolveTildePath(dest);
    try {
      await fsPromises.copyFile(resolvedSrc, resolvedDest);
    } catch (error: any) {
      if (error.code === "ENOENT") {
        throw FSError.notFound(error.path || src);
      }
      if (error.code === "EACCES") {
        throw FSError.permissionDenied(error.path || src);
      }
      throw FSError.operationFailed(error.message, error.path || src);
    }
  }

  async stat(path: string): Promise<FileStat> {
    const resolvedPath = resolveTildePath(path);
    try {
      const stats = await fsPromises.stat(resolvedPath);
      return {
        isDirectory: () => stats.isDirectory(),
        size: stats.size,
      };
    } catch (error: any) {
      if (error.code === "ENOENT") {
        throw FSError.notFound(path);
      }
      if (error.code === "EACCES") {
        throw FSError.permissionDenied(path);
      }
      throw FSError.operationFailed(error.message, path);
    }
  }

  async isDirectory(path: string): Promise<boolean> {
    const resolvedPath = resolveTildePath(path);
    try {
      const stats = await fsPromises.stat(resolvedPath);
      return stats.isDirectory();
    } catch (error: any) {
      if (error.code === "ENOENT") {
        throw FSError.notFound(path);
      }
      if (error.code === "EACCES") {
        throw FSError.permissionDenied(path);
      }
      throw FSError.operationFailed(error.message, path);
    }
  }

  async readdir(
    path: string,
    options: FileSystemOptions
  ): Promise<DirectoryEntry[]> {
    const resolvedPath = resolveTildePath(path);
    try {
      if (options.withFileTypes) {
        const entries = await fsPromises.readdir(resolvedPath, {
          withFileTypes: true,
        });
        return entries.map((entry) => ({
          name: entry.name,
          isDirectory: () => entry.isDirectory(),
        }));
      }
      const entries = await fsPromises.readdir(resolvedPath);
      return entries.map((name) => ({
        name,
        isDirectory: () => false,
      }));
    } catch (error: any) {
      if (error.code === "ENOENT") {
        throw FSError.notFound(path);
      }
      if (error.code === "ENOTDIR") {
        throw FSError.notDirectory(path);
      }
      if (error.code === "EACCES") {
        throw FSError.permissionDenied(path);
      }
      throw FSError.operationFailed(error.message, path);
    }
  }

  async rm(path: string, options: FileSystemOptions): Promise<void> {
    const resolvedPath = resolveTildePath(path);
    try {
      await fsPromises.rm(resolvedPath, { recursive: options.recursive });
    } catch (error: any) {
      if (error.code === "ENOENT") {
        throw FSError.notFound(path);
      }
      if (error.code === "EACCES") {
        throw FSError.permissionDenied(path);
      }
      throw FSError.operationFailed(error.message, path);
    }
  }

  async unlink(path: string): Promise<void> {
    const resolvedPath = resolveTildePath(path);
    try {
      await fsPromises.unlink(resolvedPath);
    } catch (error: any) {
      if (error.code === "ENOENT") {
        throw FSError.notFound(path);
      }
      if (error.code === "EISDIR") {
        throw FSError.isDirectory(path);
      }
      if (error.code === "EACCES") {
        throw FSError.permissionDenied(path);
      }
      throw FSError.operationFailed(error.message, path);
    }
  }

  async rename(oldPath: string, newPath: string): Promise<void> {
    const resolvedOldPath = resolveTildePath(oldPath);
    const resolvedNewPath = resolveTildePath(newPath);
    try {
      await fsPromises.rename(resolvedOldPath, resolvedNewPath);
    } catch (error: any) {
      if (error.code === "ENOENT") {
        throw FSError.notFound(error.path || oldPath);
      }
      if (error.code === "EACCES") {
        throw FSError.permissionDenied(error.path || oldPath);
      }
      throw FSError.operationFailed(error.message, error.path || oldPath);
    }
  }

  /**
   * Recursively copies a folder and its contents.
   *
   * @param src The source folder path
   * @param dest The destination folder path
   * @param options Additional options
   */
  async copyFolder(
    src: string,
    dest: string,
    options?: FileSystemOptions
  ): Promise<void> {
    return this.copyFolderWithReplacements(src, dest, options);
  }

  /**
   * Moves a folder and its contents.
   * On platforms that support it, this will use a native move operation.
   * Otherwise, it will fall back to copy + delete.
   *
   * @param src The source folder path
   * @param dest The destination folder path
   * @param options Additional options
   */
  async moveFolder(
    src: string,
    dest: string,
    options?: FileSystemOptions
  ): Promise<void> {
    const resolvedSrc = resolveTildePath(src);
    const resolvedDest = resolveTildePath(dest);

    try {
      // Try to use rename first (atomic move operation)
      await this.rename(resolvedSrc, resolvedDest);
    } catch (error: any) {
      // If rename fails (e.g., across devices), fall back to copy + delete
      if (error.code === "EXDEV") {
        await this.copyFolderWithReplacements(
          resolvedSrc,
          resolvedDest,
          options
        );
        await this.rm(resolvedSrc, { recursive: true });
      } else {
        if (error.code === "ENOENT") {
          throw FSError.notFound(src);
        }
        if (error.code === "EACCES") {
          throw FSError.permissionDenied(src);
        }
        throw FSError.operationFailed(error.message, src);
      }
    }
  }

  /**
   * Watch a file or directory for changes
   * @param path The path to watch
   * @param callback Callback to be called when changes occur
   * @returns A function to stop watching
   */
  async watch(
    path: string,
    callback: (eventType: "add" | "change" | "unlink", path: string) => void
  ): Promise<() => void> {
    const watcher = fsWatch(
      path,
      { recursive: true },
      (eventType, filename) => {
        if (!filename) return;

        // Map fs.watch events to our event types
        switch (eventType) {
          case "rename":
            // For rename, we need to check if the file exists to determine if it's an add or unlink
            fsPromises
              .access(pathPromises.join(path, filename))
              .then(() => callback("add", filename))
              .catch(() => callback("unlink", filename));
            break;
          case "change":
            callback("change", filename);
            break;
        }
      }
    );

    return () => watcher.close();
  }
}

// Create and export a default instance
const nodeFileSystem: FileSystem = new NodeFileSystem();
export default nodeFileSystem;
