import { Table } from "console-table-printer";

export interface LogOptions {
  verbose?: boolean;
  silent?: boolean;
  isCLI?: boolean;
}

export interface OperationLog {
  type: "create" | "copy" | "move" | "skip" | "rename";
  path: string;
  sourcePath?: string;
  isDirectory: boolean;
  originalName?: string;
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
    if (!fullPath || !this.rootDir || !fullPath.startsWith(this.rootDir)) {
      return fullPath || "";
    }
    const relativePath = fullPath.slice(this.rootDir.length);
    return relativePath.startsWith("/") ? relativePath.slice(1) : relativePath;
  }

  printHierarchy(options: LogOptions = {}): void {
    const { silent = false, isCLI = false } = options;
    if (silent) return;

    const operations = this.operations;
    if (operations.length === 0) return;

    // Only show the table in CLI mode
    if (isCLI) {
      const table = new Table({
        columns: [
          { name: "type", title: "Operation", alignment: "left" },
          { name: "path", title: "Path", alignment: "left" },
          { name: "sourcePath", title: "Source/Original", alignment: "left" },
        ],
        charLength: { type: 10, path: 50, sourcePath: 50 },
      });

      // Sort operations by path
      const sortedOperations = [...operations].sort((a, b) => {
        const pathA = this.getRelativePath(a.path)?.toLowerCase() ?? "";
        const pathB = this.getRelativePath(b.path)?.toLowerCase() ?? "";
        return pathA.localeCompare(pathB);
      });

      // Add rows to table
      for (const op of sortedOperations) {
        if (!op.path) continue;

        const row = {
          type: op.isDirectory
            ? `${
                op.type === "rename"
                  ? "created and renamed dir"
                  : `${op.type} dir`
              }`
            : op.type === "rename"
            ? "created and renamed"
            : op.type,
          path: this.getRelativePath(op.path),
          sourcePath:
            op.originalName ||
            (op.sourcePath ? this.getRelativePath(op.sourcePath) : ""),
        };

        // Add color based on operation type
        const color =
          op.type === "create"
            ? "green"
            : op.type === "copy"
            ? "cyan"
            : op.type === "move"
            ? "yellow"
            : op.type === "rename"
            ? "magenta"
            : op.type === "skip"
            ? "gray"
            : undefined;

        table.addRow(row, { color });
      }

      console.log("\nOperation Summary:");
      table.printTable();
    }
  }
}

export const collector = new LogCollector();

interface MessageConfig {
  template: (...args: any[]) => string;
  alwaysShow: boolean;
}

// Message definitions with their configuration
export const Messages = {
  // File operations
  CREATED_FILE: {
    template: (path: string) => `Created ${path}`,
    alwaysShow: true,
  },
  CREATED_DIR: {
    template: (path: string) => `Created ${path}`,
    alwaysShow: true,
  },
  DIR_EXISTS: {
    template: (path: string) => `Directory already exists: ${path}`,
    alwaysShow: false,
  },

  // Copy operations
  COPYING_DIR: {
    template: (src: string, dest: string) =>
      `Copying directory from ${src} to ${dest}`,
    alwaysShow: true,
  },
  COPIED_FILE: {
    template: (src: string, dest: string) => `Copied ${src} to ${dest}`,
    alwaysShow: true,
  },

  // Move operations
  MOVING_DIR: {
    template: (src: string, dest: string) =>
      `Moving directory from ${src} to ${dest}`,
    alwaysShow: true,
  },
  MOVING_FILE: {
    template: (src: string, dest: string) =>
      `Moving file from ${src} to ${dest}`,
    alwaysShow: true,
  },
  MOVED_SUCCESS: {
    template: () => "Moved successfully",
    alwaysShow: false,
  },

  // Warnings and errors
  SOURCE_NOT_FOUND: {
    template: (path: string) =>
      `Warning: Source not found "${path}", creating empty file`,
    alwaysShow: true,
  },
  OPERATION_FAILED: {
    template: (error: string) =>
      `Warning: Operation failed, creating empty file: ${error}`,
    alwaysShow: true,
  },
  CREATE_EMPTY_FAILED: {
    template: (error: string) =>
      `Warning: Could not create empty file: ${error}`,
    alwaysShow: true,
  },
  MOVE_FAILED: {
    template: (error: string) =>
      `Warning: Failed to move file, falling back to copy: ${error}`,
    alwaysShow: true,
  },
  COPY_FAILED: {
    template: (path: string) =>
      `Warning: Failed to copy "${path}", creating empty file`,
    alwaysShow: true,
  },

  // Structure results
  STRUCTURE_WARNINGS: {
    template: () => "\nStructure created with warnings",
    alwaysShow: true,
  },
  STRUCTURE_SUCCESS: {
    template: () => "\nStructure created successfully",
    alwaysShow: false,
  },
} as const;

// Helper function to format a message
function formatMessage(
  config: MessageConfig,
  options: LogOptions = {},
  ...args: any[]
): string {
  return config.template(...args);
}

export function logMessage(
  type: keyof typeof Messages,
  args: any[],
  options: LogOptions = {}
): void {
  // Track operations in the collector
  switch (type) {
    case "CREATED_FILE":
      // Skip if this is a rename operation
      if (
        collector
          .getOperations()
          .some((op) => op.type === "rename" && op.path === args[0])
      ) {
        break;
      }
      collector.addOperation({
        type: "create",
        path: args[0],
        isDirectory: false,
      });
      break;
    case "CREATED_DIR":
      // Skip if this is a rename operation
      if (
        collector
          .getOperations()
          .some((op) => op.type === "rename" && op.path === args[0])
      ) {
        break;
      }
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
      collector.addOperation({
        type: "move",
        path: args[1],
        sourcePath: args[0],
        isDirectory: false,
      });
      break;
    case "MOVING_DIR":
      collector.addOperation({
        type: "move",
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
  // No console output needed
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
  // Track operations in the collector
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

export function logStructureResult(
  hasWarnings: boolean,
  options: LogOptions = {}
): void {
  const { silent = false } = options;
  if (silent) return;

  // Print the hierarchy at the end
  collector.printHierarchy(options);
}
