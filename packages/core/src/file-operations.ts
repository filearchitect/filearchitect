import {
  createCopyMoveMessage,
  createPathMessage,
  logMessage,
  logWarning,
} from "./messages";
import { getParentDirectory, joinPaths, resolveSourcePath } from "./path-utils";
import { CreateOptions } from "./types";

/**
 * Creates an empty file, creating parent directories if needed.
 */
export async function createEmptyFile(
  filePath: string,
  options: CreateOptions = {}
): Promise<void> {
  const { verbose = false, fs: filesystem } = options;
  if (!filesystem) {
    throw new Error("Filesystem implementation is required");
  }

  const dir = getParentDirectory(filePath);
  await ensureDirectory(dir, { verbose, fs: filesystem });
  await filesystem.writeFile(filePath, "");
  logMessage("files.created", createPathMessage(filePath), verbose);
}

/**
 * Creates a directory if it doesn't exist.
 */
export async function createDirectory(
  dirPath: string,
  options: CreateOptions = {}
): Promise<void> {
  const { verbose = false, fs: filesystem } = options;
  if (!filesystem) {
    throw new Error("Filesystem implementation is required");
  }

  if (!(await filesystem.exists(dirPath))) {
    await filesystem.mkdir(dirPath, { recursive: true });
    logMessage("files.dirCreated", createPathMessage(dirPath), verbose);
  } else if (verbose) {
    logWarning("files.exists", createPathMessage(dirPath), verbose);
  }
}

/**
 * Ensures a directory exists, creating it if necessary.
 */
export async function ensureDirectory(
  dirPath: string,
  options: CreateOptions = {}
): Promise<void> {
  const { verbose = false, fs: filesystem } = options;
  if (!filesystem) {
    throw new Error("Filesystem implementation is required");
  }

  if (!(await filesystem.exists(dirPath))) {
    await filesystem.mkdir(dirPath, { recursive: true });
    logMessage("files.dirCreated", createPathMessage(dirPath), verbose);
  }
}

/**
 * Copies a file or directory recursively.
 */
export async function copyFile(
  sourcePath: string,
  targetPath: string,
  options: CreateOptions = {}
): Promise<void> {
  const { verbose = false, fs: filesystem } = options;
  if (!filesystem) {
    throw new Error("Filesystem implementation is required");
  }

  const resolvedSource = resolveSourcePath(sourcePath);

  if (!(await filesystem.exists(resolvedSource))) {
    logWarning("errors.sourceNotFound", createPathMessage(sourcePath), verbose);
    await createEmptyFile(targetPath, { verbose, fs: filesystem });
    return;
  }

  try {
    const stat = await filesystem.stat(resolvedSource);
    if (stat.isDirectory()) {
      logMessage(
        "copy.directory",
        createCopyMoveMessage(resolvedSource, targetPath),
        verbose
      );
      await copyDirectoryRecursive(resolvedSource, targetPath, options);
    } else {
      await ensureDirectory(getParentDirectory(targetPath), options);
      await filesystem.copyFile(resolvedSource, targetPath);
      logMessage(
        "copy.success",
        createCopyMoveMessage(sourcePath, targetPath),
        verbose
      );
    }
  } catch (error) {
    logWarning("errors.copyFailed", createPathMessage(sourcePath), verbose);
    await createEmptyFile(targetPath, { verbose, fs: filesystem });
  }
}

/**
 * Moves a file or directory.
 */
export async function moveFile(
  sourcePath: string,
  targetPath: string,
  options: CreateOptions = {}
): Promise<void> {
  const { verbose = false, fs: filesystem } = options;
  if (!filesystem) {
    throw new Error("Filesystem implementation is required");
  }

  const resolvedSource = resolveSourcePath(sourcePath);

  if (!(await filesystem.exists(resolvedSource))) {
    logWarning("errors.sourceNotFound", createPathMessage(sourcePath), verbose);
    await createEmptyFile(targetPath, { verbose, fs: filesystem });
    return;
  }

  try {
    const stat = await filesystem.stat(resolvedSource);
    if (stat.isDirectory()) {
      logMessage(
        "move.directory",
        createCopyMoveMessage(resolvedSource, targetPath),
        verbose
      );
      await copyDirectoryRecursive(resolvedSource, targetPath, {
        ...options,
        verbose: false,
      });
      await filesystem.rm(resolvedSource, { recursive: true });
      logMessage(
        "move.success",
        createCopyMoveMessage(sourcePath, targetPath),
        verbose
      );
    } else {
      logMessage(
        "move.file",
        createCopyMoveMessage(resolvedSource, targetPath),
        verbose
      );
      await ensureDirectory(getParentDirectory(targetPath), options);
      await filesystem.copyFile(resolvedSource, targetPath);
      await filesystem.unlink(resolvedSource);
      logMessage(
        "move.success",
        createCopyMoveMessage(sourcePath, targetPath),
        verbose
      );
    }
  } catch (error) {
    logWarning("errors.moveFailed", createPathMessage(sourcePath), verbose);
    await createEmptyFile(targetPath, { verbose, fs: filesystem });
  }
}

/**
 * Recursively copies a directory.
 */
async function copyDirectoryRecursive(
  source: string,
  destination: string,
  options: CreateOptions = {}
): Promise<void> {
  const { verbose = false, fs: filesystem } = options;
  if (!filesystem) {
    throw new Error("Filesystem implementation is required");
  }

  await ensureDirectory(destination, options);

  const entries = await filesystem.readdir(source, { withFileTypes: true });
  for (const entry of entries) {
    const sourcePath = joinPaths(source, entry.name);
    const destPath = joinPaths(destination, entry.name);

    if (entry.isDirectory()) {
      await copyDirectoryRecursive(sourcePath, destPath, options);
    } else {
      await filesystem.copyFile(sourcePath, destPath);
      if (verbose) {
        logMessage(
          "copy.success",
          createCopyMoveMessage(entry.name, destPath),
          verbose
        );
      }
    }
  }
}
