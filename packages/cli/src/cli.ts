#!/usr/bin/env node
import { Table } from "console-table-printer";
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import {
  createStructureFromString,
  getStructureFromString,
  NodeFileSystem,
  StructureResult,
} from "../../core/src/index.js";

// Initialize filesystem for directory scanning
const fs = new NodeFileSystem();

/**
 * Creates and prints a table of operations
 */
function printOperationsTable(result: StructureResult) {
  const table = new Table({
    columns: [
      { name: "itemType", title: "Type", alignment: "left" },
      { name: "operation", title: "Operation", alignment: "left" },
      { name: "path", title: "Path", alignment: "left" },
      { name: "sourcePath", title: "Source", alignment: "left" },
      { name: "warning", title: "Warning", alignment: "left" },
    ],
    charLength: {
      itemType: 10,
      operation: 10,
      path: 50,
      sourcePath: 50,
      warning: 50,
    },
  });

  // Add rows to table with colors
  for (const op of result.operations) {
    const row = {
      itemType: op.isDirectory ? "directory" : "file",
      operation: op.type,
      path: op.targetPath,
      sourcePath: op.sourcePath || "-",
      warning: op.warning || "-",
    };

    // Add color based on operation type
    const color =
      op.type === "create"
        ? "green"
        : op.type === "copy"
        ? "cyan"
        : op.type === "move"
        ? "yellow"
        : op.type === "included"
        ? "cyan"
        : undefined;

    table.addRow(row, { color });
  }

  table.printTable();
}

// Parse command line arguments
const args = process.argv.slice(2);
let command: string | undefined;
let inputFile: string | undefined;
let outputDir = ".";
let fileNameReplacements: { search: string; replace: string }[] = [];
let showRecursive = true;

// Parse arguments
for (let i = 0; i < args.length; i++) {
  const arg = args[i];
  if (i === 0) {
    command = arg;
  } else if (i === 1) {
    inputFile = arg;
  } else if (i === 2) {
    outputDir = arg;
  } else if (
    (arg === "--replace-folder" || arg === "--replace-file") &&
    i + 1 < args.length
  ) {
    const replacement = args[++i];
    const [search, replace] = replacement.split(":");
    if (search && replace) {
      fileNameReplacements.push({ search, replace });
    }
  } else if (arg === "--no-recursive") {
    showRecursive = false;
  }
}

// Show usage if required arguments are missing
if (!command || !inputFile || (command !== "create" && command !== "show")) {
  console.log(`
FileArchitect - Create file structures from text descriptions

Usage:
  filearchitect create <input-file> [output-dir] [options]
  filearchitect show <input-file> [output-dir] [options]

Arguments:
  input-file    Text file containing the structure description
  output-dir    Directory to create the structure in (default: current directory)

Options:
  --replace-folder <search:replace>   Replace occurrences of 'search' with 'replace' in directory names
  --replace-file <search:replace>     Replace occurrences of 'search' with 'replace' in file names
  --no-recursive                      Don't show recursive contents of copied/moved directories

Commands:
  create    Create the file structure
  show      Show the operations that would be performed without executing them
`);
  process.exit(1);
}

// Main function
async function main() {
  // At this point we know inputFile is defined due to the check above
  const input = inputFile as string;

  try {
    const structure = await readFile(input, "utf-8");
    const absoluteOutput = resolve(outputDir);

    if (command === "show") {
      // Get and display the operations
      const result = await getStructureFromString(structure, {
        rootDir: absoluteOutput,
        fileNameReplacements,
        recursive: showRecursive,
        fs,
      });

      console.log("\nOperations that would be performed:\n");
      printOperationsTable(result);
      console.log("\nNo changes were made to the filesystem.");
    } else {
      // Create the structure and show the operations performed
      await createStructureFromString(structure, absoluteOutput, {
        isCLI: true,
        fs,
        fileNameReplacements,
      });

      // Get the operations that were performed for display
      const result = await getStructureFromString(structure, {
        rootDir: absoluteOutput,
        fileNameReplacements,
        recursive: showRecursive,
        fs,
      });

      console.log("\nOperations performed:\n");
      printOperationsTable(result);
    }
  } catch (error) {
    if (error instanceof Error) {
      console.error("Error:", error.message);
    } else {
      console.error("An unknown error occurred");
    }
    process.exit(1);
  }
}

main();
