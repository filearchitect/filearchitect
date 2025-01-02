import { Table } from "console-table-printer";

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

    const table = new Table({
      columns: [
        { name: "type", title: "Operation", alignment: "left" },
        { name: "path", title: "Path", alignment: "left" },
        { name: "sourcePath", title: "Source", alignment: "left" },
      ],
      charLength: { type: 10, path: 50, sourcePath: 50 },
    });

    // Sort operations by path
    const sortedOperations = [...operations].sort((a, b) => {
      // Handle undefined paths
      const pathA = a.path?.toLowerCase() ?? "";
      const pathB = b.path?.toLowerCase() ?? "";
      return pathA.localeCompare(pathB);
    });

    // Add rows to table
    for (const op of sortedOperations) {
      if (!op.path) continue; // Skip operations with undefined paths

      const row = {
        type: op.isDirectory ? `${op.type} dir` : op.type,
        path: this.getRelativePath(op.path),
        sourcePath: op.sourcePath ? this.getRelativePath(op.sourcePath) : "",
      };

      // Add color based on operation type
      const color =
        op.type === "create"
          ? "green"
          : op.type === "copy"
          ? "cyan"
          : op.type === "move"
          ? "yellow"
          : op.type === "skip"
          ? "gray"
          : undefined;

      table.addRow(row, { color });
    }

    console.log("\nOperation Summary:");
    table.printTable();
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
    case "MOVING_FILE":
    case "MOVING_DIR":
      collector.addOperation({
        type: "move",
        path: args[1],
        sourcePath: args[0],
        isDirectory: type === "MOVING_DIR",
      });
      break;
  }
}

export function logWarning(type: keyof typeof Messages, args: any[]): void {
  const config = Messages[type];
  console.warn(formatMessage(config, ...args));

  // Track operations in warnings too
  switch (type) {
    case "SOURCE_NOT_FOUND":
      collector.addOperation({
        type: "create",
        path: args[0],
        isDirectory: false,
      });
      break;
  }
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

  // Track operations in success messages too
  switch (type) {
    case "COPIED_FILE":
      collector.addOperation({
        type: "copy",
        path: args[1],
        sourcePath: args[0],
        isDirectory: false,
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

  // Print the hierarchy at the end
  collector.printHierarchy();
}
