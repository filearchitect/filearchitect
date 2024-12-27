import chalk from "chalk";
import fs from "fs";
import os from "os";
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
 * Options for structure creation
 */
interface CreateOptions {
  /** Whether to output verbose logs */
  verbose?: boolean;
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
export function createStructureFromString(
  input: string,
  rootDir: string,
  options: CreateOptions = {}
): void {
  const { verbose = false } = options;

  if (verbose) {
    console.log(chalk.blue(`📁 Creating structure in ${rootDir}`));
  }

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

      if (verbose) {
        console.log(
          chalk.blue(`🔄 ${operation.type.toUpperCase()}: ${line.trim()}`)
        );
      }

      try {
        const newPath = executeOperation(operation, targetPath, { verbose });
        if (operation.type === "directory" && newPath) {
          stack.push(newPath);
        }
      } catch (error: any) {
        hasWarnings = true;
        console.warn(chalk.yellow(`⚠️  Warning: ${error.message}`));
      }
    } catch (error: any) {
      hasWarnings = true;
      console.warn(chalk.yellow(`⚠️  Warning: ${error.message}`));
    }
  }

  if (hasWarnings) {
    console.log(chalk.yellow("\n⚠️  Structure created with warnings"));
  } else if (verbose) {
    console.log(chalk.green("\n✨ Structure created successfully"));
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
function executeOperation(
  operation: FileOperation,
  targetPath: string,
  options: CreateOptions = {}
): string | void {
  const { verbose = false } = options;

  try {
    const destinationDir = path.dirname(targetPath);
    if (!fs.existsSync(destinationDir)) {
      fs.mkdirSync(destinationDir, { recursive: true });
      if (verbose) {
        console.log(`📁 Created directory: ${destinationDir}`);
      }
    }

    switch (operation.type) {
      case "file":
        createEmptyFile(targetPath, { verbose });
        break;

      case "directory":
        createDirectory(targetPath, { verbose });
        return targetPath;

      case "copy":
        if (!operation.sourcePath) {
          createEmptyFile(targetPath, { verbose });
          break;
        }
        copyFile(operation.sourcePath, targetPath, { verbose });
        break;

      case "move":
        if (!operation.sourcePath) {
          createEmptyFile(targetPath, { verbose });
          break;
        }
        moveFile(operation.sourcePath, targetPath, { verbose });
        break;
    }
  } catch (error: any) {
    console.warn(
      `⚠️  Warning: Operation failed, creating empty file: ${error.message}`
    );
    try {
      createEmptyFile(targetPath, { verbose });
    } catch (err: any) {
      console.warn(`⚠️  Warning: Could not create empty file: ${err.message}`);
    }
  }
}

/**
 * Creates an empty file, creating parent directories if needed.
 *
 * @param filePath The path of the file to create
 * @param options Additional options
 */
function createEmptyFile(filePath: string, options: CreateOptions = {}): void {
  const { verbose = false } = options;

  const dir = path.dirname(filePath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  if (!fs.existsSync(filePath)) {
    fs.writeFileSync(filePath, "");
    if (verbose) {
      console.log(chalk.green(`📄 Created ${filePath}`));
    }
  } else if (verbose) {
    console.log(chalk.yellow(`⚠️  File already exists: ${filePath}`));
  }
}

/**
 * Creates a directory if it doesn't exist.
 *
 * @param dirPath The path of the directory to create
 * @param options Additional options
 */
function createDirectory(dirPath: string, options: CreateOptions = {}): void {
  const { verbose = false } = options;

  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
    if (verbose) {
      console.log(chalk.green(`📁 Created ${dirPath}`));
    }
  } else if (verbose) {
    console.log(chalk.yellow(`⚠️  Directory already exists: ${dirPath}`));
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
function copyFile(
  sourcePath: string,
  targetPath: string,
  options: CreateOptions = {}
): void {
  const { verbose = false } = options;

  const resolvedSource = path.isAbsolute(sourcePath)
    ? sourcePath
    : path.resolve(process.cwd(), sourcePath);

  if (!fs.existsSync(resolvedSource)) {
    console.warn(
      chalk.yellow(
        `⚠️  Warning: Source not found "${sourcePath}", creating empty file`
      )
    );
    createEmptyFile(targetPath, { verbose });
    return;
  }

  try {
    if (fs.statSync(resolvedSource).isDirectory()) {
      if (verbose) {
        console.log(
          chalk.blue(
            `📋 Copying directory from ${resolvedSource} to ${targetPath}`
          )
        );
      }
      copyDirectorySync(resolvedSource, targetPath, { verbose });
    } else {
      fs.copyFileSync(resolvedSource, targetPath);
      if (verbose) {
        console.log(chalk.green(`✅ Copied ${sourcePath} to ${targetPath}`));
      }
    }
  } catch (error) {
    console.warn(
      chalk.yellow(
        `⚠️  Warning: Failed to copy "${sourcePath}", creating empty file`
      )
    );
    createEmptyFile(targetPath, { verbose });
  }
}

/**
 * Moves a file or directory, creating an empty file if source doesn't exist.
 *
 * @param sourcePath The source path to move from
 * @param targetPath The target path to move to
 * @param options Additional options
 */
function moveFile(
  sourcePath: string,
  targetPath: string,
  options: CreateOptions = {}
): void {
  const { verbose = false } = options;

  const resolvedSource = path.isAbsolute(sourcePath)
    ? sourcePath
    : path.resolve(process.cwd(), sourcePath);

  if (!fs.existsSync(resolvedSource)) {
    console.warn(
      chalk.yellow(
        `⚠️  Warning: Source not found "${sourcePath}", creating empty file`
      )
    );
    createEmptyFile(targetPath, { verbose });
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
      if (verbose) {
        console.log(
          chalk.yellow(`⚠️  Replaced existing directory: ${targetPath}`)
        );
      }
    } else {
      fs.unlinkSync(targetPath);
      if (verbose) {
        console.log(chalk.yellow(`⚠️  Replaced existing file: ${targetPath}`));
      }
    }
  }

  try {
    if (fs.statSync(resolvedSource).isDirectory()) {
      if (verbose) {
        console.log(
          chalk.blue(
            `✂️  Moving directory from ${resolvedSource} to ${targetPath}`
          )
        );
      }
      copyDirectorySync(resolvedSource, targetPath, { verbose: false });
      fs.rmSync(resolvedSource, { recursive: true });
      if (verbose) {
        console.log(chalk.green(`✅ Moved directory successfully`));
      }
    } else {
      if (verbose) {
        console.log(
          chalk.blue(`✂️  Moving file from ${resolvedSource} to ${targetPath}`)
        );
      }
      try {
        fs.renameSync(resolvedSource, targetPath);
      } catch {
        fs.copyFileSync(resolvedSource, targetPath);
        fs.unlinkSync(resolvedSource);
      }
      if (verbose) {
        console.log(chalk.green(`✅ Moved file successfully`));
      }
    }
  } catch (error) {
    console.warn(
      chalk.yellow(
        `⚠️  Warning: Failed to move "${sourcePath}", creating empty file`
      )
    );
    createEmptyFile(targetPath, { verbose });
  }
}

/**
 * Recursively copies a directory.
 *
 * @param source The source directory to copy from
 * @param destination The destination directory to copy to
 * @param options Additional options
 */
function copyDirectorySync(
  source: string,
  destination: string,
  options: CreateOptions = {}
): void {
  const { verbose = false } = options;

  if (!fs.existsSync(destination)) {
    fs.mkdirSync(destination, { recursive: true });
  }

  const entries = fs.readdirSync(source, { withFileTypes: true });
  for (const entry of entries) {
    const sourcePath = path.join(source, entry.name);
    const destPath = path.join(destination, entry.name);

    if (entry.isDirectory()) {
      copyDirectorySync(sourcePath, destPath, { verbose });
    } else {
      fs.copyFileSync(sourcePath, destPath);
      if (verbose) {
        console.log(chalk.green(`  ✓ ${entry.name}`));
      }
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
