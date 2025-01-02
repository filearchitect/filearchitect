export interface LogOptions {
  verbose?: boolean;
}

export interface OperationLog {
  type: "create" | "copy" | "move" | "skip";
  path: string;
  sourcePath?: string;
  isDirectory: boolean;
}

export class LogCollector {
  private operations: OperationLog[] = [];
  private rootDir: string = "";

  addOperation(operation: OperationLog): void {
    this.operations.push(operation);
  }

  getOperations(): OperationLog[] {
    return this.operations;
  }

  clear(): void {
    this.operations = [];
    this.rootDir = "";
  }

  setRootDir(rootDir: string): void {
    this.rootDir = rootDir;
  }

  private getRelativePath(fullPath: string): string {
    if (!this.rootDir || !fullPath.startsWith(this.rootDir)) {
      return fullPath;
    }
    const relativePath = fullPath.slice(this.rootDir.length);
    return relativePath.startsWith("/") ? relativePath.slice(1) : relativePath;
  }

  printHierarchy(): void {
    const operations = this.operations;
    if (operations.length === 0) return;

    console.log("\nOperation Summary:");
    for (const op of operations) {
      const type = op.isDirectory ? `${op.type} dir` : op.type;
      const path = this.getRelativePath(op.path);
      const sourcePath = op.sourcePath
        ? ` (from ${this.getRelativePath(op.sourcePath)})`
        : "";
      console.log(`${type}: ${path}${sourcePath}`);
    }
  }
}

export const collector = new LogCollector();

interface MessageConfig {
  emoji: string;
  template: (...args: any[]) => string;
  alwaysShow: boolean;
}

// Message definitions with their configuration
export const Messages = {
  // File operations
  CREATED_FILE: {
    emoji: "📄",
    template: (path: string) => `Created ${path}`,
    alwaysShow: true,
  },
  CREATED_DIR: {
    emoji: "📁",
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
    emoji: "📋",
    template: (src: string, dest: string) =>
      `Copying directory from ${src} to ${dest}`,
    alwaysShow: true,
  },
  COPIED_FILE: {
    emoji: "📋",
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

  // Track operations in the collector
  switch (type) {
    case "CREATED_FILE":
      collector.addOperation({
        type: "create",
        path: args[0],
        isDirectory: false,
      });
      break;
    case "CREATED_DIR":
      collector.addOperation({
        type: "create",
        path: args[0],
        isDirectory: true,
      });
      break;
    case "DIR_EXISTS":
      collector.addOperation({
        type: "skip",
        path: args[0],
        isDirectory: true,
      });
      break;
    case "COPIED_FILE":
      collector.addOperation({
        type: "copy",
        path: args[1],
        sourcePath: args[0],
        isDirectory: false,
      });
      break;
    case "COPYING_DIR":
      collector.addOperation({
        type: "copy",
        path: args[1],
        sourcePath: args[0],
        isDirectory: true,
      });
      break;
  }
}

export function logOperation(
  type: string,
  line: string,
  options: LogOptions = {}
): void {
  const { verbose = false } = options;
  if (verbose) {
    console.log(`${type}: ${line}`);
  }
}

export function logSuccess(
  type: keyof typeof Messages,
  args: any[],
  options: LogOptions = {}
): void {
  logMessage(type, args, options);
}

export function logWarning(
  type: keyof typeof Messages,
  args: any[],
  options: LogOptions = {}
): void {
  logMessage(type, args, { ...options, verbose: true });
}

export function logStructureResult(
  hasWarnings: boolean,
  options: LogOptions = {}
): void {
  const type = hasWarnings ? "STRUCTURE_WARNINGS" : "STRUCTURE_SUCCESS";
  logMessage(type, [], options);
  collector.printHierarchy();
}
