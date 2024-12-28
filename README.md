# File Architect

Create file and directory structures from text descriptions.

## Packages

- [@filearchitect/core](packages/core/README.md): Core library for creating file structures
- [@filearchitect/cli](packages/cli/README.md): Command-line interface
- [Browser Demo](examples/browser-demo/README.md): Web-based demo application

## Development

This is a monorepo using pnpm workspaces. To get started:

```bash
# Install dependencies
pnpm install

# Build all packages
pnpm build

# Run tests
pnpm test

# Start the browser demo
pnpm demo

# Use the CLI locally
pnpm cli create structure.txt output-dir

# Development mode (watches all packages)
pnpm dev
```

### Local CLI Development

You can use the CLI locally in three ways:

1. Using the root package script:

```bash
pnpm cli create structure.txt output-dir
```

2. Link the CLI globally:

```bash
cd packages/cli
pnpm link --global
file-architect create structure.txt output-dir
```

3. Run directly from the CLI package:

```bash
cd packages/cli
node dist/cli.js create structure.txt output-dir
```
