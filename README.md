# File Architect

Create file and directory structures from simple text descriptions. Perfect for scaffolding projects, creating templates, and organizing files.

## Features

- Create directory structures using a simple, indentation-based syntax
- Copy files and directories from existing locations
- Import (move) files from other projects
- Available as both a CLI tool and a TypeScript/JavaScript library
- Validate structures before creating them
- Replace file and folder names dynamically

## Quick Start

### Using the CLI

```bash
# Install globally
npm install -g @filearchitect/cli

# Create a structure file
echo "src
	components
		Button.tsx
		Card.tsx
	styles
		global.css" > structure.txt

# Create the structure
filearchitect create structure.txt my-project
```

### Using the Library

```bash
npm install @filearchitect/core
```

```typescript
import { createStructureFromString } from "@filearchitect/core";

const structure = `
src
	components
		Button.tsx
		Card.tsx
	styles
		global.css
`;

await createStructureFromString(structure, "./my-project");
```

## Complete Example

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

## CLI Usage

```bash
# Create a structure
filearchitect create structure.txt output

# Create with verbose output
filearchitect create structure.txt output --verbose

# Replace text in file names
filearchitect create structure.txt output --replace-file user:admin

# Replace text in folder names
filearchitect create structure.txt output --replace-folder api:rest

# Validate without creating
filearchitect validate structure.txt
```

## Library Usage

```typescript
import { createStructureFromString } from "@filearchitect/core";

// Create a structure
await createStructureFromString(structureText, "./output");

// Replace names
await createStructureFromString(structureText, "./output", {
  replaceInFiles: { user: "admin" },
  replaceInFolders: { api: "rest" },
});

// Validate only
await createStructureFromString(structureText, "./output", {
  validate: true,
});
```

## Packages

- [@filearchitect/cli](packages/cli/README.md): Command-line interface
- [@filearchitect/core](packages/core/README.md): Core library for programmatic usage

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
