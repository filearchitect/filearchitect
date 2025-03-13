import JSZip from "jszip";
import { NodeFileSystem } from "./node-filesystem.js";
import type { FileSystem } from "./types.js";

export interface ZipOptions {
  fs?: FileSystem;
  relativeTo?: string; // Base path to make paths relative to
}

export interface ZipOutput {
  type: "blob" | "buffer";
  data: Blob | Buffer;
}

/**
 * Handles creation of zip archives from files and directories.
 * Works with both browser and Node.js environments.
 */
export class ZipArchiver {
  private zip: JSZip;
  private fs: FileSystem;
  private relativeTo: string;

  constructor(options: ZipOptions = {}) {
    this.zip = new JSZip();
    this.fs = options.fs || new NodeFileSystem();
    this.relativeTo = options.relativeTo || "";
  }

  /**
   * Makes a path relative to the base path if one is set
   */
  private getRelativePath(path: string): string {
    if (!this.relativeTo) return path;
    return path.replace(new RegExp(`^${this.relativeTo}/?`), "");
  }

  /**
   * Creates necessary folder structure for a path
   */
  private ensureFolder(path: string): void {
    const pathParts = path.split("/");
    let currentPath = "";

    // Create each folder in the path
    for (let i = 0; i < pathParts.length - 1; i++) {
      currentPath += (currentPath ? "/" : "") + pathParts[i];
      if (!this.zip.folder(currentPath)) {
        this.zip.folder(currentPath);
      }
    }
  }

  /**
   * Adds a single file to the archive
   */
  async addFile(path: string, content: string): Promise<void> {
    const relativePath = this.getRelativePath(path);
    this.ensureFolder(relativePath);
    this.zip.file(relativePath, content);
  }

  /**
   * Creates a directory in the archive
   */
  async addDirectory(path: string): Promise<void> {
    const relativePath = this.getRelativePath(path);
    this.zip.folder(relativePath);
  }

  /**
   * Adds multiple files from a filesystem
   */
  async addFromFileSystem(paths: string[]): Promise<void> {
    for (const path of paths) {
      const content = await this.fs.readFile(path);
      await this.addFile(path, content);
    }
  }

  /**
   * Generates the zip archive in the requested format
   */
  async generate(type: "blob" | "buffer" = "blob"): Promise<ZipOutput> {
    const data = await this.zip.generateAsync({
      type: type === "blob" ? "blob" : "nodebuffer",
    });

    return {
      type,
      data: data as any, // Type assertion needed due to JSZip types
    };
  }
}
