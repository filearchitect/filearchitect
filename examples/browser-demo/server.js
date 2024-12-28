import {
  createStructureFromString,
  NodeFileSystem,
} from "@file-architect/core";
import { readFile } from "fs/promises";
import { createServer } from "http";
import { dirname, join } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const fs = new NodeFileSystem();

const server = createServer(async (req, res) => {
  try {
    if (req.url === "/") {
      const content = await readFile(join(__dirname, "index.html"), "utf-8");
      res.writeHead(200, { "Content-Type": "text/html" });
      res.end(content);
    } else if (req.url === "/create") {
      // Read the structure file
      const structure = await readFile(
        join(__dirname, "structure.txt"),
        "utf-8"
      );
      const outputDir = join(__dirname, "output");

      // Create the structure using our package
      await createStructureFromString(structure, outputDir, {
        verbose: true,
        fs,
      });

      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ success: true, outputDir }));
    } else {
      res.writeHead(404);
      res.end("Not found");
    }
  } catch (error) {
    console.error("Server error:", error);
    res.writeHead(500);
    res.end(JSON.stringify({ error: error.message }));
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
