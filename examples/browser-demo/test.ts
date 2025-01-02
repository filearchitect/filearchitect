import { BrowserFileSystem } from "@filearchitect/core/browser";

async function runTest() {
  const fs = new BrowserFileSystem();

  // Test basic file operations
  console.log("Testing basic file operations...");
  await fs.writeFile("test.txt", "Hello, World!");
  const content = await fs.readFile("test.txt");
  console.assert(content === "Hello, World!", "File content should match");
  console.assert(await fs.exists("test.txt"), "File should exist");

  // Test directory operations
  console.log("Testing directory operations...");
  await fs.mkdir("src", { recursive: true });
  await fs.mkdir("src/components", { recursive: true });
  console.assert(await fs.isDirectory("src"), "src should be a directory");
  console.assert(
    await fs.isDirectory("src/components"),
    "src/components should be a directory"
  );

  // Test nested file creation
  console.log("Testing nested file creation...");
  await fs.writeFile("src/index.ts", "// Entry point");
  await fs.writeFile("src/components/Button.tsx", "// Button component");
  console.assert(await fs.exists("src/index.ts"), "Nested file should exist");
  console.assert(
    await fs.exists("src/components/Button.tsx"),
    "Deeply nested file should exist"
  );

  // Test directory listing
  console.log("Testing directory listing...");
  const rootEntries = await fs.readdir("");
  console.assert(rootEntries.length === 2, "Root should have 2 entries");
  console.assert(
    rootEntries.some((e) => e.name === "src" && e.isDirectory()),
    "src directory should be listed"
  );
  console.assert(
    rootEntries.some((e) => e.name === "test.txt" && !e.isDirectory()),
    "test.txt file should be listed"
  );

  const srcEntries = await fs.readdir("src");
  console.assert(srcEntries.length === 2, "src should have 2 entries");
  console.assert(
    srcEntries.some((e) => e.name === "components" && e.isDirectory()),
    "components directory should be listed"
  );
  console.assert(
    srcEntries.some((e) => e.name === "index.ts" && !e.isDirectory()),
    "index.ts file should be listed"
  );

  // Test file moving
  console.log("Testing file moving...");
  await fs.move("test.txt", "src/test.txt");
  console.assert(
    !(await fs.exists("test.txt")),
    "Original file should not exist"
  );
  console.assert(await fs.exists("src/test.txt"), "Moved file should exist");

  // Test file copying
  console.log("Testing file copying...");
  await fs.copyFile("src/test.txt", "src/test-copy.txt");
  console.assert(
    await fs.exists("src/test.txt"),
    "Original file should still exist"
  );
  console.assert(
    await fs.exists("src/test-copy.txt"),
    "Copied file should exist"
  );

  // Test file deletion
  console.log("Testing file deletion...");
  await fs.unlink("src/test-copy.txt");
  console.assert(
    !(await fs.exists("src/test-copy.txt")),
    "Deleted file should not exist"
  );

  // Test recursive directory deletion
  console.log("Testing recursive directory deletion...");
  await fs.rm("src", { recursive: true });
  console.assert(
    !(await fs.exists("src")),
    "Deleted directory should not exist"
  );
  console.assert(
    !(await fs.exists("src/components")),
    "Nested directories should not exist"
  );
  console.assert(
    !(await fs.exists("src/index.ts")),
    "Nested files should not exist"
  );

  console.log("All tests passed!");
}

runTest().catch(console.error);
