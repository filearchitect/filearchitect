import { getBasename, getStructure } from "@filearchitect/core";
import { File, Folder } from "lucide-react";
import React, { useEffect, useState } from "react";
import { Textarea } from "./components/ui/textarea";
// We might need a Button component from Shadcn later, for now use standard HTML button

// Define type for the operation (adjust based on actual structure if different)
interface StructureOperation {
  type: string;
  targetPath: string;
  sourcePath?: string;
  isDirectory: boolean;
  depth: number;
  // Add other properties if needed
}

const initialStructure = `
src
	components
		Button.tsx
		Input.tsx
	styles
		global.css
	utils
		api.ts
		helpers.ts
	types
		index.d.ts
`.trim();

function App() {
  const [structure, setStructure] = useState<string>(initialStructure);
  const [previewOperations, setPreviewOperations] = useState<
    StructureOperation[]
  >([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const updatePreview = async () => {
      console.log("useEffect triggered. Structure:", structure);
      setError(null);
      try {
        // Assuming getStructure resolves to { operations: StructureOperation[], options: any }
        const result = await getStructure(structure, {});
        console.log("getStructure async result:", result);

        // Validate result structure before setting state
        if (result && Array.isArray(result.operations)) {
          setPreviewOperations(result.operations);
          setError(null);
        } else {
          console.error(
            "Unexpected result structure from getStructure:",
            result
          );
          setError("Error: Invalid data format received for preview.");
          setPreviewOperations([]); // Clear preview on invalid data
        }
      } catch (err: any) {
        console.error("Error in getStructure:", err);
        setError(`Error parsing structure: ${err.message}`);
        setPreviewOperations([]); // Clear preview on error
      }
    };

    updatePreview();
  }, [structure]);

  return (
    <div className="max-w-6xl mx-auto p-5 font-sans">
      <h1 className="text-2xl font-bold mb-6 text-center">
        FileArchitect Browser Demo
      </h1>

      {/* Two-column layout */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Column 1: Input */}
        <div>
          <h2 className="text-xl font-semibold mb-2">Enter File Structure</h2>
          <p className="text-sm text-gray-600 mb-3">
            Use tabs for indentation. Directories are created without
            extensions, files with extensions. Use{" "}
            <code>[source] &gt; target</code> for copies and{" "}
            <code>(source) &gt; target</code> for moves.
          </p>
          <Textarea
            value={structure}
            onChange={(e) => setStructure(e.target.value)}
            placeholder="Define your file structure here..."
            className="min-h-[400px] font-mono text-sm mb-4 w-full"
          />
          {/* Removed Preview Button */}
        </div>

        {/* Column 2: Output */}
        <div>
          <h2 className="text-xl font-semibold mb-2">Live Preview</h2>
          {error && (
            <pre className="bg-red-100 text-red-700 p-4 rounded mb-4 whitespace-pre-wrap break-words">
              {error}
            </pre>
          )}
          <div className="bg-gray-100 p-4 rounded min-h-[400px] font-mono text-sm overflow-auto">
            {previewOperations.length > 0 ? (
              previewOperations.map((op) => (
                <div
                  key={op.targetPath}
                  className="flex items-center mb-1"
                  style={{ paddingLeft: `${op.depth * 1.5}rem` }}
                >
                  {op.isDirectory ? (
                    <Folder className="w-4 h-4 mr-2 text-blue-600 flex-shrink-0" />
                  ) : (
                    <File className="w-4 h-4 mr-2 text-gray-600 flex-shrink-0" />
                  )}
                  <span className="break-all">
                    {getBasename(op.targetPath)}
                  </span>
                </div>
              ))
            ) : (
              <span className="text-gray-500">
                {error
                  ? "Fix errors to see preview"
                  : "Preview will appear here..."}
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
