#!/usr/bin/env node

import chalk from "chalk";
import fs from "fs/promises";
import path from "path";
import { version } from "../package.json";
import { createStructureFromString } from "./index";

/**
 * Supported CLI commands
 */
type Command = "create" | "preview" | "validate" | "help" | "version";

/**
 * Command descriptions for help text
 */
const commands: Record<Command, string> = {
  create: "Create file structure from a file",
  preview: "Preview file structure without creating files",
  validate: "Validate structure file syntax",
  help: "Show help information",
  version: "Show version information",
};

/**
 * File/directory icons for preview mode
 */
const icons = {
  file: "📄",
  directory: "📁",
  copy: "📄 (copy)",
  move: "📄 (move)",
} as const;

/**
 * Shows help information about available commands
 */
function showHelp(): void {
  console.log(chalk.bold("File Architect CLI\n"));
  console.log("Usage: file-architect <command> [options]\n");
  console.log(chalk.bold("Commands:"));
  Object.entries(commands).forEach(([cmd, desc]) => {
    console.log(`  ${chalk.cyan(cmd.padEnd(15))} ${desc}`);
  });
  console.log(chalk.bold("\nOptions:"));
  console.log(
    `  ${chalk.cyan("--verbose")}         Show detailed logs of all operations`
  );
  console.log(chalk.bold("\nExamples:"));
  console.log(`  ${chalk.gray("file-architect create structure.txt")}`);
  console.log(`  ${chalk.gray("file-architect preview structure.txt")}`);
  console.log(
    `  ${chalk.gray("file-architect create structure.txt --verbose")}`
  );
  console.log(
    `  ${chalk.gray(
      "echo 'project\\n  src\\n    index.js' | file-architect create -"
    )}`
  );
}

/**
 * Shows version information
 */
function showVersion(): void {
  console.log(chalk.cyan(`file-architect-core version ${version}`));
}

/**
 * Calculates the indentation level of a line
 *
 * @param indentation The indentation string at the start of the line
 * @returns The calculated indentation level
 */
function calculateIndentationLevel(indentation: string): number {
  return indentation.includes("\t")
    ? indentation.split("\t").length - 1
    : Math.floor(indentation.length / 2);
}

/**
 * Gets the operation type from a line
 *
 * @param line The line to analyze
 * @returns The icon representing the operation type
 */
function getOperationType(line: string): string {
  if (line.match(/^\[(.+?)\](?:\s*>\s*(.+))?$/)) {
    return icons.copy;
  }
  if (line.match(/^\((.+?)\)(?:\s*>\s*(.+))?$/)) {
    return icons.move;
  }
  return line.includes(".") ? icons.file : icons.directory;
}

/**
 * Previews the structure without creating files
 *
 * @param input The structure definition string
 */
async function previewStructure(input: string): Promise<void> {
  const lines = input.split("\n").filter((line) => line.trim().length > 0);
  let currentIndentation = 0;

  for (const line of lines) {
    const indentation = line.match(/^\s+/)?.[0] || "";
    const level = calculateIndentationLevel(indentation);
    currentIndentation = level;

    const prefix = "  ".repeat(level);
    const trimmedLine = line.trim();
    const icon = getOperationType(trimmedLine);

    console.log(chalk.blue(`${prefix}${icon} ${trimmedLine}`));
  }
}

/**
 * Validates the structure syntax
 *
 * @param input The structure definition string
 * @returns True if the structure is valid, false otherwise
 */
async function validateStructure(input: string): Promise<boolean> {
  try {
    const lines = input.split("\n").filter((line) => line.trim().length > 0);
    let currentIndentation = 0;

    for (const line of lines) {
      const indentation = line.match(/^\s+/)?.[0] || "";
      const level = calculateIndentationLevel(indentation);

      // Check for invalid indentation jumps
      if (level > currentIndentation + 1) {
        throw new Error(`Invalid indentation at line: ${line}`);
      }

      currentIndentation = level;
      const trimmedLine = line.trim();

      // Validate operation syntax
      if (trimmedLine.startsWith("[")) {
        // Copy operation
        if (!trimmedLine.match(/^\[(.+?)\](?:\s*>\s*(.+))?$/)) {
          throw new Error(
            `Invalid copy operation syntax at line: ${trimmedLine}`
          );
        }
      } else if (trimmedLine.startsWith("(")) {
        // Move operation
        if (!trimmedLine.match(/^\((.+?)\)(?:\s*>\s*(.+))?$/)) {
          throw new Error(
            `Invalid move operation syntax at line: ${trimmedLine}`
          );
        }
      }
    }

    console.log(chalk.green("✅ Structure file is valid"));
    return true;
  } catch (error) {
    console.error(
      chalk.red("❌ Validation failed:"),
      chalk.yellow((error as Error).message)
    );
    return false;
  }
}

/**
 * Reads input from a file or stdin
 *
 * @param source The source to read from ('-' for stdin)
 * @returns The input content as a string
 */
async function readInput(source: string): Promise<string> {
  if (source === "-") {
    const chunks = [];
    for await (const chunk of process.stdin) {
      chunks.push(chunk);
    }
    return Buffer.concat(chunks).toString("utf8");
  }
  return fs.readFile(path.resolve(source), "utf-8");
}

/**
 * Main CLI function
 */
async function main(): Promise<void> {
  const args = process.argv.slice(2);
  const verboseIndex = args.indexOf("--verbose");
  const verbose = verboseIndex !== -1;

  // Remove --verbose from args if present
  if (verbose) {
    args.splice(verboseIndex, 1);
  }

  const [command, inputFile, outputDir = process.cwd()] = args;

  // Handle help and version commands
  if (!command || command === "help") {
    showHelp();
    process.exit(0);
  }

  if (command === "version") {
    showVersion();
    process.exit(0);
  }

  // Validate input file argument
  if (!inputFile) {
    console.error(chalk.red("Error: Input file is required"));
    showHelp();
    process.exit(1);
  }

  try {
    const input = await readInput(inputFile);

    switch (command as Command) {
      case "create":
        await fs.mkdir(path.resolve(outputDir), { recursive: true });
        createStructureFromString(input, path.resolve(outputDir), { verbose });
        if (!verbose) {
          console.log(chalk.green(`✨ Structure created in ${outputDir}`));
        }
        break;

      case "preview":
        await previewStructure(input);
        break;

      case "validate":
        const isValid = await validateStructure(input);
        process.exit(isValid ? 0 : 1);
        break;

      default:
        console.error(chalk.red(`Unknown command: ${command}`));
        showHelp();
        process.exit(1);
    }
  } catch (error) {
    console.error(chalk.red(`Error: ${(error as Error).message}`));
    process.exit(1);
  }
}

// Start the CLI
main();
