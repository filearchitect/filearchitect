#!/usr/bin/env node

import fs from "fs/promises";
import path from "path";
import { version } from "../package.json";
import { createStructureFromString } from "./index";

type Command = "create" | "preview" | "validate" | "help" | "version";

const commands: Record<Command, string> = {
  create: "Create file structure from a file",
  preview: "Preview file structure without creating files",
  validate: "Validate structure file syntax",
  help: "Show help information",
  version: "Show version information",
};

function showHelp() {
  console.log("File Architect CLI\n");
  console.log("Usage: file-architect <command> [options]\n");
  console.log("Commands:");
  Object.entries(commands).forEach(([cmd, desc]) => {
    console.log(`  ${cmd.padEnd(15)} ${desc}`);
  });
  console.log("\nExamples:");
  console.log("  file-architect create structure.txt");
  console.log("  file-architect preview structure.txt");
  console.log(
    "  echo 'project\\n  src\\n    index.js' | file-architect create -"
  );
}

function showVersion() {
  console.log(`file-architect-core version ${version}`);
}

async function previewStructure(input: string) {
  const lines = input.split("\n").filter((line) => line.trim().length > 0);
  let currentIndentation = 0;

  for (const line of lines) {
    const indentation = line.match(/^\s+/)?.[0] || "";
    const level = indentation.includes("\t")
      ? indentation.split("\t").length - 1
      : Math.floor(indentation.length / 2);

    if (level > currentIndentation) {
      currentIndentation = level;
    } else if (level < currentIndentation) {
      currentIndentation = level;
    }

    const prefix = "  ".repeat(level);
    const trimmedLine = line.trim();

    if (trimmedLine.startsWith("[") && trimmedLine.endsWith("]")) {
      console.log(`${prefix}📄 ${trimmedLine} (copy)`);
    } else if (trimmedLine.startsWith("(") && trimmedLine.endsWith(")")) {
      console.log(`${prefix}📄 ${trimmedLine} (move)`);
    } else if (trimmedLine.includes(".")) {
      console.log(`${prefix}📄 ${trimmedLine}`);
    } else {
      console.log(`${prefix}📁 ${trimmedLine}`);
    }
  }
}

async function validateStructure(input: string) {
  try {
    const lines = input.split("\n").filter((line) => line.trim().length > 0);
    let currentIndentation = 0;

    for (const line of lines) {
      const indentation = line.match(/^\s+/)?.[0] || "";
      const level = indentation.includes("\t")
        ? indentation.split("\t").length - 1
        : Math.floor(indentation.length / 2);

      if (level > currentIndentation + 1) {
        throw new Error(`Invalid indentation at line: ${line}`);
      }

      currentIndentation = level;
      const trimmedLine = line.trim();

      // Validate file/folder operations syntax
      if (trimmedLine.startsWith("[") && !trimmedLine.endsWith("]")) {
        throw new Error(`Invalid copy operation syntax at line: ${line}`);
      }
      if (trimmedLine.startsWith("(") && !trimmedLine.endsWith(")")) {
        throw new Error(`Invalid move operation syntax at line: ${line}`);
      }
    }

    console.log("✅ Structure file is valid");
    return true;
  } catch (error) {
    console.error("❌ Validation failed:", (error as Error).message);
    return false;
  }
}

async function readInput(source: string): Promise<string> {
  if (source === "-") {
    const chunks = [];
    for await (const chunk of process.stdin) {
      chunks.push(chunk);
    }
    return Buffer.concat(chunks).toString("utf8");
  }

  try {
    return await fs.readFile(path.resolve(source), "utf-8");
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") {
      throw new Error(`Input file not found: ${source}`);
    }
    throw error;
  }
}

async function main() {
  const [command, inputFile, outputDir = process.cwd()] = process.argv.slice(2);

  if (!command || command === "help") {
    showHelp();
    process.exit(0);
  }

  if (command === "version") {
    showVersion();
    process.exit(0);
  }

  if (!inputFile) {
    console.error("Error: Input file is required");
    showHelp();
    process.exit(1);
  }

  try {
    const input = await readInput(inputFile);

    switch (command as Command) {
      case "create":
        // Create output directory if it doesn't exist
        await fs.mkdir(path.resolve(outputDir), { recursive: true });
        await createStructureFromString(input, path.resolve(outputDir));
        console.log(`✨ Structure created in ${outputDir}`);
        break;

      case "preview":
        await previewStructure(input);
        break;

      case "validate":
        const isValid = await validateStructure(input);
        process.exit(isValid ? 0 : 1);
        break;

      default:
        console.error(`Unknown command: ${command}`);
        showHelp();
        process.exit(1);
    }
  } catch (error) {
    console.error(`Error: ${(error as Error).message}`);
    process.exit(1);
  }
}

main();
