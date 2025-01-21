import { Table } from "console-table-printer";
import {
  createMessage,
  MessageConfig,
  Messages,
  MessageType,
} from "./warnings.js";

export { Messages, type MessageType } from "./warnings.js";

export interface LogOptions {
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

      // Sort operations by path and filter out rename operations
      const sortedOperations = [...operations]
        .filter((op) => op.type !== "rename")
        .sort((a, b) => {
          const pathA = this.getRelativePath(a.path)?.toLowerCase() ?? "";
          const pathB = this.getRelativePath(b.path)?.toLowerCase() ?? "";
          return pathA.localeCompare(pathB);
        });

      // Add rows to table
      for (const op of sortedOperations) {
        if (!op.path) continue;

        const row = {
          type: op.isDirectory ? `${op.type} dir` : `${op.type} file`,
          path: this.getRelativePath(op.path),
          sourcePath:
            op.originalName ||
            (op.sourcePath ? this.getRelativePath(op.sourcePath) : ""),
        };

        // Add color based on operation type
        const color =
          op.type === "create"
            ? "greenBright" // Brighter green for creation
            : op.type === "copy"
            ? "blueBright" // Bright blue for copy operations
            : op.type === "move"
            ? "magentaBright" // Bright magenta for move operations
            : op.type === "skip"
            ? "gray" // Gray for skipped items
            : op.type === "rename"
            ? "yellowBright" // Bright yellow for rename operations
            : undefined;

        table.addRow(row, { color });
      }

      console.log("\nOperation Summary:");
      table.printTable();
    }
  }
}

export const collector = new LogCollector();

export function logMessage<T extends MessageType>(
  type: T,
  args: Parameters<(typeof Messages)[T]>,
  options: LogOptions = {}
): void {
  const { silent = false } = options;
  if (silent) return;

  const config = MessageConfig[type];
  if (!config.alwaysShow && !options.isCLI) return;

  const message = createMessage(type, ...args);
  console.log(message);
}

export function logOperation(
  type: string,
  line: string,
  options: LogOptions = {}
): void {
  // No console output needed
}

export function logSuccess<T extends MessageType>(
  type: T,
  args: Parameters<(typeof Messages)[T]>,
  options: LogOptions = {}
): void {
  const { silent = false } = options;
  if (silent) return;

  const config = MessageConfig[type];
  if (!config.alwaysShow && !options.isCLI) return;

  const message = createMessage(type, ...args);
  console.log(message);
}

export function logWarning<T extends MessageType>(
  type: T,
  args: Parameters<(typeof Messages)[T]>,
  options: LogOptions = {}
): void {
  const { silent = false } = options;
  if (silent) return;

  const config = MessageConfig[type];
  if (!config.alwaysShow && !options.isCLI) return;

  const message = createMessage(type, ...args);
  console.warn(message);
}

export function logStructureResult(
  hasWarnings: boolean,
  options: LogOptions = {}
): void {
  const { silent = false } = options;
  if (silent) return;

  // Show final status message
  if (hasWarnings) {
    console.warn(createMessage("STRUCTURE_WARNINGS"));
  } else {
    console.log(createMessage("STRUCTURE_SUCCESS"));
  }

  // Print the hierarchy at the end
  collector.printHierarchy(options);
}
