export interface LogOptions {
  verbose?: boolean;
}

interface MessageConfig {
  emoji: string;
  template: (...args: any[]) => string;
  alwaysShow: boolean;
}

// Message definitions with their configuration
export const Messages = {
  // File operations
  CREATED_FILE: {
    emoji: "",
    template: (path: string) => `Created ${path}`,
    alwaysShow: true,
  },
  CREATED_DIR: {
    emoji: "",
    template: (path: string) => `Created ${path}`,
    alwaysShow: true,
  },
  DIR_EXISTS: {
    emoji: "📁",
    template: (path: string) => `Directory already exists: ${path}`,
    alwaysShow: false,
  },

  // Copy operations
  COPYING_DIR: {
    emoji: "",
    template: (src: string, dest: string) =>
      `Copying directory from ${src} to ${dest}`,
    alwaysShow: true,
  },
  COPIED_FILE: {
    emoji: "",
    template: (src: string, dest: string) => `Copied ${src} to ${dest}`,
    alwaysShow: true,
  },

  // Move operations
  MOVING_DIR: {
    emoji: "✂️",
    template: (src: string, dest: string) =>
      `Moving directory from ${src} to ${dest}`,
    alwaysShow: true,
  },
  MOVING_FILE: {
    emoji: "✂️",
    template: (src: string, dest: string) =>
      `Moving file from ${src} to ${dest}`,
    alwaysShow: true,
  },
  MOVED_SUCCESS: {
    emoji: "✅",
    template: () => "Moved successfully",
    alwaysShow: false,
  },

  // Warnings and errors
  SOURCE_NOT_FOUND: {
    emoji: "⚠️",
    template: (path: string) =>
      `Warning: Source not found "${path}", creating empty file`,
    alwaysShow: true,
  },
  OPERATION_FAILED: {
    emoji: "⚠️",
    template: (error: string) =>
      `Warning: Operation failed, creating empty file: ${error}`,
    alwaysShow: true,
  },
  CREATE_EMPTY_FAILED: {
    emoji: "⚠️",
    template: (error: string) =>
      `Warning: Could not create empty file: ${error}`,
    alwaysShow: true,
  },
  MOVE_FAILED: {
    emoji: "⚠️",
    template: (error: string) =>
      `Warning: Failed to move file, falling back to copy: ${error}`,
    alwaysShow: true,
  },
  COPY_FAILED: {
    emoji: "⚠️",
    template: (path: string) =>
      `Warning: Failed to copy "${path}", creating empty file`,
    alwaysShow: true,
  },

  // Structure results
  STRUCTURE_WARNINGS: {
    emoji: "⚠️",
    template: () => "\nStructure created with warnings",
    alwaysShow: true,
  },
  STRUCTURE_SUCCESS: {
    emoji: "✨",
    template: () => "\nStructure created successfully",
    alwaysShow: false,
  },
} as const;

// Helper function to format a message with its emoji
function formatMessage(config: MessageConfig, ...args: any[]): string {
  return `${config.emoji} ${config.template(...args)}`;
}

export function logMessage(
  type: keyof typeof Messages,
  args: any[],
  options: LogOptions = {}
): void {
  const { verbose = false } = options;
  const config = Messages[type];

  if (config.alwaysShow || verbose) {
    console.log(formatMessage(config, ...args));
  }
}

export function logWarning(type: keyof typeof Messages, args: any[]): void {
  const config = Messages[type];
  console.warn(formatMessage(config, ...args));
}

export function logSuccess(
  type: keyof typeof Messages,
  args: any[],
  options: LogOptions = {}
): void {
  const { verbose = false } = options;
  const config = Messages[type];

  if (config.alwaysShow || verbose) {
    console.log(formatMessage(config, ...args));
  }
}

export function logOperation(
  type: string,
  line: string,
  options: LogOptions = {}
): void {
  const { verbose = false } = options;
  if (verbose) {
    console.log("🔄 " + type.toUpperCase() + ": " + line.trim());
  }
}

export function logStructureResult(
  hasWarnings: boolean,
  options: LogOptions = {}
): void {
  if (hasWarnings) {
    logMessage("STRUCTURE_WARNINGS", [], options);
  } else {
    logMessage("STRUCTURE_SUCCESS", [], options);
  }
}
