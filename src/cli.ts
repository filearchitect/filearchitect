#!/usr/bin/env node

import fs from "fs/promises";
import path from "path";
import { createStructureFromString } from "./index";

const [, , inputFile, outputDir = process.cwd()] = process.argv;

if (!inputFile) {
  console.error("Usage: file-architect <input-file> [output-dir]");
  process.exit(1);
}

(async () => {
  try {
    const input = await fs.readFile(path.resolve(inputFile), "utf-8");
    const resolvedOutputDir = path.resolve(outputDir);

    await createStructureFromString(input, resolvedOutputDir);
    console.log(`Structure created in ${resolvedOutputDir}`);
  } catch (error) {
    console.error(`Error: ${(error as Error).message}`);
    process.exit(1);
  }
})();
