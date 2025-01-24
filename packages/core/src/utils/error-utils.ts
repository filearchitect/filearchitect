/**
 * Centralized error handling utilities
 */
import { FSError } from "../errors.js";
import type { FileSystemError } from "../types/filesystem.js";
import type { Warning } from "../types/warnings.js";

export function handleOperationError(
  error: unknown,
  path: string,
  fallbackType: "file" | "directory",
  fs: { emitWarning?: (warning: Warning) => void }
): FileSystemError {
  if (error instanceof FSError) {
    return error;
  }

  const fsError = error as FileSystemError;
  const warning: Warning = {
    type: "operation_failed",
    message: fsError.message,
    path,
  };

  if (fs.emitWarning) {
    fs.emitWarning(warning);
  }

  // Create fallback entity
  return new FSError(`Failed to create ${fallbackType} at ${path}`, {
    code: "EFAIL",
    path,
  });
}
