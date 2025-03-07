import {
  DirectoryEntry,
  FileStat,
  FileSystem,
  FileSystemOptions,
} from "./types/filesystem.js";

export class BrowserFileSystem implements FileSystem {
  private files: Map<string, Uint8Array>;
  private directories: Set<string>;

  constructor(options: FileSystemOptions = {}) {
    this.files = new Map();
    this.directories = new Set();
  }

  async writeFile(path: string, data: string): Promise<void> {
    const content = new TextEncoder().encode(data);
    this.files.set(path, content);

    // Ensure parent directories exist
    let parentPath = path.split("/").slice(0, -1).join("/");
    while (parentPath) {
      this.directories.add(parentPath);
      parentPath = parentPath.split("/").slice(0, -1).join("/");
    }
  }

  async readFile(path: string): Promise<string> {
    const content = this.files.get(path);
    if (!content) {
      throw new Error(`File not found: ${path}`);
    }
    return new TextDecoder().decode(content);
  }

  async exists(path: string): Promise<boolean> {
    return this.files.has(path) || this.directories.has(path);
  }

  async mkdir(path: string, options?: FileSystemOptions): Promise<void> {
    if (options?.recursive) {
      let currentPath = "";
      for (const part of path.split("/")) {
        if (part) {
          currentPath = currentPath ? `${currentPath}/${part}` : part;
          this.directories.add(currentPath);
        }
      }
    } else {
      this.directories.add(path);
    }
  }

  async readdir(
    path: string,
    options?: FileSystemOptions
  ): Promise<DirectoryEntry[]> {
    const entries = new Set<string>();
    const prefix = path ? `${path}/` : "";

    // Add files
    for (const filePath of this.files.keys()) {
      if (filePath.startsWith(prefix)) {
        const relativePath = filePath.slice(prefix.length);
        const firstPart = relativePath.split("/")[0];
        if (firstPart) {
          entries.add(firstPart);
        }
      }
    }

    // Add directories
    for (const dirPath of this.directories) {
      if (dirPath.startsWith(prefix)) {
        const relativePath = dirPath.slice(prefix.length);
        const firstPart = relativePath.split("/")[0];
        if (firstPart) {
          entries.add(firstPart);
        }
      }
    }

    return Array.from(entries).map((name) => ({
      name,
      isDirectory: () => this.directories.has(path ? `${path}/${name}` : name),
    }));
  }

  async stat(path: string): Promise<FileStat> {
    const isFile = this.files.has(path);
    const isDirectory = this.directories.has(path);

    if (!isFile && !isDirectory) {
      throw new Error(`No such file or directory: ${path}`);
    }

    return {
      isDirectory: () => isDirectory,
      size: isFile ? this.files.get(path)?.length : undefined,
    };
  }

  async isDirectory(path: string): Promise<boolean> {
    return this.directories.has(path);
  }

  // Required by the FileSystem interface but not implemented for browser demo
  async rm(): Promise<void> {
    throw new Error("Not implemented");
  }

  async unlink(): Promise<void> {
    throw new Error("Not implemented");
  }

  async rename(): Promise<void> {
    throw new Error("Not implemented");
  }

  async copyFile(): Promise<void> {
    throw new Error("Not implemented");
  }

  async copyFolder(): Promise<void> {
    throw new Error("Not implemented");
  }

  async moveFolder(): Promise<void> {
    throw new Error("Not implemented");
  }

  async ensureDir(): Promise<void> {
    throw new Error("Not implemented");
  }

  async emptyDir(): Promise<void> {
    throw new Error("Not implemented");
  }

  async copy(): Promise<void> {
    throw new Error("Not implemented");
  }

  async move(): Promise<void> {
    throw new Error("Not implemented");
  }

  async existsAs(): Promise<boolean> {
    throw new Error("Not implemented");
  }

  async ensureFile(): Promise<void> {
    throw new Error("Not implemented");
  }

  async remove(): Promise<void> {
    throw new Error("Not implemented");
  }

  async isEmptyDir(): Promise<boolean> {
    throw new Error("Not implemented");
  }

  async readFileOrDefault(): Promise<string> {
    throw new Error("Not implemented");
  }

  async ensureEmptyDir(): Promise<void> {
    throw new Error("Not implemented");
  }

  async copyIfNotExists(): Promise<boolean> {
    throw new Error("Not implemented");
  }

  async moveIfNotExists(): Promise<boolean> {
    throw new Error("Not implemented");
  }

  async getAllFiles(): Promise<string[]> {
    throw new Error("Not implemented");
  }

  async getAllDirectories(): Promise<string[]> {
    throw new Error("Not implemented");
  }
}
