# @filearchitect/core

Core library for File Architect - create file and directory structures from text descriptions.

## Installation

```bash
npm install @filearchitect/core
```

## Usage

```typescript
import { createStructureFromString } from "@filearchitect/core";

// Create a directory structure
await createStructureFromString(
  `
src/
  components/
    Button.tsx
    Card.tsx
  styles/
    global.css
  utils/
    helpers.ts
`,
  "./output"
);

// Copy files
await createStructureFromString(
  `
config/
  [~/configs/base.json] > base.json   # Copy file
  [~/templates/react/] > template/    # Copy directory
`,
  "./output"
);

// Move files
await createStructureFromString(
  `
src/
  (~/old-project/components/) > components/  # Move directory
  (~/old-project/config.json) > config.json  # Move file
`,
  "./output"
);

// Validate without creating
await createStructureFromString(
  `
src/
  components/
    Button.tsx
`,
  "/tmp/validate",
  { validate: true }
);
```

## API

### createStructureFromString(input: string, outputDir: string, options?: Options)

Creates a directory structure from a text description.

#### Parameters

- `input`: Text description of the directory structure
- `outputDir`: Directory where the structure will be created
- `options`: Optional configuration
  - `verbose`: Show detailed output (default: false)
  - `validate`: Only validate the structure without creating files (default: false)
  - `fs`: Custom filesystem implementation (default: NodeFileSystem)

## Syntax Guide

| Syntax              | Description          | Example                         |
| ------------------- | -------------------- | ------------------------------- |
| `name`              | Create an empty file | `file.txt`                      |
| `name/`             | Create a directory   | `src/`                          |
| `[source] > target` | Copy file/directory  | `[~/config.json] > config.json` |
| `(source) > target` | Move file/directory  | `(~/old.txt) > new.txt`         |

## Custom Filesystem Support

You can provide your own filesystem implementation for different environments:

```typescript
import { createStructureFromString, FileSystem } from "@filearchitect/core";

class CustomFileSystem implements FileSystem {
  // Implement the FileSystem interface
}

const fs = new CustomFileSystem();
await createStructureFromString(input, outputDir, { fs });
```

## CLI Tool

For command-line usage, see [@filearchitect/cli](https://www.npmjs.com/package/@filearchitect/cli).
