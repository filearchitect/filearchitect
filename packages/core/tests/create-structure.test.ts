import path from "path";
import { fileURLToPath } from "url";
import { afterEach, beforeEach, describe, expect, test } from "vitest";
import { createStructureFromString } from "../src/create-structure.js";
import { NodeFileSystem } from "../src/node-filesystem.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

describe("createStructureFromString", () => {
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

    await createStructureFromString(input, testDir, {
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

    await createStructureFromString(input, testDir, {
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

    await createStructureFromString(input, testDir, {
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

    await createStructureFromString(input, testDir, {
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

    await createStructureFromString(input, testDir, {
      fs,
      fileNameReplacements: [{ search: "NAME", replace: "replaced" }],
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

    await createStructureFromString(input, testDir, {
      fs,
    });

    // Verify the target file was created (empty)
    const targetPath = path.join(testDir, "src", "copied.ts");
    expect(fs.exists(targetPath)).resolves.toBe(true);
    expect(fs.readFile(targetPath)).resolves.toBe("");
  });

  test("creates structure with frontmatter replacements", async () => {
    const input = `---
replace-folder:
  - search: "old"
    replace: "new"
replace-file:
  - search: ".js"
    replace: ".ts"
---
root
  old-dir
    test.js
    other.js`;

    await createStructureFromString(input, "/test", { fs });

    // Check if directories were created with replaced names
    expect(await fs.exists("/test/root/new-dir")).toBe(true);

    // Check if files were created with replaced extensions
    expect(await fs.exists("/test/root/new-dir/test.ts")).toBe(true);
    expect(await fs.exists("/test/root/new-dir/other.ts")).toBe(true);
  });

  test("applies replacements to copied files and directories", async () => {
    const input = `---
replace-folder:
  - search: "old"
    replace: "new"
replace-file:
  - search: ".js"
    replace: ".ts"
---
root
  [/src/old-dir] > target-dir
  [/src/test.js] > target.js`;

    await createStructureFromString(input, "/test", { fs });

    // Check if directory was copied with replaced name
    expect(await fs.exists("/test/root/target-new-dir")).toBe(true);

    // Check if files were copied with replaced extensions
    expect(await fs.exists("/test/root/target-new-dir/file1.ts")).toBe(true);
    expect(await fs.exists("/test/root/target-new-dir/file2.ts")).toBe(true);
    expect(await fs.exists("/test/root/target.ts")).toBe(true);

    // Check original content was preserved
    expect(await fs.readFile("/test/root/target-new-dir/file1.ts")).toBe(
      "file1 content"
    );
    expect(await fs.readFile("/test/root/target-new-dir/file2.ts")).toBe(
      "file2 content"
    );
    expect(await fs.readFile("/test/root/target.ts")).toBe("test content");
  });

  test("applies replacements to moved files and directories", async () => {
    const input = `---
replace-folder:
  - search: "old"
    replace: "new"
replace-file:
  - search: ".js"
    replace: ".ts"
---
root
  (/src/old-dir) > target-dir
  (/src/test.js) > target.js`;

    await createStructureFromString(input, "/test", { fs });

    // Check if directory was moved with replaced name
    expect(await fs.exists("/test/root/target-new-dir")).toBe(true);
    expect(await fs.exists("/src/old-dir")).toBe(false);

    // Check if files were moved with replaced extensions
    expect(await fs.exists("/test/root/target-new-dir/file1.ts")).toBe(true);
    expect(await fs.exists("/test/root/target-new-dir/file2.ts")).toBe(true);
    expect(await fs.exists("/test/root/target.ts")).toBe(true);
    expect(await fs.exists("/src/test.js")).toBe(false);

    // Check content was preserved
    expect(await fs.readFile("/test/root/target-new-dir/file1.ts")).toBe(
      "file1 content"
    );
    expect(await fs.readFile("/test/root/target-new-dir/file2.ts")).toBe(
      "file2 content"
    );
    expect(await fs.readFile("/test/root/target.ts")).toBe("test content");
  });

  test("merges frontmatter replacements with options replacements", async () => {
    const input = `---
replace-folder:
  - search: "old"
    replace: "new"
replace-file:
  - search: ".js"
    replace: ".ts"
---
root
  old-dir
    test.js`;

    await createStructureFromString(input, "/test", {
      fs,
      fileNameReplacements: [{ search: "test", replace: "spec" }],
      folderNameReplacements: [{ search: "dir", replace: "folder" }],
    });

    // Check if both sets of replacements were applied
    expect(await fs.exists("/test/root/new-folder")).toBe(true);
    expect(await fs.exists("/test/root/new-folder/spec.ts")).toBe(true);
  });
});
