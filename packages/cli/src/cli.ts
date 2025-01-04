#!/usr/bin/env node
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import {
  createStructureFromString,
  NodeFileSystem,
} from "../../core/src/index.js";

// Parse command line arguments
const args = process.argv.slice(2);
let command: string | undefined;
let inputFile: string | undefined;
let outputDir = ".";
let fileNameReplacements: { search: string; replace: string }[] = [];

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
  }
}

// Show usage if required arguments are missing
if (!command || !inputFile || command !== "create") {
  console.log(`
FileArchitect - Create file structures from text descriptions

Usage:
  filearchitect create <input-file> [output-dir] [options]

Arguments:
  input-file    Text file containing the structure description
  output-dir    Directory to create the structure in (default: current directory)

Options:
  --replace-folder <search:replace>    Replace occurrences of 'search' with 'replace' in directory names
  --replace-file <search:replace>      Replace occurrences of 'search' with 'replace' in file names
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

    // Create the structure
    await createStructureFromString(structure, absoluteOutput, {
      verbose: true,
      isCLI: true,
      fs: new NodeFileSystem(),
      fileNameReplacements,
    });
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
