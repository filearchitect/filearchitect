# File Architect

Create file and directory structures from simple text descriptions. Perfect for scaffolding projects, creating templates, and organizing files.

## Features

-   Create directory structures using a simple, indentation-based syntax
-   Copy files and directories from existing locations
-   Import (move) files from other projects
-   Available as both a CLI tool and a TypeScript/JavaScript library

## Quick Start

### Using the CLI

1. Install globally:

```bash
npm install -g @filearchitect/cli
```

2. Create a structure file (`structure.txt`):

```txt
src
    components
        Button.tsx
        Card.tsx
    styles
        global.css
```

3. Create the structure:

```bash
filearchitect create structure.txt my-project
```

### Using the Library

1. Install the package:

```bash
npm install @filearchitect/core
```

2. Use in your code:

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

await createStructure(structure, "./my-project");
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

Create a complete project structure with file creation, copying, and importing. Learn more on how the syntax works in the [docs](https://filearchitect.com/docs).

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

## CLI Usage

```bash
# Create a structure
filearchitect create structure.txt output

# Replace text in file names
filearchitect create structure.txt output --fileReplacements user:admin

# Replace text in folder names
filearchitect create structure.txt output --folderReplacements api:rest

# Validate without creating
filearchitect validate structure.txt
```

## Library Usage

```typescript
import { createStructure } from "@filearchitect/core";

// Create a structure
await createStructure(structureText, "./output");

// Replace names
await createStructure(structureText, "./output", {
    replaceInFiles: { user: "admin" },
    replaceInFolders: { api: "rest" },
});

// Validate only
await createStructure(structureText, "./output", {
    validate: true,
});
```

## Packages

-   [@filearchitect/cli](packages/cli/README.md): Command-line interface
-   [@filearchitect/core](packages/core/README.md): Core library for programmatic usage

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
