import { mkdir, readFile, writeFile } from "fs/promises";
import { createServer } from "http";
import { dirname, join } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));

// Create a self-contained browser bundle
const createBrowserBundle = async () => {
  return `
    // Self-contained browser bundle
    (function(window) {
      class BrowserFileSystem {
        constructor(baseUrl = "/fs") {
          this.baseUrl = baseUrl;
        }

        async exists(path) {
          try {
            await fetch(\`\${this.baseUrl}/exists?path=\${encodeURIComponent(path)}\`);
            return true;
          } catch {
            return false;
          }
        }

        async mkdir(path, options) {
          await fetch(\`\${this.baseUrl}/mkdir\`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ path, options }),
          });
        }

        async writeFile(path, data) {
          await fetch(\`\${this.baseUrl}/writeFile\`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ path, data }),
          });
        }
      }

      async function createStructureFromString(input, rootDir, options = {}) {
        const { verbose = false, fs = new BrowserFileSystem() } = options;
        
        if (verbose) {
          console.log('Creating structure in:', rootDir);
        }

        // Create the root directory
        await fs.mkdir(rootDir, { recursive: true });

        const lines = input.split('\\n')
          .map(line => line.trim())
          .filter(line => line);

        for (const line of lines) {
          if (line.includes('>')) {
            const [content, path] = line.split('>').map(s => s.trim());
            const fullPath = \`\${rootDir}/\${path}\`;
            
            if (verbose) {
              console.log('Creating file:', fullPath);
            }

            if (content.startsWith('[') && content.endsWith(']')) {
              const fileContent = content.slice(1, -1);
              const dirPath = fullPath.split('/').slice(0, -1).join('/');
              await fs.mkdir(dirPath, { recursive: true });
              await fs.writeFile(fullPath, fileContent);
            }
          } else {
            const fullPath = \`\${rootDir}/\${line}\`;
            if (verbose) {
              console.log('Creating directory:', fullPath);
            }
            await fs.mkdir(fullPath, { recursive: true });
          }
        }

        if (verbose) {
          console.log('✨ Structure created successfully');
        }
      }

      // Export to window
      window.FileArchitect = {
        createStructureFromString,
        BrowserFileSystem
      };
    })(window);
  `;
};

const server = createServer(async (req, res) => {
  try {
    if (req.url === "/") {
      const content = await readFile(join(__dirname, "index.html"), "utf-8");
      res.writeHead(200, { "Content-Type": "text/html" });
      res.end(content);
    } else if (req.url === "/browser-bundle.js") {
      // Serve the bundled browser module
      const bundle = await createBrowserBundle();
      res.writeHead(200, {
        "Content-Type": "application/javascript; charset=utf-8",
      });
      res.end(bundle);
    } else if (req.url.startsWith("/fs/")) {
      // Handle filesystem operations
      const url = new URL(req.url, "http://localhost");

      if (req.method === "POST") {
        // Read the request body
        const chunks = [];
        for await (const chunk of req) {
          chunks.push(chunk);
        }
        const body = JSON.parse(Buffer.concat(chunks).toString());

        if (url.pathname === "/fs/mkdir") {
          await mkdir(body.path, body.options);
          res.writeHead(200);
          res.end("Directory created");
        } else if (url.pathname === "/fs/writeFile") {
          await writeFile(body.path, body.data);
          res.writeHead(200);
          res.end("File written");
        } else {
          res.writeHead(404);
          res.end("Not found");
        }
      } else if (req.method === "GET" && url.pathname === "/fs/exists") {
        const path = url.searchParams.get("path");
        try {
          await readFile(path);
          res.writeHead(200);
          res.end("File exists");
        } catch {
          res.writeHead(404);
          res.end("File not found");
        }
      } else {
        res.writeHead(405);
        res.end("Method not allowed");
      }
    } else {
      res.writeHead(404);
      res.end("Not found");
    }
  } catch (error) {
    console.error("Server error:", error);
    res.writeHead(500);
    res.end("Server error: " + error.message);
  }
});

// Try different ports if the default one is in use
const tryPort = (port) => {
  server
    .listen(port, () => {
      console.log(`Server running at http://localhost:${port}`);
    })
    .on("error", (err) => {
      if (err.code === "EADDRINUSE") {
        console.log(`Port ${port} is in use, trying ${port + 1}...`);
        tryPort(port + 1);
      } else {
        console.error("Server error:", err);
        process.exit(1);
      }
    });
};

// Start with port 3456
tryPort(3456);
