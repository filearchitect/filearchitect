import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { logMessage, logSuccess, logWarning } from "../src/messages";

describe("Message Logging", () => {
  let logSpy: any;
  let warnSpy: any;

  beforeEach(() => {
    logSpy = vi.spyOn(console, "log").mockImplementation(() => {});
    warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
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
