# File Architect

<p align="center">
  <a href="https://filearchitect.com" target="_blank">Website</a> |
  <a href="https://filearchitect.com/docs" target="_blank">Documentation</a>
</p>

Create file and directory structures from simple text descriptions. Perfect for scaffolding projects, creating templates, and organizing files.

## Features

-   📁 Create directory structures using a simple, indentation-based syntax
-   📋 Copy files and directories from existing locations
-   🔄 Move (import) files from other projects
-   🔧 Replace file and folder names using patterns
-   🚀 Available as both a CLI tool and a TypeScript/JavaScript library
-   🌐 Works in both Node.js and browser environments
-   🔍 Validates operations before execution
-   ⚡ Supports YAML frontmatter for configuration

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
import { createStructure } from "@filearchitect/core";

// Basic usage with Node.js filesystem (default)
await createStructure(structureText, "./output");

// With replacements
await createStructure(structureText, "./output", {
    replacements: {
        files: [{ search: ".js", replace: ".ts" }],
        folders: [{ search: "api", replace: "rest" }],
    },
});

// Preview operations
const { operations } = await getStructure(structureText, {
    rootDir: "./output",
});
console.log(operations);
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
