import path from "path";
import process from "process";
import {
  collector,
  logMessage,
  logOperation,
  logStructureResult,
  logSuccess,
  logWarning,
} from "./messages.js";
import { resolveTildePath } from "./path-utils.js";
import { CreateStructureOptions, FileSystem } from "./types.js";

/**
 * Represents a file name replacement.
 */
interface FileNameReplacement {
  /** The search string to replace */
  search: string;
  /** The replacement string */
  replace: string;
}

/**
 * Applies file name replacements to a given name.
 *
 * @param name The name to apply replacements to
 * @param replacements The replacements to apply
 * @returns The name with replacements applied
 */
function applyFileNameReplacements(
  name: string,
  replacements?: FileNameReplacement[]
): string {
  if (!replacements || replacements.length === 0) {
    return name;
  }

  let result = name;
  for (const { search, replace } of replacements) {
    result = result.split(search).join(replace);
  }
  return result;
}

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
  const { fs: filesystem, isCLI = false, fileNameReplacements } = options;
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

      // Store original name before replacements
      const originalName = operation.name;

      // Apply replacements to the operation name
      const replacedName = applyFileNameReplacements(
        operation.name,
        fileNameReplacements
      );
      const targetPath = path.join(currentDir, replacedName);

      logOperation(operation.type, line, { isCLI });

      try {
        const newPath = await executeOperation(
          { ...operation, name: replacedName, originalName },
          targetPath,
          {
            isCLI,
            fs: filesystem,
          }
        );
        if (operation.type === "directory" && newPath) {
          stack.push(newPath);
        }
      } catch (error: any) {
        hasWarnings = true;
        if (error.code === "ENOENT") {
          logWarning("SOURCE_NOT_FOUND", [error.path]);
          await createEmptyFile(targetPath, { isCLI, fs: filesystem });
        } else {
          logWarning("OPERATION_FAILED", [error.message]);
        }
      }
    } catch (error: any) {
      hasWarnings = true;
      logWarning("OPERATION_FAILED", [error.message]);
    }
  }

  logStructureResult(hasWarnings, { isCLI });
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
  /** The original name before replacements */
  originalName?: string;
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
    const result: FileOperation = {
      type: "move" as OperationType,
      sourcePath,
      name: moveMatch[2]?.trim() || path.basename(sourcePath),
    };
    return result;
  }

  // Copy operation (with or without rename)
  const copyMatch = line.match(/^\[(.+?)\](?:\s*>\s*(.+))?$/);
  if (copyMatch) {
    const sourcePath = resolveTildePath(copyMatch[1].trim());
    const targetName = copyMatch[2]?.trim();
    const result: FileOperation = {
      type: "copy" as OperationType,
      sourcePath,
      name: targetName || path.basename(sourcePath),
    };
    return result;
  }

  // Regular file or directory
  const result: FileOperation = {
    type: path.extname(line)
      ? ("file" as OperationType)
      : ("directory" as OperationType),
    name: line,
  };
  return result;
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
  options: { isCLI?: boolean; fs: FileSystem } = {} as any
): Promise<string | void> {
  const { isCLI = false, fs: filesystem } = options;

  try {
    const destinationDir = path.dirname(targetPath);
    if (!(await filesystem.exists(destinationDir))) {
      await createDirectory(destinationDir, {
        isCLI,
        fs: filesystem,
        skipLogging: true,
      });
    }

    // If the name was changed by replacements, log it as a rename
    if (operation.originalName && operation.originalName !== operation.name) {
      collector.addOperation({
        type: "rename",
        path: targetPath,
        isDirectory: operation.type === "directory",
        originalName: operation.originalName,
      });
    }

    switch (operation.type) {
      case "file":
        await createEmptyFile(targetPath, {
          isCLI,
          fs: filesystem,
          skipLogging: true,
        });
        collector.addOperation({
          type: "create",
          path: targetPath,
          isDirectory: false,
        });
        break;

      case "directory":
        await createDirectory(targetPath, {
          isCLI,
          fs: filesystem,
          skipLogging: true,
        });
        collector.addOperation({
          type: "create",
          path: targetPath,
          isDirectory: true,
        });
        return targetPath;

      case "copy":
        if (!operation.sourcePath) {
          throw new Error("Source path is required for copy operations");
        }
        await copyFile(operation.sourcePath, targetPath, {
          isCLI,
          fs: filesystem,
        });
        break;

      case "move":
        if (!operation.sourcePath) {
          throw new Error("Source path is required for move operations");
        }
        await moveFile(operation.sourcePath, targetPath, {
          isCLI,
          fs: filesystem,
        });
        break;

      default:
        throw new Error(`Unknown operation type: ${(operation as any).type}`);
    }
  } catch (error: any) {
    if (error.code === "ENOENT") {
      throw error;
    }
    throw new Error(`Failed to execute operation: ${error.message}`);
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
  options: {
    isCLI?: boolean;
    fs: FileSystem;
    skipLogging?: boolean;
  } = {} as any
): Promise<void> {
  const { isCLI = false, fs: filesystem, skipLogging = false } = options;

  const dir = path.dirname(filePath);
  if (!(await filesystem.exists(dir))) {
    await createDirectory(dir, { isCLI, fs: filesystem, skipLogging: true });
  }

  // Always write the file, even if it exists
  await filesystem.writeFile(filePath, "");
  if (!skipLogging) {
    logMessage("CREATED_FILE", [filePath]);
  }
}

/**
 * Creates a directory if it doesn't exist.
 *
 * @param dirPath The path of the directory to create
 * @param options Additional options
 */
async function createDirectory(
  dirPath: string,
  options: {
    isCLI?: boolean;
    fs: FileSystem;
    skipLogging?: boolean;
  } = {} as any
): Promise<void> {
  const { isCLI = false, fs: filesystem, skipLogging = false } = options;

  // Always create the directory, even if it exists
  await filesystem.mkdir(dirPath, { recursive: true });
  if (!skipLogging) {
    logMessage("CREATED_DIR", [dirPath]);
  }
}

/**
 * Copies a file or directory, creating an empty file/directory if source doesn't exist.
 *
 * @param sourcePath The source path to copy from
 * @param targetPath The target path to copy to
 * @param options Additional options
 */
async function copyFile(
  sourcePath: string,
  targetPath: string,
  options: { isCLI?: boolean; fs: FileSystem } = {} as any
): Promise<void> {
  const { isCLI = false, fs: filesystem } = options;

  // Always use absolute path for source
  const resolvedSource = path.isAbsolute(sourcePath)
    ? sourcePath
    : path.resolve(process.cwd(), sourcePath);

  // Check if the source exists
  const sourceExists = await filesystem.exists(resolvedSource);

  // If source doesn't exist, try to determine if it was meant to be a directory
  if (!sourceExists) {
    logWarning("SOURCE_NOT_FOUND", [sourcePath]);
    // If the source path has no extension or ends with a slash, treat it as a directory
    const shouldBeDirectory =
      !path.extname(sourcePath) || sourcePath.endsWith(path.sep);
    if (shouldBeDirectory) {
      await createDirectory(targetPath, {
        isCLI,
        fs: filesystem,
        skipLogging: true,
      });
      collector.addOperation({
        type: "create",
        path: targetPath,
        isDirectory: true,
      });
    } else {
      await createEmptyFile(targetPath, {
        isCLI,
        fs: filesystem,
        skipLogging: true,
      });
      collector.addOperation({
        type: "create",
        path: targetPath,
        isDirectory: false,
      });
    }
    return;
  }

  try {
    const stat = await filesystem.stat(resolvedSource);
    const isDirectory = stat.isDirectory();

    if (isDirectory) {
      logMessage("COPYING_DIR", [resolvedSource, targetPath]);
      await filesystem.copyFolder(resolvedSource, targetPath);
      collector.addOperation({
        type: "copy",
        path: targetPath,
        sourcePath: resolvedSource,
        isDirectory: true,
      });
    } else {
      await filesystem.copyFile(resolvedSource, targetPath);
      logMessage("COPIED_FILE", [sourcePath, targetPath]);
      collector.addOperation({
        type: "copy",
        path: targetPath,
        sourcePath: resolvedSource,
        isDirectory: false,
      });
    }
  } catch (error) {
    logWarning("COPY_FAILED", [sourcePath]);
    // If copy fails, create empty file/directory based on source type
    const shouldBeDirectory =
      !path.extname(sourcePath) || sourcePath.endsWith(path.sep);
    if (shouldBeDirectory) {
      await createDirectory(targetPath, {
        isCLI,
        fs: filesystem,
        skipLogging: true,
      });
      collector.addOperation({
        type: "create",
        path: targetPath,
        isDirectory: true,
      });
    } else {
      await createEmptyFile(targetPath, {
        isCLI,
        fs: filesystem,
        skipLogging: true,
      });
      collector.addOperation({
        type: "create",
        path: targetPath,
        isDirectory: false,
      });
    }
  }
}

/**
 * Moves a file or directory, creating an empty file/directory if source doesn't exist.
 *
 * @param sourcePath The source path to move from
 * @param targetPath The target path to move to
 * @param options Additional options
 */
async function moveFile(
  sourcePath: string,
  targetPath: string,
  options: { isCLI?: boolean; fs: FileSystem } = {} as any
): Promise<void> {
  const { isCLI = false, fs: filesystem } = options;

  // Always use absolute path for source
  const resolvedSource = path.isAbsolute(sourcePath)
    ? sourcePath
    : path.resolve(process.cwd(), sourcePath);

  // Check if the source exists
  const sourceExists = await filesystem.exists(resolvedSource);

  // If source doesn't exist, try to determine if it was meant to be a directory
  if (!sourceExists) {
    logWarning("SOURCE_NOT_FOUND", [sourcePath]);
    // If the source path has no extension or ends with a slash, treat it as a directory
    const shouldBeDirectory =
      !path.extname(sourcePath) || sourcePath.endsWith(path.sep);
    if (shouldBeDirectory) {
      await createDirectory(targetPath, {
        isCLI,
        fs: filesystem,
        skipLogging: true,
      });
      collector.addOperation({
        type: "create",
        path: targetPath,
        isDirectory: true,
      });
    } else {
      await createEmptyFile(targetPath, {
        isCLI,
        fs: filesystem,
        skipLogging: true,
      });
      collector.addOperation({
        type: "create",
        path: targetPath,
        isDirectory: false,
      });
    }
    return;
  }

  try {
    const stat = await filesystem.stat(resolvedSource);
    const isDirectory = stat.isDirectory();

    if (isDirectory) {
      logMessage("MOVING_DIR", [resolvedSource, targetPath]);
      await filesystem.moveFolder(resolvedSource, targetPath);
      collector.addOperation({
        type: "move",
        path: targetPath,
        sourcePath: resolvedSource,
        isDirectory: true,
      });
    } else {
      logMessage("MOVING_FILE", [resolvedSource, targetPath]);
      await filesystem.rename(resolvedSource, targetPath);
      collector.addOperation({
        type: "move",
        path: targetPath,
        sourcePath: resolvedSource,
        isDirectory: false,
      });
    }
    logSuccess("MOVED_SUCCESS", []);
  } catch (error: any) {
    logWarning("MOVE_FAILED", [error.message]);
    // If move fails, create empty file/directory based on source type
    const shouldBeDirectory =
      !path.extname(sourcePath) || sourcePath.endsWith(path.sep);
    if (shouldBeDirectory) {
      await createDirectory(targetPath, {
        isCLI,
        fs: filesystem,
        skipLogging: true,
      });
      collector.addOperation({
        type: "create",
        path: targetPath,
        isDirectory: true,
      });
    } else {
      await createEmptyFile(targetPath, {
        isCLI,
        fs: filesystem,
        skipLogging: true,
      });
      collector.addOperation({
        type: "create",
        path: targetPath,
        isDirectory: false,
      });
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
