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

const initialStructure = ``.trim();

function App() {
  const [structure, setStructure] = useState<string>(initialStructure);
  const [previewOperations, setPreviewOperations] = useState<
    StructureOperation[]
  >([]);
  const [error, setError] = useState<string | null>(null);

  return (
    <div className="h-screen flex flex-col py-16">
      <div className="max-w-6xl  mx-auto w-full flex-1 flex flex-col">
        <StructureEditor
          structure={structure}
          onStructureChange={setStructure}
          previewOperations={previewOperations}
          onPreviewOperationsChange={setPreviewOperations}
          error={error}
          onErrorChange={setError}
          maxLines={10}
          supportCopy={true}
          supportMove={true}
        />
        <div className="flex justify-end mt-8">
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
