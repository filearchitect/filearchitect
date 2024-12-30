import { describe, expect, it } from "vitest";
import { FSError } from "../src/errors";

describe("FSError", () => {
  describe("constructor", () => {
    it("should create error with basic message", () => {
      const error = new FSError("Test error");
      expect(error.message).toBe("Test error");
      expect(error.name).toBe("FSError");
      expect(error.code).toBeUndefined();
      expect(error.path).toBeUndefined();
    });

    it("should create error with code and path", () => {
      const error = new FSError("Test error", {
        code: "TEST",
        path: "/test/path",
      });
      expect(error.message).toBe("Test error");
      expect(error.code).toBe("TEST");
      expect(error.path).toBe("/test/path");
    });
  });

  describe("static factories", () => {
    it("should create not found error", () => {
      const error = FSError.notFound("/test/file.txt");
      expect(error.message).toBe("File or directory not found: /test/file.txt");
      expect(error.code).toBe("ENOENT");
      expect(error.path).toBe("/test/file.txt");
    });

    it("should create already exists error", () => {
      const error = FSError.alreadyExists("/test/file.txt");
      expect(error.message).toBe(
        "File or directory already exists: /test/file.txt"
      );
      expect(error.code).toBe("EEXIST");
      expect(error.path).toBe("/test/file.txt");
    });

    it("should create not directory error", () => {
      const error = FSError.notDirectory("/test/file.txt");
      expect(error.message).toBe("Not a directory: /test/file.txt");
      expect(error.code).toBe("ENOTDIR");
      expect(error.path).toBe("/test/file.txt");
    });

    it("should create is directory error", () => {
      const error = FSError.isDirectory("/test/dir");
      expect(error.message).toBe("Is a directory: /test/dir");
      expect(error.code).toBe("EISDIR");
      expect(error.path).toBe("/test/dir");
    });

    it("should create permission denied error", () => {
      const error = FSError.permissionDenied("/test/file.txt");
      expect(error.message).toBe("Permission denied: /test/file.txt");
      expect(error.code).toBe("EACCES");
      expect(error.path).toBe("/test/file.txt");
    });

    it("should create invalid argument error", () => {
      const error = FSError.invalidArgument("Invalid path");
      expect(error.message).toBe("Invalid argument: Invalid path");
      expect(error.code).toBe("EINVAL");
      expect(error.path).toBeUndefined();
    });

    it("should create operation failed error", () => {
      const error = FSError.operationFailed("Copy failed", "/test/file.txt");
      expect(error.message).toBe("Operation failed: Copy failed");
      expect(error.code).toBe("EFAIL");
      expect(error.path).toBe("/test/file.txt");
    });
  });

  describe("error inheritance", () => {
    it("should be instance of Error", () => {
      const error = new FSError("Test error");
      expect(error).toBeInstanceOf(Error);
    });

    it("should be instance of FSError", () => {
      const error = new FSError("Test error");
      expect(error).toBeInstanceOf(FSError);
    });

    it("should work with try-catch", () => {
      expect(() => {
        throw FSError.notFound("/test/file.txt");
      }).toThrow(FSError);
    });
  });
});
