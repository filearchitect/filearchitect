import { createStructureFromString } from "file-architect-core";

// Example: Custom filesystem that logs all operations
class LoggingFileSystem {
  constructor(realFs) {
    this.realFs = realFs;
  }

  async exists(path) {
    console.log("🔍 Checking existence:", path);
    return this.realFs.exists(path);
  }

  async mkdir(path, options) {
    console.log("📁 Creating directory:", path, options);
    return this.realFs.mkdir(path, options);
  }

  async writeFile(path, data) {
    console.log("📝 Writing file:", path, `(${data.length} bytes)`);
    return this.realFs.writeFile(path, data);
  }

  async readFile(path) {
    console.log("📖 Reading file:", path);
    return this.realFs.readFile(path);
  }

  async copyFile(src, dest) {
    console.log("📋 Copying file:", src, "→", dest);
    return this.realFs.copyFile(src, dest);
  }

  async stat(path) {
    console.log("📊 Getting stats:", path);
    return this.realFs.stat(path);
  }

  async readdir(path, options) {
    console.log("📂 Reading directory:", path);
    return this.realFs.readdir(path, options);
  }

  async rm(path, options) {
    console.log("🗑️  Removing:", path, options);
    return this.realFs.rm(path, options);
  }

  async unlink(path) {
    console.log("🗑️  Unlinking:", path);
    return this.realFs.unlink(path);
  }

  async rename(oldPath, newPath) {
    console.log("✏️  Renaming:", oldPath, "→", newPath);
    return this.realFs.rename(oldPath, newPath);
  }
}

// Example: Create a project structure with the logging filesystem
async function createProjectWithLogging() {
  const structure = `
    my-project
      src
        index.js
        utils
          helpers.js
      tests
        helpers.test.js
      [~/Desktop/example.json] > config.json
      (~/old-files/data.txt) > data/info.txt
  `;

  // Create the structure using our logging filesystem
  await createStructureFromString(structure, "./output", {
    verbose: true,
    fs: new LoggingFileSystem(new NodeFileSystem()),
  });

  console.log(
    "\n✨ Project created successfully with detailed operation logging!"
  );
}

// Run the demo
createProjectWithLogging().catch(console.error);
