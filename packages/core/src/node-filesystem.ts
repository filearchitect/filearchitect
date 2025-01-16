import fs from "fs";
import path from "path";
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
export class NodeFileSystem implements FileSystem {
  async exists(path: string): Promise<boolean> {
    try {
      await fs.promises.access(resolveTildePath(path));
      return true;
    } catch {
      return false;
    }
  }

  async mkdir(path: string, options: FileSystemOptions): Promise<void> {
    const resolvedPath = resolveTildePath(path);
    try {
      await fs.promises.mkdir(resolvedPath, { recursive: options.recursive });
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
      await fs.promises.writeFile(resolvedPath, data);
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
      return await fs.promises.readFile(resolvedPath, "utf-8");
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
      await fs.promises.copyFile(resolvedSrc, resolvedDest);
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
      const stats = await fs.promises.stat(resolvedPath);
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
      const stats = await fs.promises.stat(resolvedPath);
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
        const entries = await fs.promises.readdir(resolvedPath, {
          withFileTypes: true,
        });
        return entries.map((entry) => ({
          name: entry.name,
          isDirectory: () => entry.isDirectory(),
        }));
      }
      const entries = await fs.promises.readdir(resolvedPath);
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
      await fs.promises.rm(resolvedPath, { recursive: options.recursive });
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
      await fs.promises.unlink(resolvedPath);
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
      await fs.promises.rename(resolvedOldPath, resolvedNewPath);
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
    const resolvedSrc = resolveTildePath(src);
    const resolvedDest = resolveTildePath(dest);

    try {
      // Create destination directory if it doesn't exist
      await this.mkdir(resolvedDest, { recursive: true });

      // Read source directory contents
      const entries = await this.readdir(resolvedSrc, { withFileTypes: true });

      // Copy each entry
      for (const entry of entries) {
        const srcPath = path.join(resolvedSrc, entry.name);
        const destPath = path.join(resolvedDest, entry.name);

        if (entry.isDirectory()) {
          // Recursively copy subdirectories
          await this.copyFolder(srcPath, destPath, options);
        } else {
          // Copy files
          await this.copyFile(srcPath, destPath);
        }
      }
    } catch (error: any) {
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

// Create and export a default instance
const nodeFileSystem: FileSystem = new NodeFileSystem();
export default nodeFileSystem;
