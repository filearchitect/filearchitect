# File Architect Core

A flexible and powerful library for creating file and directory structures from text descriptions.

## Features

- Create files and directories with a simple indented structure
- Copy files and directories with `[source] > target` syntax
- Move files and directories with `(source) > target` syntax
- Support for spaces and special characters in file names
- Support for absolute and relative paths
- Support for home directory (`~`) in paths
- Filesystem abstraction layer for different environments (Node.js, Tauri, etc.)
- Verbose mode for detailed operation logging

## Installation

```bash
npm install file-architect-core
```

## Usage

### CLI Usage

```bash
# Create structure from a file
file-architect create structure.txt output-dir

# Create structure from stdin
echo "folder1\n  file1.txt" | file-architect create - output-dir

# Validate structure file
file-architect validate structure.txt

# Show verbose output
file-architect create structure.txt output-dir --verbose
```

### Library Usage

```typescript
import { createStructureFromString } from "file-architect-core";

const structure = `
folder1
  file1.txt
  folder2
    file2.txt
  [~/Desktop/config.json] > config.json
  (~/old-files/data.txt) > data.txt
`;

await createStructureFromString(structure, "./output");
```

### Filesystem Adapters

The library supports different filesystem implementations through adapters. By default, it uses Node.js's filesystem, but you can provide your own implementation:

#### Using with Node.js (default)

```typescript
import { createStructureFromString } from "file-architect-core";

// Uses Node's fs by default
await createStructureFromString(structure, "./output");
```

#### Using with Tauri

```typescript
import {
  createStructureFromString,
  TauriFileSystem,
} from "file-architect-core";
import { fs } from "@tauri-apps/api";

// Use Tauri's filesystem
const tauriFs = new TauriFileSystem(fs);
await createStructureFromString(structure, "./output", { fs: tauriFs });
```

#### Using in the Browser

```typescript
import {
  createStructureFromString,
  BrowserFileSystem,
} from "file-architect-core";

// Use browser filesystem (requires server-side implementation)
const browserFs = new BrowserFileSystem("/api/fs");
await createStructureFromString(structure, "./output", { fs: browserFs });
```

#### Creating a Custom Adapter

You can create your own filesystem adapter by implementing the `FileSystem` interface:

```typescript
import { FileSystem } from "file-architect-core";

class CustomFileSystem implements FileSystem {
  async exists(path: string): Promise<boolean> {
    // Your implementation
  }

  async mkdir(path: string, options: { recursive: boolean }): Promise<void> {
    // Your implementation
  }

  async writeFile(path: string, data: string): Promise<void> {
    // Your implementation
  }

  async readFile(path: string): Promise<string> {
    // Your implementation
  }

  async copyFile(src: string, dest: string): Promise<void> {
    // Your implementation
  }

  async stat(path: string): Promise<{ isDirectory(): boolean }> {
    // Your implementation
  }

  async readdir(
    path: string,
    options: { withFileTypes: true }
  ): Promise<any[]> {
    // Your implementation
  }

  async rm(path: string, options: { recursive: boolean }): Promise<void> {
    // Your implementation
  }

  async unlink(path: string): Promise<void> {
    // Your implementation
  }

  async rename(oldPath: string, newPath: string): Promise<void> {
    // Your implementation
  }
}

// Use your custom filesystem
const customFs = new CustomFileSystem();
await createStructureFromString(structure, "./output", { fs: customFs });
```

## Syntax Guide

| Syntax              | Description              | Example                           |
| ------------------- | ------------------------ | --------------------------------- |
| `name`              | Create an empty file     | `file.txt`                        |
| `name/`             | Create a directory       | `folder/`                         |
| `[source]`          | Copy a file or directory | `[~/config.json]`                 |
| `[source] > target` | Copy and rename          | `[~/config.json] > settings.json` |
| `(source)`          | Move a file or directory | `(~/old-file.txt)`                |
| `(source) > target` | Move and rename          | `(~/old-file.txt) > new-file.txt` |

## Options

When using the library, you can provide additional options:

```typescript
interface CreateOptions {
  verbose?: boolean; // Enable verbose logging
  fs?: FileSystem; // Custom filesystem implementation
}

await createStructureFromString(structure, "./output", {
  verbose: true,
  fs: customFs,
});
```

## Development

```bash
# Install dependencies
pnpm install

# Run tests
pnpm test

# Run tests in watch mode
pnpm test:watch

# Build
pnpm build

# Build in watch mode
pnpm dev
```

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
