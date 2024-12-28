#!/usr/bin/env node

import { createStructureFromString } from "@filearchitect/core";
import { readFile } from "fs/promises";
import { version } from "../package.json";

const help = `
file-architect v${version}

Usage:
  file-architect create <input-file> <output> [--verbose]
  file-architect validate <input-file>

Options:
  --verbose    Show detailed output
  -h, --help   Show this help message
  -v, --version Show version

Examples:
  file-architect create structure.txt output
  echo "folder1\\n  file1.txt" | file-architect create - output
  file-architect validate structure.txt
`;

async function main() {
  const args = process.argv.slice(2);

  if (args.length === 0 || args.includes("-h") || args.includes("--help")) {
    console.log(help);
    process.exit(0);
  }

  if (args.includes("-v") || args.includes("--version")) {
    console.log(version);
    process.exit(0);
  }

  const command = args[0];
  const inputFile = args[1];
  const outputDir = args[2];
  const verbose = args.includes("--verbose");

  if (!inputFile) {
    console.error("Error: Input file is required");
    process.exit(1);
  }

  try {
    let input: string;
    if (inputFile === "-") {
      // Read from stdin
      const chunks = [];
      for await (const chunk of process.stdin) {
        chunks.push(chunk);
      }
      input = Buffer.concat(chunks).toString();
    } else {
      input = await readFile(inputFile, "utf-8");
    }

    if (command === "create") {
      if (!outputDir) {
        console.error("Error: Output directory is required");
        process.exit(1);
      }

      await createStructureFromString(input, outputDir, { verbose });
      if (verbose) {
        console.log("✨ Structure created successfully");
      }
    } else if (command === "validate") {
      // Just try to parse the input, if no error is thrown, it's valid
      await createStructureFromString(input, "/tmp/validate", {
        verbose: false,
      });
      console.log("✅ Structure is valid");
    } else {
      console.error(`Error: Unknown command "${command}"`);
      process.exit(1);
    }
  } catch (error: unknown) {
    if (error instanceof Error) {
      console.error("Error:", error.message);
    } else {
      console.error("Error:", String(error));
    }
    process.exit(1);
  }
}

main();
