import { describe, expect, test } from "vitest";
import { getStructureFromString } from "../src/get-structure.js";
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

describe("getStructureFromString", () => {
  test("creates basic file structure", async () => {
    const input = `
src
    index.ts
    utils
        helpers.ts
`;

    const result = await getStructureFromString(input, {
      rootDir: "/test",
      fs: new MockFileSystem({}),
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

    const result = await getStructureFromString(input, {
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

    const result = await getStructureFromString(input, {
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

    const result = await getStructureFromString(input, {
      rootDir: "/test",
      fileNameReplacements: [{ search: "NAME", replace: "replaced" }],
      fs: new MockFileSystem({}),
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

    const result = await getStructureFromString(input, {
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

    const result = await getStructureFromString(input, {
      rootDir: "/test",
      fs,
    });

    expect(result.operations.length).toBeGreaterThan(2);
    expect(result.operations.some((op) => op.name === "file1.ts")).toBe(true);
    expect(result.operations.some((op) => op.name === "file2.ts")).toBe(true);
  });
});
