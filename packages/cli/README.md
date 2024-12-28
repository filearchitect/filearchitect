# @filearchitect/cli

Command-line interface for File Architect - create file and directory structures from text descriptions.

## Installation

```bash
npm install -g @filearchitect/cli
```

## Usage

```bash
# Create a directory structure from a file
file-architect create structure.txt output-dir

# Create a structure from stdin
echo "folder1\n  file1.txt" | file-architect create - output-dir

# Validate a structure file
file-architect validate structure.txt

# Show help
file-architect --help
```

## Options

- `--verbose`: Show detailed output during creation
- `-h, --help`: Show help message
- `-v, --version`: Show version

## Related Packages

- [@filearchitect/core](https://www.npmjs.com/package/@filearchitect/core): Core library for programmatic usage
