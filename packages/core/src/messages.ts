import chalk from "chalk";

type MessageKey =
  | "files.created"
  | "files.dirCreated"
  | "files.exists"
  | "copy.directory"
  | "copy.success"
  | "move.directory"
  | "move.file"
  | "move.success"
  | "errors.sourceNotFound"
  | "errors.operationFailed"
  | "errors.createFailed"
  | "errors.moveFailed"
  | "errors.copyFailed";

type PathMessage = {
  type: "path";
  path: string;
};

type CopyMoveMessage = {
  type: "copyMove";
  source: string;
  target: string;
};

type ErrorMessage = {
  type: "error";
  message: string;
};

type MessageData = PathMessage | CopyMoveMessage | ErrorMessage;

const messageFormatters: Record<MessageKey, (data: MessageData) => string> = {
  "files.created": (data) => {
    if (data.type !== "path") throw new Error("Invalid message data");
    return `Created ${data.path}`;
  },
  "files.dirCreated": (data) => {
    if (data.type !== "path") throw new Error("Invalid message data");
    return `Created directory ${data.path}`;
  },
  "files.exists": (data) => {
    if (data.type !== "path") throw new Error("Invalid message data");
    return `Already exists: ${data.path}`;
  },
  "copy.directory": (data) => {
    if (data.type !== "copyMove") throw new Error("Invalid message data");
    return `Copying directory from ${data.source} to ${data.target}`;
  },
  "copy.success": (data) => {
    if (data.type !== "copyMove") throw new Error("Invalid message data");
    return `✅ Successfully copied ${data.source} to ${data.target}`;
  },
  "move.directory": (data) => {
    if (data.type !== "copyMove") throw new Error("Invalid message data");
    return `Moving directory from ${data.source} to ${data.target}`;
  },
  "move.file": (data) => {
    if (data.type !== "copyMove") throw new Error("Invalid message data");
    return `Moving file from ${data.source} to ${data.target}`;
  },
  "move.success": (data) => {
    if (data.type !== "copyMove") throw new Error("Invalid message data");
    return `✅ Successfully moved ${data.source} to ${data.target}`;
  },
  "errors.sourceNotFound": (data) => {
    if (data.type !== "path") throw new Error("Invalid message data");
    return `Source not found "${data.path}", creating empty file`;
  },
  "errors.operationFailed": (data) => {
    if (data.type !== "error") throw new Error("Invalid message data");
    return `Operation failed: ${data.message}`;
  },
  "errors.createFailed": (data) => {
    if (data.type !== "error") throw new Error("Invalid message data");
    return `Failed to create file: ${data.message}`;
  },
  "errors.moveFailed": (data) => {
    if (data.type !== "path") throw new Error("Invalid message data");
    return `Failed to move "${data.path}", creating empty file`;
  },
  "errors.copyFailed": (data) => {
    if (data.type !== "path") throw new Error("Invalid message data");
    return `Failed to copy "${data.path}", creating empty file`;
  },
};

export function createPathMessage(path: string): PathMessage {
  return { type: "path", path };
}

export function createCopyMoveMessage(
  source: string,
  target: string
): CopyMoveMessage {
  return { type: "copyMove", source, target };
}

export function createErrorMessage(message: string): ErrorMessage {
  return { type: "error", message };
}

export function logMessage(
  key: MessageKey,
  data: MessageData,
  verbose: boolean = false
): void {
  if (verbose) {
    const message = messageFormatters[key](data);
    console.log(chalk.blue(message));
  }
}

export function logWarning(
  key: MessageKey,
  data: MessageData,
  verbose: boolean = false
): void {
  if (verbose) {
    const message = messageFormatters[key](data);
    console.warn(chalk.yellow(`Warning: ${message}`));
  }
}

export function logSuccess(
  key: MessageKey,
  data: MessageData,
  verbose: boolean = false
): void {
  if (verbose) {
    const message = messageFormatters[key](data);
    console.log(chalk.green(message));
  }
}

export function logError(
  key: MessageKey,
  data: MessageData,
  verbose: boolean = false
): void {
  if (verbose) {
    const message = messageFormatters[key](data);
    console.error(chalk.red(`Error: ${message}`));
  }
}
