import fs from "fs";
import path from "path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { createStructureFromString } from "../src/index";

describe("createStructureFromString", () => {
  let tempDir: string;

  beforeEach(() => {
    // Create a temporary directory for testing
    tempDir = path.join(__dirname, "test-temp");
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir, { recursive: true });
    }
  });

  afterEach(() => {
    // Clean up the temporary directory after each test
    if (fs.existsSync(tempDir)) {
      fs.rmSync(tempDir, { recursive: true, force: true });
    }
  });

  it("creates a simple file and folder structure", () => {
    const structure = `
        Project2024
            Documents
                Contracts
                    PRJ_2024_001_ServiceAgreement.docx
        `;

    createStructureFromString(structure, tempDir);

    const expectedPaths = [
      path.join(tempDir, "Project2024"),
      path.join(tempDir, "Project2024", "Documents"),
      path.join(tempDir, "Project2024", "Documents", "Contracts"),
      path.join(
        tempDir,
        "Project2024",
        "Documents",
        "Contracts",
        "PRJ_2024_001_ServiceAgreement.docx"
      ),
    ];

    expectedPaths.forEach((filePath) => {
      expect(fs.existsSync(filePath)).toBe(true);
    });
  });

  it("handles file imports with renaming", () => {
    const sourceFile = path.join(tempDir, "source.docx");
    fs.writeFileSync(sourceFile, "Test content");

    const structure = `
        Project2024
            Documents
                ${sourceFile} > PRJ_2024_001_ServiceAgreement.docx
        `;

    createStructureFromString(structure, tempDir);

    const targetFile = path.join(
      tempDir,
      "Project2024",
      "Documents",
      "PRJ_2024_001_ServiceAgreement.docx"
    );

    expect(fs.existsSync(targetFile)).toBe(true);
    const content = fs.readFileSync(targetFile, "utf-8");
    expect(content).toBe("Test content");
  });

  it("handles folder imports", () => {
    const sourceFolder = path.join(tempDir, "source-folder");
    const sourceFile = path.join(sourceFolder, "test.txt");
    fs.mkdirSync(sourceFolder, { recursive: true });
    fs.writeFileSync(sourceFile, "Folder content");

    const structure = `
        Project2024
            [${sourceFolder}]
        `;

    createStructureFromString(structure, tempDir);

    const targetFile = path.join(
      tempDir,
      "Project2024",
      "source-folder",
      "test.txt"
    );

    expect(fs.existsSync(targetFile)).toBe(true);
    const content = fs.readFileSync(targetFile, "utf-8");
    expect(content).toBe("Folder content");
  });

  it("ignores invalid lines gracefully", () => {
    const structure = `
        Project2024
            InvalidLineWithoutTabs
            Documents
                Contracts
                    PRJ_2024_001_ServiceAgreement.docx
        `;

    createStructureFromString(structure, tempDir);

    const expectedFile = path.join(
      tempDir,
      "Project2024",
      "Documents",
      "Contracts",
      "PRJ_2024_001_ServiceAgreement.docx"
    );

    expect(fs.existsSync(expectedFile)).toBe(true);
  });

  it("handles bracketed file imports with and without renaming", () => {
    const sourceFile = path.join(tempDir, "source.txt");
    fs.writeFileSync(sourceFile, "Test content");

    const structure = `
        Project2024
            [${sourceFile}]
            Documents
                [${sourceFile}] > renamed.txt
        `;

    createStructureFromString(structure, tempDir);

    const copiedFile = path.join(tempDir, "Project2024", "source.txt");
    const renamedFile = path.join(
      tempDir,
      "Project2024",
      "Documents",
      "renamed.txt"
    );

    expect(fs.existsSync(copiedFile)).toBe(true);
    expect(fs.existsSync(renamedFile)).toBe(true);
    expect(fs.readFileSync(copiedFile, "utf-8")).toBe("Test content");
    expect(fs.readFileSync(renamedFile, "utf-8")).toBe("Test content");
  });

  it("handles bracketed file paths with spaces and special characters", () => {
    const sourceFile = path.join(tempDir, "test file.txt");
    fs.writeFileSync(sourceFile, "Test content");

    const structure = `
        Project2024
            [${sourceFile}] > renamed file.txt
        `;

    createStructureFromString(structure, tempDir);

    const renamedFile = path.join(tempDir, "Project2024", "renamed file.txt");

    expect(fs.existsSync(renamedFile)).toBe(true);
    expect(fs.readFileSync(renamedFile, "utf-8")).toBe("Test content");
  });

  it("handles bracketed file paths with absolute paths", () => {
    const sourceFile = path.join(tempDir, "absolute-path.txt");
    fs.writeFileSync(sourceFile, "Test content");

    const structure = `
        Project2024
            [${sourceFile}] > renamed.txt
            [${sourceFile}]
        `;

    createStructureFromString(structure, tempDir);

    const renamedFile = path.join(tempDir, "Project2024", "renamed.txt");
    const copiedFile = path.join(tempDir, "Project2024", "absolute-path.txt");

    expect(fs.existsSync(renamedFile)).toBe(true);
    expect(fs.existsSync(copiedFile)).toBe(true);
    expect(fs.readFileSync(renamedFile, "utf-8")).toBe("Test content");
    expect(fs.readFileSync(copiedFile, "utf-8")).toBe("Test content");
  });

  it("handles bracketed file paths with special characters in source path", () => {
    const sourceFile = path.join(tempDir, "[test] file.txt");
    fs.writeFileSync(sourceFile, "Test content");

    const structure = `
        Project2024
            [${sourceFile}] > renamed.txt
        `;

    createStructureFromString(structure, tempDir);

    const renamedFile = path.join(tempDir, "Project2024", "renamed.txt");

    expect(fs.existsSync(renamedFile)).toBe(true);
    expect(fs.readFileSync(renamedFile, "utf-8")).toBe("Test content");
  });

  it("handles tab indentation", () => {
    const sourceFile = path.join(tempDir, "test.txt");
    fs.writeFileSync(sourceFile, "Test content");

    const structure = `Project2024
\t[${sourceFile}] > renamed.txt
\t\tDocuments
\t\t\tContracts`;

    createStructureFromString(structure, tempDir);

    const renamedFile = path.join(tempDir, "Project2024", "renamed.txt");
    const contractsDir = path.join(
      tempDir,
      "Project2024",
      "Documents",
      "Contracts"
    );

    expect(fs.existsSync(renamedFile)).toBe(true);
    expect(fs.existsSync(contractsDir)).toBe(true);
    expect(fs.readFileSync(renamedFile, "utf-8")).toBe("Test content");
  });

  it("handles missing files with clean error messages", () => {
    const nonExistentFile = path.join(tempDir, "does-not-exist.txt");

    const structure = `Project2024
\t[${nonExistentFile}] > renamed.txt`;

    expect(() => createStructureFromString(structure, tempDir)).toThrow(
      `Error processing file "${nonExistentFile}": ENOENT: no such file or directory`
    );
  });

  it("handles moving files with parentheses", () => {
    const sourceFile = path.join(tempDir, "source.txt");
    fs.writeFileSync(sourceFile, "Move me");
    // Create a second source file for the second move
    const sourceFile2 = path.join(tempDir, "source2.txt");
    fs.writeFileSync(sourceFile2, "Move me too");

    const structure = `
        Project2024
            (${sourceFile})
            Documents
                (${sourceFile2}) > renamed.txt
        `;

    createStructureFromString(structure, tempDir);

    const movedFile = path.join(tempDir, "Project2024", "source.txt");
    const renamedFile = path.join(
      tempDir,
      "Project2024",
      "Documents",
      "renamed.txt"
    );

    // Original files should not exist anymore
    expect(fs.existsSync(sourceFile)).toBe(false);
    expect(fs.existsSync(sourceFile2)).toBe(false);
    // Files should be moved to new locations
    expect(fs.existsSync(movedFile)).toBe(true);
    expect(fs.existsSync(renamedFile)).toBe(true);
    // Content should be preserved
    expect(fs.readFileSync(movedFile, "utf-8")).toBe("Move me");
    expect(fs.readFileSync(renamedFile, "utf-8")).toBe("Move me too");
  });

  it("handles moving directories with parentheses", () => {
    const sourceDir = path.join(tempDir, "source-dir");
    const sourceDir2 = path.join(tempDir, "source-dir2");
    const sourceFile = path.join(sourceDir, "test.txt");
    const sourceFile2 = path.join(sourceDir2, "test.txt");

    fs.mkdirSync(sourceDir, { recursive: true });
    fs.mkdirSync(sourceDir2, { recursive: true });
    fs.writeFileSync(sourceFile, "Move me");
    fs.writeFileSync(sourceFile2, "Move me too");

    const structure = `
        Project2024
            (${sourceDir})
            Documents
                (${sourceDir2}) > renamed-dir
        `;

    createStructureFromString(structure, tempDir);

    const movedDir = path.join(tempDir, "Project2024", "source-dir");
    const renamedDir = path.join(
      tempDir,
      "Project2024",
      "Documents",
      "renamed-dir"
    );
    const movedFile = path.join(movedDir, "test.txt");
    const renamedFile = path.join(renamedDir, "test.txt");

    // Original directories should not exist anymore
    expect(fs.existsSync(sourceDir)).toBe(false);
    expect(fs.existsSync(sourceDir2)).toBe(false);
    // Directories should be moved to new locations
    expect(fs.existsSync(movedDir)).toBe(true);
    expect(fs.existsSync(renamedDir)).toBe(true);
    // Files inside should be preserved
    expect(fs.existsSync(movedFile)).toBe(true);
    expect(fs.existsSync(renamedFile)).toBe(true);
    expect(fs.readFileSync(movedFile, "utf-8")).toBe("Move me");
    expect(fs.readFileSync(renamedFile, "utf-8")).toBe("Move me too");
  });

  it("handles moving files with spaces and special characters", () => {
    const sourceFile = path.join(tempDir, "source file [1].txt");
    fs.writeFileSync(sourceFile, "Move me");

    const structure = `
        Project2024
            (${sourceFile}) > renamed file [1].txt
        `;

    createStructureFromString(structure, tempDir);

    const renamedFile = path.join(
      tempDir,
      "Project2024",
      "renamed file [1].txt"
    );

    // Original file should not exist anymore
    expect(fs.existsSync(sourceFile)).toBe(false);
    // File should be moved and renamed
    expect(fs.existsSync(renamedFile)).toBe(true);
    expect(fs.readFileSync(renamedFile, "utf-8")).toBe("Move me");
  });

  it("handles moving files to existing locations", () => {
    const sourceFile = path.join(tempDir, "source.txt");
    const existingFile = path.join(tempDir, "Project2024", "existing.txt");

    fs.writeFileSync(sourceFile, "Move me");
    fs.mkdirSync(path.join(tempDir, "Project2024"), { recursive: true });
    fs.writeFileSync(existingFile, "Existing content");

    const structure = `
        Project2024
            (${sourceFile}) > existing.txt
        `;

    createStructureFromString(structure, tempDir);

    // Original file should not exist anymore
    expect(fs.existsSync(sourceFile)).toBe(false);
    // Destination file should have new content
    expect(fs.existsSync(existingFile)).toBe(true);
    expect(fs.readFileSync(existingFile, "utf-8")).toBe("Move me");
  });

  it("handles errors when moving non-existent files", () => {
    const nonExistentFile = path.join(tempDir, "does-not-exist.txt");

    const structure = `
        Project2024
            (${nonExistentFile})
        `;

    expect(() => createStructureFromString(structure, tempDir)).toThrow(
      `Error moving file "${nonExistentFile}": ENOENT: no such file or directory`
    );
  });
});
