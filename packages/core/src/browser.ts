import { FSError } from "./errors";
import {
  DirectoryEntry,
  FileStat,
  FileSystem,
  FileSystemOptions,
} from "./types";

/**
 * Browser-specific implementation of the FileSystem interface
 */
export class BrowserFileSystem implements FileSystem {
  constructor(private baseUrl: string = "/fs") {}

  async exists(path: string): Promise<boolean> {
    try {
      const response = await fetch(
        `${this.baseUrl}/exists?path=${encodeURIComponent(path)}`
      );
      if (!response.ok) {
        return false;
      }
      return true;
    } catch {
      return false;
    }
  }

  async mkdir(path: string, options: FileSystemOptions): Promise<void> {
    const response = await fetch(`${this.baseUrl}/mkdir`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ path, options }),
    });

    if (!response.ok) {
      const error = await response.json();
      if (error.code === "EEXIST") {
        throw FSError.alreadyExists(path);
      }
      if (error.code === "EACCES") {
        throw FSError.permissionDenied(path);
      }
      throw FSError.operationFailed(
        error.message || "Failed to create directory",
        path
      );
    }
  }

  async writeFile(path: string, data: string): Promise<void> {
    const response = await fetch(`${this.baseUrl}/writeFile`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ path, data }),
    });

    if (!response.ok) {
      const error = await response.json();
      if (error.code === "EISDIR") {
        throw FSError.isDirectory(path);
      }
      if (error.code === "EACCES") {
        throw FSError.permissionDenied(path);
      }
      throw FSError.operationFailed(
        error.message || "Failed to write file",
        path
      );
    }
  }

  async readFile(path: string): Promise<string> {
    const response = await fetch(
      `${this.baseUrl}/readFile?path=${encodeURIComponent(path)}`
    );

    if (!response.ok) {
      const error = await response.json();
      if (error.code === "ENOENT") {
        throw FSError.notFound(path);
      }
      if (error.code === "EISDIR") {
        throw FSError.isDirectory(path);
      }
      if (error.code === "EACCES") {
        throw FSError.permissionDenied(path);
      }
      throw FSError.operationFailed(
        error.message || "Failed to read file",
        path
      );
    }

    return response.text();
  }

  async copyFile(src: string, dest: string): Promise<void> {
    const response = await fetch(`${this.baseUrl}/copyFile`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ src, dest }),
    });

    if (!response.ok) {
      const error = await response.json();
      if (error.code === "ENOENT") {
        throw FSError.notFound(error.path || src);
      }
      if (error.code === "EACCES") {
        throw FSError.permissionDenied(error.path || src);
      }
      throw FSError.operationFailed(
        error.message || "Failed to copy file",
        error.path || src
      );
    }
  }

  async stat(path: string): Promise<FileStat> {
    const response = await fetch(
      `${this.baseUrl}/stat?path=${encodeURIComponent(path)}`
    );

    if (!response.ok) {
      const error = await response.json();
      if (error.code === "ENOENT") {
        throw FSError.notFound(path);
      }
      if (error.code === "EACCES") {
        throw FSError.permissionDenied(path);
      }
      throw FSError.operationFailed(
        error.message || "Failed to get file stats",
        path
      );
    }

    const data = await response.json();
    return {
      isDirectory: () => data.isDirectory,
    };
  }

  async readdir(
    path: string,
    options: FileSystemOptions
  ): Promise<DirectoryEntry[]> {
    const response = await fetch(
      `${this.baseUrl}/readdir?path=${encodeURIComponent(path)}&withFileTypes=${
        options.withFileTypes
      }`
    );

    if (!response.ok) {
      const error = await response.json();
      if (error.code === "ENOENT") {
        throw FSError.notFound(path);
      }
      if (error.code === "ENOTDIR") {
        throw FSError.notDirectory(path);
      }
      if (error.code === "EACCES") {
        throw FSError.permissionDenied(path);
      }
      throw FSError.operationFailed(
        error.message || "Failed to read directory",
        path
      );
    }

    const entries = await response.json();
    return entries.map((entry: any) => ({
      name: entry.name,
      isDirectory: () => entry.isDirectory,
    }));
  }

  async rm(path: string, options: FileSystemOptions): Promise<void> {
    const response = await fetch(`${this.baseUrl}/rm`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ path, options }),
    });

    if (!response.ok) {
      const error = await response.json();
      if (error.code === "ENOENT") {
        throw FSError.notFound(path);
      }
      if (error.code === "EACCES") {
        throw FSError.permissionDenied(path);
      }
      throw FSError.operationFailed(
        error.message || "Failed to remove file or directory",
        path
      );
    }
  }

  async unlink(path: string): Promise<void> {
    const response = await fetch(`${this.baseUrl}/unlink`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ path }),
    });

    if (!response.ok) {
      const error = await response.json();
      if (error.code === "ENOENT") {
        throw FSError.notFound(path);
      }
      if (error.code === "EISDIR") {
        throw FSError.isDirectory(path);
      }
      if (error.code === "EACCES") {
        throw FSError.permissionDenied(path);
      }
      throw FSError.operationFailed("Failed to unlink file", path);
    }
  }

  async rename(oldPath: string, newPath: string): Promise<void> {
    const response = await fetch(`${this.baseUrl}/rename`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ oldPath, newPath }),
    });

    if (!response.ok) {
      const error = await response.json();
      if (error.code === "ENOENT") {
        throw FSError.notFound(error.path || oldPath);
      }
      if (error.code === "EACCES") {
        throw FSError.permissionDenied(error.path || oldPath);
      }
      throw FSError.operationFailed(
        error.message || "Failed to rename file or directory",
        error.path || oldPath
      );
    }
  }
}

// Re-export the core functionality
export { createStructureFromString } from "./index";
