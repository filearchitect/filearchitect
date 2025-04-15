import os from "os";
import path from "path";

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
 * Gets the directory name of a path.
 */
export function getDirname(filePath: string): string {
  return path.dirname(filePath);
}

/**
 * Gets the base name of a path.
 */
export function getBasename(filePath: string): string {
  return path.basename(filePath);
}

/**
 * The platform-specific path segment separator.
 * '\\' on Windows, '/' on POSIX.
 */
export const pathSeparator = path.sep;
