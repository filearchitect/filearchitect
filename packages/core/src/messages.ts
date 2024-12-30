import { MESSAGES } from "./constants";

export interface LogOptions {
  verbose?: boolean;
}

// Messages that should always be shown, regardless of verbose setting
const ALWAYS_SHOW_MESSAGES = new Set(
  [
    // Important file operations
    MESSAGES.CREATED_FILE(""),
    MESSAGES.CREATED_DIR(""),

    // Warnings and errors
    MESSAGES.SOURCE_NOT_FOUND(""),
    MESSAGES.OPERATION_FAILED(""),
    MESSAGES.CREATE_EMPTY_FAILED(""),
    MESSAGES.MOVE_FAILED(""),
    MESSAGES.COPY_FAILED(""),
    MESSAGES.STRUCTURE_WARNINGS(),
  ].map((msg) => msg.split(" ")[1])
); // Get the message type without the emoji

// Messages that should only be shown in verbose mode
const VERBOSE_ONLY_MESSAGES = new Set(
  [
    // Success messages
    MESSAGES.COPIED_FILE("", ""),
    MESSAGES.MOVED_SUCCESS(),
    MESSAGES.STRUCTURE_SUCCESS(),

    // Directory operations
    MESSAGES.COPYING_DIR("", ""),
    MESSAGES.MOVING_DIR("", ""),
    MESSAGES.MOVING_FILE("", ""),
    MESSAGES.DIR_EXISTS(""),
  ].map((msg) => msg.split(" ")[1])
);

export function logMessage(message: string, options: LogOptions = {}): void {
  const { verbose = false } = options;
  const messageType = message.split(" ")[1]; // Get the message type without the emoji

  if (
    ALWAYS_SHOW_MESSAGES.has(messageType) ||
    (verbose && VERBOSE_ONLY_MESSAGES.has(messageType))
  ) {
    console.log(message);
  }
}

export function logWarning(message: string): void {
  console.warn(message);
}

export function logSuccess(message: string, options: LogOptions = {}): void {
  const { verbose = false } = options;
  const messageType = message.split(" ")[1];

  if (
    ALWAYS_SHOW_MESSAGES.has(messageType) ||
    (verbose && VERBOSE_ONLY_MESSAGES.has(messageType))
  ) {
    console.log(message);
  }
}

export function logOperation(
  type: string,
  line: string,
  options: LogOptions = {}
): void {
  const { verbose = false } = options;
  if (verbose) {
    console.log("🔄 " + type.toUpperCase() + ": " + line.trim());
  }
}

export function logStructureResult(
  hasWarnings: boolean,
  options: LogOptions = {}
): void {
  const { verbose = false } = options;
  if (hasWarnings) {
    console.log(MESSAGES.STRUCTURE_WARNINGS());
  } else if (verbose) {
    console.log(MESSAGES.STRUCTURE_SUCCESS());
  }
}
