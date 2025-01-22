import path from "path";
import { NodeFileSystem } from "./node-filesystem.js";
import { resolveTildePath } from "./path-utils.js";
import type {
  FileNameReplacement,
  FileOperation,
  FileSystem,
  GetStructureOptions,
  StructureOperation,
  StructureResult,
} from "./types.js";
import { createMessage } from "./warnings.js";

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
    const result: FileOperation = {
      type: "move",
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
      type: "copy",
      sourcePath,
      name: targetName || path.basename(sourcePath),
    };
    return result;
  }

  // Regular file or directory
  const result: FileOperation = {
    type: "create",
    // type: path.extname(line) ? "file" : "directory",
    name: line,
  };
  return result;
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

/**
 * Recursively lists all files and directories in a directory
 */
async function listDirectoryContents(
  fs: FileSystem,
  sourcePath: string,
  targetPath: string,
  baseDepth: number
): Promise<StructureOperation[]> {
  const results: StructureOperation[] = [];
  const entries = await fs.readdir(sourcePath, { withFileTypes: true });

  for (const entry of entries) {
    const currentSourcePath = path.join(sourcePath, entry.name);
    const currentTargetPath = path.join(targetPath, entry.name);
    const isDirectory = entry.isDirectory();
    results.push({
      type: "included",
      targetPath: currentTargetPath,
      sourcePath: currentSourcePath,
      isDirectory,
      depth: baseDepth + 1,
      name: entry.name,
    });

    if (isDirectory) {
      const subContents = await listDirectoryContents(
        fs,
        currentSourcePath,
        currentTargetPath,
        baseDepth + 1
      );
      results.push(...subContents);
    }
  }

  return results;
}

/**
 * Processes a single line of the input string.
 *
 * @param line The line to process
 * @param stack The current directory stack
 * @param options The options for getting structure operations
 * @returns A structure operation or null if the line is invalid
 */
async function processLine(
  line: string,
  stack: string[],
  options: GetStructureOptions
): Promise<StructureOperation | null> {
  const { fileNameReplacements = [], fs } = options;
  const { level, operation } = parseLine(line);
  if (!operation) return null;

  adjustStack(stack, level);
  const currentDir = stack[stack.length - 1];

  // Apply replacements to the operation name
  const replacedName = applyFileNameReplacements(
    operation.name,
    fileNameReplacements
  );
  const targetPath = path.join(currentDir, replacedName);

  // Determine if it's a directory operation
  const isDirectory = !path.extname(line);

  // Create the structure operation
  const structureOperation: StructureOperation = {
    type: operation.type,
    targetPath,
    sourcePath: operation.sourcePath,
    isDirectory,
    depth: level,
    name: path.basename(targetPath),
  };

  // If it's a directory, add it to the stack for nesting
  if (structureOperation.isDirectory) {
    stack.push(targetPath);
  }

  return structureOperation;
}

/**
 * Handles listing directory contents for copy or move operations.
 *
 * @param operation The structure operation to handle
 * @param fs The file system to use
 * @param options The options for getting structure operations
 * @returns An array of structure operations
 */
async function handleDirectoryContents(
  operation: StructureOperation,
  fs: FileSystem,
  options: GetStructureOptions
): Promise<StructureOperation[]> {
  const { recursive = true } = options;
  const operations: StructureOperation[] = [];
  if (
    recursive &&
    (operation.type === "copy" || operation.type === "move") &&
    operation.isDirectory &&
    operation.sourcePath
  ) {
    try {
      const exists = await fs.exists(operation.sourcePath);
      if (exists) {
        const contents = await listDirectoryContents(
          fs,
          operation.sourcePath,
          operation.targetPath,
          operation.depth
        );
        operations.push(...contents);
      } else {
        operation.warning = createMessage(
          "SOURCE_NOT_FOUND",
          operation.sourcePath
        );
      }
    } catch (error) {
      operation.warning = createMessage(
        "SOURCE_ACCESS_ERROR",
        operation.sourcePath
      );
    }
  }
  return operations;
}

/**
 * Handles checking if the source file exists for copy or move operations.
 *
 * @param operation The structure operation to handle
 * @param fs The file system to use
 */
async function handleFileSourceCheck(
  operation: StructureOperation,
  fs: FileSystem
): Promise<void> {
  if (
    (operation.type === "copy" || operation.type === "move") &&
    operation.sourcePath
  ) {
    try {
      const exists = await fs.exists(operation.sourcePath);
      if (!exists) {
        operation.warning = createMessage(
          "SOURCE_NOT_FOUND",
          operation.sourcePath
        );
      }
    } catch (error) {
      operation.warning = createMessage(
        "SOURCE_ACCESS_ERROR",
        operation.sourcePath
      );
    }
  }
}

/**
 * Gets an array of structure operations from a tab-indented string.
 * The string format supports:
 * - Regular files and directories
 * - File/directory copying with [source] > target syntax
 * - File/directory moving with (source) > target syntax
 * - Tab or space indentation for nesting
 *
 * @param input The tab-indented string describing the structure
 * @param options Options for getting structure operations
 * @returns The structure result containing operations and options used
 */
export async function getStructureFromString(
  input: string,
  options: GetStructureOptions
): Promise<StructureResult> {
  const { rootDir } = options;

  const operations: StructureOperation[] = [];
  const lines = input.split("\n").filter((line) => line.trim().length > 0);
  const stack: string[] = [rootDir];
  const fs = options.fs || new NodeFileSystem();

  for (const line of lines) {
    const structureOperation = await processLine(line, stack, options);
    if (!structureOperation) continue;

    operations.push(structureOperation);

    const directoryContents = await handleDirectoryContents(
      structureOperation,
      fs,
      options
    );
    operations.push(...directoryContents);

    await handleFileSourceCheck(structureOperation, fs);
  }

  return {
    operations,
    options: {
      rootDir,
      fileNameReplacements: options.fileNameReplacements,
      recursive: options.recursive,
      fs,
    },
  };
}
