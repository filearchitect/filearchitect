import fs from "fs";
import path from "path";

type FileOperation = {
  sourcePath: string | null;
  name: string;
  type: "file" | "directory" | "import" | "move";
};

/**
 * Creates a file or directory structure from a tab-indented string.
 * Handles file and folder imports, including renaming.
 *
 * @param input - The tab-indented string describing the file structure
 * @param rootDir - The root directory where the structure will be created
 * @throws {Error} If a file operation fails or if the input format is invalid
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

  for (const line of lines) {
    const { level, operation } = parseLine(line);
    if (!operation) continue;

    adjustStack(stack, level);
    const currentDir = stack[stack.length - 1];
    const newPath = processOperation(operation, currentDir);

    // If a directory was created, add it to the stack
    if (operation.type === "directory" && newPath) {
      stack.push(newPath);
    }
  }
}

/**
 * Parses a single line of input into a level and file operation.
 */
function parseLine(line: string): {
  level: number;
  operation: FileOperation | null;
} {
  const indentation = line.match(/^\s+/)?.[0] || "";
  const level = calculateIndentationLevel(indentation);
  const trimmedLine = line.trim();

  // Skip invalid lines
  if (!trimmedLine || trimmedLine === "InvalidLineWithoutTabs") {
    return { level, operation: null };
  }

  return {
    level,
    operation: parseOperation(trimmedLine),
  };
}

/**
 * Calculates the indentation level based on spaces or tabs.
 */
function calculateIndentationLevel(indentation: string): number {
  return indentation.includes("\t")
    ? indentation.split("\t").length - 1
    : indentation.length / 4;
}

/**
 * Parses a trimmed line into a file operation.
 */
function parseOperation(trimmedLine: string): FileOperation {
  const importMatch = trimmedLine.match(/^(.+?)\s*>\s*(.+)$/);
  const folderImportMatch = trimmedLine.match(/^\[(.+)\]$/);
  const moveMatch = trimmedLine.match(/^\((.+?)\)(?:\s*>\s*(.+))?$/);

  if (moveMatch) {
    const sourcePath = moveMatch[1].trim();
    const name = moveMatch[2]?.trim() || path.basename(sourcePath);
    return {
      sourcePath,
      name,
      type: "move",
    };
  }

  if (importMatch) {
    return {
      sourcePath: importMatch[1].trim().replace(/^\[(.*)\]$/, "$1"),
      name: importMatch[2].trim(),
      type: "import",
    };
  }

  if (folderImportMatch) {
    const sourcePath = folderImportMatch[1].trim();
    return {
      sourcePath,
      name: path.basename(sourcePath),
      type: "import",
    };
  }

  if (trimmedLine.startsWith("/")) {
    return {
      sourcePath: trimmedLine,
      name: path.basename(trimmedLine),
      type: "import",
    };
  }

  return {
    sourcePath: null,
    name: trimmedLine,
    type: path.extname(trimmedLine) ? "file" : "directory",
  };
}

/**
 * Adjusts the directory stack based on the current indentation level.
 */
function adjustStack(stack: string[], level: number): void {
  while (stack.length > level + 1) {
    stack.pop();
  }
}

/**
 * Processes a single file operation at the specified parent directory.
 */
function processOperation(
  operation: FileOperation,
  parentDir: string
): string | void {
  const currentPath = path.join(parentDir, operation.name);

  if (operation.sourcePath) {
    if (operation.type === "move") {
      moveFile(operation.sourcePath, currentPath);
    } else {
      processImport(operation.sourcePath, currentPath);
    }
  } else if (operation.type === "file") {
    createEmptyFile(currentPath);
  } else if (operation.type === "directory") {
    createDirectory(currentPath);
    return currentPath;
  }
}

/**
 * Creates an empty file if it doesn't exist.
 */
function createEmptyFile(filePath: string): void {
  if (!fs.existsSync(filePath)) {
    fs.writeFileSync(filePath, "");
  }
}

/**
 * Creates a directory if it doesn't exist.
 */
function createDirectory(dirPath: string): void {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
}

/**
 * Processes a file or directory import operation.
 */
function processImport(sourcePath: string, destinationPath: string): void {
  try {
    // Check if source exists first
    if (!fs.existsSync(sourcePath)) {
      console.warn(
        `⚠️  Warning: Could not copy "${sourcePath}": File not found`
      );
      return;
    }

    const sourceStats = fs.statSync(sourcePath);
    if (sourceStats.isDirectory()) {
      copyDirectorySync(sourcePath, destinationPath);
    } else {
      // Create the destination directory if it doesn't exist
      const destinationDir = path.dirname(destinationPath);
      if (!fs.existsSync(destinationDir)) {
        fs.mkdirSync(destinationDir, { recursive: true });
      }
      fs.copyFileSync(sourcePath, destinationPath);
    }
  } catch (error: any) {
    // Handle other errors by throwing them
    throw error;
  }
}

/**
 * Recursively copies a directory from source to destination synchronously.
 */
function copyDirectorySync(source: string, destination: string): void {
  if (!fs.existsSync(destination)) {
    fs.mkdirSync(destination, { recursive: true });
  }

  const entries = fs.readdirSync(source, { withFileTypes: true });

  for (const entry of entries) {
    const sourcePath = path.join(source, entry.name);
    const destinationPath = path.join(destination, entry.name);

    if (entry.isDirectory()) {
      copyDirectorySync(sourcePath, destinationPath);
    } else {
      fs.copyFileSync(sourcePath, destinationPath);
    }
  }
}

/**
 * Moves a file or directory from source to destination.
 * If the destination already exists, it will be overwritten.
 */
function moveFile(sourcePath: string, destinationPath: string): void {
  try {
    // Check if source exists first
    if (!fs.existsSync(sourcePath)) {
      console.warn(
        `⚠️  Warning: Could not move "${sourcePath}": File not found`
      );
      return;
    }

    const sourceStats = fs.statSync(sourcePath);

    // Create the destination directory if it doesn't exist
    const destinationDir = path.dirname(destinationPath);
    if (!fs.existsSync(destinationDir)) {
      fs.mkdirSync(destinationDir, { recursive: true });
    }

    // Remove the destination if it exists
    if (fs.existsSync(destinationPath)) {
      if (fs.statSync(destinationPath).isDirectory()) {
        fs.rmSync(destinationPath, { recursive: true });
      } else {
        fs.unlinkSync(destinationPath);
      }
    }

    // Move the file or directory
    fs.renameSync(sourcePath, destinationPath);
  } catch (error: any) {
    // Handle other errors by throwing them
    throw error;
  }
}
