export const EMOJIS = {
  PROCESSING: "🔄",
  FILE: "📄",
  DIRECTORY: "📁",
  COPY: "📋",
  MOVE: "✂️",
  SUCCESS: "✅",
  WARNING: "⚠️",
  CHECK: "✓",
  SPARKLES: "✨",
} as const;

export const MESSAGES = {
  CREATED_FILE: (path: string) => `${EMOJIS.FILE} Created ${path}`,
  CREATED_DIR: (path: string) => `${EMOJIS.DIRECTORY} Created ${path}`,
  DIR_EXISTS: (path: string) =>
    `${EMOJIS.WARNING} Directory already exists: ${path}`,
  COPYING_DIR: (src: string, dest: string) =>
    `${EMOJIS.COPY} Copying directory from ${src} to ${dest}`,
  MOVING_DIR: (src: string, dest: string) =>
    `${EMOJIS.MOVE} Moving directory from ${src} to ${dest}`,
  MOVING_FILE: (src: string, dest: string) =>
    `${EMOJIS.MOVE} Moving file from ${src} to ${dest}`,
  COPIED_FILE: (src: string, dest: string) =>
    `${EMOJIS.SUCCESS} Copied ${src} to ${dest}`,
  MOVED_SUCCESS: () => `${EMOJIS.SUCCESS} Moved successfully`,
  SOURCE_NOT_FOUND: (path: string) =>
    `${EMOJIS.WARNING} Warning: Source not found "${path}", creating empty file`,
  OPERATION_FAILED: (error: string) =>
    `${EMOJIS.WARNING} Warning: Operation failed, creating empty file: ${error}`,
  CREATE_EMPTY_FAILED: (error: string) =>
    `${EMOJIS.WARNING} Warning: Could not create empty file: ${error}`,
  MOVE_FAILED: (error: string) =>
    `${EMOJIS.WARNING} Warning: Failed to move file, falling back to copy: ${error}`,
  COPY_FAILED: (path: string) =>
    `${EMOJIS.WARNING} Warning: Failed to copy "${path}", creating empty file`,
  STRUCTURE_WARNINGS: () =>
    `\n${EMOJIS.WARNING} Structure created with warnings`,
  STRUCTURE_SUCCESS: () =>
    `\n${EMOJIS.SPARKLES} Structure created successfully`,
} as const;
