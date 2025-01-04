import os from "os";
import path from "path";
import process from "process";

/**
 * Resolves a path that may contain a tilde (~) to represent the home directory.
 */
export function resolveTildePath(filePath: string): string {
  if (filePath.startsWith("~")) {
    return path.join(os.homedir(), filePath.slice(1));
  }
  return filePath;
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
 * Gets the parent directory of a path.
 */
export function getParentDirectory(filePath: string): string {
  return path.dirname(filePath);
}

/**
 * Gets the base name of a path.
 */
export function getBaseName(filePath: string): string {
  return path.basename(filePath);
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
