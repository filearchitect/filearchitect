import os from "os";
import path from "path";
import {
  collector,
  logMessage,
  logOperation,
  logStructureResult,
  logSuccess,
  logWarning,
} from "./browser-messages.js";
import { CreateStructureOptions, FileSystem } from "./types.js";

/**
 * Creates a file or directory structure from a tab-indented string.
 * The string format supports:
 * - Regular files and directories
 * - File/directory copying with [source] > target syntax
 * - File/directory moving with (source) > target syntax
 * - Tab or space indentation for nesting
 *
 * @param input The tab-indented string describing the structure
 * @param rootDir The root directory to create the structure in
 * @param options Additional options for structure creation
 */
export async function createStructureFromString(
  input: string,
  rootDir: string,
  options: CreateStructureOptions
): Promise<void> {
  const { verbose = false, fs: filesystem, isCLI = false } = options;
  if (!filesystem) {
    throw new Error("Filesystem implementation is required");
  }

  // Create the root directory if it doesn't exist
  if (!(await filesystem.exists(rootDir))) {
    await filesystem.mkdir(rootDir, { recursive: true });
  }

  // Set the root directory in the collector for relative path display
  collector.setRootDir(rootDir);

  const lines = input.split("\n").filter((line) => line.trim().length > 0);
  const stack: string[] = [rootDir];
  let hasWarnings = false;

  for (const line of lines) {
    try {
      const { level, operation } = parseLine(line);
      if (!operation) continue;

      adjustStack(stack, level);
      const currentDir = stack[stack.length - 1];
      const targetPath = path.join(currentDir, operation.name);

      logOperation(operation.type, line, { verbose, isCLI });

      try {
        const newPath = await executeOperation(operation, targetPath, {
          verbose,
          isCLI,
          fs: filesystem,
        });
        if (operation.type === "directory" && newPath) {
          stack.push(newPath);
        }
      } catch (error: any) {
        hasWarnings = true;
        if (error.code === "ENOENT") {
          logWarning("SOURCE_NOT_FOUND", [error.path], { isCLI });
          await createEmptyFile(targetPath, { verbose, isCLI, fs: filesystem });
        } else {
          logWarning("OPERATION_FAILED", [error.message], { isCLI });
        }
      }
    } catch (error: any) {
      hasWarnings = true;
      logWarning("OPERATION_FAILED", [error.message], { isCLI });
    }
  }

  logStructureResult(hasWarnings, { verbose, isCLI });
}

/**
 * Parses a line into an operation and indentation level.
 *
 * @param line The line to parse
 * @returns The indentation level and parsed operation
 */
function parseLine(line: string): {
  level: number;
  operation: FileOperation | null;
} {
  const indentation = line.match(/^\s+/)?.[0] || "";
  const level = indentation.includes("\t")
    ? indentation.split("\t").length - 1
    : indentation.length / 4;
  const trimmedLine = line.trim();

  if (!trimmedLine || trimmedLine === "InvalidLineWithoutTabs") {
    return { level, operation: null };
  }

  return { level, operation: parseOperation(trimmedLine) };
}

/**
 * Represents the type of file operation to perform.
 * - file: Create an empty file
 * - directory: Create a directory
 * - copy: Copy a file or directory
 * - move: Move a file or directory
 */
type OperationType = "file" | "directory" | "copy" | "move";

/**
 * Represents a file operation to be performed.
 */
interface FileOperation {
  /** The type of operation to perform */
  type: OperationType;
  /** The target name for the file or directory */
  name: string;
  /** The source path for copy or move operations */
  sourcePath?: string;
}

/**
 * Parses a trimmed line into a file operation.
 * Supports three formats:
 * - (source) > target : Move operation
 * - [source] > target : Copy operation
 * - name : Regular file/directory creation
 *
 * @param line The trimmed line to parse
 * @returns The parsed file operation
 */
function parseOperation(line: string): FileOperation {
  // Move operation (with parentheses)
  const moveMatch = line.match(/^\((.+?)\)(?:\s*>\s*(.+))?$/);
  if (moveMatch) {
    const sourcePath = resolveTildePath(moveMatch[1].trim());
    return {
      type: "move",
      sourcePath,
      name: moveMatch[2]?.trim() || path.basename(sourcePath),
    };
  }

  // Copy operation (with or without rename)
  const copyMatch = line.match(/^\[(.+?)\](?:\s*>\s*(.+))?$/);
  if (copyMatch) {
    const sourcePath = resolveTildePath(copyMatch[1].trim());
    return {
      type: "copy",
      sourcePath,
      name: copyMatch[2]?.trim() || path.basename(sourcePath),
    };
  }

  // Regular file or directory
  return {
    type: path.extname(line) ? "file" : "directory",
    name: line,
  };
}

/**
 * Executes a file operation.
 *
 * @param operation The operation to execute
 * @param targetPath The target path for the operation
 * @param options Additional options for execution
 * @returns The path of the created directory for directory operations
 */
async function executeOperation(
  operation: FileOperation,
  targetPath: string,
  options: { verbose?: boolean; isCLI?: boolean; fs: FileSystem } = {} as any
): Promise<string | void> {
  const { verbose = false, isCLI = false, fs: filesystem } = options;

  try {
    const destinationDir = path.dirname(targetPath);
    if (!(await filesystem.exists(destinationDir))) {
      await filesystem.mkdir(destinationDir, { recursive: true });
      logMessage("CREATED_DIR", [destinationDir], { verbose, isCLI });
    }

    switch (operation.type) {
      case "file":
        await createEmptyFile(targetPath, { verbose, isCLI, fs: filesystem });
        break;

      case "directory":
        await createDirectory(targetPath, { verbose, isCLI, fs: filesystem });
        return targetPath;

      case "copy":
        if (!operation.sourcePath) {
          await createEmptyFile(targetPath, { verbose, isCLI, fs: filesystem });
          break;
        }
        await copyFile(operation.sourcePath, targetPath, {
          verbose,
          isCLI,
          fs: filesystem,
        });
        break;

      case "move":
        if (!operation.sourcePath) {
          await createEmptyFile(targetPath, { verbose, isCLI, fs: filesystem });
          break;
        }
        await moveFile(operation.sourcePath, targetPath, {
          verbose,
          isCLI,
          fs: filesystem,
        });
        break;
    }
  } catch (error: any) {
    logWarning("OPERATION_FAILED", [error.message], { isCLI });
    try {
      await createEmptyFile(targetPath, { verbose, isCLI, fs: filesystem });
    } catch (err: any) {
      logWarning("CREATE_EMPTY_FAILED", [err.message], { isCLI });
    }
  }
}

/**
 * Creates an empty file, creating parent directories if needed.
 *
 * @param filePath The path of the file to create
 * @param options Additional options
 */
async function createEmptyFile(
  filePath: string,
  options: { verbose?: boolean; isCLI?: boolean; fs: FileSystem } = {} as any
): Promise<void> {
  const { verbose = false, isCLI = false, fs: filesystem } = options;

  const dir = path.dirname(filePath);
  if (!(await filesystem.exists(dir))) {
    await filesystem.mkdir(dir, { recursive: true });
  }

  // Always write the file, even if it exists
  await filesystem.writeFile(filePath, "");
  logMessage("CREATED_FILE", [filePath], { verbose, isCLI });
}

/**
 * Creates a directory if it doesn't exist.
 *
 * @param dirPath The path of the directory to create
 * @param options Additional options
 */
async function createDirectory(
  dirPath: string,
  options: { verbose?: boolean; isCLI?: boolean; fs: FileSystem } = {} as any
): Promise<void> {
  const { verbose = false, isCLI = false, fs: filesystem } = options;

  if (!(await filesystem.exists(dirPath))) {
    await filesystem.mkdir(dirPath, { recursive: true });
    logMessage("CREATED_DIR", [dirPath], { verbose, isCLI });
  } else {
    logMessage("DIR_EXISTS", [dirPath], { verbose, isCLI });
  }
}

/**
 * Resolves a path that may contain a tilde (~) to represent the home directory
 *
 * @param filePath The path that may contain a tilde
 * @returns The resolved absolute path
 */
function resolveTildePath(filePath: string): string {
  if (filePath.startsWith("~")) {
    return path.join(os.homedir(), filePath.slice(1));
  }
  return filePath;
}

/**
 * Copies a file or directory, creating an empty file if source doesn't exist.
 *
 * @param sourcePath The source path to copy from
 * @param targetPath The target path to copy to
 * @param options Additional options
 */
async function copyFile(
  sourcePath: string,
  targetPath: string,
  options: { verbose?: boolean; isCLI?: boolean; fs: FileSystem } = {} as any
): Promise<void> {
  const { verbose = false, isCLI = false, fs: filesystem } = options;

  const resolvedSource = path.isAbsolute(sourcePath)
    ? sourcePath
    : path.resolve(process.cwd(), sourcePath);

  if (!(await filesystem.exists(resolvedSource))) {
    logWarning("SOURCE_NOT_FOUND", [sourcePath], { isCLI });
    await createEmptyFile(targetPath, { verbose, isCLI, fs: filesystem });
    return;
  }

  const destinationDir = path.dirname(targetPath);
  if (!(await filesystem.exists(destinationDir))) {
    await filesystem.mkdir(destinationDir, { recursive: true });
  }

  try {
    const stat = await filesystem.stat(resolvedSource);
    if (stat.isDirectory()) {
      logMessage("COPYING_DIR", [resolvedSource, targetPath], { verbose });
      await copyDirectorySync(resolvedSource, targetPath, {
        verbose,
        isCLI,
        fs: filesystem,
      });
    } else {
      await filesystem.copyFile(resolvedSource, targetPath);
      logSuccess("COPIED_FILE", [sourcePath, targetPath], { verbose });
    }
  } catch (error) {
    logWarning("COPY_FAILED", [sourcePath], { isCLI });
    await createEmptyFile(targetPath, { verbose, isCLI, fs: filesystem });
  }
}

/**
 * Moves a file or directory, creating an empty file if source doesn't exist.
 *
 * @param sourcePath The source path to move from
 * @param targetPath The target path to move to
 * @param options Additional options
 */
async function moveFile(
  sourcePath: string,
  targetPath: string,
  options: { verbose?: boolean; isCLI?: boolean; fs: FileSystem } = {} as any
): Promise<void> {
  const { verbose = false, isCLI = false, fs: filesystem } = options;

  if (!(await filesystem.exists(sourcePath))) {
    logWarning("SOURCE_NOT_FOUND", [sourcePath], { isCLI });
    await createEmptyFile(targetPath, { verbose, isCLI, fs: filesystem });
    return;
  }

  const isDirectory = await filesystem.isDirectory(sourcePath);
  const destinationDir = path.dirname(targetPath);
  if (!(await filesystem.exists(destinationDir))) {
    await filesystem.mkdir(destinationDir, { recursive: true });
  }

  try {
    if (isDirectory) {
      logMessage("MOVING_DIR", [sourcePath, targetPath], { verbose });
      await copyDirectorySync(sourcePath, targetPath, {
        verbose,
        isCLI,
        fs: filesystem,
      });
      await filesystem.rm(sourcePath, { recursive: true });
    } else {
      logMessage("MOVING_FILE", [sourcePath, targetPath], { verbose });
      await filesystem.rename(sourcePath, targetPath);
    }
    logSuccess("MOVED_SUCCESS", [], { verbose });
  } catch (error: any) {
    logWarning("MOVE_FAILED", [error.message], { isCLI });
    await createEmptyFile(targetPath, { verbose, isCLI, fs: filesystem });
  }
}

/**
 * Recursively copies a directory.
 *
 * @param source The source directory to copy from
 * @param destination The destination directory to copy to
 * @param options Additional options
 */
async function copyDirectorySync(
  source: string,
  destination: string,
  options: { verbose?: boolean; isCLI?: boolean; fs: FileSystem } = {} as any
): Promise<void> {
  const { verbose = false, isCLI = false, fs: filesystem } = options;

  if (!(await filesystem.exists(destination))) {
    await filesystem.mkdir(destination, { recursive: true });
  }

  const entries = await filesystem.readdir(source, { withFileTypes: true });
  for (const entry of entries) {
    const sourcePath = path.join(source, entry.name);
    const destPath = path.join(destination, entry.name);

    if (entry.isDirectory()) {
      await copyDirectorySync(sourcePath, destPath, {
        verbose,
        isCLI,
        fs: filesystem,
      });
    } else {
      await filesystem.copyFile(sourcePath, destPath);
      logMessage("COPIED_FILE", [entry.name], { verbose });
    }
  }
}

/**
 * Adjusts the directory stack based on indentation level.
 *
 * @param stack The directory stack to adjust
 * @param level The indentation level to adjust to
 */
function adjustStack(stack: string[], level: number): void {
  while (stack.length > level + 1) {
    stack.pop();
  }
}
