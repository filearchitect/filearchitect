import path from "path";
import { MESSAGES } from "./constants";
import { logMessage, logSuccess, logWarning } from "./messages";
import { FileSystem } from "./types";

/**
 * Creates an empty file, creating parent directories if needed.
 *
 * @param filePath The path of the file to create
 * @param options Additional options
 */
export async function createEmptyFile(
  filePath: string,
  options: { verbose?: boolean; fs: FileSystem } = {} as any
): Promise<void> {
  const { verbose = false, fs: filesystem } = options;

  const dir = path.dirname(filePath);
  if (!(await filesystem.exists(dir))) {
    await filesystem.mkdir(dir, { recursive: true });
  }

  // Always write the file, even if it exists
  await filesystem.writeFile(filePath, "");
  logMessage(MESSAGES.CREATED_FILE(filePath), { verbose });
}

/**
 * Creates a directory if it doesn't exist.
 *
 * @param dirPath The path of the directory to create
 * @param options Additional options
 */
export async function createDirectory(
  dirPath: string,
  options: { verbose?: boolean; fs: FileSystem } = {} as any
): Promise<void> {
  const { verbose = false, fs: filesystem } = options;

  if (!(await filesystem.exists(dirPath))) {
    await filesystem.mkdir(dirPath, { recursive: true });
    logMessage(MESSAGES.CREATED_DIR(dirPath), { verbose });
  } else if (verbose) {
    logMessage(MESSAGES.DIR_EXISTS(dirPath), { verbose });
  }
}

/**
 * Copies a file or directory, creating an empty file if source doesn't exist.
 *
 * @param sourcePath The source path to copy from
 * @param targetPath The target path to copy to
 * @param options Additional options
 */
export async function copyFile(
  sourcePath: string,
  targetPath: string,
  options: { verbose?: boolean; fs: FileSystem } = {} as any
): Promise<void> {
  const { verbose = false, fs: filesystem } = options;

  const resolvedSource = path.isAbsolute(sourcePath)
    ? sourcePath
    : path.resolve(process.cwd(), sourcePath);

  if (!(await filesystem.exists(resolvedSource))) {
    logWarning(MESSAGES.SOURCE_NOT_FOUND(sourcePath));
    await createEmptyFile(targetPath, { verbose, fs: filesystem });
    return;
  }

  const destinationDir = path.dirname(targetPath);
  if (!(await filesystem.exists(destinationDir))) {
    await filesystem.mkdir(destinationDir, { recursive: true });
  }

  try {
    const stat = await filesystem.stat(resolvedSource);
    if (stat.isDirectory()) {
      logMessage(MESSAGES.COPYING_DIR(resolvedSource, targetPath), { verbose });
      await copyDirectorySync(resolvedSource, targetPath, {
        verbose,
        fs: filesystem,
      });
    } else {
      await filesystem.copyFile(resolvedSource, targetPath);
      logSuccess(MESSAGES.COPIED_FILE(sourcePath, targetPath), { verbose });
    }
  } catch (error) {
    logWarning(MESSAGES.COPY_FAILED(sourcePath));
    await createEmptyFile(targetPath, { verbose, fs: filesystem });
  }
}

/**
 * Moves a file or directory, creating an empty file if source doesn't exist.
 *
 * @param sourcePath The source path to move from
 * @param targetPath The target path to move to
 * @param options Additional options
 */
export async function moveFile(
  sourcePath: string,
  targetPath: string,
  options: { verbose?: boolean; fs: FileSystem } = {} as any
): Promise<void> {
  const { verbose = false, fs: filesystem } = options;

  const resolvedSource = path.isAbsolute(sourcePath)
    ? sourcePath
    : path.resolve(process.cwd(), sourcePath);

  if (!(await filesystem.exists(resolvedSource))) {
    logWarning(MESSAGES.SOURCE_NOT_FOUND(sourcePath));
    await createEmptyFile(targetPath, { verbose, fs: filesystem });
    return;
  }

  const destinationDir = path.dirname(targetPath);
  if (!(await filesystem.exists(destinationDir))) {
    await filesystem.mkdir(destinationDir, { recursive: true });
  }

  try {
    const stat = await filesystem.stat(resolvedSource);
    if (stat.isDirectory()) {
      logMessage(MESSAGES.MOVING_DIR(resolvedSource, targetPath), { verbose });
      await copyDirectorySync(resolvedSource, targetPath, {
        verbose: false,
        fs: filesystem,
      });
      await filesystem.rm(resolvedSource, { recursive: true });
      logSuccess(MESSAGES.MOVED_SUCCESS(), { verbose });
    } else {
      logMessage(MESSAGES.MOVING_FILE(resolvedSource, targetPath), { verbose });
      try {
        // First try to copy the file to ensure we have the content
        await filesystem.copyFile(resolvedSource, targetPath);
        // Then try to remove the source file
        await filesystem.unlink(resolvedSource);
      } catch (error) {
        logWarning(MESSAGES.MOVE_FAILED(error as string));
      }
      logSuccess(MESSAGES.MOVED_SUCCESS(), { verbose });
    }
  } catch (error) {
    logWarning(MESSAGES.COPY_FAILED(sourcePath));
    await createEmptyFile(targetPath, { verbose, fs: filesystem });
  }
}

/**
 * Recursively copies a directory.
 *
 * @param source The source directory to copy from
 * @param destination The destination directory to copy to
 * @param options Additional options
 */
export async function copyDirectorySync(
  source: string,
  destination: string,
  options: { verbose?: boolean; fs: FileSystem } = {} as any
): Promise<void> {
  const { verbose = false, fs: filesystem } = options;

  if (!(await filesystem.exists(destination))) {
    await filesystem.mkdir(destination, { recursive: true });
  }

  const entries = await filesystem.readdir(source, { withFileTypes: true });
  for (const entry of entries) {
    const sourcePath = path.join(source, entry.name);
    const destPath = path.join(destination, entry.name);

    if (entry.isDirectory()) {
      await copyDirectorySync(sourcePath, destPath, {
        verbose,
        fs: filesystem,
      });
    } else {
      await filesystem.copyFile(sourcePath, destPath);
      logMessage(`  ✓ ${entry.name}`, { verbose });
    }
  }
}
