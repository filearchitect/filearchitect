# File Architect

A monorepo containing tools and packages for creating file and directory structures from text descriptions.

## Packages

- [file-architect-core](packages/file-architect-core/README.md) - The core library and CLI tool
- [browser-demo](examples/browser-demo/README.md) - A web-based demo showing how to use the library in a browser

## Development

```bash
# Install dependencies
pnpm install

# Run tests
pnpm test

# Build all packages
pnpm build

# Run development mode (watches all packages)
pnpm dev

# Run the browser demo
pnpm demo

# Use the CLI
pnpm cli create structure.txt output-dir
```

## Project Structure

```
file-architect/
├── packages/
│   └── file-architect-core/     # The main package
│       ├── src/                 # Source code
│       ├── dist/                # Compiled code
│       └── README.md            # Package documentation
├── examples/
│   └── browser-demo/           # Browser demo
│       ├── index.html          # Demo interface
│       ├── server.js           # Demo server
│       └── README.md           # Demo documentation
└── README.md                   # This file
```

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
