import fs from "fs";
import path from "path";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { OperationLog } from "../src/index";
import { core, createStructureFromString, NodeFileSystem } from "../src/index";

describe("createStructureFromString", () => {
  const testDir = path.join(__dirname, "test-temp");
  let warnSpy: any;
  let filesystem: NodeFileSystem;

  // Helper functions
  const fileExists = async (filePath: string): Promise<boolean> => {
    return fs.promises
      .access(filePath)
      .then(() => true)
      .catch(() => false);
  };

  const readFileContent = async (filePath: string): Promise<string> => {
    return fs.promises.readFile(filePath, "utf-8");
  };

  const writeFile = async (
    filePath: string,
    content: string
  ): Promise<void> => {
    await fs.promises.writeFile(filePath, content);
  };

  beforeEach(async () => {
    // Clean up any existing test directory
    try {
      await fs.promises.rm(testDir, { recursive: true, force: true });
    } catch {}
    // Create test directory
    await fs.promises.mkdir(testDir, { recursive: true });
    warnSpy = vi.spyOn(console, "warn");
    filesystem = new NodeFileSystem();
    // Clear the collector before each test
    core.collector.clear();
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

    await createStructureFromString(input, testDir, { fs: filesystem });

    expect(await fileExists(path.join(testDir, "folder1"))).toBe(true);
    expect(await fileExists(path.join(testDir, "folder1", "file1.txt"))).toBe(
      true
    );
    expect(await fileExists(path.join(testDir, "folder1", "folder2"))).toBe(
      true
    );
    expect(
      await fileExists(path.join(testDir, "folder1", "folder2", "file2.txt"))
    ).toBe(true);
  });

  it("handles file imports with renaming", async () => {
    const sourceFile = path.join(testDir, "source.txt");
    const targetFile = path.join(testDir, "target.txt");

    await writeFile(sourceFile, "Test content");
    const input = `[${sourceFile}] > target.txt`;

    await createStructureFromString(input, testDir, { fs: filesystem });

    expect(await fileExists(targetFile)).toBe(true);
    expect(await readFileContent(targetFile)).toBe("Test content");
  });

  it("handles folder imports", async () => {
    const sourceDir = path.join(testDir, "source");
    await fs.promises.mkdir(sourceDir);
    await writeFile(path.join(sourceDir, "file1.txt"), "Content 1");
    await writeFile(path.join(sourceDir, "file2.txt"), "Content 2");

    const input = `[${sourceDir}]`;

    await createStructureFromString(input, testDir, { fs: filesystem });

    expect(await fileExists(path.join(testDir, "source"))).toBe(true);
    expect(await fileExists(path.join(testDir, "source", "file1.txt"))).toBe(
      true
    );
    expect(await fileExists(path.join(testDir, "source", "file2.txt"))).toBe(
      true
    );
  });

  it("ignores invalid lines gracefully", async () => {
    const input = `
      folder1
      InvalidLineWithoutTabs
        file1.txt
    `;

    await createStructureFromString(input, testDir, { fs: filesystem });

    expect(await fileExists(path.join(testDir, "folder1"))).toBe(true);
    expect(await fileExists(path.join(testDir, "folder1", "file1.txt"))).toBe(
      true
    );
  });

  it("handles bracketed file imports with and without renaming", async () => {
    const sourceFile = path.join(testDir, "source.txt");
    await writeFile(sourceFile, "Test content");

    const input = `
      [${sourceFile}]
      [${sourceFile}] > renamed.txt
    `;

    await createStructureFromString(input, testDir, { fs: filesystem });

    expect(await fileExists(path.join(testDir, "source.txt"))).toBe(true);
    expect(await fileExists(path.join(testDir, "renamed.txt"))).toBe(true);
  });

  it("handles bracketed file paths with spaces and special characters", async () => {
    const sourceFile = path.join(testDir, "source file.txt");
    await writeFile(sourceFile, "Test content");

    const input = `[${sourceFile}] > target file.txt`;

    await createStructureFromString(input, testDir, { fs: filesystem });

    expect(await fileExists(path.join(testDir, "target file.txt"))).toBe(true);
  });

  it("handles bracketed file paths with absolute paths", async () => {
    const sourceFile = path.join(testDir, "source.txt");
    await writeFile(sourceFile, "Test content");

    const input = `[${sourceFile}] > /target.txt`;

    await createStructureFromString(input, testDir, { fs: filesystem });

    expect(await fileExists(path.join(testDir, "target.txt"))).toBe(true);
  });

  it("handles bracketed file paths with special characters in source path", async () => {
    const sourceFile = path.join(testDir, "source@2x.txt");
    await writeFile(sourceFile, "Test content");

    const input = `[${sourceFile}] > target.txt`;

    await createStructureFromString(input, testDir, { fs: filesystem });

    expect(await fileExists(path.join(testDir, "target.txt"))).toBe(true);
  });

  it("handles tab indentation", async () => {
    const input = "folder1\n\tfile1.txt\n\tfolder2\n\t\tfile2.txt";

    await createStructureFromString(input, testDir, { fs: filesystem });

    expect(await fileExists(path.join(testDir, "folder1"))).toBe(true);
    expect(await fileExists(path.join(testDir, "folder1", "file1.txt"))).toBe(
      true
    );
    expect(await fileExists(path.join(testDir, "folder1", "folder2"))).toBe(
      true
    );
    expect(
      await fileExists(path.join(testDir, "folder1", "folder2", "file2.txt"))
    ).toBe(true);
  });

  it("handles missing files with clean error messages", async () => {
    const nonExistentFile = path.join(testDir, "does-not-exist.txt");
    const input = `[${nonExistentFile}]`;

    await createStructureFromString(input, testDir, { fs: filesystem });

    expect(warnSpy).toHaveBeenCalledWith(
      `⚠️ Warning: Source not found "${nonExistentFile}", creating empty file`
    );

    expect(await fileExists(path.join(testDir, "does-not-exist.txt"))).toBe(
      true
    );
    expect(
      await readFileContent(path.join(testDir, "does-not-exist.txt"))
    ).toBe("");
  });

  it("handles moving files with parentheses", async () => {
    const sourceDir = path.join(testDir, "source-dir");
    await fs.promises.mkdir(sourceDir);
    const sourceFile = path.join(sourceDir, "source.txt");
    const sourceFile2 = path.join(sourceDir, "source2.txt");
    await writeFile(sourceFile, "Test content 1");
    await writeFile(sourceFile2, "Test content 2");

    const input = `
      (${sourceFile})
      (${sourceFile2}) > renamed.txt
    `;

    await createStructureFromString(input, testDir, { fs: filesystem });

    // Original files should not exist anymore
    expect(await fileExists(sourceFile)).toBe(false);
    expect(await fileExists(sourceFile2)).toBe(false);

    // Files should be moved to new locations
    expect(await fileExists(path.join(testDir, "source.txt"))).toBe(true);
    expect(await fileExists(path.join(testDir, "renamed.txt"))).toBe(true);

    // Content should be preserved
    expect(await readFileContent(path.join(testDir, "source.txt"))).toBe(
      "Test content 1"
    );
    expect(await readFileContent(path.join(testDir, "renamed.txt"))).toBe(
      "Test content 2"
    );
  });

  it("handles moving directories with parentheses", async () => {
    const sourceParentDir = path.join(testDir, "source-parent");
    await fs.promises.mkdir(sourceParentDir);
    const sourceDir = path.join(sourceParentDir, "source");
    const sourceDir2 = path.join(sourceParentDir, "source2");
    await fs.promises.mkdir(sourceDir);
    await fs.promises.mkdir(sourceDir2);
    await writeFile(path.join(sourceDir, "file1.txt"), "Content 1");
    await writeFile(path.join(sourceDir2, "file2.txt"), "Content 2");

    const input = `
      (${sourceDir})
      (${sourceDir2}) > renamed
    `;

    await createStructureFromString(input, testDir, { fs: filesystem });

    // Original directories should not exist anymore
    expect(await fileExists(sourceDir)).toBe(false);
    expect(await fileExists(sourceDir2)).toBe(false);

    // Directories should be moved to new locations
    expect(await fileExists(path.join(testDir, "source"))).toBe(true);
    expect(await fileExists(path.join(testDir, "renamed"))).toBe(true);

    // Content should be preserved
    expect(
      await readFileContent(path.join(testDir, "source", "file1.txt"))
    ).toBe("Content 1");
    expect(
      await readFileContent(path.join(testDir, "renamed", "file2.txt"))
    ).toBe("Content 2");
  });

  it("handles moving files with spaces and special characters", async () => {
    const sourceFile = path.join(testDir, "source file@2x.txt");
    const renamedFile = path.join(testDir, "renamed file.txt");
    await writeFile(sourceFile, "Test content");

    const input = `(${sourceFile}) > renamed file.txt`;

    await createStructureFromString(input, testDir, { fs: filesystem });

    // Original file should not exist anymore
    expect(await fileExists(sourceFile)).toBe(false);

    // File should be moved and renamed
    expect(await fileExists(renamedFile)).toBe(true);

    // Content should be preserved
    expect(await readFileContent(renamedFile)).toBe("Test content");
  });

  it("handles moving files to existing locations", async () => {
    const sourceFile = path.join(testDir, "source.txt");
    const existingFile = path.join(testDir, "existing.txt");
    await writeFile(sourceFile, "New content");
    await writeFile(existingFile, "Old content");

    const input = `(${sourceFile}) > existing.txt`;

    await createStructureFromString(input, testDir, { fs: filesystem });

    // Original file should not exist anymore
    expect(await fileExists(sourceFile)).toBe(false);

    // Destination file should have new content
    expect(await fileExists(existingFile)).toBe(true);
    expect(await readFileContent(existingFile)).toBe("New content");
  });

  it("handles errors when moving non-existent files", async () => {
    const nonExistentFile = path.join(testDir, "does-not-exist.txt");
    const input = `(${nonExistentFile})`;

    await createStructureFromString(input, testDir, { fs: filesystem });

    expect(warnSpy).toHaveBeenCalledWith(
      `⚠️ Warning: Source not found "${nonExistentFile}", creating empty file`
    );

    expect(await fileExists(path.join(testDir, "does-not-exist.txt"))).toBe(
      true
    );
    expect(
      await readFileContent(path.join(testDir, "does-not-exist.txt"))
    ).toBe("");
  });

  describe("Operation Logging", () => {
    beforeEach(() => {
      core.collector.clear();
    });

    it("tracks file and directory creation operations", async () => {
      const input = `
        folder1
          file1.txt
          folder2
            file2.txt
      `;

      await createStructureFromString(input, testDir, { fs: filesystem });

      const operations = core.collector.getOperations();
      const expectedOperations: OperationLog[] = [
        {
          type: "create",
          path: path.join(testDir, "folder1"),
          isDirectory: true,
        },
        {
          type: "create",
          path: path.join(testDir, "folder1", "file1.txt"),
          isDirectory: false,
        },
        {
          type: "create",
          path: path.join(testDir, "folder1", "folder2"),
          isDirectory: true,
        },
        {
          type: "create",
          path: path.join(testDir, "folder1", "folder2", "file2.txt"),
          isDirectory: false,
        },
      ];

      expect(operations).toEqual(expectedOperations);
    });

    it("tracks file copy operations", async () => {
      const sourceFile = path.join(testDir, "source.txt");
      await writeFile(sourceFile, "Test content");
      const input = `[${sourceFile}] > target.txt`;

      await createStructureFromString(input, testDir, { fs: filesystem });

      const operations = core.collector.getOperations();
      const expectedOperations: OperationLog[] = [
        {
          type: "copy",
          path: path.join(testDir, "target.txt"),
          sourcePath: sourceFile,
          isDirectory: false,
        },
      ];

      expect(operations).toEqual(expectedOperations);
    });

    it("tracks file move operations", async () => {
      const sourceFile = path.join(testDir, "source.txt");
      await writeFile(sourceFile, "Test content");
      const input = `(${sourceFile}) > target.txt`;

      await createStructureFromString(input, testDir, { fs: filesystem });

      const operations = core.collector.getOperations();
      const expectedOperations: OperationLog[] = [
        {
          type: "move",
          path: path.join(testDir, "target.txt"),
          sourcePath: sourceFile,
          isDirectory: false,
        },
      ];

      expect(operations).toEqual(expectedOperations);
    });

    it("tracks skipped directory operations", async () => {
      const existingDir = path.join(testDir, "existing");
      await fs.promises.mkdir(existingDir);

      const input = `existing`;

      await createStructureFromString(input, testDir, { fs: filesystem });

      const operations = core.collector.getOperations();
      const expectedOperations: OperationLog[] = [
        {
          type: "skip",
          path: path.join(testDir, "existing"),
          isDirectory: true,
        },
      ];

      expect(operations).toEqual(expectedOperations);
    });

    it("tracks operations in complex scenarios", async () => {
      const sourceFile = path.join(testDir, "source.txt");
      await writeFile(sourceFile, "Test content");

      const input = `
        folder1
          [${sourceFile}] > copied.txt
          subfolder
            (${sourceFile}) > moved.txt
      `;

      await createStructureFromString(input, testDir, { fs: filesystem });

      const operations = core.collector.getOperations();
      const expectedOperations: OperationLog[] = [
        {
          type: "create",
          path: path.join(testDir, "folder1"),
          isDirectory: true,
        },
        {
          type: "copy",
          path: path.join(testDir, "folder1", "copied.txt"),
          sourcePath: sourceFile,
          isDirectory: false,
        },
        {
          type: "create",
          path: path.join(testDir, "folder1", "subfolder"),
          isDirectory: true,
        },
        {
          type: "move",
          path: path.join(testDir, "folder1", "subfolder", "moved.txt"),
          sourcePath: sourceFile,
          isDirectory: false,
        },
      ];

      expect(operations).toEqual(expectedOperations);
    });
  });
});
