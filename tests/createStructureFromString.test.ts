import fs from "fs";
import path from "path";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createStructureFromString } from "../src/index";

describe("createStructureFromString", () => {
  const testDir = path.join(__dirname, "test-temp");
  let warnSpy: any;

  beforeEach(async () => {
    // Clean up any existing test directory
    try {
      await fs.promises.rm(testDir, { recursive: true, force: true });
    } catch {}
    // Create test directory
    await fs.promises.mkdir(testDir, { recursive: true });
    warnSpy = vi.spyOn(console, "warn");
  });

  afterEach(async () => {
    // Clean up test directory
    try {
      await fs.promises.rm(testDir, { recursive: true, force: true });
    } catch {}
    vi.restoreAllMocks();
  });

  it("creates a simple file and folder structure", async () => {
    const input = `
      folder1
        file1.txt
        folder2
          file2.txt
    `;

    await createStructureFromString(input, testDir);

    const folder1Exists = await fs.promises
      .access(path.join(testDir, "folder1"))
      .then(() => true)
      .catch(() => false);
    const file1Exists = await fs.promises
      .access(path.join(testDir, "folder1", "file1.txt"))
      .then(() => true)
      .catch(() => false);
    const folder2Exists = await fs.promises
      .access(path.join(testDir, "folder1", "folder2"))
      .then(() => true)
      .catch(() => false);
    const file2Exists = await fs.promises
      .access(path.join(testDir, "folder1", "folder2", "file2.txt"))
      .then(() => true)
      .catch(() => false);

    expect(folder1Exists).toBe(true);
    expect(file1Exists).toBe(true);
    expect(folder2Exists).toBe(true);
    expect(file2Exists).toBe(true);
  });

  it("handles file imports with renaming", async () => {
    const sourceFile = path.join(testDir, "source.txt");
    const targetFile = path.join(testDir, "target.txt");

    // Create source file
    await fs.promises.writeFile(sourceFile, "Test content");

    const input = `[${sourceFile}] > target.txt`;

    await createStructureFromString(input, testDir);

    const exists = await fs.promises
      .access(targetFile)
      .then(() => true)
      .catch(() => false);
    expect(exists).toBe(true);
    const content = await fs.promises.readFile(targetFile, "utf-8");
    expect(content).toBe("Test content");
  });

  it("handles folder imports", async () => {
    const sourceDir = path.join(testDir, "source");
    await fs.promises.mkdir(sourceDir);
    await fs.promises.writeFile(path.join(sourceDir, "file1.txt"), "Content 1");
    await fs.promises.writeFile(path.join(sourceDir, "file2.txt"), "Content 2");

    const input = `[${sourceDir}]`;

    await createStructureFromString(input, testDir);

    const dirExists = await fs.promises
      .access(path.join(testDir, "source"))
      .then(() => true)
      .catch(() => false);
    const file1Exists = await fs.promises
      .access(path.join(testDir, "source", "file1.txt"))
      .then(() => true)
      .catch(() => false);
    const file2Exists = await fs.promises
      .access(path.join(testDir, "source", "file2.txt"))
      .then(() => true)
      .catch(() => false);

    expect(dirExists).toBe(true);
    expect(file1Exists).toBe(true);
    expect(file2Exists).toBe(true);
  });

  it("ignores invalid lines gracefully", async () => {
    const input = `
      folder1
      InvalidLineWithoutTabs
        file1.txt
    `;

    await createStructureFromString(input, testDir);

    expect(fs.existsSync(path.join(testDir, "folder1"))).toBe(true);
    expect(fs.existsSync(path.join(testDir, "folder1", "file1.txt"))).toBe(
      true
    );
  });

  it("handles bracketed file imports with and without renaming", async () => {
    const sourceFile = path.join(testDir, "source.txt");
    fs.writeFileSync(sourceFile, "Test content");

    const input = `
      [${sourceFile}]
      [${sourceFile}] > renamed.txt
    `;

    await createStructureFromString(input, testDir);

    expect(fs.existsSync(path.join(testDir, "source.txt"))).toBe(true);
    expect(fs.existsSync(path.join(testDir, "renamed.txt"))).toBe(true);
  });

  it("handles bracketed file paths with spaces and special characters", async () => {
    const sourceFile = path.join(testDir, "source file.txt");
    fs.writeFileSync(sourceFile, "Test content");

    const input = `[${sourceFile}] > target file.txt`;

    await createStructureFromString(input, testDir);

    expect(fs.existsSync(path.join(testDir, "target file.txt"))).toBe(true);
  });

  it("handles bracketed file paths with absolute paths", async () => {
    const sourceFile = path.join(testDir, "source.txt");
    fs.writeFileSync(sourceFile, "Test content");

    const input = `[${sourceFile}] > /target.txt`;

    await createStructureFromString(input, testDir);

    expect(fs.existsSync(path.join(testDir, "target.txt"))).toBe(true);
  });

  it("handles bracketed file paths with special characters in source path", async () => {
    const sourceFile = path.join(testDir, "source@2x.txt");
    fs.writeFileSync(sourceFile, "Test content");

    const input = `[${sourceFile}] > target.txt`;

    await createStructureFromString(input, testDir);

    expect(fs.existsSync(path.join(testDir, "target.txt"))).toBe(true);
  });

  it("handles tab indentation", async () => {
    const input = "folder1\n\tfile1.txt\n\tfolder2\n\t\tfile2.txt";

    await createStructureFromString(input, testDir);

    expect(fs.existsSync(path.join(testDir, "folder1"))).toBe(true);
    expect(fs.existsSync(path.join(testDir, "folder1", "file1.txt"))).toBe(
      true
    );
    expect(fs.existsSync(path.join(testDir, "folder1", "folder2"))).toBe(true);
    expect(
      fs.existsSync(path.join(testDir, "folder1", "folder2", "file2.txt"))
    ).toBe(true);
  });

  it("handles missing files with clean error messages", async () => {
    const nonExistentFile = path.join(testDir, "does-not-exist.txt");
    const input = `[${nonExistentFile}]`;

    await createStructureFromString(input, testDir);

    // Should have called console.warn with the correct message
    expect(warnSpy).toHaveBeenCalledWith(
      `⚠️  Warning: Source not found "${nonExistentFile}", creating empty file`
    );

    // Should create an empty file instead
    expect(fs.existsSync(path.join(testDir, "does-not-exist.txt"))).toBe(true);
    expect(
      fs.readFileSync(path.join(testDir, "does-not-exist.txt"), "utf-8")
    ).toBe("");
  });

  it("handles moving files with parentheses", async () => {
    const sourceDir = path.join(testDir, "source-dir");
    await fs.promises.mkdir(sourceDir);
    const sourceFile = path.join(sourceDir, "source.txt");
    const sourceFile2 = path.join(sourceDir, "source2.txt");
    await fs.promises.writeFile(sourceFile, "Test content 1");
    await fs.promises.writeFile(sourceFile2, "Test content 2");

    const input = `
      (${sourceFile})
      (${sourceFile2}) > renamed.txt
    `;

    await createStructureFromString(input, testDir);

    // Original files should not exist anymore
    const sourceExists = await fs.promises
      .access(sourceFile)
      .then(() => true)
      .catch(() => false);
    const source2Exists = await fs.promises
      .access(sourceFile2)
      .then(() => true)
      .catch(() => false);
    expect(sourceExists).toBe(false);
    expect(source2Exists).toBe(false);

    // Files should be moved to new locations
    const targetExists = await fs.promises
      .access(path.join(testDir, "source.txt"))
      .then(() => true)
      .catch(() => false);
    const renamedExists = await fs.promises
      .access(path.join(testDir, "renamed.txt"))
      .then(() => true)
      .catch(() => false);
    expect(targetExists).toBe(true);
    expect(renamedExists).toBe(true);

    // Content should be preserved
    const content1 = await fs.promises.readFile(
      path.join(testDir, "source.txt"),
      "utf-8"
    );
    const content2 = await fs.promises.readFile(
      path.join(testDir, "renamed.txt"),
      "utf-8"
    );
    expect(content1).toBe("Test content 1");
    expect(content2).toBe("Test content 2");
  });

  it("handles moving directories with parentheses", async () => {
    const sourceParentDir = path.join(testDir, "source-parent");
    await fs.promises.mkdir(sourceParentDir);
    const sourceDir = path.join(sourceParentDir, "source");
    const sourceDir2 = path.join(sourceParentDir, "source2");
    await fs.promises.mkdir(sourceDir);
    await fs.promises.mkdir(sourceDir2);
    await fs.promises.writeFile(path.join(sourceDir, "file1.txt"), "Content 1");
    await fs.promises.writeFile(
      path.join(sourceDir2, "file2.txt"),
      "Content 2"
    );

    const input = `
      (${sourceDir})
      (${sourceDir2}) > renamed
    `;

    await createStructureFromString(input, testDir);

    // Original directories should not exist anymore
    const sourceDirExists = await fs.promises
      .access(sourceDir)
      .then(() => true)
      .catch(() => false);
    const sourceDir2Exists = await fs.promises
      .access(sourceDir2)
      .then(() => true)
      .catch(() => false);
    expect(sourceDirExists).toBe(false);
    expect(sourceDir2Exists).toBe(false);

    // Directories should be moved to new locations
    const targetDirExists = await fs.promises
      .access(path.join(testDir, "source"))
      .then(() => true)
      .catch(() => false);
    const renamedDirExists = await fs.promises
      .access(path.join(testDir, "renamed"))
      .then(() => true)
      .catch(() => false);
    expect(targetDirExists).toBe(true);
    expect(renamedDirExists).toBe(true);

    // Content should be preserved
    const content1 = await fs.promises.readFile(
      path.join(testDir, "source", "file1.txt"),
      "utf-8"
    );
    const content2 = await fs.promises.readFile(
      path.join(testDir, "renamed", "file2.txt"),
      "utf-8"
    );
    expect(content1).toBe("Content 1");
    expect(content2).toBe("Content 2");
  });

  it("handles moving files with spaces and special characters", async () => {
    const sourceFile = path.join(testDir, "source file@2x.txt");
    const renamedFile = path.join(testDir, "renamed file.txt");
    await fs.promises.writeFile(sourceFile, "Test content");

    const input = `(${sourceFile}) > renamed file.txt`;

    await createStructureFromString(input, testDir);

    // Original file should not exist anymore
    const sourceExists = await fs.promises
      .access(sourceFile)
      .then(() => true)
      .catch(() => false);
    expect(sourceExists).toBe(false);

    // File should be moved and renamed
    const renamedExists = await fs.promises
      .access(renamedFile)
      .then(() => true)
      .catch(() => false);
    expect(renamedExists).toBe(true);

    // Content should be preserved
    const content = await fs.promises.readFile(renamedFile, "utf-8");
    expect(content).toBe("Test content");
  });

  it("handles moving files to existing locations", async () => {
    const sourceFile = path.join(testDir, "source.txt");
    const existingFile = path.join(testDir, "existing.txt");
    await fs.promises.writeFile(sourceFile, "New content");
    await fs.promises.writeFile(existingFile, "Old content");

    const input = `(${sourceFile}) > existing.txt`;

    await createStructureFromString(input, testDir);

    // Original file should not exist anymore
    const sourceExists = await fs.promises
      .access(sourceFile)
      .then(() => true)
      .catch(() => false);
    expect(sourceExists).toBe(false);

    // Destination file should have new content
    const existingExists = await fs.promises
      .access(existingFile)
      .then(() => true)
      .catch(() => false);
    expect(existingExists).toBe(true);
    const content = await fs.promises.readFile(existingFile, "utf-8");
    expect(content).toBe("New content");
  });

  it("handles errors when moving non-existent files", async () => {
    const nonExistentFile = path.join(testDir, "does-not-exist.txt");
    const input = `(${nonExistentFile})`;

    await createStructureFromString(input, testDir);

    // Should have called console.warn with the correct message
    expect(warnSpy).toHaveBeenCalledWith(
      `⚠️  Warning: Source not found "${nonExistentFile}", creating empty file`
    );

    // Should create an empty file instead
    const exists = await fs.promises
      .access(path.join(testDir, "does-not-exist.txt"))
      .then(() => true)
      .catch(() => false);
    expect(exists).toBe(true);
    const content = await fs.promises.readFile(
      path.join(testDir, "does-not-exist.txt"),
      "utf-8"
    );
    expect(content).toBe("");
  });
});
