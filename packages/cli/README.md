# @filearchitect/cli

Command-line interface for File Architect - create file and directory structures from text descriptions.

## Installation

```bash
# Global installation
npm install -g @filearchitect/cli

# Local installation
npm install @filearchitect/cli
```

## Usage

```bash
# Create a directory structure from a file
filearchitect create structure.txt output

# Create a structure with verbose output
filearchitect create structure.txt output --verbose

# Validate a structure file
filearchitect validate structure.txt

# Show help
filearchitect --help

# Show version
filearchitect --version
```

## Structure File Format

```
# Simple directory structure
src/
  components/
    Button.tsx
    Card.tsx
  styles/
    global.css

# Copy files/directories
config/
  [~/configs/base.json] > base.json   # Copy file
  [~/templates/react/] > template/    # Copy directory

# Move files/directories
src/
  (~/old-project/components/) > components/  # Move directory
  (~/old-project/config.json) > config.json  # Move file
```

## Options

- `--verbose`: Show detailed output during creation
- `-h, --help`: Show help message
- `-v, --version`: Show version

## Local Development

1. Clone and navigate to the repository:

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

4. Use the CLI locally:

```bash
# Using the root package script
pnpm cli create structure.txt output

# Link globally
cd packages/cli
pnpm link --global
filearchitect create structure.txt output

# Run directly
node dist/cli.js create structure.txt output
```

## Related Packages

- [@filearchitect/core](https://www.npmjs.com/package/@filearchitect/core): Core library for programmatic usage
