import { getStructure } from "./get-structure.js";
import { NodeFileSystem } from "./node-filesystem.js";
import * as pathUtils from "./path-utils.js"; // Import path utils
import type {
  CreateStructureOptions,
  FileNameReplacement,
  FileSystem,
  GetStructureResult,
  StructureOperation, // Import StructureOperation
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
 * @param options Additional options for structure creation
 */
export async function createStructure(
  input: string,
  options: CreateStructureOptions
): Promise<GetStructureResult> {
  const fs = options.fs || new NodeFileSystem();
  const { rootDir, replacements = { files: [], folders: [], all: [] } } =
    options;

  // 1. Get the structure plan (operations) from getStructure
  const result = await getStructure(input, {
    rootDir,
    fs,
    replacements, // Pass replacements for parsing phase
    // Pass recursive only if it exists in CreateStructureOptions (though not standard)
    ...(options.hasOwnProperty("recursive") && {
      recursive: (options as any).recursive,
    }),
  });

  // 2. Ensure the root directory exists (is this necessary if getStructure uses it?)
  // ensureEmptyDir might be too destructive if getStructure already relied on existing sources within it.
  // Let's ensure it exists, but not necessarily empty it here. Maybe add an option?
  // For now, ensuring it exists seems safest if operations target it.
  await fs.ensureDir(rootDir); // Changed from ensureEmptyDir

  const { operations: structureOperations } = result;

  // 3. Execute each operation
  for (const operation of structureOperations) {
    // Skip 'included' operations as they are handled by parent copy/move
    if (operation.type === "included") continue;

    try {
      // Ensure parent directory exists *before* attempting the operation
      const parentDir = pathUtils.getDirname(operation.targetPath);
      if (
        parentDir &&
        parentDir !== "." &&
        parentDir !== rootDir &&
        !(await fs.exists(parentDir))
      ) {
        await executeCreateDirectory(parentDir, fs);
      }

      switch (operation.type) {
        case "create":
          await executeCreate(operation, fs);
          break;
        case "copy":
          // Replacements are needed here again if the FS layer uses them during copyFolder
          await executeCopy(operation, fs, replacements);
          break;
        case "move":
          // Replacements might be needed here for moveFolder if it implies copies/renames
          await executeMove(operation, fs, replacements);
          break;
      }
    } catch (error: any) {
      // Handle errors, potentially falling back for missing sources
      await handleExecutionError(error, operation, fs);
    }
  }

  // Return the result from getStructure which includes the performed operations and options used
  return result;
}

// --- Helper Functions for Execution ---

/**
 * Creates an empty file, ensuring parent directories exist.
 */
async function executeCreateFile(
  filePath: string,
  fs: FileSystem
): Promise<void> {
  const dir = pathUtils.getDirname(filePath);
  if (dir && dir !== "." && !(await fs.exists(dir))) {
    await executeCreateDirectory(dir, fs); // Reuse directory creation logic
  }
  await fs.writeFile(filePath, "");
}

/**
 * Creates a directory recursively if it doesn't exist.
 */
async function executeCreateDirectory(
  dirPath: string,
  fs: FileSystem
): Promise<void> {
  await fs.mkdir(dirPath, { recursive: true });
}

/**
 * Executes a "create" operation (file or directory).
 */
async function executeCreate(
  operation: StructureOperation,
  fs: FileSystem
): Promise<void> {
  if (operation.isDirectory) {
    await executeCreateDirectory(operation.targetPath, fs);
  } else {
    await executeCreateFile(operation.targetPath, fs);
  }
}

/**
 * Executes a "copy" operation.
 */
async function executeCopy(
  operation: StructureOperation,
  fs: FileSystem,
  replacements: {
    all?: FileNameReplacement[];
    files?: FileNameReplacement[];
    folders?: FileNameReplacement[];
  }
): Promise<void> {
  if (!operation.sourcePath) {
    throw new Error(
      `Source path missing for copy operation: ${operation.targetPath}`
    );
  }
  const exists = await fs.exists(operation.sourcePath);
  if (!exists) {
    throw Object.assign(
      new Error(`Source path not found: ${operation.sourcePath}`),
      { code: "ENOENT", path: operation.sourcePath }
    );
  }

  const stat = await fs.stat(operation.sourcePath);
  const isSourceDirectory = stat.isDirectory();

  if (isSourceDirectory) {
    // Ensure target directory exists before copying folder contents
    if (!(await fs.exists(operation.targetPath))) {
      await executeCreateDirectory(operation.targetPath, fs);
    }
    await fs.copyFolder(operation.sourcePath, operation.targetPath, {
      replacements,
    });
  } else {
    // Ensure target directory exists before copying file
    const targetDir = pathUtils.getDirname(operation.targetPath);
    if (targetDir && targetDir !== "." && !(await fs.exists(targetDir))) {
      await executeCreateDirectory(targetDir, fs);
    }
    await fs.copyFile(operation.sourcePath, operation.targetPath);
  }
}

/**
 * Executes a "move" operation.
 */
async function executeMove(
  operation: StructureOperation,
  fs: FileSystem,
  replacements: {
    all?: FileNameReplacement[];
    files?: FileNameReplacement[];
    folders?: FileNameReplacement[];
  }
): Promise<void> {
  if (!operation.sourcePath) {
    throw new Error(
      `Source path missing for move operation: ${operation.targetPath}`
    );
  }
  const exists = await fs.exists(operation.sourcePath);
  if (!exists) {
    throw Object.assign(
      new Error(`Source path not found: ${operation.sourcePath}`),
      { code: "ENOENT", path: operation.sourcePath }
    );
  }

  const stat = await fs.stat(operation.sourcePath);
  const isSourceDirectory = stat.isDirectory();

  // Ensure target directory exists before moving
  const targetDir = pathUtils.getDirname(operation.targetPath);
  if (targetDir && targetDir !== "." && !(await fs.exists(targetDir))) {
    await executeCreateDirectory(targetDir, fs);
  }

  if (isSourceDirectory) {
    await fs.moveFolder(operation.sourcePath, operation.targetPath, {
      replacements,
    });
  } else {
    await fs.rename(operation.sourcePath, operation.targetPath);
  }
}

/**
 * Handles errors during operation execution, emitting warnings and potentially falling back.
 */
async function handleExecutionError(
  error: any,
  operation: StructureOperation,
  fs: FileSystem
): Promise<void> {
  if (fs.emitWarning) {
    if (error.code === "ENOENT" && error.path) {
      // Check for specific ENOENT structure
      fs.emitWarning({
        type: "missing_source",
        message: `Source path not found during execution: ${error.path}`,
        path: error.path, // Use error.path which should be the source path
      });
      // Fallback: Create an empty target file/directory if source was missing
      console.warn(
        `Warning: Source ${error.path} not found for ${operation.type} operation. Creating empty target ${operation.targetPath}.`
      );
      await executeCreate(operation, fs); // Use the dedicated create function
    } else {
      fs.emitWarning({
        type: "operation_failed",
        message: `Failed to execute ${operation.type} for ${operation.targetPath}: ${error.message}`,
        path: operation.targetPath,
      });
      console.error(
        `Error executing operation for ${operation.targetPath}:`,
        error
      );
    }
  } else {
    // If no warning emitter, just log the error
    console.error(
      `Error executing operation for ${operation.targetPath}:`,
      error
    );
  }
}
