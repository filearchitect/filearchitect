import React from "react";
import ReactDOM from "react-dom/client";
import { StructureEditor } from "./components/StructureEditor";
import "./index.css";

const rootElement = document.getElementById("root");
if (!rootElement) {
  throw new Error("Failed to find the root element");
}

const root = ReactDOM.createRoot(rootElement);

root.render(
  <React.StrictMode>
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
          <StructureEditor />
        </div>
      </div>
    </div>
  </React.StrictMode>
);
