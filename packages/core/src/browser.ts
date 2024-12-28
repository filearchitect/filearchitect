/**
 * Browser-specific implementation of the FileSystem interface
 */
export class BrowserFileSystem {
  constructor(private baseUrl: string = "/fs") {}

  async exists(path: string): Promise<boolean> {
    try {
      await fetch(`${this.baseUrl}/exists?path=${encodeURIComponent(path)}`);
      return true;
    } catch {
      return false;
    }
  }

  async mkdir(path: string, options?: { recursive?: boolean }): Promise<void> {
    await fetch(`${this.baseUrl}/mkdir`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ path, options }),
    });
  }

  async writeFile(path: string, data: string): Promise<void> {
    await fetch(`${this.baseUrl}/writeFile`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ path, data }),
    });
  }

  async readFile(path: string): Promise<string> {
    const response = await fetch(
      `${this.baseUrl}/readFile?path=${encodeURIComponent(path)}`
    );
    return response.text();
  }

  async copyFile(src: string, dest: string): Promise<void> {
    await fetch(`${this.baseUrl}/copyFile`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ src, dest }),
    });
  }

  async stat(path: string): Promise<{ isDirectory: () => boolean }> {
    const response = await fetch(
      `${this.baseUrl}/stat?path=${encodeURIComponent(path)}`
    );
    const data = await response.json();
    return {
      isDirectory: () => data.isDirectory,
    };
  }

  async readdir(
    path: string,
    options?: { withFileTypes?: boolean }
  ): Promise<string[] | { name: string; isDirectory: () => boolean }[]> {
    const response = await fetch(
      `${this.baseUrl}/readdir?path=${encodeURIComponent(path)}&withFileTypes=${
        options?.withFileTypes
      }`
    );
    return response.json();
  }

  async rm(path: string, options?: { recursive?: boolean }): Promise<void> {
    await fetch(`${this.baseUrl}/rm`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ path, options }),
    });
  }

  async unlink(path: string): Promise<void> {
    await fetch(`${this.baseUrl}/unlink`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ path }),
    });
  }

  async rename(oldPath: string, newPath: string): Promise<void> {
    await fetch(`${this.baseUrl}/rename`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ oldPath, newPath }),
    });
  }
}

// Re-export the core functionality
export { createStructureFromString } from "./index";
