import { DirectoryEntry, FileSystem, FileSystemOptions } from "./types.js";

export class BrowserFileSystem implements FileSystem {
  private files: Map<string, string> = new Map();
  private directories: Set<string> = new Set();

  constructor() {
    // Initialize root directory
    this.directories.add("");
  }

  private normalizePath(filePath: string): string {
    // Remove leading and trailing slashes
    return filePath.replace(/^\/+|\/+$/g, "");
  }

  private getParentDirectories(path: string): string[] {
    const parts = path.split("/");
    const dirs: string[] = [];
    let current = "";
    for (let i = 0; i < parts.length - 1; i++) {
      current = current ? `${current}/${parts[i]}` : parts[i];
      dirs.push(current);
    }
    return dirs;
  }

  async exists(filePath: string): Promise<boolean> {
    const normalizedPath = this.normalizePath(filePath);
    return (
      this.files.has(normalizedPath) || this.directories.has(normalizedPath)
    );
  }

  async mkdir(
    dirPath: string,
    options?: { recursive?: boolean }
  ): Promise<void> {
    const normalizedPath = this.normalizePath(dirPath);
    if (normalizedPath) {
      this.directories.add(normalizedPath);
      if (options?.recursive) {
        const parentDirs = this.getParentDirectories(normalizedPath);
        for (const dir of parentDirs) {
          this.directories.add(dir);
        }
      }
    }
  }

  async writeFile(filePath: string, content: string): Promise<void> {
    const normalizedPath = this.normalizePath(filePath);
    // Ensure parent directory exists
    const parentDir = normalizedPath.split("/").slice(0, -1).join("/");
    if (parentDir) {
      await this.mkdir(parentDir, { recursive: true });
    }
    this.files.set(normalizedPath, content);
  }

  async readFile(filePath: string): Promise<string> {
    const normalizedPath = this.normalizePath(filePath);
    const content = this.files.get(normalizedPath);
    if (content === undefined) {
      throw new Error(`File not found: ${filePath}`);
    }
    return content;
  }

  async copyFile(src: string, dest: string): Promise<void> {
    const normalizedSrc = this.normalizePath(src);
    const normalizedDest = this.normalizePath(dest);
    const content = this.files.get(normalizedSrc);
    if (content === undefined) {
      throw new Error(`Source file not found: ${src}`);
    }
    await this.writeFile(normalizedDest, content);
  }

  async move(src: string, dest: string): Promise<void> {
    const normalizedSrc = this.normalizePath(src);
    const normalizedDest = this.normalizePath(dest);
    const content = this.files.get(normalizedSrc);
    if (content === undefined) {
      throw new Error(`Source file not found: ${src}`);
    }
    await this.writeFile(normalizedDest, content);
    await this.unlink(normalizedSrc);
  }

  async isDirectory(filePath: string): Promise<boolean> {
    const normalizedPath = this.normalizePath(filePath);
    return this.directories.has(normalizedPath);
  }

  async readdir(
    path: string,
    options?: FileSystemOptions
  ): Promise<DirectoryEntry[]> {
    const normalizedPath = this.normalizePath(path);
    const prefix = normalizedPath ? `${normalizedPath}/` : "";
    const entries = new Map<string, DirectoryEntry>();

    // Add directories
    for (const dir of this.directories) {
      if (dir.startsWith(prefix) && dir !== normalizedPath) {
        const relativePath = dir.slice(prefix.length);
        const firstPart = relativePath.split("/")[0];
        if (!entries.has(firstPart)) {
          entries.set(firstPart, {
            name: firstPart,
            isDirectory: () => true,
          });
        }
      }
    }

    // Add files
    for (const file of this.files.keys()) {
      if (file.startsWith(prefix)) {
        const relativePath = file.slice(prefix.length);
        const firstPart = relativePath.split("/")[0];
        if (!entries.has(firstPart)) {
          entries.set(firstPart, {
            name: firstPart,
            isDirectory: () => false,
          });
        }
      }
    }

    return Array.from(entries.values());
  }

  async stat(filePath: string): Promise<{ isDirectory: () => boolean }> {
    const normalizedPath = this.normalizePath(filePath);
    return {
      isDirectory: () => this.directories.has(normalizedPath),
    };
  }

  async rm(filePath: string, options?: { recursive?: boolean }): Promise<void> {
    const normalizedPath = this.normalizePath(filePath);
    if (this.directories.has(normalizedPath)) {
      if (options?.recursive) {
        const prefix = normalizedPath + "/";
        for (const file of this.files.keys()) {
          if (file.startsWith(prefix)) {
            this.files.delete(file);
          }
        }
        for (const dir of this.directories) {
          if (dir.startsWith(prefix)) {
            this.directories.delete(dir);
          }
        }
      }
      this.directories.delete(normalizedPath);
    } else {
      this.files.delete(normalizedPath);
    }
  }

  async unlink(filePath: string): Promise<void> {
    const normalizedPath = this.normalizePath(filePath);
    this.files.delete(normalizedPath);
  }

  async rename(oldPath: string, newPath: string): Promise<void> {
    const normalizedOld = this.normalizePath(oldPath);
    const normalizedNew = this.normalizePath(newPath);
    if (this.files.has(normalizedOld)) {
      const content = this.files.get(normalizedOld)!;
      this.files.delete(normalizedOld);
      this.files.set(normalizedNew, content);
    } else if (this.directories.has(normalizedOld)) {
      this.directories.delete(normalizedOld);
      this.directories.add(normalizedNew);
      const oldPrefix = normalizedOld + "/";
      const newPrefix = normalizedNew + "/";
      for (const [file, content] of this.files.entries()) {
        if (file.startsWith(oldPrefix)) {
          const newPath = newPrefix + file.slice(oldPrefix.length);
          this.files.delete(file);
          this.files.set(newPath, content);
        }
      }
      for (const dir of this.directories) {
        if (dir.startsWith(oldPrefix)) {
          const newPath = newPrefix + dir.slice(oldPrefix.length);
          this.directories.delete(dir);
          this.directories.add(newPath);
        }
      }
    }
  }

  getFiles(): Map<string, string> {
    return new Map(this.files);
  }

  getDirectories(): Set<string> {
    return new Set(this.directories);
  }
}
