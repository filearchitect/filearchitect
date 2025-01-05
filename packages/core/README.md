# @filearchitect/core

Core library for File Architect - create file and directory structures from text descriptions.

## Installation

```bash
npm install @filearchitect/core
```

## Basic Example

Create a complete project structure with file creation, copying, and importing (`project-structure.txt`):

```txt
# Create directories and files
src
	components
		Button.tsx
		Card.tsx
		forms
			LoginForm.tsx
			SignupForm.tsx
	styles
		global.css
			components.css
	utils
		api.ts
		helpers.ts
	types
		index.d.ts

# Copy configuration files
config
	[~/configs/base.json] > base.json
	[~/templates/react] > template

# Import existing files
tests
	(~/old-project/components/Button.test.tsx) > components/Button.test.tsx
	(~/old-project/utils/helpers.test.ts) > utils/helpers.test.ts
```

```typescript
import { createStructureFromString } from "@filearchitect/core";

const structureText = await fs.readFile("project-structure.txt", "utf-8");
await createStructureFromString(structureText, "./my-project");
```

This creates:

```
my-project/
├── src/
│   ├── components/
│   │   ├── Button.tsx
│   │   ├── Card.tsx
│   │   └── forms/
│   │       ├── LoginForm.tsx
│   │       └── SignupForm.tsx
│   ├── styles/
│   │   ├── global.css
│   │   └── components.css
│   ├── utils/
│   │   ├── api.ts
│   │   └── helpers.ts
│   └── types/
│       └── index.d.ts
├── config/
│   ├── base.json          # Copied from ~/configs/base.json
│   └── template/          # Copied from ~/templates/react
└── tests/
    ├── components/
    │   └── Button.test.tsx  # Imported from ~/old-project/components/Button.test.tsx
    └── utils/
        └── helpers.test.ts  # Imported from ~/old-project/utils/helpers.test.ts
```

## Syntax Guide

| Syntax              | Description                      | Example                         |
| ------------------- | -------------------------------- | ------------------------------- |
| `name.ext`          | Creates an empty file            | `file.txt`                      |
| `name`              | Creates a directory              | `folder`                        |
| `[source] > target` | Copies a file/directory          | `[~/config.json] > config.json` |
| `(source) > target` | Moves (imports) a file/directory | `(~/old.txt) > new.txt`         |

## Features

### Creating Files and Directories

Simply write the path to create empty files and directories:

```txt
src
	components
		Button.tsx
		Card.tsx
	styles
		global.css
```

### Copying Files

Use `[source] > target` to copy files or directories:

```txt
config
	[~/configs/base.json] > base.json   # Copy file
	[~/templates/react] > template      # Copy directory
```

### Importing Files

Use `(source) > target` to import (move) files or directories:

```txt
tests
	(~/old-project/Button.test.tsx) > Button.test.tsx  # Import file
	(~/old-project/utils) > utils                      # Import directory
```

## API

### createStructureFromString(input: string, outputDir: string, options?: Options)

Creates a directory structure from a text description.

#### Parameters

- `input`: Text description of the directory structure
- `outputDir`: Directory where the structure will be created
- `options`: Optional configuration
  - `verbose`: Show detailed output (default: false)
  - `fs`: Custom filesystem implementation (default: NodeFileSystem)
  - `replaceInFiles`: Object mapping strings to replace in file names
  - `replaceInFolders`: Object mapping strings to replace in folder names

### Custom Filesystem Support (Experimental)

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
