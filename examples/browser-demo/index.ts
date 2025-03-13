import { BrowserFileSystem } from "@filearchitect/core/browser";
import JSZip from "jszip";

interface FileNode {
  name: string;
  type: "file";
}

interface FolderNode {
  name: string;
  type: "folder";
  children: (FileNode | FolderNode)[];
}

type Node = FileNode | FolderNode;

const structureTextarea = document.getElementById(
  "structure"
) as HTMLTextAreaElement;
const createButton = document.getElementById("create") as HTMLButtonElement;
const testButton = document.getElementById("test") as HTMLButtonElement;
const downloadButton = document.getElementById("download") as HTMLButtonElement;
const output = document.getElementById("output") as HTMLPreElement;

// Initialize filesystem
const fs = new BrowserFileSystem();

async function ensureOutputDir() {
  try {
    await fs.mkdir("output", { recursive: true });
  } catch (error) {
    console.error("Failed to create output directory:", error);
  }
}

async function createStructure(node: Node, parentPath: string): Promise<void> {
  const nodePath = parentPath ? `${parentPath}/${node.name}` : node.name;
  const fullPath = `output/${nodePath}`;

  if (node.type === "file") {
    // Ensure the parent directory exists first
    const parentDir = `output/${parentPath}`;
    await fs.mkdir(parentDir, { recursive: true });

    // Add appropriate default content based on file type
    let content = "";
    if (node.name.endsWith(".tsx")) {
      content = `import React from 'react';\n\nexport const ${node.name.replace(
        ".tsx",
        ""
      )} = () => {\n  return (\n    <div>\n      {/* Add your component content here */}\n    </div>\n  );\n};\n`;
    } else if (node.name.endsWith(".ts")) {
      content = `// Add your TypeScript code here\n`;
    } else if (node.name.endsWith(".css")) {
      content = `/* Add your styles here */\n`;
    } else if (node.name.endsWith(".d.ts")) {
      content = `// Add your type definitions here\n`;
    }

    // Write the file with its content
    await fs.writeFile(fullPath, content);
    console.log(`Created file: ${fullPath}`);
  } else {
    // Create the directory
    await fs.mkdir(fullPath, { recursive: true });
    console.log(`Created directory: ${fullPath}`);

    // Process all children
    for (const child of node.children) {
      await createStructure(child, nodePath);
    }
  }
}

async function displayStructure(): Promise<string[]> {
  let result = "Created structure:\n\n";
  const allFiles: string[] = [];

  // List actual files from memory
  async function listFiles(dir: string): Promise<string[]> {
    const entries = await fs.readdir(dir);
    const result: string[] = [];

    for (const entry of entries) {
      const fullPath = `${dir}/${entry.name}`;
      const relativePath = fullPath.replace(/^output\//, "");
      const stat = await fs.stat(fullPath);

      if (stat.isDirectory()) {
        // Add the directory path itself
        result.push(`📁 ${relativePath}/`);
        // Get nested files and add them with proper indentation
        const nestedFiles = await listFiles(fullPath);
        result.push(...nestedFiles.map((file) => file));
      } else {
        result.push(`📄 ${relativePath}`);
        allFiles.push(fullPath);
      }
    }

    return result;
  }

  const files = await listFiles("output");
  // Sort files to ensure consistent order and proper nesting
  const sortedFiles = files.sort((a, b) => {
    const aPath = a.replace(/^[📁📄]\s+/, "");
    const bPath = b.replace(/^[📁📄]\s+/, "");
    return aPath.localeCompare(bPath);
  });

  result += sortedFiles.join("\n");
  output.textContent = result;
  return allFiles;
}

async function createAndDownloadZip(files: string[]) {
  const zip = new JSZip();

  // Add all files to the zip
  for (const file of files) {
    const content = await fs.readFile(file);
    const relativePath = file.replace(/^output\//, "");

    // Create folder structure
    const pathParts = relativePath.split("/");
    let currentPath = "";

    // Create each folder in the path
    for (let i = 0; i < pathParts.length - 1; i++) {
      currentPath += (currentPath ? "/" : "") + pathParts[i];
      if (!zip.folder(currentPath)) {
        zip.folder(currentPath);
      }
    }

    // Add the file with its full path
    zip.file(relativePath, content);
  }

  // Generate the zip file
  const blob = await zip.generateAsync({ type: "blob" });

  // Create download link and trigger download
  const downloadUrl = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = downloadUrl;
  link.download = "file-structure.zip";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(downloadUrl);
}

createButton.addEventListener("click", async () => {
  try {
    const structure = structureTextarea.value;

    // Clear previous output
    output.textContent = "Creating structure...\n\n";

    // Ensure output directory exists
    await ensureOutputDir();

    // Parse the indented structure
    const lines = structure.split("\n").filter((line) => line.trim());
    const root: FolderNode = { name: "root", type: "folder", children: [] };
    const stack: Array<{ node: FolderNode; indent: number }> = [
      { node: root, indent: -1 },
    ];

    for (const line of lines) {
      const indent = line.search(/\S/);
      if (indent === -1) continue;

      const name = line.trim();
      const isFile = name.includes("."); // Check for file extension
      const node: Node = isFile
        ? { name, type: "file" }
        : { name, type: "folder", children: [] };

      // Find the appropriate parent based on indentation
      while (stack.length > 1 && stack[stack.length - 1].indent >= indent) {
        stack.pop();
      }

      const parent = stack[stack.length - 1].node;
      parent.children.push(node);

      if (!isFile) {
        stack.push({ node: node as FolderNode, indent });
      }
    }

    // Create the structure
    for (const child of root.children) {
      await createStructure(child, "");
    }

    // Display the structure and store file list for download
    const files = await displayStructure();

    // Enable download button
    downloadButton.onclick = () => createAndDownloadZip(files);
    downloadButton.disabled = false;
  } catch (error) {
    if (error instanceof Error) {
      output.textContent = `Error: ${error.message}`;
      console.error(error);
    } else {
      output.textContent = "An unknown error occurred";
      console.error(error);
    }
  }
});

// Initially disable download button
downloadButton.disabled = true;

// Run tests when test button is clicked
testButton.addEventListener("click", async () => {
  output.textContent = "Running tests...\n";

  try {
    // Test basic file operations
    output.textContent += "\nTesting basic file operations...";
    await fs.writeFile("test.txt", "Hello, World!");
    const content = await fs.readFile("test.txt");
    if (content !== "Hello, World!")
      throw new Error("File content doesn't match");
    if (!(await fs.exists("test.txt"))) throw new Error("File doesn't exist");

    // Test directory operations
    output.textContent += "\nTesting directory operations...";
    await fs.mkdir("src", { recursive: true });
    await fs.mkdir("src/components", { recursive: true });
    if (!(await fs.isDirectory("src")))
      throw new Error("src is not a directory");
    if (!(await fs.isDirectory("src/components")))
      throw new Error("src/components is not a directory");

    // Test nested file creation
    output.textContent += "\nTesting nested file creation...";
    await fs.writeFile("src/index.ts", "// Entry point");
    await fs.writeFile("src/components/Button.tsx", "// Button component");
    if (!(await fs.exists("src/index.ts")))
      throw new Error("Nested file doesn't exist");
    if (!(await fs.exists("src/components/Button.tsx")))
      throw new Error("Deeply nested file doesn't exist");

    // Display final structure
    output.textContent += "\n\nFinal structure:\n";
    await displayStructure();
    output.textContent += "\nAll tests passed! ✅";
  } catch (error) {
    if (error instanceof Error) {
      output.textContent += `\n\nTest failed: ${error.message} ❌`;
      console.error(error);
    } else {
      output.textContent += "\n\nAn unknown error occurred ❌";
      console.error(error);
    }
  }
});
