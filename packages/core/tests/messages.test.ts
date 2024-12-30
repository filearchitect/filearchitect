import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  createCopyMoveMessage,
  createErrorMessage,
  createPathMessage,
  logError,
  logMessage,
  logSuccess,
  logWarning,
} from "../src/messages";

describe("Message Creators", () => {
  it("should create path message", () => {
    const message = createPathMessage("/test/path");
    expect(message).toEqual({
      type: "path",
      path: "/test/path",
    });
  });

  it("should create copy/move message", () => {
    const message = createCopyMoveMessage("/source/path", "/target/path");
    expect(message).toEqual({
      type: "copyMove",
      source: "/source/path",
      target: "/target/path",
    });
  });

  it("should create error message", () => {
    const message = createErrorMessage("Test error message");
    expect(message).toEqual({
      type: "error",
      message: "Test error message",
    });
  });
});

describe("Message Logging", () => {
  beforeEach(() => {
    vi.spyOn(console, "log").mockImplementation(() => {});
    vi.spyOn(console, "warn").mockImplementation(() => {});
    vi.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("should log file creation message when verbose", () => {
    logMessage("files.created", createPathMessage("/test/file.txt"), true);
    expect(console.log).toHaveBeenCalledWith(
      expect.stringContaining("Created /test/file.txt")
    );
  });

  it("should not log message when not verbose", () => {
    logMessage("files.created", createPathMessage("/test/file.txt"), false);
    expect(console.log).not.toHaveBeenCalled();
  });

  it("should log warning with correct prefix", () => {
    logWarning("files.exists", createPathMessage("/test/file.txt"), true);
    expect(console.warn).toHaveBeenCalledWith(
      expect.stringContaining("Warning: Already exists: /test/file.txt")
    );
  });

  it("should log success message with emoji", () => {
    logSuccess(
      "copy.success",
      createCopyMoveMessage("/src/file.txt", "/dest/file.txt"),
      true
    );
    expect(console.log).toHaveBeenCalledWith(
      expect.stringContaining(
        "✅ Successfully copied /src/file.txt to /dest/file.txt"
      )
    );
  });

  it("should log error with correct prefix", () => {
    logError(
      "errors.operationFailed",
      createErrorMessage("Something went wrong"),
      true
    );
    expect(console.error).toHaveBeenCalledWith(
      expect.stringContaining("Error: Operation failed: Something went wrong")
    );
  });

  it("should throw error for invalid message data type", () => {
    expect(() => {
      logMessage("files.created", createCopyMoveMessage("/src", "/dest"), true);
    }).toThrow("Invalid message data");
  });
});
