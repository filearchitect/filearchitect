import path from "path";
import yaml from "yaml";
import { NodeFileSystem } from "./node-filesystem.js";
import { resolveTildePath } from "./path-utils.js";
import type {
  FileNameReplacement,
  FileSystem,
  GetStructureOptions,
  GetStructureResult,
  StructureFrontmatter,
  StructureOperation,
  StructureOperationLine,
  StructureOperationType,
} from "./types.js";
import { Replacements } from "./types/operations.js";
import { handleOperationError } from "./utils/error-utils.js";
import { applyReplacements } from "./utils/replacements.js";
import { validateOperation } from "./utils/validation.js";
import { createMessage } from "./warnings.js";

/**
 * Parses a line into an operation and indentation level.
 *
 * @param line The line to parse
 * @param replacements The replacements for the line
 * @returns The indentation level and parsed operation
 */
function parseLine(
  line: string,
  replacements: {
    files: FileNameReplacement[];
    folders: FileNameReplacement[];
  }
): {
  level: number;
  operation: {
    name: string;
    sourcePath?: string;
  } | null;
} {
  const indentation = line.match(/^\s+/)?.[0] || "";
  const level = indentation.includes("\t")
    ? indentation.split("\t").length - 1
    : indentation.length / 4;
  const trimmedLine = line.trim();

  if (!trimmedLine || trimmedLine === "InvalidLineWithoutTabs") {
    return { level, operation: null };
  }

  return {
    level,
    operation: parseOperation(
      trimmedLine,
      replacements.files,
      replacements.folders
    ),
  };
}

/**
 * Parses a trimmed line into a file operation.
 * Supports three formats:
 * - (source) > target : Move operation
 * - [source] > target : Copy operation
 * - name : Regular file/directory creation
 *
 * @param line The trimmed line to parse
 * @param fileNameReplacements The replacements for file names
 * @param folderNameReplacements The replacements for folder names
 * @returns The parsed file operation
 */
function parseOperation(
  line: string,
  fileNameReplacements: FileNameReplacement[],
  folderNameReplacements: FileNameReplacement[]
): StructureOperationLine | null {
  // Move operation
  const moveMatch = line.match(/^\((.+?)\)(?:\s*>\s*(.+))?$/);
  if (moveMatch) {
    return {
      type: "move",
      sourcePath: resolveTildePath(moveMatch[1].trim()),
      name: moveMatch[2]?.trim() || path.basename(moveMatch[1].trim()),
    };
  }

  // Copy operation
  const copyMatch = line.match(/^\[(.+?)\](?:\s*>\s*(.+))?$/);
  if (copyMatch) {
    return {
      type: "copy",
      sourcePath: resolveTildePath(copyMatch[1].trim()),
      name: copyMatch[2]?.trim() || path.basename(copyMatch[1].trim()),
    };
  }

  // Create operation
  const isDirectory = !path.extname(line);
  return {
    type: "create",
    name: line,
    isDirectory,
  } satisfies StructureOperationLine;
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
  baseDepth: number,
  options: {
    fileNameReplacements: FileNameReplacement[];
    folderNameReplacements: FileNameReplacement[];
  }
): Promise<StructureOperation[]> {
  const results: StructureOperation[] = [];
  const entries = await fs.readdir(sourcePath, { withFileTypes: true });

  for (const entry of entries) {
    const isDirectory = entry.isDirectory();
    const replacedName = applyReplacements(
      entry.name,
      isDirectory
        ? options.folderNameReplacements
        : options.fileNameReplacements
    );

    const currentSourcePath = path.join(sourcePath, entry.name);
    const currentTargetPath = path.join(targetPath, replacedName);

    results.push({
      type: "included",
      targetPath: currentTargetPath,
      sourcePath: currentSourcePath,
      isDirectory,
      depth: baseDepth + 1,
      name: replacedName,
    });

    if (isDirectory) {
      const subContents = await listDirectoryContents(
        fs,
        currentSourcePath,
        currentTargetPath,
        baseDepth + 1,
        {
          fileNameReplacements: options.fileNameReplacements,
          folderNameReplacements: options.folderNameReplacements,
        }
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
  // Get pre-merged replacements from options
  const fileNameReplacements = options.replacements?.files || [];
  const folderNameReplacements = options.replacements?.folders || [];

  const fs = options.fs || new NodeFileSystem();
  const { level, operation } = parseLine(line, {
    files: fileNameReplacements,
    folders: folderNameReplacements,
  });
  if (!operation || !("type" in operation)) return null;

  adjustStack(stack, level);
  const currentDir = stack[stack.length - 1];

  // Handle directory markers with explicit trailing slash
  const directoryMatch = line.match(/^(\s*)(.*\/)\s*$/);
  if (directoryMatch) {
    const rawName = directoryMatch[2].trim().replace(/\/$/, "");
    const replacedName = applyReplacements(rawName, folderNameReplacements);

    return {
      type: "create",
      name: replacedName + "/",
      targetPath: path.join(currentDir, replacedName),
      isDirectory: true,
      depth: directoryMatch[1].length / 2,
    };
  }

  // For copy/move operations, check the target name (operation.name)
  // For create operations, check the line itself to handle directories correctly
  const isDirectory =
    operation.type === "create"
      ? !path.extname(line.trim())
      : !path.extname(operation.name);

  // Apply replacements based on whether it's a file or directory
  const replacedName = applyReplacements(
    operation.name,
    isDirectory ? folderNameReplacements : fileNameReplacements
  );
  const targetPath = path.join(currentDir, replacedName);

  // Create the structure operation with proper type assertion
  const structureOperation: StructureOperation = {
    type: operation.type as StructureOperationType,
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

  validateOperation(structureOperation);

  // Check for missing source files
  await handleFileSourceCheck(structureOperation, fs);

  try {
    // ... existing code ...
  } catch (error) {
    throw handleOperationError(
      error,
      structureOperation.targetPath,
      structureOperation.isDirectory ? "directory" : "file",
      { emitWarning: fs?.emitWarning?.bind(fs) }
    );
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
          operation.depth,
          {
            fileNameReplacements: options.replacements?.files || [],
            folderNameReplacements: options.replacements?.folders || [],
          }
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
 * Parses YAML frontmatter from the input string if present
 */
function parseFrontmatter(input: string): {
  frontmatter: StructureFrontmatter | null;
  content: string;
} {
  const match = input.match(/^\s*---\s*([\s\S]*?)\s*---\s*([\s\S]*)$/);
  if (!match) {
    return { frontmatter: null, content: input };
  }

  try {
    const yamlContent = match[1].replace(/\t/g, "  ");

    const parsed = yaml.parse(yamlContent);
    const frontmatter = {
      replacements: {
        files: parsed.fileReplacements || [],
        folders: parsed.folderReplacements || [],
        all: parsed.allReplacements || [],
      },
    };

    return { frontmatter, content: match[2] };
  } catch (error) {
    // If YAML parsing fails, treat the whole input as content
    return { frontmatter: null, content: input };
  }
}

function mergeReplacements(
  frontmatter: StructureFrontmatter | null,
  options: GetStructureOptions
): Replacements {
  // De-duplicate replacements with priority: options > frontmatter
  const allReplacements = [
    ...(frontmatter?.replacements?.all || []),
    ...(options.replacements?.all || []),
  ].filter((v, i, a) => a.findIndex((t) => t.search === v.search) === i);

  return {
    files: [
      ...allReplacements,
      ...(frontmatter?.replacements?.files || []),
      ...(options.replacements?.files || []),
    ],
    folders: [
      ...allReplacements,
      ...(frontmatter?.replacements?.folders || []),
      ...(options.replacements?.folders || []),
    ],
    all: allReplacements,
  };
}

/**
 * Gets an array of structure operations from a tab-indented string.
 * The string format supports:
 * - Regular files and directories
 * - File/directory copying with [source] > target syntax
 * - File/directory moving with (source) > target syntax
 * - Tab or space indentation for nesting
 * - YAML frontmatter for file and folder name replacements
 *
 * @param input The tab-indented string describing the structure
 * @param options Options for getting structure operations
 * @returns The structure result containing operations and options used
 */
export async function getStructure(
  input: string,
  options: GetStructureOptions
): Promise<GetStructureResult> {
  const { rootDir } = options;
  const { frontmatter, content } = parseFrontmatter(input);

  // Merge frontmatter and options replacements here
  const mergedReplacements = mergeReplacements(frontmatter, options);

  const mergedOptions: GetStructureOptions = {
    ...options,
    replacements: mergedReplacements,
  };

  const operations: (StructureOperation & { orderIndex: number })[] = [];
  let orderIndex = 0;
  const lines = content.split("\n").filter((line) => line.trim().length > 0);
  const stack: string[] = [rootDir];

  for (const line of lines) {
    const structureOperation = await processLine(line, stack, mergedOptions);
    if (!structureOperation) continue;

    operations.push({ ...structureOperation, orderIndex: orderIndex++ });

    const directoryContents = await handleDirectoryContents(
      structureOperation,
      mergedOptions.fs || new NodeFileSystem(),
      mergedOptions
    );

    // Add directory contents with incrementing order indices
    for (const content of directoryContents) {
      operations.push({ ...content, orderIndex: orderIndex++ });
    }
  }

  // Sort operations to maintain parent-child relationships while preserving original order
  operations.sort((a, b) => {
    // If one path is a parent of the other, parent comes first
    if (b.targetPath.startsWith(a.targetPath + path.sep)) return -1;
    if (a.targetPath.startsWith(b.targetPath + path.sep)) return 1;

    // Otherwise preserve original order based on orderIndex
    return a.orderIndex - b.orderIndex;
  });

  // Remove the orderIndex before returning since it's not part of the StructureOperation type
  const finalOperations = operations.map(({ orderIndex, ...op }) => op);

  return {
    operations: finalOperations,
    options: {
      rootDir,
      replacements: mergedReplacements,
      recursive: options.recursive ?? true,
      fs: mergedOptions.fs || new NodeFileSystem(),
    },
  };
}
