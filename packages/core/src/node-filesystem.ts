import fs from "fs";
import { FSError } from "./errors.js";
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
      await fs.promises.access(path);
      return true;
    } catch {
      return false;
    }
  }

  async mkdir(path: string, options: FileSystemOptions): Promise<void> {
    try {
      await fs.promises.mkdir(path, { recursive: options.recursive });
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
    try {
      await fs.promises.writeFile(path, data);
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
    try {
      return await fs.promises.readFile(path, "utf-8");
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
    try {
      await fs.promises.copyFile(src, dest);
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
    try {
      const stats = await fs.promises.stat(path);
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
    try {
      const stats = await fs.promises.stat(path);
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
    try {
      if (options.withFileTypes) {
        const entries = await fs.promises.readdir(path, {
          withFileTypes: true,
        });
        return entries.map((entry) => ({
          name: entry.name,
          isDirectory: () => entry.isDirectory(),
        }));
      }
      const entries = await fs.promises.readdir(path);
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
    try {
      await fs.promises.rm(path, { recursive: options.recursive });
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
    try {
      await fs.promises.unlink(path);
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
    try {
      await fs.promises.rename(oldPath, newPath);
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
}

// Create and export a default instance
const nodeFileSystem: FileSystem = new NodeFileSystem();
export default nodeFileSystem;
