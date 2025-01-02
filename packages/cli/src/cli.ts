#!/usr/bin/env node
import { createStructureFromString, NodeFileSystem } from "@filearchitect/core";
import { Command } from "commander";
import { readFile } from "fs/promises";

const program = new Command();

program
  .name("filearchitect")
  .description("Create file and directory structures from text descriptions")
  .version("0.1.2");

program
  .command("create")
  .description("Create a file structure from a text file")
  .argument("<file>", "The structure file to read")
  .argument("[output]", "Output directory", ".")
  .option("-v, --verbose", "Show verbose output", false)
  .action(
    async (file: string, output: string, options: { verbose: boolean }) => {
      try {
        const structure = await readFile(file, "utf-8");
        await createStructureFromString(structure, output, {
          verbose: options.verbose,
          fs: new NodeFileSystem(),
        });
      } catch (error: any) {
        console.error("Error:", error.message);
        process.exit(1);
      }
    }
  );

program.parse();
