# File Architect Core

File Architect is a CLI and library that helps you create a file structure from a text file. It supports creating files and directories, copying existing files, and moving files with a simple, intuitive syntax.

Don't want to use code? There is also a mac app available at [filearchitect.com](https://filearchitect.com).

Learn more about the syntax [here](https://filearchitect.com/docs).

## Features

- 📝 Create files and directories from a text description
- 📋 Copy existing files and directories
- ✂️ Move files and directories
- 🔄 Rename files during copy/move operations
- 🌳 Support for nested structures with indentation
- 🔍 Preview mode to visualize structure before creating
- ✅ Syntax validation
- ⚠️ Graceful error handling with warnings
- 🔄 Works with both absolute and relative paths
- 🏠 Supports ~ for home directory paths

## Installation

```bash
# Global installation (recommended for CLI usage)
npm install -g file-architect-core

# Local installation (for using as a library)
npm install file-architect-core
```

## Quick Syntax Guide

| Syntax                                      | Action                   | Example                                                                                  | Description                            |
| ------------------------------------------- | ------------------------ | ---------------------------------------------------------------------------------------- | -------------------------------------- |
| Plain text                                  | Creates a folder         | `project`                                                                                | Creates a directory named "project"    |
| Text with extension                         | Creates a file           | `index.js`                                                                               | Creates an empty file named "index.js" |
| Bracketed file path                         | Copies existing file     | `[/Users/You/logo.png]`                                                                  | Copies the file at the specified path  |
| Bracketed file path with name replacement   | Copies and renames file  | `[/Users/You/logo.png] > new-logo.png`                                                   | Copies and renames the file            |
| Bracketed folder path                       | Copies entire folder     | `[path/to/folder]`                                                                       | Copies the entire directory            |
| Parentheses file path                       | Moves existing file      | `(/Users/You/logo.png)`                                                                  | Moves the file to the current location |
| Parentheses file path with name replacement | Moves existing file      | `(/Users/You/logo.png) > new-logo.png`                                                   | Moves and renames the file             |
| Tab indentation                             | Creates nested structure | parent<div class="border-l-2  border-gray-300" style="padding: 0 0 0 .8rem;">child</div> | Creates nested directories/files       |

### Path Resolution

File Architect supports several ways to specify paths:

- Absolute paths: `/Users/you/file.txt`
- Relative paths: `./file.txt` or `../file.txt`
- Home directory paths: `~/file.txt` (expands to your home directory)

For example:

```bash
# Using home directory path
[~/Documents/logo.png] > assets/logo.png

# Using absolute path
[/Users/you/Documents/logo.png] > assets/logo.png

# Using relative path
[./logo.png] > assets/logo.png
```

## CLI Usage

```bash
# Create structure from a file
file-architect create structure.txt [output-dir]

# Create structure from stdin
echo "project\n  src\n    index.js" | file-architect create - [output-dir]

# Preview structure without creating files
file-architect preview structure.txt

# Validate structure syntax
file-architect validate structure.txt

# Show help information
file-architect help

# Show version information
file-architect version
```

### CLI Commands

- `create <file> [output-dir]` - Create file structure from a file
- `preview <file>` - Preview file structure without creating files
- `validate <file>` - Validate structure syntax
- `help` - Show help information
- `version` - Show version information

## Library Usage

```typescript
import { createStructureFromString } from "file-architect-core";

// Create structure from a string
const structure = `
project
  src
    index.js
    components
      Button.tsx
      [/path/to/existing/Component.tsx]
  tests
    index.test.js
  assets
    (path/to/existing/logo.png) > logo.png
`;

// Create the structure in the specified directory
createStructureFromString(structure, "./output");
```

## Error Handling

File Architect is designed to be resilient and user-friendly:

- If a source file for copy/move doesn't exist, it creates an empty file and logs a warning
- If a destination already exists, it's overwritten
- Invalid lines in the structure file are ignored with warnings
- Syntax errors are reported with clear error messages

## Development

```bash
# Install dependencies
npm install

# Run in development mode with watch
npm run dev

# Run tests
npm test

# Build for production
npm run build
```

## Contributing

We welcome contributions! Here's how you can help:

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

Please make sure to:

- Update tests as appropriate
- Follow the existing code style
- Update documentation if needed
- Add comments for complex logic

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Support

- Website: [filearchitect.com](https://filearchitect.com)
- Documentation: [filearchitect.com/docs](https://filearchitect.com/docs)
- Issues: [GitHub Issues](https://github.com/yourusername/file-architect-core/issues)

## Changelog

See [CHANGELOG.md](./CHANGELOG.md) for a list of changes.

## Security

If you discover any security-related issues, please email security@filearchitect.com instead of using the issue tracker.
