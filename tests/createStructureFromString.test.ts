import fs from "fs";
import path from "path";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createStructureFromString } from "../src/index";

describe("createStructureFromString", () => {
  const testDir = path.join(__dirname, "test-temp");
  let warnSpy: any;

  beforeEach(() => {
    // Create test directory
    if (!fs.existsSync(testDir)) {
      fs.mkdirSync(testDir);
    }
    warnSpy = vi.spyOn(console, "warn");
  });

  afterEach(() => {
    // Clean up test directory
    if (fs.existsSync(testDir)) {
      fs.rmSync(testDir, { recursive: true });
    }
    vi.restoreAllMocks();
  });

  it("creates a simple file and folder structure", () => {
    const input = `
      folder1
        file1.txt
        folder2
          file2.txt
    `;

    createStructureFromString(input, testDir);

    expect(fs.existsSync(path.join(testDir, "folder1"))).toBe(true);
    expect(fs.existsSync(path.join(testDir, "folder1", "file1.txt"))).toBe(
      true
    );
    expect(fs.existsSync(path.join(testDir, "folder1", "folder2"))).toBe(true);
    expect(
      fs.existsSync(path.join(testDir, "folder1", "folder2", "file2.txt"))
    ).toBe(true);
  });

  it("handles file imports with renaming", () => {
    const sourceFile = path.join(testDir, "source.txt");
    const targetFile = path.join(testDir, "target.txt");

    // Create source file
    fs.writeFileSync(sourceFile, "Test content");

    const input = `[${sourceFile}] > target.txt`;

    createStructureFromString(input, testDir);

    expect(fs.existsSync(targetFile)).toBe(true);
    const content = fs.readFileSync(targetFile, "utf-8");
    expect(content).toBe("Test content");
  });

  it("handles folder imports", () => {
    const sourceDir = path.join(testDir, "source");
    fs.mkdirSync(sourceDir);
    fs.writeFileSync(path.join(sourceDir, "file1.txt"), "Content 1");
    fs.writeFileSync(path.join(sourceDir, "file2.txt"), "Content 2");

    const input = `[${sourceDir}]`;

    createStructureFromString(input, testDir);

    expect(fs.existsSync(path.join(testDir, "source"))).toBe(true);
    expect(fs.existsSync(path.join(testDir, "source", "file1.txt"))).toBe(true);
    expect(fs.existsSync(path.join(testDir, "source", "file2.txt"))).toBe(true);
  });

  it("ignores invalid lines gracefully", () => {
    const input = `
      folder1
      InvalidLineWithoutTabs
        file1.txt
    `;

    createStructureFromString(input, testDir);

    expect(fs.existsSync(path.join(testDir, "folder1"))).toBe(true);
    expect(fs.existsSync(path.join(testDir, "folder1", "file1.txt"))).toBe(
      true
    );
  });

  it("handles bracketed file imports with and without renaming", () => {
    const sourceFile = path.join(testDir, "source.txt");
    fs.writeFileSync(sourceFile, "Test content");

    const input = `
      [${sourceFile}]
      [${sourceFile}] > renamed.txt
    `;

    createStructureFromString(input, testDir);

    expect(fs.existsSync(path.join(testDir, "source.txt"))).toBe(true);
    expect(fs.existsSync(path.join(testDir, "renamed.txt"))).toBe(true);
  });

  it("handles bracketed file paths with spaces and special characters", () => {
    const sourceFile = path.join(testDir, "source file.txt");
    fs.writeFileSync(sourceFile, "Test content");

    const input = `[${sourceFile}] > target file.txt`;

    createStructureFromString(input, testDir);

    expect(fs.existsSync(path.join(testDir, "target file.txt"))).toBe(true);
  });

  it("handles bracketed file paths with absolute paths", () => {
    const sourceFile = path.join(testDir, "source.txt");
    fs.writeFileSync(sourceFile, "Test content");

    const input = `[${sourceFile}] > /target.txt`;

    createStructureFromString(input, testDir);

    expect(fs.existsSync(path.join(testDir, "target.txt"))).toBe(true);
  });

  it("handles bracketed file paths with special characters in source path", () => {
    const sourceFile = path.join(testDir, "source@2x.txt");
    fs.writeFileSync(sourceFile, "Test content");

    const input = `[${sourceFile}] > target.txt`;

    createStructureFromString(input, testDir);

    expect(fs.existsSync(path.join(testDir, "target.txt"))).toBe(true);
  });

  it("handles tab indentation", () => {
    const input = "folder1\n\tfile1.txt\n\tfolder2\n\t\tfile2.txt";

    createStructureFromString(input, testDir);

    expect(fs.existsSync(path.join(testDir, "folder1"))).toBe(true);
    expect(fs.existsSync(path.join(testDir, "folder1", "file1.txt"))).toBe(
      true
    );
    expect(fs.existsSync(path.join(testDir, "folder1", "folder2"))).toBe(true);
    expect(
      fs.existsSync(path.join(testDir, "folder1", "folder2", "file2.txt"))
    ).toBe(true);
  });

  it("handles missing files with clean error messages", () => {
    const nonExistentFile = path.join(testDir, "does-not-exist.txt");
    const input = `[${nonExistentFile}]`;

    createStructureFromString(input, testDir);

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

  it("handles moving files with parentheses", () => {
    const sourceDir = path.join(testDir, "source-dir");
    fs.mkdirSync(sourceDir);
    const sourceFile = path.join(sourceDir, "source.txt");
    const sourceFile2 = path.join(sourceDir, "source2.txt");
    fs.writeFileSync(sourceFile, "Test content 1");
    fs.writeFileSync(sourceFile2, "Test content 2");

    const input = `
      (${sourceFile})
      (${sourceFile2}) > renamed.txt
    `;

    createStructureFromString(input, testDir);

    // Original files should not exist anymore
    expect(fs.existsSync(sourceFile)).toBe(false);
    expect(fs.existsSync(sourceFile2)).toBe(false);
    // Files should be moved to new locations
    expect(fs.existsSync(path.join(testDir, "source.txt"))).toBe(true);
    expect(fs.existsSync(path.join(testDir, "renamed.txt"))).toBe(true);
    // Content should be preserved
    expect(fs.readFileSync(path.join(testDir, "source.txt"), "utf-8")).toBe(
      "Test content 1"
    );
    expect(fs.readFileSync(path.join(testDir, "renamed.txt"), "utf-8")).toBe(
      "Test content 2"
    );
  });

  it("handles moving directories with parentheses", () => {
    const sourceParentDir = path.join(testDir, "source-parent");
    fs.mkdirSync(sourceParentDir);
    const sourceDir = path.join(sourceParentDir, "source");
    const sourceDir2 = path.join(sourceParentDir, "source2");
    fs.mkdirSync(sourceDir);
    fs.mkdirSync(sourceDir2);
    fs.writeFileSync(path.join(sourceDir, "file1.txt"), "Content 1");
    fs.writeFileSync(path.join(sourceDir2, "file2.txt"), "Content 2");

    const input = `
      (${sourceDir})
      (${sourceDir2}) > renamed
    `;

    createStructureFromString(input, testDir);

    // Original directories should not exist anymore
    expect(fs.existsSync(sourceDir)).toBe(false);
    expect(fs.existsSync(sourceDir2)).toBe(false);
    // Directories should be moved to new locations
    expect(fs.existsSync(path.join(testDir, "source"))).toBe(true);
    expect(fs.existsSync(path.join(testDir, "renamed"))).toBe(true);
    // Content should be preserved
    expect(
      fs.readFileSync(path.join(testDir, "source", "file1.txt"), "utf-8")
    ).toBe("Content 1");
    expect(
      fs.readFileSync(path.join(testDir, "renamed", "file2.txt"), "utf-8")
    ).toBe("Content 2");
  });

  it("handles moving files with spaces and special characters", () => {
    const sourceFile = path.join(testDir, "source file@2x.txt");
    const renamedFile = path.join(testDir, "renamed file.txt");
    fs.writeFileSync(sourceFile, "Test content");

    const input = `(${sourceFile}) > renamed file.txt`;

    createStructureFromString(input, testDir);

    // Original file should not exist anymore
    expect(fs.existsSync(sourceFile)).toBe(false);
    // File should be moved and renamed
    expect(fs.existsSync(renamedFile)).toBe(true);
    // Content should be preserved
    expect(fs.readFileSync(renamedFile, "utf-8")).toBe("Test content");
  });

  it("handles moving files to existing locations", () => {
    const sourceFile = path.join(testDir, "source.txt");
    const existingFile = path.join(testDir, "existing.txt");
    fs.writeFileSync(sourceFile, "New content");
    fs.writeFileSync(existingFile, "Old content");

    const input = `(${sourceFile}) > existing.txt`;

    createStructureFromString(input, testDir);

    // Original file should not exist anymore
    expect(fs.existsSync(sourceFile)).toBe(false);
    // Destination file should have new content
    expect(fs.existsSync(existingFile)).toBe(true);
    expect(fs.readFileSync(existingFile, "utf-8")).toBe("New content");
  });

  it("handles errors when moving non-existent files", () => {
    const nonExistentFile = path.join(testDir, "does-not-exist.txt");
    const input = `(${nonExistentFile})`;

    createStructureFromString(input, testDir);

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
});
