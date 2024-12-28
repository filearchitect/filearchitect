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
folder1
  file1.txt
  folder2
    file2.txt
`,
  "./output-dir"
);

// Validate a structure string
await createStructureFromString(
  `
folder1
  file1.txt
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

## CLI Tool

For command-line usage, see [@filearchitect/cli](https://www.npmjs.com/package/@filearchitect/cli).
