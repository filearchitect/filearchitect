File Architect is a CLI and library that helps you create a file structure from a text file.

Don't want to use code? There is also a mac app available at [filearchitect.com](https://filearchitect.com).

Learn more about the syntax [here](https://filearchitect.com/docs).

## Installation

```bash
npm install -g file-architect-core
```

## Development

```bash
npm install
```

```bash
npm run dev
```

## Quick syntax guide

| Syntax                                      | Action                   | Example                                                                                  |
| ------------------------------------------- | ------------------------ | ---------------------------------------------------------------------------------------- |
| Plain text                                  | Creates a folder         | `project`                                                                                |
| Text with extension                         | Creates a file           | `index.js`                                                                               |
| Bracketed file path                         | Copies existing file     | `[/Users/You/logo.png]`                                                                  |
| Bracketed file path with name replacement   | Copies and renames file  | `[/Users/You/logo.png] > new-logo.png`                                                   |
| Bracketed folder path                       | Copies entire folder     | `[path/to/folder]`                                                                       |
| Parentheses file path                       | Moves existing file      | `(/Users/You/logo.png)`                                                                  |
| Parentheses file path with name replacement | Moves existing file      | `(/Users/You/logo.png) > new-logo.png`                                                   |
| Tab indentation                             | Creates nested structure | parent<div class="border-l-2  border-gray-300" style="padding: 0 0 0 .8rem;">child</div> |

## Usage Examples

### Using the CLI

```bash
# Create structure from a file
file-architect create structure.txt

# Create structure from stdin
echo "project\n  src\n    index.js" | file-architect create -

# Preview structure without creating files
file-architect preview structure.txt
```

### Using as a Library

```typescript
import { createStructure } from "file-architect-core";

// Create structure from a string
const structure = `
project
  src
    index.js
  tests
    index.test.js
`;

await createStructure(structure, "./output");
```

## CLI Commands

- `create <file>` - Create file structure from a file
- `preview <file>` - Preview file structure without creating files
- `help` - Show help information
- `version` - Show version information

## Contributing

We welcome contributions! Here's how you can help:

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

Please make sure to update tests as appropriate and follow the existing code style.

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Support

- Website: [filearchitect.com](https://filearchitect.com)
- Documentation: [filearchitect.com/docs](https://filearchitect.com/docs)
- Issues: [GitHub Issues](https://github.com/yourusername/file-architect-core/issues)
