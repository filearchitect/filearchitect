import {
  DirectoryEntry,
  FileStat,
  FileSystem,
  FileSystemOptions,
  Warning,
} from "./types.js";
import { createMessage } from "./warnings.js";

/**
 * Base class with shared filesystem implementations.
 */
export abstract class BaseFileSystem implements FileSystem {
  protected onWarning?: (warning: Warning) => void;

  /**
   * Sets the warning handler for this filesystem
   */
  setWarningHandler(handler: (warning: Warning) => void) {
    this.onWarning = handler;
  }

  /**
   * Emits a warning through the warning handler if one is set
   */
  emitWarning(warning: Warning): void {
    this.onWarning?.(warning);
  }

  abstract exists(path: string): boolean | Promise<boolean>;
  abstract mkdir(
    path: string,
    options?: FileSystemOptions
  ): void | Promise<void>;
  abstract writeFile(path: string, data: string): void | Promise<void>;
  abstract readFile(path: string): string | Promise<string>;
  abstract copyFile(src: string, dest: string): void | Promise<void>;
  abstract copyFolder(
    src: string,
    dest: string,
    options?: FileSystemOptions
  ): Promise<void>;
  abstract moveFolder(
    src: string,
    dest: string,
    options?: FileSystemOptions
  ): Promise<void>;
  abstract stat(path: string): FileStat | Promise<FileStat>;
  abstract readdir(
    path: string,
    options?: FileSystemOptions
  ): DirectoryEntry[] | Promise<DirectoryEntry[]>;
  abstract rm(path: string, options?: FileSystemOptions): void | Promise<void>;
  abstract unlink(path: string): void | Promise<void>;
  abstract rename(oldPath: string, newPath: string): void | Promise<void>;
  abstract isDirectory(path: string): Promise<boolean>;

  /**
   * Ensures a directory exists, creating it and any necessary parent directories.
   */
  async ensureDir(path: string): Promise<void> {
    await this.mkdir(path, { recursive: true });
  }

  /**
   * Empties a directory without removing it.
   */
  async emptyDir(path: string): Promise<void> {
    try {
      await this.rm(path, { recursive: true });
    } catch (error: any) {
      // Ignore if directory doesn't exist
      if (error.code !== "ENOENT") {
        throw error;
      }
    }
    await this.mkdir(path, { recursive: true });
  }

  /**
   * Smart copy that handles both files and directories.
   */
  async copy(
    src: string,
    dest: string,
    options?: FileSystemOptions
  ): Promise<void> {
    try {
      const stat = await this.stat(src);
      if (stat.isDirectory()) {
        await this.copyFolder(src, dest, options);
      } else {
        await this.copyFile(src, dest);
      }
    } catch (error: any) {
      if (error.code === "ENOENT") {
        this.emitWarning({
          type: "missing_source",
          message: createMessage("SOURCE_NOT_FOUND", src),
          path: src,
        });
      }
      throw error;
    }
  }

  /**
   * Smart move that handles both files and directories.
   */
  async move(
    src: string,
    dest: string,
    options?: FileSystemOptions
  ): Promise<void> {
    try {
      const stat = await this.stat(src);
      if (stat.isDirectory()) {
        await this.moveFolder(src, dest, options);
      } else {
        await this.rename(src, dest);
      }
    } catch (error: any) {
      if (error.code === "ENOENT") {
        this.emitWarning({
          type: "missing_source",
          message: createMessage("SOURCE_EMPTY", src),
          path: src,
        });
      }
      throw error;
    }
  }

  /**
   * Checks if a path exists and is of a specific type.
   */
  async existsAs(path: string, type: "file" | "directory"): Promise<boolean> {
    try {
      const stat = await this.stat(path);
      return type === "directory" ? stat.isDirectory() : !stat.isDirectory();
    } catch {
      return false;
    }
  }

  /**
   * Ensures a file exists, creating it if it doesn't.
   * If the file exists, it won't be modified.
   */
  async ensureFile(path: string): Promise<void> {
    try {
      await this.stat(path);
    } catch {
      // Create parent directory if needed
      const parentDir = path.split("/").slice(0, -1).join("/");
      if (parentDir) {
        await this.ensureDir(parentDir);
      }
      await this.writeFile(path, "");
    }
  }

  /**
   * Removes a file or directory and all its contents.
   * Does not throw if the path doesn't exist.
   */
  async remove(path: string): Promise<void> {
    try {
      const stat = await this.stat(path);
      if (stat.isDirectory()) {
        await this.rm(path, { recursive: true });
      } else {
        await this.unlink(path);
      }
    } catch (error: any) {
      // Ignore if path doesn't exist
      if (error.code !== "ENOENT") {
        throw error;
      }
    }
  }

  /**
   * Checks if a directory is empty.
   */
  async isEmptyDir(path: string): Promise<boolean> {
    try {
      const entries = await this.readdir(path, { withFileTypes: true });
      return entries.length === 0;
    } catch {
      return false;
    }
  }

  /**
   * Reads a file if it exists, returns default content if it doesn't.
   */
  async readFileOrDefault(
    path: string,
    defaultContent: string = ""
  ): Promise<string> {
    try {
      return await this.readFile(path);
    } catch {
      return defaultContent;
    }
  }

  /**
   * Ensures a directory exists and is empty.
   */
  async ensureEmptyDir(path: string): Promise<void> {
    await this.emptyDir(path);
    await this.ensureDir(path);
  }

  /**
   * Copies a file or directory only if the destination doesn't exist.
   * Returns true if copied, false if destination already exists.
   */
  async copyIfNotExists(
    src: string,
    dest: string,
    options?: FileSystemOptions
  ): Promise<boolean> {
    if (await this.exists(dest)) {
      return false;
    }
    await this.copy(src, dest, options);
    return true;
  }

  /**
   * Moves a file or directory only if the destination doesn't exist.
   * Returns true if moved, false if destination already exists.
   */
  async moveIfNotExists(
    src: string,
    dest: string,
    options?: FileSystemOptions
  ): Promise<boolean> {
    if (await this.exists(dest)) {
      return false;
    }
    await this.move(src, dest, options);
    return true;
  }

  /**
   * Gets all files in a directory recursively.
   * Returns an array of paths relative to the directory.
   */
  async getAllFiles(dirPath: string): Promise<string[]> {
    const result: string[] = [];
    const entries = await this.readdir(dirPath, { withFileTypes: true });

    for (const entry of entries) {
      const fullPath = `${dirPath}/${entry.name}`;
      if (entry.isDirectory()) {
        const subFiles = await this.getAllFiles(fullPath);
        result.push(...subFiles.map((f) => `${entry.name}/${f}`));
      } else {
        result.push(entry.name);
      }
    }

    return result;
  }

  /**
   * Gets all directories in a directory recursively.
   * Returns an array of paths relative to the directory.
   */
  async getAllDirectories(dirPath: string): Promise<string[]> {
    const result: string[] = [];
    const entries = await this.readdir(dirPath, { withFileTypes: true });

    for (const entry of entries) {
      const fullPath = `${dirPath}/${entry.name}`;
      if (entry.isDirectory()) {
        result.push(entry.name);
        const subDirs = await this.getAllDirectories(fullPath);
        result.push(...subDirs.map((d) => `${entry.name}/${d}`));
      }
    }

    return result;
  }

  /**
   * Gets the relative path between two absolute paths.
   */
  async getRelativePath(from: string, to: string): Promise<string> {
    // Split paths into segments
    const fromParts = from.split("/").filter(Boolean);
    const toParts = to.split("/").filter(Boolean);

    // Find common prefix
    let i = 0;
    while (
      i < fromParts.length &&
      i < toParts.length &&
      fromParts[i] === toParts[i]
    ) {
      i++;
    }

    // Build relative path
    const upCount = fromParts.length - i;
    const relativeParts = [...Array(upCount).fill(".."), ...toParts.slice(i)];
    return relativeParts.join("/") || ".";
  }

  /**
   * Gets all paths matching a glob pattern.
   * For example: src/**\/*.ts will get all TypeScript files in src and subdirectories.
   */
  async glob(pattern: string): Promise<string[]> {
    const [baseDir, ...patternParts] = pattern.split("/");
    const results: string[] = [];

    if (!patternParts.length) {
      return [baseDir];
    }

    const processDirectory = async (
      dir: string,
      remainingPattern: string[]
    ) => {
      const [current, ...rest] = remainingPattern;
      const entries = await this.readdir(dir, { withFileTypes: true });

      for (const entry of entries) {
        const fullPath = `${dir}/${entry.name}`;

        if (current === "**") {
          // Deep search
          if (entry.isDirectory()) {
            await processDirectory(fullPath, remainingPattern);
          }
          if (rest.length) {
            await processDirectory(fullPath, rest);
          }
        } else if (current.includes("*")) {
          // Pattern matching
          const regex = new RegExp(`^${current.replace(/\*/g, ".*")}$`);
          if (regex.test(entry.name)) {
            if (rest.length === 0) {
              results.push(fullPath);
            } else if (entry.isDirectory()) {
              await processDirectory(fullPath, rest);
            }
          }
        } else if (entry.name === current) {
          // Exact match
          if (rest.length === 0) {
            results.push(fullPath);
          } else if (entry.isDirectory()) {
            await processDirectory(fullPath, rest);
          }
        }
      }
    };

    await processDirectory(baseDir, patternParts);
    return results;
  }

  /**
   * Watches a path for changes.
   * Returns a function to stop watching.
   */
  abstract watch(
    path: string,
    callback: (eventType: "add" | "change" | "unlink", path: string) => void
  ): Promise<() => void>;

  /**
   * Checks if a path matches a glob pattern.
   */
  matchesPattern(path: string, pattern: string): boolean {
    const regex = new RegExp(
      `^${pattern
        .split("*")
        .map((s) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"))
        .join(".*")}$`
    );
    return regex.test(path);
  }

  /**
   * Gets common parent directory of multiple paths.
   */
  getCommonParent(...paths: string[]): string {
    if (paths.length === 0) return "";
    if (paths.length === 1) return paths[0];

    const parts = paths.map((p) => p.split("/").filter(Boolean));
    const minLength = Math.min(...parts.map((p) => p.length));

    let commonParts: string[] = [];
    for (let i = 0; i < minLength; i++) {
      const part = parts[0][i];
      if (parts.every((p) => p[i] === part)) {
        commonParts.push(part);
      } else {
        break;
      }
    }

    return commonParts.join("/") || "/";
  }
}
