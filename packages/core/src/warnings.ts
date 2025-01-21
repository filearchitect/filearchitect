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
  SOURCE_NOT_FOUND: (path: string) => `Source path does not exist: ${path}`,
  SOURCE_ACCESS_ERROR: (path: string) => `Error accessing source path: ${path}`,
  PERMISSION_DENIED: (path: string) => `Permission denied: ${path}`,
  INVALID_SOURCE: (path: string) => `Invalid source path: ${path}`,
  SOURCE_EMPTY: (path: string) =>
    `Source path does not exist. Will be created empty: ${path}`,
  OPERATION_FAILED: (error: string) =>
    `Operation failed, creating empty file: ${error}`,
  CREATE_EMPTY_FAILED: (error: string) =>
    `Could not create empty file: ${error}`,
  MOVE_FAILED: (error: string) =>
    `Failed to move file, falling back to copy: ${error}`,
  COPY_FAILED: (path: string) =>
    `Failed to copy "${path}", creating empty file`,

  // Structure results
  STRUCTURE_WARNINGS: () => "\nStructure created with warnings",
  STRUCTURE_SUCCESS: () => "\nStructure created successfully",
} as const;

export type MessageType = keyof typeof Messages;

/**
 * Configuration for message display
 */
export const MessageConfig: Record<MessageType, { alwaysShow: boolean }> = {
  // File operations
  CREATED_FILE: { alwaysShow: true },
  CREATED_DIR: { alwaysShow: true },
  DIR_EXISTS: { alwaysShow: false },

  // Copy operations
  COPYING_DIR: { alwaysShow: true },
  COPIED_FILE: { alwaysShow: true },

  // Move operations
  MOVING_DIR: { alwaysShow: true },
  MOVING_FILE: { alwaysShow: true },
  MOVED_SUCCESS: { alwaysShow: false },

  // Warnings
  SOURCE_NOT_FOUND: { alwaysShow: true },
  SOURCE_ACCESS_ERROR: { alwaysShow: true },
  PERMISSION_DENIED: { alwaysShow: true },
  INVALID_SOURCE: { alwaysShow: true },
  SOURCE_EMPTY: { alwaysShow: true },
  OPERATION_FAILED: { alwaysShow: true },
  CREATE_EMPTY_FAILED: { alwaysShow: true },
  MOVE_FAILED: { alwaysShow: true },
  COPY_FAILED: { alwaysShow: true },

  // Structure results
  STRUCTURE_WARNINGS: { alwaysShow: true },
  STRUCTURE_SUCCESS: { alwaysShow: false },
};

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
