# File Architect

<p align="center">
  <a href="https://filearchitect.com" target="_blank">Website</a> |
  <a href="https://filearchitect.com/docs" target="_blank">Documentation</a>
</p>

Create file and folder structures with plain text. Write the file and folder structures you want to create and nest them with tabs. Perfect for scaffolding projects, creating templates, and organizing files.

This code powers the mac app available at [filearchitect.com](https://filearchitect.com)

## Features

-   📁 Create directory structures using a simple, indentation-based syntax
-   📋 Copy files and directories from existing locations
-   🔄 Move (import) files from other projects
-   🚀 Available as both a CLI tool and a TypeScript/JavaScript library
-   🌐 Works in both Node.js and browser environments
-   ⚡ Supports YAML frontmatter for configuration
-   🔍 Preview structure operations before execution

> ℹ️ **Note**  
> This is still a work-in-progress and might have some breaking changes


## Installation

### CLI Tool

```bash
npm install -g @filearchitect/cli
# or
pnpm add -g @filearchitect/cli
# or
yarn global add @filearchitect/cli
```

### Library

```bash
npm install @filearchitect/core
# or
pnpm add @filearchitect/core
# or
yarn add @filearchitect/core
```

## Quick Start

### Using the CLI

1. Create a structure file (`structure.txt`):

```txt
src
    components
        Button.tsx
        Card.tsx
    styles
        global.css
```

2. Create the structure:

```bash
filearchitect create structure.txt my-project
```

### Using the Library

```typescript
import { createStructure } from "@filearchitect/core";

const structure = `
src
    components
        Button.tsx
        Card.tsx
    styles
        global.css
`;

// Uses Node.js filesystem by default
await createStructure(structure, "./my-project");

// Or with options
await createStructure(structure, "./my-project", {
    replacements: {
        files: [{ search: ".js", replace: ".ts" }],
    },
});
```

## Syntax Guide

| Syntax                | Description                                        | Example                                 |
| --------------------- | -------------------------------------------------- | --------------------------------------- |
| `name.ext`            | Creates an empty file                              | `file.txt`                              |
| `name`                | Creates a directory                                | `folder`                                |
| `[source]`            | Copies a file or folder with its contents          | `[~/path/to/config.json]`               |
| `[souce] > name.ext`  | Copies and renames a file or folder                | `[~/path/to/config.json] > config.json` |
| `(source)`            | Moves (imports) a file or folder with its contents | `(~/path/to/file.txt)`                  |
| `(source) > name.ext` | Moves and renames a file or folder                 | `(~/old.txt) > new.txt`                 |

### YAML Frontmatter

You can include YAML frontmatter at the start of your structure file to configure replacements:

```yaml
---
fileReplacements:
    - search: ".js"
      replace: ".ts"
folderReplacements:
    - search: "api"
      replace: "rest"
---
src
api
index.js
```

### Complete Example

```txt
---
fileReplacements:
  - search: ".js"
    replace: ".ts"
---
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
        [~/templates/api.js] > api.ts
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
│   │   ├── api.ts        # Copied and renamed from ~/templates/api.js
│   │   └── helpers.ts
│   └── types/
│       └── index.d.ts
├── config/
│   ├── base.json         # Copied from ~/configs/base.json
│   └── template/         # Copied from ~/templates/react
└── tests/
    ├── components/
    │   └── Button.test.tsx  # Moved from ~/old-project/components/Button.test.tsx
    └── utils/
        └── helpers.test.ts  # Moved from ~/old-project/utils/helpers.test.ts
```

## CLI Usage

```bash
# Create a structure
filearchitect create structure.txt output

# Preview operations without creating
filearchitect show structure.txt output
```

## Library Usage

```typescript
import { createStructure, getStructure } from "@filearchitect/core";

// Basic usage with Node.js filesystem (default)
await createStructure(structureText, "./output");

// With replacements
await createStructure(structureText, "./output", {
    replacements: {
        files: [{ search: ".js", replace: ".ts" }],
        folders: [{ search: "api", replace: "rest" }],
    },
});

// Preview operations without creating files
const { operations } = await getStructure(structureText, {
    rootDir: "./output",
});
console.log(operations);

// Use the operations for custom processing
operations.forEach((operation) => {
    console.log(`${operation.type}: ${operation.targetPath}`);
});
```

## Browser Usage

File Architect also works in the browser with an in-memory filesystem:

```typescript
import { createStructure, BrowserFileSystem } from "@filearchitect/core";

const fs = new BrowserFileSystem();

// Browser requires explicit filesystem
await createStructure(structureText, "/", {
    fs, // Browser filesystem must be provided explicitly
    replacements: {
        files: [{ search: ".js", replace: ".ts" }],
    },
});

// Access the in-memory files
const files = fs.getFiles();
const directories = fs.getDirectories();
```

## Structure Operations

When using `getStructure`, you get access to all planned operations before execution:

```typescript
import { getStructure } from "@filearchitect/core";

const { operations } = await getStructure(structureText, {
    rootDir: "./output",
});
```

Each operation has the following structure:

```typescript
interface StructureOperation {
    // Type of operation: "create", "copy", "move", or "included"
    type: "create" | "copy" | "move" | "included";

    // Target path where the file/directory will be created
    targetPath: string;

    // For copy/move operations, the source path
    sourcePath?: string;

    // Whether this is a directory or file
    isDirectory: boolean;

    // Indentation depth in the original structure
    depth: number;

    // Base name of the file/directory
    name: string;

    // Warning message if there might be an issue
    warning?: string;
}
```

You can use these operations to:

-   Preview changes before execution
-   Create custom validation rules
-   Implement your own file processing logic
-   Generate documentation about the structure

## ZIP Archive Support

File Architect also provides a ZIP archiver to bundle your generated files:

```typescript
import { createStructure, ZipArchiver } from "@filearchitect/core";

// Create your file structure
await createStructure(structureText, "./output");

// Create a ZIP archive of the results
const zipArchiver = new ZipArchiver({ relativeTo: "./output" });

// Add specific files or directories
await zipArchiver.addFile("./output/config.json", '{"key": "value"}');
await zipArchiver.addDirectory("./output/src");

// Add files from the filesystem
await zipArchiver.addFromFileSystem([
    "./output/package.json",
    "./output/README.md",
]);

// Generate the ZIP archive
const zipOutput = await zipArchiver.generate("buffer"); // or "blob" for browser

// In Node.js, you can write the buffer to disk
import fs from "fs";
fs.writeFileSync("project.zip", zipOutput.data);
```

The ZIP archiver works in both Node.js and browser environments.

## Practical Examples

### Generate a React Component

```txt
src
    components
        Button
            Button.tsx
            Button.module.css
            index.ts
            Button.test.tsx
```

### Create a Project Scaffold

```txt
---
fileReplacements:
  - search: "MyProject"
    replace: "TaskManager"
---
MyProject
    src
        index.ts
        models
            User.ts
            Task.ts
        services
            api.ts
        components
            layout
                Header.tsx
                Footer.tsx
            shared
                Button.tsx
                Card.tsx
    public
        index.html
        assets
            logo.svg
    tests
        unit
            models
                User.test.ts
    README.md
    package.json
    tsconfig.json
```

### Import from an Existing Project

```txt
# Create a new project with files from multiple sources
new-project
    # Copy configuration files
    [~/templates/typescript/tsconfig.json]
    [~/templates/eslint/.eslintrc.js]

    # Import key components from another project
    src
        components
            (~/old-project/src/components/Button.tsx)
            (~/old-project/src/components/Card.tsx)

        # Add new files
        pages
            Home.tsx
            About.tsx
            Contact.tsx
```

## Contributing

1. Clone the repository:

```bash
git clone https://github.com/filearchitect/filearchitect.git
cd filearchitect
```

2. Install dependencies:

```bash
pnpm install
```

3. Build the packages:

```bash
pnpm build
```

4. Try it out:

```bash
pnpm cli create structure.txt output
```

## License

MIT

## Roadmap

File Architect is actively developed. Upcoming features include:

-   **Remote Sources**: Import files from GitHub, npm packages, and other remote sources
-   **Folder with dots in their names**: This is a known issue

Want to contribute? Check the [issues](https://github.com/filearchitect/filearchitect/issues) for opportunities!
