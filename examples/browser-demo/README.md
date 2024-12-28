# File Architect Browser Demo

A web-based demo showing how to use File Architect in a browser environment.

## Features

- Create files and directories through a web interface
- Handle filesystem operations via HTTP endpoints
- Demonstrate browser-specific filesystem adapter
- Show operation progress and results in real-time
- Handle errors gracefully

## Running the Demo

1. Install dependencies:

```bash
pnpm install
```

2. Start the server:

```bash
pnpm dev
```

3. Open http://localhost:3456 in your browser

## How it Works

The demo consists of:

1. A simple HTTP server (`server.js`) that:

   - Serves the HTML interface
   - Provides a bundled version of file-architect-core
   - Handles filesystem operations through HTTP endpoints
   - Serves static files and handles CORS

2. A web interface (`index.html`) that:
   - Provides a button to create a sample project structure
   - Shows the progress and results of file operations
   - Demonstrates error handling
   - Uses modern CSS for styling

## Implementation Details

The demo shows how to:

- Create a browser-friendly bundle of file-architect-core
- Implement filesystem operations over HTTP
- Handle file paths and operations in a web context
- Display operation progress and results to users
- Handle errors and provide feedback

## API Endpoints

The server provides these endpoints:

- `GET /fs/exists?path=...` - Check if a file exists
- `POST /fs/mkdir` - Create a directory
- `POST /fs/writeFile` - Write a file

All POST endpoints accept JSON payloads with the necessary parameters.

## Example Structure

The demo creates this structure:

```
test-project/
  ├── src/
  │   └── index.js
  └── README.md
```

## Development

```bash
# Install dependencies
pnpm install

# Start development server
pnpm dev

# Start production server
pnpm web
```

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
