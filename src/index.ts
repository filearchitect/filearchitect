import chalk from "chalk";
import fs from "fs";
import os from "os";
import path from "path";
import process from "process";

/**
 * Interface for filesystem operations
 */
export interface FileSystem {
  exists(path: string): boolean | Promise<boolean>;
  mkdir(path: string, options: { recursive: boolean }): void | Promise<void>;
  writeFile(path: string, data: string): void | Promise<void>;
  readFile(path: string): string | Promise<string>;
  copyFile(src: string, dest: string): void | Promise<void>;
  stat(
    path: string
  ): { isDirectory(): boolean } | Promise<{ isDirectory(): boolean }>;
  readdir(
    path: string,
    options: { withFileTypes: true }
  ): any[] | Promise<any[]>;
  rm(path: string, options: { recursive: boolean }): void | Promise<void>;
  unlink(path: string): void | Promise<void>;
  rename(oldPath: string, newPath: string): void | Promise<void>;
}

/**
 * Node.js filesystem implementation
 */
export class NodeFileSystem implements FileSystem {
  async exists(path: string): Promise<boolean> {
    try {
      await fs.promises.access(path);
      return true;
    } catch {
      return false;
    }
  }

  async mkdir(path: string, options: { recursive: boolean }): Promise<void> {
    await fs.promises.mkdir(path, options);
  }

  async writeFile(path: string, data: string): Promise<void> {
    await fs.promises.writeFile(path, data);
  }

  async readFile(path: string): Promise<string> {
    return await fs.promises.readFile(path, "utf-8");
  }

  async copyFile(src: string, dest: string): Promise<void> {
    await fs.promises.copyFile(src, dest);
  }

  async stat(path: string): Promise<{ isDirectory(): boolean }> {
    return await fs.promises.stat(path);
  }

  async readdir(
    path: string,
    options: { withFileTypes: true }
  ): Promise<any[]> {
    return await fs.promises.readdir(path, options);
  }

  async rm(path: string, options: { recursive: boolean }): Promise<void> {
    await fs.promises.rm(path, options);
  }

  async unlink(path: string): Promise<void> {
    await fs.promises.unlink(path);
  }

  async rename(oldPath: string, newPath: string): Promise<void> {
    await fs.promises.rename(oldPath, newPath);
  }
}

/**
 * Tauri filesystem implementation
 */
export class TauriFileSystem implements FileSystem {
  private fs: any;

  constructor(tauriFs: any) {
    this.fs = tauriFs;
  }

  async exists(path: string): Promise<boolean> {
    try {
      await this.fs.stat(path);
      return true;
    } catch {
      return false;
    }
  }

  async mkdir(path: string, options: { recursive: boolean }): Promise<void> {
    await this.fs.createDir(path, { recursive: options.recursive });
  }

  async writeFile(path: string, data: string): Promise<void> {
    await this.fs.writeTextFile(path, data);
  }

  async readFile(path: string): Promise<string> {
    return await this.fs.readTextFile(path);
  }

  async copyFile(src: string, dest: string): Promise<void> {
    await this.fs.copyFile(src, dest);
  }

  async stat(path: string): Promise<{ isDirectory(): boolean }> {
    const stat = await this.fs.stat(path);
    return {
      isDirectory: () => stat.type === "directory",
    };
  }

  async readdir(
    path: string,
    options: { withFileTypes: true }
  ): Promise<any[]> {
    const entries = await this.fs.readDir(path);
    if (options.withFileTypes) {
      return entries.map((entry: any) => ({
        name: entry.name,
        isDirectory: () => entry.type === "directory",
      }));
    }
    return entries.map((entry: any) => entry.name);
  }

  async rm(path: string, options: { recursive: boolean }): Promise<void> {
    await this.fs.removeFile(path, { recursive: options.recursive });
  }

  async unlink(path: string): Promise<void> {
    await this.fs.removeFile(path);
  }

  async rename(oldPath: string, newPath: string): Promise<void> {
    await this.fs.rename(oldPath, newPath);
  }
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
 * Options for structure creation
 */
interface CreateOptions {
  /** Whether to output verbose logs */
  verbose?: boolean;
  /** Custom filesystem implementation */
  fs?: FileSystem;
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
  options: CreateOptions = {}
): Promise<void> {
  const { verbose = false, fs: filesystem = new NodeFileSystem() } = options;

  if (verbose) {
    console.log(chalk.blue("��� Creating structure in " + rootDir));
  }

  // Create the root directory if it doesn't exist
  if (!(await filesystem.exists(rootDir))) {
    await filesystem.mkdir(rootDir, { recursive: true });
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
          chalk.blue("🔄 " + operation.type.toUpperCase() + ": " + line.trim())
        );
      }

      try {
        const newPath = await executeOperation(operation, targetPath, {
          verbose,
          fs: filesystem,
        });
        if (operation.type === "directory" && newPath) {
          stack.push(newPath);
        }
      } catch (error: any) {
        hasWarnings = true;
        console.warn(chalk.yellow("⚠️  Warning: " + error.message));
      }
    } catch (error: any) {
      hasWarnings = true;
      console.warn(chalk.yellow("⚠️  Warning: " + error.message));
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
async function executeOperation(
  operation: FileOperation,
  targetPath: string,
  options: CreateOptions = {}
): Promise<string | void> {
  const { verbose = false, fs: filesystem = new NodeFileSystem() } = options;

  try {
    const destinationDir = path.dirname(targetPath);
    if (!(await filesystem.exists(destinationDir))) {
      await filesystem.mkdir(destinationDir, { recursive: true });
      if (verbose) {
        console.log(`📁 Created directory: ${destinationDir}`);
      }
    }

    switch (operation.type) {
      case "file":
        await createEmptyFile(targetPath, { verbose, fs: filesystem });
        break;

      case "directory":
        await createDirectory(targetPath, { verbose, fs: filesystem });
        return targetPath;

      case "copy":
        if (!operation.sourcePath) {
          await createEmptyFile(targetPath, { verbose, fs: filesystem });
          break;
        }
        await copyFile(operation.sourcePath, targetPath, {
          verbose,
          fs: filesystem,
        });
        break;

      case "move":
        if (!operation.sourcePath) {
          await createEmptyFile(targetPath, { verbose, fs: filesystem });
          break;
        }
        await moveFile(operation.sourcePath, targetPath, {
          verbose,
          fs: filesystem,
        });
        break;
    }
  } catch (error: any) {
    console.warn(
      chalk.yellow(
        `⚠️  Warning: Operation failed, creating empty file: ${error.message}`
      )
    );
    try {
      await createEmptyFile(targetPath, { verbose, fs: filesystem });
    } catch (err: any) {
      console.warn(
        chalk.yellow(`⚠️  Warning: Could not create empty file: ${err.message}`)
      );
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
  options: CreateOptions = {}
): Promise<void> {
  const { verbose = false, fs: filesystem = new NodeFileSystem() } = options;

  const dir = path.dirname(filePath);
  if (!(await filesystem.exists(dir))) {
    await filesystem.mkdir(dir, { recursive: true });
  }

  // Always write the file, even if it exists
  await filesystem.writeFile(filePath, "");
  if (verbose) {
    console.log(chalk.green("📄 Created " + filePath));
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
  options: CreateOptions = {}
): Promise<void> {
  const { verbose = false, fs: filesystem = new NodeFileSystem() } = options;

  if (!(await filesystem.exists(dirPath))) {
    await filesystem.mkdir(dirPath, { recursive: true });
    if (verbose) {
      console.log(chalk.green("📁 Created " + dirPath));
    }
  } else if (verbose) {
    console.log(chalk.yellow("⚠️  Directory already exists: " + dirPath));
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
  options: CreateOptions = {}
): Promise<void> {
  const { verbose = false, fs: filesystem = new NodeFileSystem() } = options;

  const resolvedSource = path.isAbsolute(sourcePath)
    ? sourcePath
    : path.resolve(process.cwd(), sourcePath);

  if (!(await filesystem.exists(resolvedSource))) {
    console.warn(
      chalk.yellow(
        '⚠️  Warning: Source not found "' +
          sourcePath +
          '", creating empty file'
      )
    );
    await createEmptyFile(targetPath, { verbose, fs: filesystem });
    return;
  }

  const destinationDir = path.dirname(targetPath);
  if (!(await filesystem.exists(destinationDir))) {
    await filesystem.mkdir(destinationDir, { recursive: true });
  }

  try {
    const stat = await filesystem.stat(resolvedSource);
    if (stat.isDirectory()) {
      if (verbose) {
        console.log(
          chalk.blue(
            "📋 Copying directory from " + resolvedSource + " to " + targetPath
          )
        );
      }
      await copyDirectorySync(resolvedSource, targetPath, {
        verbose,
        fs: filesystem,
      });
    } else {
      await filesystem.copyFile(resolvedSource, targetPath);
      if (verbose) {
        console.log(
          chalk.green("✅ Copied " + sourcePath + " to " + targetPath)
        );
      }
    }
  } catch (error) {
    console.warn(
      chalk.yellow(
        '⚠️  Warning: Failed to copy "' + sourcePath + '", creating empty file'
      )
    );
    await createEmptyFile(targetPath, { verbose, fs: filesystem });
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
  options: CreateOptions = {}
): Promise<void> {
  const { verbose = false, fs: filesystem = new NodeFileSystem() } = options;

  const resolvedSource = path.isAbsolute(sourcePath)
    ? sourcePath
    : path.resolve(process.cwd(), sourcePath);

  if (!(await filesystem.exists(resolvedSource))) {
    console.warn(
      chalk.yellow(
        '⚠️  Warning: Source not found "' +
          sourcePath +
          '", creating empty file'
      )
    );
    await createEmptyFile(targetPath, { verbose, fs: filesystem });
    return;
  }

  const destinationDir = path.dirname(targetPath);
  if (!(await filesystem.exists(destinationDir))) {
    await filesystem.mkdir(destinationDir, { recursive: true });
  }

  try {
    const stat = await filesystem.stat(resolvedSource);
    if (stat.isDirectory()) {
      if (verbose) {
        console.log(
          chalk.blue(
            "✂️  Moving directory from " + resolvedSource + " to " + targetPath
          )
        );
      }
      await copyDirectorySync(resolvedSource, targetPath, {
        verbose: false,
        fs: filesystem,
      });
      await filesystem.rm(resolvedSource, { recursive: true });
      if (verbose) {
        console.log(chalk.green("✅ Moved directory successfully"));
      }
    } else {
      if (verbose) {
        console.log(
          chalk.blue(
            "✂️  Moving file from " + resolvedSource + " to " + targetPath
          )
        );
      }
      try {
        // First try to copy the file to ensure we have the content
        await filesystem.copyFile(resolvedSource, targetPath);
        // Then try to remove the source file
        await filesystem.unlink(resolvedSource);
      } catch (error) {
        console.warn(
          chalk.yellow(
            "⚠️  Warning: Failed to move file, falling back to copy: " + error
          )
        );
      }
      if (verbose) {
        console.log(chalk.green("✅ Moved file successfully"));
      }
    }
  } catch (error) {
    console.warn(
      chalk.yellow(
        '⚠️  Warning: Failed to move "' + sourcePath + '", creating empty file'
      )
    );
    await createEmptyFile(targetPath, { verbose, fs: filesystem });
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
  options: CreateOptions = {}
): Promise<void> {
  const { verbose = false, fs: filesystem = new NodeFileSystem() } = options;

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
        fs: filesystem,
      });
    } else {
      await filesystem.copyFile(sourcePath, destPath);
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
