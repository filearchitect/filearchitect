/**
 * Message templates for all operations and warnings
 */
export const Messages = {
  // File operations
  CREATED_FILE: (path: string) => `Created ${path}`,
  CREATED_DIR: (path: string) => `Created ${path}`,
  DIR_EXISTS: (path: string) => `Directory already exists: ${path}`,

  // Copy operations
  COPYING_DIR: (src: string, dest: string) =>
    `Copying directory from ${src} to ${dest}`,
  COPIED_FILE: (src: string, dest: string) => `Copied ${src} to ${dest}`,

  // Move operations
  MOVING_DIR: (src: string, dest: string) =>
    `Moving directory from ${src} to ${dest}`,
  MOVING_FILE: (src: string, dest: string) =>
    `Moving file from ${src} to ${dest}`,
  MOVED_SUCCESS: () => "Moved successfully",

  // Warnings
  SOURCE_NOT_FOUND: (path: string) =>
    `Source path does not exist. Will be created empty.`,
  SOURCE_ACCESS_ERROR: (path: string) =>
    `Error accessing source path. Will be created empty.`,
  PERMISSION_DENIED: (path: string) =>
    `Permission denied. Will be created empty.`,
  INVALID_SOURCE: (path: string) =>
    `Invalid source path. Will be created empty.`,
  SOURCE_EMPTY: (path: string) =>
    `Source path does not exist. Will be created empty.`,
  OPERATION_FAILED: (error: string) => `Operation failed, creating empty file.`,
  CREATE_EMPTY_FAILED: (error: string) => `Could not create empty file.`,
  MOVE_FAILED: (error: string) => `Failed to move file, falling back to copy.`,
  COPY_FAILED: (path: string) =>
    `Failed to copy "${path}", creating empty file`,

  // Structure results
  STRUCTURE_WARNINGS: () => "\nStructure created with warnings",
  STRUCTURE_SUCCESS: () => "\nStructure created successfully",
} as const;

export type MessageType = keyof typeof Messages;

/**
 * Creates a message from a template
 */
export function createMessage<T extends MessageType>(
  type: T,
  ...args: Parameters<(typeof Messages)[T]>
): string {
  const template = Messages[type] as (...args: any[]) => string;
  return template(...args);
}
