import {
  BrowserFileSystem,
  createStructure,
  ZipArchiver,
  type StructureOperation,
} from "@filearchitect/core";
import React, { useCallback, useState } from "react";
import ReactDOM from "react-dom/client";
import { StructureEditor } from "./components/StructureEditor";
import "./index.css";

const rootElement = document.getElementById("root");
if (!rootElement) {
  throw new Error("Failed to find the root element");
}

const initialStructure = `
src
\tcomponents
\t\tButton.tsx
\t\tInput.tsx
\tstyles
\t\tglobal.css
\tutils
\t\tapi.ts
\t\thelpers.ts
\ttypes
\t\tindex.d.ts
`.trim();

function App() {
  const [structure, setStructure] = useState<string>(initialStructure);
  const [previewOperations, setPreviewOperations] = useState<
    StructureOperation[]
  >([]);
  const [error, setError] = useState<string | null>(null);
  const [isDownloading, setIsDownloading] = useState(false);

  const handleDownloadZip = useCallback(async () => {
    if (!structure.trim()) {
      alert("Please define a file structure first.");
      return;
    }
    setIsDownloading(true);
    setError(null);
    try {
      const inMemoryFs = new BrowserFileSystem();
      await createStructure(structure, {
        fs: inMemoryFs,
        rootDir: "/",
      });

      const archiver = new ZipArchiver({ fs: inMemoryFs, relativeTo: "/" });

      const directories = Array.from(inMemoryFs.getDirectories());
      for (const dir of directories) {
        if (dir === "" || dir === "/") continue;
        await archiver.addDirectory(dir);
      }

      const files = Array.from(inMemoryFs.getFiles().entries());
      for (const [path, content] of files) {
        await archiver.addFile(path, content);
      }

      const zipOutput = await archiver.generate("blob");

      const url = URL.createObjectURL(zipOutput.data as Blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "file-structure.zip";
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (e: any) {
      console.error("Error creating ZIP:", e);
      setError(`Error creating ZIP: ${e.message}`);
    } finally {
      setIsDownloading(false);
    }
  }, [structure]);

  return (
    <div className="h-screen flex flex-col py-16">
      <div className="max-w-6xl mx-auto w-full flex-1 flex flex-col">
        <div className="bg-gray-50 p-4 rounded-lg mb-4 border border-gray-200">
          <h2 className="text-xl font-semibold mb-2">Enter File Structure</h2>
          <p className="text-sm text-gray-600 mb-3">
            Use tabs for indentation. Directories are created without
            extensions, files with extensions. Use{" "}
            <code>[source] &gt; target</code> for copies and{" "}
            <code>(source) &gt; target</code> for moves.
          </p>
        </div>
        <div className="flex-1 my-8">
          <StructureEditor
            structure={structure}
            onStructureChange={setStructure}
            previewOperations={previewOperations}
            onPreviewOperationsChange={setPreviewOperations}
            error={error}
            onErrorChange={setError}
          />
        </div>
        <div className="flex justify-end">
          <button
            onClick={handleDownloadZip}
            disabled={isDownloading}
            className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded disabled:opacity-50"
          >
            {isDownloading ? "Downloading..." : "Download ZIP"}
          </button>
        </div>
      </div>
    </div>
  );
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
