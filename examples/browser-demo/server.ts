import { readFile } from "fs/promises";
import type { IncomingMessage, ServerResponse } from "http";
import { createServer } from "http";
import { dirname, extname, join } from "path";
import { fileURLToPath } from "url";
import {
  createStructureFromString,
  NodeFileSystem,
} from "../../packages/core/dist/index.js";

const __dirname = dirname(fileURLToPath(import.meta.url));

// MIME types for static files
const MIME_TYPES: Record<string, string> = {
  ".html": "text/html",
  ".js": "text/javascript",
  ".css": "text/css",
  ".json": "application/json",
  ".txt": "text/plain",
};

const server = createServer(
  async (req: IncomingMessage, res: ServerResponse) => {
    console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);

    // Enable CORS
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type");

    // Handle preflight requests
    if (req.method === "OPTIONS") {
      res.writeHead(204);
      res.end();
      return;
    }

    try {
      const url = new URL(req.url || "", `http://${req.headers.host}`);
      const pathname = decodeURIComponent(url.pathname);

      console.log(`Processing request for path: ${pathname}`);

      if (pathname === "/" || pathname === "/index.html") {
        console.log("Serving index.html");
        const content = await readFile(join(__dirname, "index.html"), "utf-8");
        res.writeHead(200, { "Content-Type": "text/html" });
        res.end(content);
      } else if (pathname === "/create") {
        console.log("Processing /create request");
        // Read the structure file
        const structurePath = join(__dirname, "structure.txt");
        console.log(`Reading structure from: ${structurePath}`);
        const structure = await readFile(structurePath, "utf-8");

        const outputDir = join(__dirname, "output");
        console.log(`Creating structure in: ${outputDir}`);

        // Create the structure using our package
        await createStructureFromString(structure, outputDir, {
          verbose: true,
          fs: new NodeFileSystem(),
        });

        console.log("Structure created successfully");
        res.writeHead(200, { "Content-Type": "application/json" });
        res.end(
          JSON.stringify({
            success: true,
            outputDir,
            message: "Structure created successfully",
          })
        );
      } else {
        // Try to serve static files
        try {
          const filePath = join(__dirname, pathname);
          console.log(`Attempting to serve static file: ${filePath}`);
          const content = await readFile(filePath);
          const ext = extname(filePath).toLowerCase();
          const contentType = MIME_TYPES[ext] || "application/octet-stream";

          res.writeHead(200, { "Content-Type": contentType });
          res.end(content);
        } catch (err) {
          console.log(`404 - File not found: ${pathname}`);
          res.writeHead(404, { "Content-Type": "application/json" });
          res.end(
            JSON.stringify({
              success: false,
              error: "Not found",
              path: pathname,
            })
          );
        }
      }
    } catch (error: any) {
      console.error("Server error:", error);
      res.writeHead(500, { "Content-Type": "application/json" });
      res.end(
        JSON.stringify({
          success: false,
          error: error.message,
          stack:
            process.env.NODE_ENV === "development" ? error.stack : undefined,
        })
      );
    }
  }
);

const port = 3456;
server.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
  console.log(`Current directory: ${__dirname}`);
});
