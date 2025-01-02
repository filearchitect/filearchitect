import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { collector, logMessage, logSuccess, logWarning } from "../src/messages";

describe("Message Logging", () => {
  let logSpy: any;
  let warnSpy: any;

  beforeEach(() => {
    logSpy = vi.spyOn(console, "log").mockImplementation(() => {});
    warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
    // Clear the collector before each test
    collector["operations"] = [];
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("should log file creation message when verbose", () => {
    logMessage("CREATED_FILE", ["/test/file.txt"], { verbose: true });
    expect(logSpy).toHaveBeenCalledWith(
      expect.stringContaining("Created /test/file.txt")
    );
  });

  it("should log file creation message even when not verbose", () => {
    logMessage("CREATED_FILE", ["/test/file.txt"], { verbose: false });
    expect(logSpy).toHaveBeenCalledWith(
      expect.stringContaining("Created /test/file.txt")
    );
  });

  it("should log warning with correct prefix", () => {
    logWarning("SOURCE_NOT_FOUND", ["/test/file.txt"]);
    expect(warnSpy).toHaveBeenCalledWith(
      expect.stringContaining("Warning: Source not found")
    );
  });

  it("should log success message with emoji", () => {
    logSuccess("COPIED_FILE", ["/src/file.txt", "/dest/file.txt"], {
      verbose: true,
    });
    expect(logSpy).toHaveBeenCalledWith(
      expect.stringContaining("Copied /src/file.txt to /dest/file.txt")
    );
  });

  it("should log copy message even when not verbose", () => {
    logSuccess("COPIED_FILE", ["/src/file.txt", "/dest/file.txt"], {
      verbose: false,
    });
    expect(logSpy).toHaveBeenCalledWith(
      expect.stringContaining("Copied /src/file.txt to /dest/file.txt")
    );
  });

  it("should log operation failed message", () => {
    logWarning("OPERATION_FAILED", ["Something went wrong"]);
    expect(warnSpy).toHaveBeenCalledWith(
      expect.stringContaining("Warning: Operation failed")
    );
  });
});

describe("LogCollector", () => {
  beforeEach(() => {
    // Clear the collector before each test
    collector["operations"] = [];
    vi.spyOn(console, "log").mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("should track file creation operations", () => {
    logMessage("CREATED_FILE", ["/test/file.txt"]);

    const operations = collector.getOperations();
    expect(operations).toHaveLength(1);
    expect(operations[0]).toEqual({
      type: "create",
      path: "/test/file.txt",
      isDirectory: false,
    });
  });

  it("should track directory creation operations", () => {
    logMessage("CREATED_DIR", ["/test/dir"]);

    const operations = collector.getOperations();
    expect(operations).toHaveLength(1);
    expect(operations[0]).toEqual({
      type: "create",
      path: "/test/dir",
      isDirectory: true,
    });
  });

  it("should track skipped directory operations", () => {
    logMessage("DIR_EXISTS", ["/test/dir"]);

    const operations = collector.getOperations();
    expect(operations).toHaveLength(1);
    expect(operations[0]).toEqual({
      type: "skip",
      path: "/test/dir",
      isDirectory: true,
    });
  });

  it("should track file copy operations", () => {
    logMessage("COPIED_FILE", ["/src/file.txt", "/dest/file.txt"]);

    const operations = collector.getOperations();
    expect(operations).toHaveLength(1);
    expect(operations[0]).toEqual({
      type: "copy",
      path: "/dest/file.txt",
      sourcePath: "/src/file.txt",
      isDirectory: false,
    });
  });

  it("should track file move operations", () => {
    logMessage("MOVING_FILE", ["/src/file.txt", "/dest/file.txt"]);

    const operations = collector.getOperations();
    expect(operations).toHaveLength(1);
    expect(operations[0]).toEqual({
      type: "move",
      path: "/dest/file.txt",
      sourcePath: "/src/file.txt",
      isDirectory: false,
    });
  });

  it("should track directory move operations", () => {
    logMessage("MOVING_DIR", ["/src/dir", "/dest/dir"]);

    const operations = collector.getOperations();
    expect(operations).toHaveLength(1);
    expect(operations[0]).toEqual({
      type: "move",
      path: "/dest/dir",
      sourcePath: "/src/dir",
      isDirectory: true,
    });
  });

  it("should print hierarchy correctly", () => {
    // Create a simple hierarchy
    logMessage("CREATED_DIR", ["/test"]);
    logMessage("CREATED_DIR", ["/test/dir1"]);
    logMessage("CREATED_FILE", ["/test/dir1/file1.txt"]);
    logMessage("CREATED_FILE", ["/test/file2.txt"]);

    collector.printHierarchy();

    expect(console.log).toHaveBeenCalledWith("\nOperation Summary:");
    // We don't test the exact table output since it's handled by the console-table-printer package
    // Instead, we verify that the operations are in the collector
    const operations = collector.getOperations();
    expect(operations).toHaveLength(4);
    expect(operations).toContainEqual({
      type: "create",
      path: "/test",
      isDirectory: true,
    });
    expect(operations).toContainEqual({
      type: "create",
      path: "/test/dir1",
      isDirectory: true,
    });
    expect(operations).toContainEqual({
      type: "create",
      path: "/test/dir1/file1.txt",
      isDirectory: false,
    });
    expect(operations).toContainEqual({
      type: "create",
      path: "/test/file2.txt",
      isDirectory: false,
    });
  });

  it("should display relative paths when root directory is set", () => {
    const rootDir = "/test/root";
    collector.setRootDir(rootDir);

    logMessage("CREATED_DIR", [`${rootDir}/folder1`]);
    logMessage("CREATED_FILE", [`${rootDir}/folder1/file1.txt`]);
    logMessage("COPYING_DIR", [`${rootDir}/src`, `${rootDir}/folder1/dest`]);

    collector.printHierarchy();

    expect(console.log).toHaveBeenCalledWith("\nOperation Summary:");
    const operations = collector.getOperations();
    expect(operations).toHaveLength(3);

    // Verify that operations are stored with absolute paths
    expect(operations).toContainEqual({
      type: "create",
      path: `${rootDir}/folder1`,
      isDirectory: true,
    });
    expect(operations).toContainEqual({
      type: "create",
      path: `${rootDir}/folder1/file1.txt`,
      isDirectory: false,
    });
    expect(operations).toContainEqual({
      type: "copy",
      path: `${rootDir}/folder1/dest`,
      sourcePath: `${rootDir}/src`,
      isDirectory: true,
    });
  });

  it("should handle paths outside root directory", () => {
    const rootDir = "/test/root";
    collector.setRootDir(rootDir);

    // Path outside root directory
    logMessage("COPYING_DIR", ["/other/path/src", `${rootDir}/dest`]);

    collector.printHierarchy();

    expect(console.log).toHaveBeenCalledWith("\nOperation Summary:");
    const operations = collector.getOperations();
    expect(operations).toHaveLength(1);
    expect(operations).toContainEqual({
      type: "copy",
      path: `${rootDir}/dest`,
      sourcePath: "/other/path/src",
      isDirectory: true,
    });
  });
});
