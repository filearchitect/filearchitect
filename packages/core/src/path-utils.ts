import os from "os";
import path from "path";
import process from "process";
import { FSError } from "./errors.js";

/**
 * Resolves a path that may contain a tilde (~) to represent the home directory.
 */
export function resolveTildePath(filePath: string): string {
  if (filePath.startsWith("~")) {
    return path.join(os.homedir(), filePath.slice(1));
  }
  return path.resolve(filePath);
}

/**
 * Resolves a source path to an absolute path.
 */
export function resolveSourcePath(sourcePath: string): string {
  return path.isAbsolute(sourcePath)
    ? sourcePath
    : path.resolve(process.cwd(), sourcePath);
}

/**
 * Joins path segments.
 */
export function joinPaths(...paths: string[]): string {
  return path.join(...paths);
}

/**
 * Checks if a path has a file extension.
 */
export function hasFileExtension(filePath: string): boolean {
  return path.extname(filePath).length > 0;
}

/**
 * Gets the file extension of a path.
 */
export function getFileExtension(filePath: string): string {
  return path.extname(filePath);
}

export function validatePathSegments(...segments: string[]): string {
  const fullPath = path.join(...segments);

  if (/(^|\/)\.[^\/]|\.\.($|\/)/.test(fullPath)) {
    throw new FSError("Invalid path containing . or .. segments", {
      code: "EINVAL",
      path: fullPath,
    });
  }

  return fullPath;
}

export function sanitizeFileName(name: string): string {
  return name.replace(/[^a-z0-9\-_.]/gi, "_");
}

export function ensureValidPath(...segments: string[]): string {
  return validatePathSegments(...segments);
}

export function sanitizedJoin(...segments: string[]): string {
  return joinPaths(...segments.map(sanitizeFileName));
}
