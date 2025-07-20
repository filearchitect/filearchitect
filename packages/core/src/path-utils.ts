import os from "os";
import path from "path";

const isBrowser = typeof window !== "undefined";

/**
 * The platform-specific path segment separator.
 * '\' on Windows, '/' on POSIX/Browser.
 */
export const pathSeparator = isBrowser ? "/" : path.sep;

/**
 * Resolves a path that may contain a tilde (~) to represent the home directory.
 * No-op in browser environments.
 */
export function resolveTildePath(filePath: string): string {
  if (isBrowser || !filePath.startsWith("~")) {
    return filePath; // Cannot resolve ~ in browser, or no ~ present
  }
  // Node.js environment with tilde
  return path.join(os.homedir(), filePath.slice(1));
}

/**
 * Checks if a path contains escaped dots (backslash followed by dot).
 */
export function hasEscapedDot(filePath: string): boolean {
  return filePath.includes("\\.");
}

/**
 * Removes backslashes from escaped dots in a path.
 * Converts "\." to "." to create the actual file/directory name.
 */
export function unescapeDots(filePath: string): string {
  return filePath.replace(/\\\./g, ".");
}

/**
 * Checks if a path has a file extension, considering escaped dots.
 * Escaped dots (\.) are ignored when determining file extension.
 * If the path contains only escaped dots, it's considered a directory.
 */
export function hasFileExtensionIgnoreEscaped(filePath: string): boolean {
  // If there are escaped dots, we need to check if there are any unescaped dots
  if (hasEscapedDot(filePath)) {
    // Temporarily replace escaped dots with a placeholder to check for real extensions
    const pathWithPlaceholders = filePath.replace(/\\\./g, "__ESCAPED_DOT__");
    const hasRealExtension = isBrowser
      ? browserHasFileExtension(pathWithPlaceholders)
      : path.extname(pathWithPlaceholders).length > 0;
    return hasRealExtension;
  }

  // No escaped dots, use normal logic
  return hasFileExtension(filePath);
}

// --- Browser-safe path functions (using POSIX separator '/') ---

function browserJoinPaths(...paths: string[]): string {
  const relevantPaths = paths.filter((p) => p);
  if (relevantPaths.length === 0) return ".";

  let joined = relevantPaths.join("/");

  // Normalize, removing redundant slashes, but preserve leading/trailing slashes if present
  // This is a simplified normalization
  joined = joined.replace(/\/{2,}/g, "/");

  return joined;
}

function browserHasFileExtension(filePath: string): boolean {
  const lastDotIndex = filePath.lastIndexOf(".");
  const lastSeparatorIndex = filePath.lastIndexOf("/");
  // Ensure dot exists, is not the only character, and appears after the last separator
  return lastDotIndex > 0 && lastDotIndex > lastSeparatorIndex;
}

function browserGetDirname(filePath: string): string {
  const lastSeparatorIndex = filePath.lastIndexOf("/");
  if (lastSeparatorIndex === -1) {
    return "."; // No directory part
  }
  if (lastSeparatorIndex === 0) {
    return "/"; // Root directory
  }
  return filePath.substring(0, lastSeparatorIndex) || "/"; // Handle cases like '/file'
}

function browserGetBasename(filePath: string): string {
  const lastSeparatorIndex = filePath.lastIndexOf("/");
  return filePath.substring(lastSeparatorIndex + 1);
}

// --- Exported path functions using conditional logic ---

/**
 * Joins path segments using the appropriate separator ('/' in browser).
 */
export function joinPaths(...paths: string[]): string {
  return isBrowser ? browserJoinPaths(...paths) : path.join(...paths);
}

/**
 * Checks if a path has a file extension.
 */
export function hasFileExtension(filePath: string): boolean {
  return isBrowser
    ? browserHasFileExtension(filePath)
    : path.extname(filePath).length > 0;
}

/**
 * Gets the directory name of a path.
 */
export function getDirname(filePath: string): string {
  return isBrowser ? browserGetDirname(filePath) : path.dirname(filePath);
}

/**
 * Gets the base name of a path.
 */
export function getBasename(filePath: string): string {
  return isBrowser ? browserGetBasename(filePath) : path.basename(filePath);
}
