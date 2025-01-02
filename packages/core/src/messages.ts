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

  addOperation(operation: OperationLog): void {
    this.operations.push(operation);
  }

  getOperations(): OperationLog[] {
    return this.operations;
  }

  clear(): void {
    this.operations = [];
  }

  printHierarchy(): void {
    const pathMap = new Map<
      string,
      { isDirectory: boolean; children: Set<string> }
    >();

    // First pass: create all nodes
    for (const op of this.operations) {
      if (op.path && !pathMap.has(op.path)) {
        pathMap.set(op.path, {
          isDirectory: op.isDirectory,
          children: new Set(),
        });
      }
    }

    // Second pass: build parent-child relationships
    for (const path of pathMap.keys()) {
      if (!path) continue;
      const parent = path.split("/").slice(0, -1).join("/");
      if (parent && pathMap.has(parent)) {
        pathMap.get(parent)?.children.add(path);
      }
    }

    // Find root nodes (those without parents in our map)
    const roots = Array.from(pathMap.keys()).filter((path) => {
      if (!path) return false;
      const parent = path.split("/").slice(0, -1).join("/");
      return !parent || !pathMap.has(parent);
    });

    // Print the hierarchy
    const printNode = (path: string, level: number = 0): void => {
      const node = pathMap.get(path);
      if (!node) return;

      const indent = "  ".repeat(level);
      const name = path.split("/").pop() || path;
      const icon = node.isDirectory ? "📁" : "📄";
      console.log(`${indent}${icon} ${name}`);

      // Sort children alphabetically, directories first
      const sortedChildren = Array.from(node.children).sort((a, b) => {
        const aIsDir = pathMap.get(a)?.isDirectory || false;
        const bIsDir = pathMap.get(b)?.isDirectory || false;
        if (aIsDir !== bIsDir) return bIsDir ? 1 : -1;
        return a.localeCompare(b);
      });

      for (const child of sortedChildren) {
        printNode(child, level + 1);
      }
    };

    if (roots.length > 0) {
      console.log("\nFile Structure:");
      for (const root of roots.sort()) {
        printNode(root);
      }
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
