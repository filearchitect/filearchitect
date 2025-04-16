import { getStructure } from "@filearchitect/core";
import React, { useEffect, useState } from "react";
import { Textarea } from "./components/ui/textarea";
// We might need a Button component from Shadcn later, for now use standard HTML button

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
  const [output, setOutput] = useState<string>("");
  const [error, setError] = useState<string | null>(null);

  // useEffect for live preview update
  useEffect(() => {
    setError(null); // Clear previous errors on new input
    try {
      const result = getStructure(structure, {});
      setOutput(JSON.stringify(result, null, 2));
      setError(null); // Clear error if successful
    } catch (err: any) {
      // Don't clear output on error, show last valid output
      setError(`Error parsing structure: ${err.message}`);
      console.error(err);
    }
  }, [structure]); // Rerun effect when structure changes

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
          <pre className="bg-gray-100 p-4 rounded min-h-[400px] whitespace-pre-wrap break-words font-mono text-sm">
            {output ||
              (error
                ? "Fix errors to see preview"
                : "Preview will appear here...")}
          </pre>
        </div>
      </div>
    </div>
  );
}

export default App;
