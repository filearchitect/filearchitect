import os from "os";
import path from "path";
import { describe, expect, it } from "vitest";
import {
  getBaseName,
  getFileExtension,
  getParentDirectory,
  hasFileExtension,
  joinPaths,
  resolveSourcePath,
  resolveTildePath,
} from "../src/path-utils";

describe("Path Utilities", () => {
  describe("resolveTildePath", () => {
    it("should resolve home directory tilde", () => {
      const result = resolveTildePath("~/test/path");
      expect(result).toBe(path.join(os.homedir(), "test/path"));
    });

    it("should not modify paths without tilde", () => {
      const testPath = "/absolute/path/test";
      expect(resolveTildePath(testPath)).toBe(testPath);
    });
  });

  describe("resolveSourcePath", () => {
    it("should keep absolute paths unchanged", () => {
      const absolutePath = path.resolve("/test/path");
      expect(resolveSourcePath(absolutePath)).toBe(absolutePath);
    });

    it("should resolve relative paths to absolute", () => {
      const relativePath = "test/path";
      expect(resolveSourcePath(relativePath)).toBe(
        path.resolve(process.cwd(), relativePath)
      );
    });
  });

  describe("getParentDirectory", () => {
    it("should return parent directory path", () => {
      expect(getParentDirectory("/test/path/file.txt")).toBe("/test/path");
      expect(getParentDirectory("/test/path/")).toBe("/test");
    });

    it("should handle root directory", () => {
      expect(getParentDirectory("/test")).toBe("/");
    });
  });

  describe("getBaseName", () => {
    it("should return file name from path", () => {
      expect(getBaseName("/test/path/file.txt")).toBe("file.txt");
    });

    it("should return directory name from path", () => {
      expect(getBaseName("/test/path/")).toBe("path");
    });
  });

  describe("joinPaths", () => {
    it("should join multiple path segments", () => {
      expect(joinPaths("test", "path", "file.txt")).toBe(
        path.join("test", "path", "file.txt")
      );
    });

    it("should handle absolute paths correctly", () => {
      expect(joinPaths("/test", "path")).toBe("/test/path");
    });
  });

  describe("hasFileExtension", () => {
    it("should return true for paths with extension", () => {
      expect(hasFileExtension("file.txt")).toBe(true);
      expect(hasFileExtension("/test/path/file.js")).toBe(true);
    });

    it("should return false for paths without extension", () => {
      expect(hasFileExtension("file")).toBe(false);
      expect(hasFileExtension("/test/path")).toBe(false);
    });

    it("should handle hidden files correctly", () => {
      expect(hasFileExtension(".gitignore")).toBe(false);
      expect(hasFileExtension(".env.local")).toBe(true);
    });
  });

  describe("getFileExtension", () => {
    it("should return file extension with dot", () => {
      expect(getFileExtension("file.txt")).toBe(".txt");
      expect(getFileExtension("/test/path/file.js")).toBe(".js");
    });

    it("should return empty string for no extension", () => {
      expect(getFileExtension("file")).toBe("");
      expect(getFileExtension("/test/path")).toBe("");
    });

    it("should handle multiple dots correctly", () => {
      expect(getFileExtension("file.test.js")).toBe(".js");
    });
  });
});
