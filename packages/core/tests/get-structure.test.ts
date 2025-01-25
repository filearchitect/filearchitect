import { describe, expect, test } from "vitest";
import { getStructure } from "../src/get-structure.js";
import { NodeFileSystem } from "../src/node-filesystem.js";
import type {
  DirectoryEntry,
  FileStat,
  FileSystem,
  FileSystemOptions,
  Warning,
} from "../src/types.js";

// Mock FileSystem implementation for testing
class MockFileSystem implements FileSystem {
  private files: Map<string, { isDirectory: boolean }> = new Map();

  constructor(initialFiles: { [path: string]: boolean }) {
    Object.entries(initialFiles).forEach(([path, isDirectory]) => {
      this.files.set(path, { isDirectory });
    });
  }

  async exists(path: string): Promise<boolean> {
    return this.files.has(path);
  }

  async readdir(
    path: string,
    options?: FileSystemOptions
  ): Promise<DirectoryEntry[]> {
    const entries = Array.from(this.files.entries())
      .filter(([filePath]) => filePath.startsWith(path) && filePath !== path)
      .map(([filePath, { isDirectory }]) => ({
        name: filePath.split("/").pop()!,
        isDirectory: () => isDirectory,
      }));
    return entries;
  }

  // Implement required methods with minimal functionality
  async mkdir(): Promise<void> {}
  async writeFile(): Promise<void> {}
  async readFile(): Promise<string> {
    return "";
  }
  async stat(path: string): Promise<FileStat> {
    const file = this.files.get(path);
    return {
      isDirectory: () => file?.isDirectory ?? false,
      size: 0,
    };
  }
  async rm(): Promise<void> {}
  async unlink(): Promise<void> {}
  async rename(): Promise<void> {}
  async isDirectory(path: string): Promise<boolean> {
    return this.files.get(path)?.isDirectory ?? false;
  }
  async copyFile(): Promise<void> {}
  async copyFolder(): Promise<void> {}
  async moveFolder(): Promise<void> {}
  async ensureDir(): Promise<void> {}
  async emptyDir(): Promise<void> {}
  async copy(): Promise<void> {}
  async move(): Promise<void> {}
  async existsAs(): Promise<boolean> {
    return false;
  }
  async ensureFile(): Promise<void> {}
  async remove(): Promise<void> {}
  async isEmptyDir(): Promise<boolean> {
    return true;
  }
  async readFileOrDefault(): Promise<string> {
    return "";
  }
  async ensureEmptyDir(): Promise<void> {}
  async copyIfNotExists(): Promise<boolean> {
    return false;
  }
  async moveIfNotExists(): Promise<boolean> {
    return false;
  }
  async getAllFiles(): Promise<string[]> {
    return [];
  }
  async getAllDirectories(): Promise<string[]> {
    return [];
  }
  async getRelativePath(): Promise<string> {
    return "";
  }
  async glob(): Promise<string[]> {
    return [];
  }
  async watch(): Promise<() => void> {
    return () => {};
  }
  matchesPattern(): boolean {
    return false;
  }
  getCommonParent(): string {
    return "";
  }
  emitWarning(warning: Warning): void {}
}

describe("getStructure", () => {
  const fs = new NodeFileSystem();

  test("creates basic file structure", async () => {
    const input = `
src
    index.ts
    utils
        helpers.ts
`;

    const result = await getStructure(input, {
      rootDir: "/test",
      fs,
    });

    expect(result.operations).toHaveLength(4);
    expect(result.operations[0]).toMatchObject({
      type: "create",
      name: "src",
      isDirectory: true,
      depth: 0,
    });
    expect(result.operations[1]).toMatchObject({
      type: "create",
      name: "index.ts",
      isDirectory: false,
      depth: 1,
    });
  });

  test("handles file copying", async () => {
    const input = `
src
    [/existing/file.ts] > copied.ts
`;

    const fs = new MockFileSystem({
      "/existing/file.ts": false,
    });

    const result = await getStructure(input, {
      rootDir: "/test",
      fs,
    });

    expect(result.operations).toHaveLength(2);
    expect(result.operations[1]).toMatchObject({
      type: "copy",
      name: "copied.ts",
      sourcePath: "/existing/file.ts",
      isDirectory: false,
    });
  });

  test("handles file moving", async () => {
    const input = `
src
    (/existing/file.ts) > moved.ts
`;

    const fs = new MockFileSystem({
      "/existing/file.ts": false,
    });

    const result = await getStructure(input, {
      rootDir: "/test",
      fs,
    });

    expect(result.operations).toHaveLength(2);
    expect(result.operations[1]).toMatchObject({
      type: "move",
      name: "moved.ts",
      sourcePath: "/existing/file.ts",
      isDirectory: false,
    });
  });

  test("applies file name replacements", async () => {
    const input = `
src
    file-NAME-test.ts
`;

    const result = await getStructure(input, {
      rootDir: "/test/root",
      replacements: {
        files: [{ search: "NAME", replace: "replaced" }],
      },
    });

    expect(result.operations[1]).toMatchObject({
      name: "file-replaced-test.ts",
    });
  });

  test("handles missing source files", async () => {
    const input = `
src
    [/non/existent/file.ts] > copied.ts
`;

    const fs = new MockFileSystem({});

    const result = await getStructure(input, {
      rootDir: "/test",
      fs,
    });

    expect(result.operations[1].warning).toBeDefined();
    expect(result.operations[1].warning).toContain(
      "Source path does not exist"
    );
  });

  test("recursively copies directories", async () => {
    const input = `
src
    [/existing/dir] > copied
`;

    const fs = new MockFileSystem({
      "/existing/dir": true,
      "/existing/dir/file1.ts": false,
      "/existing/dir/subdir": true,
      "/existing/dir/subdir/file2.ts": false,
    });

    const result = await getStructure(input, {
      rootDir: "/test",
      fs,
    });

    expect(result.operations.length).toBeGreaterThan(2);
    expect(result.operations.some((op) => op.name === "file1.ts")).toBe(true);
    expect(result.operations.some((op) => op.name === "file2.ts")).toBe(true);
  });

  test("parses frontmatter with replacements", async () => {
    const input = `---
replace-folder:
  - search: "old-folder"
    replace: "new-folder"
  - search: "temp"
    replace: "permanent"
replace-file:
  - search: "old-file"
    replace: "new-file"
  - search: ".js"
    replace: ".ts"
---
root
    old-folder
        old-file.js
        temp
            test.js`;

    const result = await getStructure(input, {
      rootDir: "/test",
      fs,
    });

    // Check if replacements were parsed correctly
    expect(result.options.replacements.folders).toEqual([
      { search: "old-folder", replace: "new-folder" },
      { search: "temp", replace: "permanent" },
    ]);
    expect(result.options.replacements.files).toEqual([
      { search: "old-file", replace: "new-file" },
      { search: ".js", replace: ".ts" },
    ]);

    // Check if replacements were applied correctly
    const operations = result.operations.map((op) => ({
      type: op.type,
      targetPath: op.targetPath,
      isDirectory: op.isDirectory,
    }));

    expect(operations).toEqual([
      {
        type: "create",
        targetPath: "/test/root",
        isDirectory: true,
      },
      {
        type: "create",
        targetPath: "/test/root/new-folder",
        isDirectory: true,
      },
      {
        type: "create",
        targetPath: "/test/root/new-folder/new-file.ts",
        isDirectory: false,
      },
      {
        type: "create",
        targetPath: "/test/root/new-folder/permanent",
        isDirectory: true,
      },
      {
        type: "create",
        targetPath: "/test/root/new-folder/permanent/test.ts",
        isDirectory: false,
      },
    ]);
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
    [src/old-dir] > target-old-dir
    [src/test.js] > target.js`;

    const result = await getStructure(input, {
      rootDir: "/test",
      fs,
    });

    const operations = result.operations.map((op) => ({
      type: op.type,
      targetPath: op.targetPath,
      isDirectory: op.isDirectory,
    }));

    expect(operations).toEqual([
      {
        type: "create",
        targetPath: "/test/root",
        isDirectory: true,
      },
      {
        type: "copy",
        targetPath: "/test/root/target-new-dir",
        isDirectory: true,
      },
      {
        type: "copy",
        targetPath: "/test/root/target.ts",
        isDirectory: false,
      },
    ]);
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
    (src/old-dir) > target-old-dir
    (src/test.js) > target.js`;

    const result = await getStructure(input, {
      rootDir: "/test",
      fs,
    });

    const operations = result.operations.map((op) => ({
      type: op.type,
      targetPath: op.targetPath,
      isDirectory: op.isDirectory,
    }));

    expect(operations).toEqual([
      {
        type: "create",
        targetPath: "/test/root",
        isDirectory: true,
      },
      {
        type: "move",
        targetPath: "/test/root/target-new-dir",
        isDirectory: true,
      },
      {
        type: "move",
        targetPath: "/test/root/target.ts",
        isDirectory: false,
      },
    ]);
  });
});
