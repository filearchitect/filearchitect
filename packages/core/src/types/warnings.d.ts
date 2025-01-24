/**
 * Warning types and interfaces
 */

export interface Warning {
  /** Type of warning */
  type: "missing_source" | "operation_failed" | "permission_denied" | "other";
  /** Descriptive message */
  message: string;
  /** Related path */
  path?: string;
}

export type MessageType = keyof typeof Messages;

/**
 * Message templates for all operations and warnings
 */
export const Messages = {
  // ... existing Messages object content ...
} as const;
