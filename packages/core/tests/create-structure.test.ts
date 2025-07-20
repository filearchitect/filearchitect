import os from "os";
import path from "path";
import { fileURLToPath } from "url";
import { afterEach, beforeEach, describe, expect, test } from "vitest";
import { createStructure } from "../src/create-structure.js";
import { NodeFileSystem } from "../src/node-filesystem.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

describe("createStructure", () => {
  let testDir: string;
  const sourceDir = path.join(__dirname, "test-source");
  const fs = new NodeFileSystem();

  // Create test directories before each test
  beforeEach(async () => {
    // Use a unique test directory for each test
    testDir = path.join(
      os.tmpdir(),
      `fa-test-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`
    );
    await fs.ensureDir(testDir);
    await fs.ensureEmptyDir(sourceDir);
  });

  // Clean up test directories after each test
  afterEach(async () => {
    // Cleanup test directory
    await fs.remove(testDir).catch(() => {});
    await fs.remove(sourceDir);
  });

  test("creates a basic file structure", async () => {
    const input = `
src
    index.ts
    utils
        helpers.ts
`;

    await createStructure(input, {
      rootDir: testDir,
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

    await createStructure(input, {
      rootDir: testDir,
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

    await createStructure(input, {
      rootDir: testDir,
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

    await createStructure(input, {
      rootDir: testDir,
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

    await createStructure(input, {
      rootDir: testDir,
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

    await createStructure(input, {
      rootDir: testDir,
      fs,
    });

    // Verify the target file was created (empty)
    const targetPath = path.join(testDir, "src", "copied.ts");
    expect(fs.exists(targetPath)).resolves.toBe(true);
    expect(fs.readFile(targetPath)).resolves.toBe("");
  });

  test("creates structure with frontmatter replacements", async () => {
    const input = `---
fileReplacements:
  - search: ".js"
    replace: ".ts"
---
src
    index.ts`;

    await createStructure(input, {
      rootDir: "test",
      fs,
    });

    // Verify created files
    expect(await fs.exists("test/src/index.ts")).toBe(true);
  });

  test("applies replacements to copied files and directories", async () => {
    const input = `---
fileReplacements:
  - search: ".js"
    replace: ".ts"
---
[src] > lib
    [index.js] > index.ts`;

    await createStructure(input, {
      rootDir: "test",
      fs,
    });

    // Verify copied files
    expect(await fs.exists("test/lib/index.ts")).toBe(true);
  });

  test("applies replacements to moved files and directories", async () => {
    const input = `---
fileReplacements:
  - search: ".js"
    replace: ".ts"
---
(src) > lib
    (index.js) > index.ts`;

    await createStructure(input, {
      rootDir: "test",
      fs,
    });

    // Verify moved files
    expect(await fs.exists("test/lib/index.ts")).toBe(true);
  });

  test("applies all replacements to both files and folders", async () => {
    const input = `
src
    client-name-folder
        client-name_file.ts
`;

    await createStructure(input, {
      rootDir: testDir,
      fs,
      replacements: {
        all: [{ search: "client-name", replace: "foo" }],
        folders: [{ search: "folder", replace: "bar" }],
        files: [{ search: "_file", replace: "-file" }],
      },
    });

    const dirPath = path.join(testDir, "src/foo-bar");
    expect(await fs.exists(dirPath)).toBe(true);

    const filePath = path.join(dirPath, "foo-file.ts");
    expect(await fs.exists(filePath)).toBe(true);
  });

  test("applies replacements in correct priority order", async () => {
    const input = `
src
    test-file.txt
`;

    await createStructure(input, {
      rootDir: testDir,
      fs,
      replacements: {
        all: [{ search: "test-", replace: "" }],
        files: [
          { search: "file", replace: "document" },
          { search: "-file", replace: "" },
        ],
      },
    });

    expect(await fs.exists(path.join(testDir, "src/document.txt"))).toBe(true);
  });

  test("creates directories with escaped dots in names", async () => {
    const input = `
src
    folder\\.with\\.dots
        file.ts
        another\\.folder
            script.js
    config\\.directory
        settings\\.file
`;

    await createStructure(input, {
      rootDir: testDir,
      fs,
    });

    // Verify directories with dots in their names were created
    expect(await fs.exists(path.join(testDir, "src"))).toBe(true);
    expect(await fs.exists(path.join(testDir, "src/folder.with.dots"))).toBe(
      true
    );
    expect(
      await fs.exists(path.join(testDir, "src/folder.with.dots/file.ts"))
    ).toBe(true);
    expect(
      await fs.exists(path.join(testDir, "src/folder.with.dots/another.folder"))
    ).toBe(true);
    expect(
      await fs.exists(
        path.join(testDir, "src/folder.with.dots/another.folder/script.js")
      )
    ).toBe(true);
    expect(await fs.exists(path.join(testDir, "src/config.directory"))).toBe(
      true
    );
    expect(
      await fs.exists(path.join(testDir, "src/config.directory/settings.file"))
    ).toBe(true);

    // Verify they are actually directories, not files
    expect(
      await fs.existsAs(path.join(testDir, "src/folder.with.dots"), "directory")
    ).toBe(true);
    expect(
      await fs.existsAs(
        path.join(testDir, "src/folder.with.dots/another.folder"),
        "directory"
      )
    ).toBe(true);
    expect(
      await fs.existsAs(path.join(testDir, "src/config.directory"), "directory")
    ).toBe(true);
    expect(
      await fs.existsAs(
        path.join(testDir, "src/config.directory/settings.file"),
        "directory"
      )
    ).toBe(true);

    // Verify files are still files
    expect(
      await fs.existsAs(
        path.join(testDir, "src/folder.with.dots/file.ts"),
        "file"
      )
    ).toBe(true);
    expect(
      await fs.existsAs(
        path.join(testDir, "src/folder.with.dots/another.folder/script.js"),
        "file"
      )
    ).toBe(true);
  });
});
