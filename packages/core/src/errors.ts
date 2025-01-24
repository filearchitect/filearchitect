import { FileSystemError } from "./types.js";

export class FSError extends Error implements FileSystemError {
  code?: string;
  path?: string;

  constructor(message: string, options: { code?: string; path?: string } = {}) {
    super(message);
    this.name = "FSError";
    this.code = options.code;
    this.path = options.path;
  }

  static notFound(path: string): FSError {
    return new FSError(`File or directory not found: ${path}`, {
      code: "ENOENT",
      path,
    });
  }

  static alreadyExists(path: string): FSError {
    return new FSError(`File or directory already exists: ${path}`, {
      code: "EEXIST",
      path,
    });
  }

  static notDirectory(path: string): FSError {
    return new FSError(`Not a directory: ${path}`, {
      code: "ENOTDIR",
      path,
    });
  }

  static isDirectory(path: string): FSError {
    return new FSError(`Is a directory: ${path}`, {
      code: "EISDIR",
      path,
    });
  }

  static permissionDenied(path: string): FSError {
    return new FSError(`Permission denied: ${path}`, {
      code: "EACCES",
      path,
    });
  }

  static operationFailed(message: string, path?: string): FSError {
    return new FSError(`Operation failed: ${message}`, {
      code: "EFAIL",
      path,
    });
  }
}
