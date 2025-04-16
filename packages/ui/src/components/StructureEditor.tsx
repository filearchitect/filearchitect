import { getStructure } from "@filearchitect/core";
import { useEffect, useState } from "react";
import { StructureInput } from "./StructureInput";
import { StructurePreview } from "./StructurePreview";

// Define type for the operation (adjust based on actual structure if different)
// This should ideally be imported from @filearchitect/core if available
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

// Renamed to StructureEditor
// It orchestrates the editor and the output preview
export function StructureEditor() {
  const [structure, setStructure] = useState<string>(initialStructure);
  const [previewOperations, setPreviewOperations] = useState<
    StructureOperation[]
  >([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const updatePreview = async () => {
      setError(null);
      try {
        const result = await getStructure(structure, {});
        if (result && Array.isArray(result.operations)) {
          setPreviewOperations(result.operations);
          setError(null);
        } else {
          console.error(
            "Unexpected result structure from getStructure:",
            result
          );
          setError("Error: Invalid data format received for preview.");
          setPreviewOperations([]);
        }
      } catch (err: any) {
        console.error("Error in getStructure:", err);
        setError(`Error parsing structure: ${err.message}`);
        setPreviewOperations([]);
      }
    };
    updatePreview();
  }, [structure]);

  return (
    // Main grid layout remains
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 font-sans">
      {/* Column 1: Input Component */}
      <StructureInput
        value={structure}
        onStructureChange={setStructure} // Pass the setter directly
      />

      {/* Column 2: Preview Component */}
      <StructurePreview operations={previewOperations} error={error} />
    </div>
  );
}
