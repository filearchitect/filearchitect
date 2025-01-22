import path from "path";
import process from "process";
import { BaseFileSystem } from "./base-filesystem.js";
import { getStructureFromString } from "./get-structure.js";
import {
  CreateStructureOptions,
  FileNameReplacement,
  FileSystem,
} from "./types.js";

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
  const {
    fs: filesystem,
    fileNameReplacements,
    folderNameReplacements,
    recursive,
    onWarning,
  } = options;

  if (!filesystem) {
    throw new Error("Filesystem implementation is required");
  }

  // Set up warning handler if provided
  if (filesystem instanceof BaseFileSystem && onWarning) {
    filesystem.setWarningHandler(onWarning);
  }

  // Create the root directory if it doesn't exist
  if (!(await filesystem.exists(rootDir))) {
    await filesystem.mkdir(rootDir, { recursive: true });
  }

  // Get the structure operations
  const result = await getStructureFromString(input, {
    rootDir,
    fs: filesystem,
    fileNameReplacements,
    folderNameReplacements,
    recursive,
  });

  // Execute each operation
  for (const operation of result.operations) {
    try {
      const destinationDir = path.dirname(operation.targetPath);
      if (!(await filesystem.exists(destinationDir))) {
        await createDirectory(destinationDir, { fs: filesystem });
      }

      switch (operation.type) {
        case "create":
          if (operation.isDirectory) {
            await createDirectory(operation.targetPath, { fs: filesystem });
          } else {
            await createEmptyFile(operation.targetPath, { fs: filesystem });
          }
          break;

        case "copy":
          if (!operation.sourcePath) {
            throw new Error("Source path is required for copy operations");
          }
          await copyFile(operation.sourcePath, operation.targetPath, {
            fs: filesystem,
            fileNameReplacements,
            folderNameReplacements,
          });
          break;

        case "move":
          if (!operation.sourcePath) {
            throw new Error("Source path is required for move operations");
          }
          await moveFile(operation.sourcePath, operation.targetPath, {
            fs: filesystem,
          });
          break;

        case "included":
          // These are already handled by the copy/move operations
          break;
      }
    } catch (error: any) {
      if (filesystem.emitWarning) {
        if (error.code === "ENOENT") {
          filesystem.emitWarning({
            type: "missing_source",
            message: `Source path not found: ${error.path}`,
            path: error.path,
          });
          // Create empty file/directory as fallback
          if (operation.isDirectory) {
            await createDirectory(operation.targetPath, { fs: filesystem });
          } else {
            await createEmptyFile(operation.targetPath, { fs: filesystem });
          }
        } else {
          filesystem.emitWarning({
            type: "operation_failed",
            message: error.message,
            path: operation.targetPath,
          });
        }
      }
    }
  }
}

/**
 * Creates an empty file, creating parent directories if needed.
 */
async function createEmptyFile(
  filePath: string,
  options: { fs: FileSystem }
): Promise<void> {
  const { fs: filesystem } = options;

  const dir = path.dirname(filePath);
  if (!(await filesystem.exists(dir))) {
    await createDirectory(dir, { fs: filesystem });
  }

  await filesystem.writeFile(filePath, "");
}

/**
 * Creates a directory if it doesn't exist.
 */
async function createDirectory(
  dirPath: string,
  options: { fs: FileSystem }
): Promise<void> {
  const { fs: filesystem } = options;
  await filesystem.mkdir(dirPath, { recursive: true });
}

/**
 * Copies a file or directory.
 */
async function copyFile(
  sourcePath: string,
  targetPath: string,
  options: {
    fs: FileSystem;
    fileNameReplacements?: FileNameReplacement[];
    folderNameReplacements?: FileNameReplacement[];
  }
): Promise<void> {
  const {
    fs: filesystem,
    fileNameReplacements,
    folderNameReplacements,
  } = options;

  const resolvedSource = path.isAbsolute(sourcePath)
    ? sourcePath
    : path.resolve(process.cwd(), sourcePath);

  const stat = await filesystem.stat(resolvedSource);
  const isDirectory = stat.isDirectory();

  if (isDirectory) {
    await filesystem.copyFolder(resolvedSource, targetPath, {
      fileNameReplacements,
      folderNameReplacements,
    });
  } else {
    await filesystem.copyFile(resolvedSource, targetPath);
  }
}

/**
 * Moves a file or directory.
 */
async function moveFile(
  sourcePath: string,
  targetPath: string,
  options: { fs: FileSystem }
): Promise<void> {
  const { fs: filesystem } = options;

  const resolvedSource = path.isAbsolute(sourcePath)
    ? sourcePath
    : path.resolve(process.cwd(), sourcePath);

  const stat = await filesystem.stat(resolvedSource);
  const isDirectory = stat.isDirectory();

  if (isDirectory) {
    await filesystem.moveFolder(resolvedSource, targetPath);
  } else {
    await filesystem.rename(resolvedSource, targetPath);
  }
}
