import path from "path";
import { fileURLToPath } from "url";
import { afterEach, beforeEach, describe, expect, test } from "vitest";
import { createStructure } from "../src/create-structure.js";
import { NodeFileSystem } from "../src/node-filesystem.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

describe("createStructure", () => {
  const testDir = path.join(__dirname, "test-output");
  const sourceDir = path.join(__dirname, "test-source");
  const fs = new NodeFileSystem();

  // Create test directories before each test
  beforeEach(async () => {
    await fs.ensureEmptyDir(testDir);
    await fs.ensureEmptyDir(sourceDir);
  });

  // Clean up test directories after each test
  afterEach(async () => {
    await fs.remove(testDir);
    await fs.remove(sourceDir);
  });

  test("creates a basic file structure", async () => {
    const input = `
src
    index.ts
    utils
        helpers.ts
`;

    await createStructure(input, testDir, {
      fs,
    });

    // Verify the files and directories were created
    expect(fs.exists(path.join(testDir, "src"))).resolves.toBe(true);
    expect(fs.exists(path.join(testDir, "src", "index.ts"))).resolves.toBe(
      true
    );
    expect(fs.exists(path.join(testDir, "src", "utils"))).resolves.toBe(true);
    expect(
      fs.exists(path.join(testDir, "src", "utils", "helpers.ts"))
    ).resolves.toBe(true);
  });

  test("copies files and preserves content", async () => {
    // Create a source file with content
    const sourceFile = path.join(sourceDir, "source.ts");
    const sourceContent = "console.log('Hello, World!');";
    await fs.writeFile(sourceFile, sourceContent);

    const input = `
src
    [${sourceFile}] > copied.ts
`;

    await createStructure(input, testDir, {
      fs,
    });

    // Verify the file was copied with correct content
    const copiedPath = path.join(testDir, "src", "copied.ts");
    expect(fs.exists(copiedPath)).resolves.toBe(true);
    expect(fs.readFile(copiedPath)).resolves.toBe(sourceContent);
  });

  test("moves files and removes source", async () => {
    // Create a source file
    const sourceFile = path.join(sourceDir, "to-move.ts");
    const sourceContent = "export const x = 42;";
    await fs.writeFile(sourceFile, sourceContent);

    const input = `
src
    (${sourceFile}) > moved.ts
`;

    await createStructure(input, testDir, {
      fs,
    });

    // Verify the file was moved
    const movedPath = path.join(testDir, "src", "moved.ts");
    expect(fs.exists(movedPath)).resolves.toBe(true);
    expect(fs.exists(sourceFile)).resolves.toBe(false);
    expect(fs.readFile(movedPath)).resolves.toBe(sourceContent);
  });

  test("copies directories recursively", async () => {
    // Create a source directory structure
    const sourceSubDir = path.join(sourceDir, "subdir");
    await fs.ensureDir(sourceSubDir);
    await fs.writeFile(path.join(sourceDir, "file1.ts"), "file1");
    await fs.writeFile(path.join(sourceSubDir, "file2.ts"), "file2");

    const input = `
src
    [${sourceDir}] > copied
`;

    await createStructure(input, testDir, {
      fs,
    });

    // Verify the directory was copied with all contents
    const copiedDir = path.join(testDir, "src", "copied");
    expect(fs.exists(copiedDir)).resolves.toBe(true);
    expect(fs.exists(path.join(copiedDir, "file1.ts"))).resolves.toBe(true);
    expect(fs.exists(path.join(copiedDir, "subdir", "file2.ts"))).resolves.toBe(
      true
    );
    expect(fs.readFile(path.join(copiedDir, "file1.ts"))).resolves.toBe(
      "file1"
    );
    expect(
      fs.readFile(path.join(copiedDir, "subdir", "file2.ts"))
    ).resolves.toBe("file2");
  });

  test("applies file name replacements during creation", async () => {
    const input = `
src
    file-NAME-test.ts
`;

    await createStructure(input, testDir, {
      fs,
      replacements: {
        files: [{ search: "NAME", replace: "replaced" }],
      },
    });

    // Verify the file was created with the replaced name
    expect(
      fs.exists(path.join(testDir, "src", "file-replaced-test.ts"))
    ).resolves.toBe(true);
  });

  test("handles missing source files gracefully", async () => {
    const input = `
src
    [/non/existent/file.ts] > copied.ts
`;

    await createStructure(input, testDir, {
      fs,
    });

    // Verify the target file was created (empty)
    const targetPath = path.join(testDir, "src", "copied.ts");
    expect(fs.exists(targetPath)).resolves.toBe(true);
    expect(fs.readFile(targetPath)).resolves.toBe("");
  });

  test("creates structure with frontmatter replacements", async () => {
    const input = `---
replace-file:
  - search: ".js"
    replace: ".ts"
---
src
    index.ts`;

    await createStructure(input, "test", {
      fs,
    });

    // Verify created files
    expect(await fs.exists("test/src/index.ts")).toBe(true);
  });

  test("applies replacements to copied files and directories", async () => {
    const input = `---
replace-file:
  - search: ".js"
    replace: ".ts"
---
[src] > lib
    [index.js] > index.ts`;

    await createStructure(input, "test", {
      fs,
    });

    // Verify copied files
    expect(await fs.exists("test/lib/index.ts")).toBe(true);
  });

  test("applies replacements to moved files and directories", async () => {
    const input = `---
replace-file:
  - search: ".js"
    replace: ".ts"
---
(src) > lib
    (index.js) > index.ts`;

    await createStructure(input, "test", {
      fs,
    });

    // Verify moved files
    expect(await fs.exists("test/lib/index.ts")).toBe(true);
  });
});
