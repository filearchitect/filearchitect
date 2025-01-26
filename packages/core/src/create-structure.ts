import path from "path";

import process from "process";
import { getStructure } from "./get-structure.js";
import { NodeFileSystem } from "./node-filesystem.js";
import type {
  CreateStructureOptions,
  FileNameReplacement,
  FileSystem,
  GetStructureResult,
  StructureOperation,
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
export async function createStructure(
  input: string,
  rootDir: string,
  options: CreateStructureOptions = {}
): Promise<GetStructureResult> {
  const fs = options.fs || new NodeFileSystem();
  const operations: StructureOperation[] = [];

  // Remove replacements from root directory processing
  const replacedRoot = rootDir;

  // Ensure root directory exists and is empty
  await fs.ensureEmptyDir(replacedRoot);

  // Process structure
  const result = await getStructure(input, {
    ...options,
    rootDir: replacedRoot,
    fs,
  });

  const { operations: structureOperations } = result;

  const { replacements = { files: [], folders: [], all: [] }, recursive } =
    options;

  const fileNameReplacements = replacements.files || [];
  const folderNameReplacements = replacements.folders || [];

  // Execute each operation
  for (const operation of structureOperations) {
    try {
      const destinationDir = path.dirname(operation.targetPath);
      if (!(await fs.exists(destinationDir))) {
        await createDirectory(destinationDir, { fs });
      }

      switch (operation.type) {
        case "create":
          if (operation.isDirectory) {
            await createDirectory(operation.targetPath, { fs });
          } else {
            await createEmptyFile(operation.targetPath, { fs });
          }
          break;

        case "copy":
          if (!operation.sourcePath) {
            throw new Error("Source path is required for copy operations");
          }
          await copyFile(operation.sourcePath, operation.targetPath, {
            fs,
            replacements: {
              all: replacements.all || [],
              files: fileNameReplacements,
              folders: folderNameReplacements,
            },
          });
          break;

        case "move":
          if (!operation.sourcePath) {
            throw new Error("Source path is required for move operations");
          }
          await moveFile(operation.sourcePath, operation.targetPath, {
            fs,
            replacements: {
              all: replacements.all || [],
              files: fileNameReplacements,
              folders: folderNameReplacements,
            },
          });
          break;

        case "included":
          // These are already handled by the copy/move operations
          break;
      }
    } catch (error: any) {
      if (fs.emitWarning) {
        if (error.code === "ENOENT") {
          fs.emitWarning({
            type: "missing_source",
            message: `Source path not found: ${error.path}`,
            path: error.path,
          });
          // Create empty file/directory as fallback
          if (operation.isDirectory) {
            await createDirectory(operation.targetPath, { fs });
          } else {
            await createEmptyFile(operation.targetPath, { fs });
          }
        } else {
          fs.emitWarning({
            type: "operation_failed",
            message: error.message,
            path: operation.targetPath,
          });
        }
      }
    }
  }

  return result;
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
    replacements: {
      all?: FileNameReplacement[];
      files?: FileNameReplacement[];
      folders?: FileNameReplacement[];
    };
  }
): Promise<void> {
  const { fs: filesystem, replacements } = options;

  const resolvedSource = path.isAbsolute(sourcePath)
    ? sourcePath
    : path.resolve(process.cwd(), sourcePath);

  const stat = await filesystem.stat(resolvedSource);
  const isDirectory = stat.isDirectory();

  if (isDirectory) {
    await filesystem.copyFolder(resolvedSource, targetPath, {
      replacements,
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
  options: {
    fs: FileSystem;
    replacements: {
      all?: FileNameReplacement[];
      files?: FileNameReplacement[];
      folders?: FileNameReplacement[];
    };
  }
): Promise<void> {
  const { fs: filesystem, replacements } = options;

  const resolvedSource = path.isAbsolute(sourcePath)
    ? sourcePath
    : path.resolve(process.cwd(), sourcePath);

  const stat = await filesystem.stat(resolvedSource);
  const isDirectory = stat.isDirectory();

  if (isDirectory) {
    await filesystem.moveFolder(resolvedSource, targetPath, {
      replacements,
    });
  } else {
    await filesystem.rename(resolvedSource, targetPath);
  }
}
