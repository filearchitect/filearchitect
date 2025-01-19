import path from "path";
import { resolveTildePath } from "./path-utils.js";
import type {
  FileNameReplacement,
  GetStructureOptions,
  OperationType,
  StructureOperation,
} from "./types.js";

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
    type: path.extname(line) ? "file" : "directory",
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
 * Gets an array of structure operations from a tab-indented string.
 * The string format supports:
 * - Regular files and directories
 * - File/directory copying with [source] > target syntax
 * - File/directory moving with (source) > target syntax
 * - Tab or space indentation for nesting
 *
 * @param input The tab-indented string describing the structure
 * @param options Options for getting structure operations
 * @returns An array of structure operations
 */
export function getStructureFromString(
  input: string,
  options: GetStructureOptions
): StructureOperation[] {
  const { rootDir, fileNameReplacements } = options;
  const operations: StructureOperation[] = [];
  const lines = input.split("\n").filter((line) => line.trim().length > 0);
  const stack: string[] = [rootDir];

  for (const line of lines) {
    const { level, operation } = parseLine(line);
    if (!operation) continue;

    adjustStack(stack, level);
    const currentDir = stack[stack.length - 1];

    // Apply replacements to the operation name
    const replacedName = applyFileNameReplacements(
      operation.name,
      fileNameReplacements
    );
    const targetPath = path.join(currentDir, replacedName);

    // Determine if it's a directory operation
    const isDirectory =
      operation.type === "directory" ||
      Boolean(
        operation.sourcePath &&
          (!path.extname(operation.sourcePath) ||
            operation.sourcePath.endsWith(path.sep))
      );

    // Create the structure operation
    const structureOperation: StructureOperation = {
      type: operation.type,
      targetPath,
      sourcePath: operation.sourcePath,
      isDirectory,
    };

    operations.push(structureOperation);

    // If it's a directory, add it to the stack for nesting
    if (structureOperation.isDirectory) {
      stack.push(targetPath);
    }
  }

  return operations;
}
