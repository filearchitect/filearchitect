# @filearchitect/core

Core functionality for FileArchitect, providing a unified filesystem interface that works in both Node.js and browser environments.

## Features

-   🌳 Create directory structures from simple text descriptions
-   🔄 Copy and move files/directories with ease
-   🌐 Works in both Node.js and browser environments
-   🛡️ Type-safe with TypeScript
-   🧰 Rich set of filesystem utilities
-   🔍 Glob pattern matching and file watching
-   🛠️ Advanced path manipulation utilities

## Installation

```bash
npm install @filearchitect/core
# or
pnpm add @filearchitect/core
# or
yarn add @filearchitect/core
```

## Basic Usage

```typescript
import { createStructureFromString } from "@filearchitect/core";
import nodeFileSystem from "@filearchitect/core/node";

// Create a directory structure
const structure = `
src/
    components/
        Button.tsx
        Input.tsx
    utils/
        helpers.ts
    index.ts
`;

await createStructureFromString(structure, "./my-project", {
    fs: nodeFileSystem,
    isCLI: true,
});
```

## Syntax Guide

| Syntax              | Description                                                       | Example                         |
| ------------------- | ----------------------------------------------------------------- | ------------------------------- |
| `name.ext`          | Creates an empty file                                             | `file.txt`                      |
| `name`              | Creates a directory                                               | `folder`                        |
| `[source]`          | Copies a file or folder with its contents                         | `[~/config.json]`               |
| `[source] > target` | Copies a file or folder with its contents and renames it          | `[~/config.json] > config.json` |
| `(source)`          | Moves (imports) a file or folder with its contents                | `(~/old.txt)`                   |
| `(source) > target` | Moves (imports) a file or folder with its contents and renames it | `(~/old.txt) > new.txt`         |

### Full Example

```txt
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

## Filesystem API

The package provides a rich set of filesystem operations through the `FileSystem` interface:

### Basic Operations

-   `exists(path)` - Check if a path exists
-   `mkdir(path, options)` - Create a directory
-   `writeFile(path, data)` - Write data to a file
-   `readFile(path)` - Read file contents
-   `stat(path)` - Get file/directory stats
-   `readdir(path, options)` - List directory contents
-   `rm(path, options)` - Remove a file or directory
-   `unlink(path)` - Remove a file
-   `rename(oldPath, newPath)` - Rename/move a file or directory
-   `isDirectory(path)` - Check if a path is a directory

### High-Level Operations

-   `copyFile(src, dest)` - Copy a file
-   `copyFolder(src, dest)` - Copy a directory recursively
-   `moveFolder(src, dest)` - Move a directory

### Convenience Methods

-   `ensureDir(path)` - Create a directory and any necessary parent directories
-   `emptyDir(path)` - Empty a directory without removing it
-   `copy(src, dest)` - Smart copy that handles both files and directories
-   `move(src, dest)` - Smart move that handles both files and directories
-   `existsAs(path, type)` - Check if a path exists and is of a specific type
-   `ensureFile(path)` - Create a file and any necessary parent directories
-   `remove(path)` - Remove a file or directory (doesn't throw if not exists)
-   `isEmptyDir(path)` - Check if a directory is empty
-   `readFileOrDefault(path, defaultContent)` - Read file with fallback content
-   `ensureEmptyDir(path)` - Ensure a directory exists and is empty
-   `copyIfNotExists(src, dest)` - Copy only if destination doesn't exist
-   `moveIfNotExists(src, dest)` - Move only if destination doesn't exist
-   `getAllFiles(dirPath)` - Get all files in a directory recursively
-   `getAllDirectories(dirPath)` - Get all directories in a directory recursively

### Path Manipulation and Watching

-   `getRelativePath(from, to)` - Get relative path between two absolute paths
-   `glob(pattern)` - Find files matching a glob pattern
-   `watch(path, callback)` - Watch for file system changes
-   `matchesPattern(path, pattern)` - Check if a path matches a glob pattern
-   `getCommonParent(...paths)` - Get common parent directory of multiple paths

## Browser Support

For browser environments, use the browser filesystem implementation:

```typescript
import { BrowserFileSystem } from "@filearchitect/core/browser";

const browserFs = new BrowserFileSystem();
// Use browserFs just like nodeFileSystem
```

## Error Handling

All filesystem operations throw appropriate errors when they fail:

-   `FSError.notFound(path)` - Path doesn't exist
-   `FSError.alreadyExists(path)` - Path already exists
-   `FSError.isDirectory(path)` - Expected file but got directory
-   `FSError.notDirectory(path)` - Expected directory but got file
-   `FSError.permissionDenied(path)` - Permission denied
-   `FSError.operationFailed(message, path)` - Other operation failures

## Advanced Usage

### Creating Complex Structures

```typescript
const structure = `
src/
    [~/templates/component.tsx] > components/Button.tsx
    [~/templates/component.tsx] > components/Input.tsx
    (~/old-utils/helpers.ts) > utils/helpers.ts
`;

await createStructureFromString(structure, "./my-project", {
    fs: nodeFileSystem,
    isCLI: true,
    fileNameReplacements: [
        { search: "component", replace: "Button" },
        { search: "component", replace: "Input" },
    ],
});
```

### Working with Files and Directories

```typescript
import nodeFileSystem from "@filearchitect/core/node";

// Ensure directory exists and is empty
await nodeFileSystem.ensureEmptyDir("./build");

// Copy files only if they don't exist
await nodeFileSystem.copyIfNotExists("./src/config.ts", "./dist/config.ts");

// Get all files recursively
const files = await nodeFileSystem.getAllFiles("./src");
console.log("All source files:", files);

// Get all directories recursively
const dirs = await nodeFileSystem.getAllDirectories("./src");
console.log("All source directories:", dirs);

// Read file with fallback
const config = await nodeFileSystem.readFileOrDefault("./config.json", "{}");
```

### Using Glob Patterns and File Watching

```typescript
// Find all TypeScript files in src directory
const tsFiles = await nodeFileSystem.glob("src/**/*.ts");

// Watch for changes in the src directory
const stopWatching = await nodeFileSystem.watch("src", (eventType, path) => {
    console.log(`${eventType} event for ${path}`);
});

// Get relative path between directories
const relativePath = await nodeFileSystem.getRelativePath("/a/b/c", "/a/d/e");
console.log(relativePath); // "../../d/e"

// Find common parent directory
const commonParent = nodeFileSystem.getCommonParent(
    "/a/b/c/file1.ts",
    "/a/b/d/file2.ts"
);
console.log(commonParent); // "/a/b"
```

## License

MIT
