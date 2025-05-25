import { type StructureOperation } from "@filearchitect/core";
import React, { useState } from "react";
import ReactDOM from "react-dom/client";
import { DownloadZipButton } from "./components/DownloadZipButton";
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
          <DownloadZipButton structure={structure} onError={setError} />
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
