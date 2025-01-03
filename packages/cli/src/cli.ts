#!/usr/bin/env node
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import {
  createStructureFromString,
  NodeFileSystem,
} from "../../core/src/index.js";

// Parse command line arguments
const [, , command, inputFile, outputDir = "."] = process.argv;

// Show usage if required arguments are missing
if (!command || !inputFile || command !== "create") {
  console.log(`
FileArchitect - Create file structures from text descriptions

Usage:
  filearchitect create <input-file> [output-dir]

Arguments:
  input-file    Text file containing the structure description
  output-dir    Directory to create the structure in (default: current directory)
`);
  process.exit(1);
}

// Main function
async function main() {
  try {
    // Read structure from file
    const structure = await readFile(inputFile, "utf-8");
    const absoluteOutput = resolve(outputDir);

    // Create the structure
    await createStructureFromString(structure, absoluteOutput, {
      verbose: true,
      isCLI: true,
      fs: new NodeFileSystem(),
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
