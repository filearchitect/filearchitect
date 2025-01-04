import { BrowserFileSystem } from "@filearchitect/core/browser";

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
    await fs.mkdir(`output/${parentPath}`, { recursive: true });
    await fs.writeFile(fullPath, "");
  } else {
    await fs.mkdir(fullPath, { recursive: true });
    for (const child of node.children) {
      await createStructure(child, nodePath);
    }
  }
}

async function displayStructure(): Promise<void> {
  let result = "Created structure:\n\n";

  // List actual files from memory
  async function listFiles(dir: string): Promise<string[]> {
    const entries = await fs.readdir(dir);
    const result: string[] = [];

    for (const entry of entries) {
      const fullPath = `${dir}/${entry.name}`;
      const relativePath = fullPath.replace(/^output\//, "");
      const stat = await fs.stat(fullPath);

      if (stat.isDirectory()) {
        result.push(`📁 ${relativePath}`);
        result.push(...(await listFiles(fullPath)));
      } else {
        result.push(`📄 ${relativePath}`);
      }
    }

    return result;
  }

  const files = await listFiles("output");
  result += files.sort().join("\n");
  output.textContent = result;
}

createButton.addEventListener("click", async () => {
  try {
    const structure = structureTextarea.value;

    // Ensure output directory exists
    await ensureOutputDir();

    // Parse the indented structure
    const lines = structure.split("\n");
    const root: FolderNode = { name: "root", type: "folder", children: [] };
    const stack: Array<{ node: FolderNode; indent: number }> = [
      { node: root, indent: -1 },
    ];

    for (const line of lines) {
      const indent = line.search(/\S/);
      if (indent === -1) continue;

      const name = line.trim();
      const isFile = !name.endsWith("/");
      const node: Node = isFile
        ? { name, type: "file" }
        : { name: name.slice(0, -1), type: "folder", children: [] };

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

    // Display the structure
    await displayStructure();
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
