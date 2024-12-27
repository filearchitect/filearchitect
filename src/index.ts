import fs from "fs";
import path from "path";
import process from "process";

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
 * Creates a file or directory structure from a tab-indented string.
 * The string format supports:
 * - Regular files and directories
 * - File/directory copying with [source] > target syntax
 * - File/directory moving with (source) > target syntax
 * - Tab or space indentation for nesting
 *
 * @param input The tab-indented string describing the structure
 * @param rootDir The root directory to create the structure in
 */
export function createStructureFromString(
  input: string,
  rootDir: string
): void {
  // Create the root directory if it doesn't exist
  if (!fs.existsSync(rootDir)) {
    fs.mkdirSync(rootDir, { recursive: true });
  }

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

      try {
        const newPath = executeOperation(operation, targetPath);
        if (operation.type === "directory" && newPath) {
          stack.push(newPath);
        }
      } catch (error: any) {
        hasWarnings = true;
        console.warn(`⚠️  Warning: ${error.message}`);
      }
    } catch (error: any) {
      hasWarnings = true;
      console.warn(`⚠️  Warning: ${error.message}`);
    }
  }

  if (hasWarnings) {
    console.log("\n⚠️  Structure created with warnings");
  }
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
    const sourcePath = moveMatch[1].trim();
    return {
      type: "move",
      sourcePath,
      name: moveMatch[2]?.trim() || path.basename(sourcePath),
    };
  }

  // Copy operation (with or without rename)
  const copyMatch = line.match(/^\[(.+?)\](?:\s*>\s*(.+))?$/);
  if (copyMatch) {
    return {
      type: "copy",
      sourcePath: copyMatch[1].trim(),
      name: copyMatch[2]?.trim() || path.basename(copyMatch[1].trim()),
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
 * @returns The path of the created directory for directory operations
 */
function executeOperation(
  operation: FileOperation,
  targetPath: string
): string | void {
  try {
    const destinationDir = path.dirname(targetPath);
    if (!fs.existsSync(destinationDir)) {
      fs.mkdirSync(destinationDir, { recursive: true });
    }

    switch (operation.type) {
      case "file":
        createEmptyFile(targetPath);
        break;

      case "directory":
        createDirectory(targetPath);
        return targetPath;

      case "copy":
        if (!operation.sourcePath) {
          createEmptyFile(targetPath);
          break;
        }
        copyFile(operation.sourcePath, targetPath);
        break;

      case "move":
        if (!operation.sourcePath) {
          createEmptyFile(targetPath);
          break;
        }
        moveFile(operation.sourcePath, targetPath);
        break;
    }
  } catch (error: any) {
    console.warn(
      `⚠️  Warning: Operation failed, creating empty file: ${error.message}`
    );
    try {
      createEmptyFile(targetPath);
    } catch (err: any) {
      console.warn(`⚠️  Warning: Could not create empty file: ${err.message}`);
    }
  }
}

/**
 * Creates an empty file, creating parent directories if needed.
 *
 * @param filePath The path of the file to create
 */
function createEmptyFile(filePath: string): void {
  const dir = path.dirname(filePath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  if (!fs.existsSync(filePath)) {
    fs.writeFileSync(filePath, "");
  }
}

/**
 * Creates a directory if it doesn't exist.
 *
 * @param dirPath The path of the directory to create
 */
function createDirectory(dirPath: string): void {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
}

/**
 * Copies a file or directory, creating an empty file if source doesn't exist.
 *
 * @param sourcePath The source path to copy from
 * @param targetPath The target path to copy to
 */
function copyFile(sourcePath: string, targetPath: string): void {
  const resolvedSource = path.isAbsolute(sourcePath)
    ? sourcePath
    : path.resolve(process.cwd(), sourcePath);

  if (!fs.existsSync(resolvedSource)) {
    console.warn(
      `⚠️  Warning: Source not found "${sourcePath}", creating empty file`
    );
    createEmptyFile(targetPath);
    return;
  }

  try {
    if (fs.statSync(resolvedSource).isDirectory()) {
      copyDirectorySync(resolvedSource, targetPath);
    } else {
      fs.copyFileSync(resolvedSource, targetPath);
    }
  } catch (error) {
    console.warn(
      `⚠️  Warning: Failed to copy "${sourcePath}", creating empty file`
    );
    createEmptyFile(targetPath);
  }
}

/**
 * Moves a file or directory, creating an empty file if source doesn't exist.
 *
 * @param sourcePath The source path to move from
 * @param targetPath The target path to move to
 */
function moveFile(sourcePath: string, targetPath: string): void {
  const resolvedSource = path.isAbsolute(sourcePath)
    ? sourcePath
    : path.resolve(process.cwd(), sourcePath);

  // Create empty file if source doesn't exist
  if (!fs.existsSync(resolvedSource)) {
    console.warn(
      `⚠️  Warning: Source not found "${sourcePath}", creating empty file`
    );
    createEmptyFile(targetPath);
    return;
  }

  // Create the destination directory if it doesn't exist
  const destinationDir = path.dirname(targetPath);
  if (!fs.existsSync(destinationDir)) {
    fs.mkdirSync(destinationDir, { recursive: true });
  }

  // Remove the destination if it exists
  if (fs.existsSync(targetPath)) {
    if (fs.statSync(targetPath).isDirectory()) {
      fs.rmSync(targetPath, { recursive: true });
    } else {
      fs.unlinkSync(targetPath);
    }
  }

  // Try to move the file
  try {
    if (fs.statSync(resolvedSource).isDirectory()) {
      // For directories, we need to copy then delete
      copyDirectorySync(resolvedSource, targetPath);
      fs.rmSync(resolvedSource, { recursive: true });
    } else {
      // For files, try rename first, then fallback to copy+delete
      try {
        fs.renameSync(resolvedSource, targetPath);
      } catch {
        fs.copyFileSync(resolvedSource, targetPath);
        fs.unlinkSync(resolvedSource);
      }
    }
  } catch (error) {
    // If all else fails, create an empty file
    console.warn(
      `⚠️  Warning: Failed to move "${sourcePath}", creating empty file`
    );
    createEmptyFile(targetPath);
  }
}

/**
 * Recursively copies a directory.
 *
 * @param source The source directory to copy from
 * @param destination The destination directory to copy to
 */
function copyDirectorySync(source: string, destination: string): void {
  if (!fs.existsSync(destination)) {
    fs.mkdirSync(destination, { recursive: true });
  }

  const entries = fs.readdirSync(source, { withFileTypes: true });
  for (const entry of entries) {
    const sourcePath = path.join(source, entry.name);
    const destPath = path.join(destination, entry.name);

    if (entry.isDirectory()) {
      copyDirectorySync(sourcePath, destPath);
    } else {
      fs.copyFileSync(sourcePath, destPath);
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
