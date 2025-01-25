/**
 * Warning types and interfaces
 */

export type WarningType =
  | "missing_source"
  | "operation_failed"
  | "permission_denied";

export interface Warning {
  /** Type of warning */
  type: WarningType;
  /** Descriptive message */
  message: string;
  /** Related path */
  path?: string;
}

/**
 * Message templates for all operations and warnings
 */
export const Messages = {
  // File operations
  CREATED_FILE: (path: string) => string,
  CREATED_DIR: (path: string) => string,
  DIR_EXISTS: (path: string) => string,

  // Copy operations
  COPYING_DIR: (src: string, dest: string) => string,
  COPIED_FILE: (src: string, dest: string) => string,

  // Move operations
  MOVING_DIR: (src: string, dest: string) => string,
  MOVING_FILE: (src: string, dest: string) => string,
  MOVED_SUCCESS: () => string,

  // Warnings
  SOURCE_NOT_FOUND: (path: string) => string,
  SOURCE_ACCESS_ERROR: (path: string) => string,
  PERMISSION_DENIED: (path: string) => string,
  INVALID_SOURCE: (path: string) => string,
  SOURCE_EMPTY: (path: string) => string,
  OPERATION_FAILED: (error: string) => string,
  CREATE_EMPTY_FAILED: (error: string) => string,
  MOVE_FAILED: (error: string) => string,
  COPY_FAILED: (path: string) => string,

  // Structure results
  STRUCTURE_WARNINGS: () => string,
  STRUCTURE_SUCCESS: () => string,
} as const;

export type MessageType = keyof typeof Messages;
