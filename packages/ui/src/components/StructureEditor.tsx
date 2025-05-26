import {
  BrowserFileSystem,
  getStructure,
  type GetStructureOptions,
  type StructureOperation,
} from "@filearchitect/core";
import { useEffect } from "react";
import { StructureInput } from "./StructureInput";
import { StructurePreview } from "./StructurePreview";

// Define type for the operation (adjust based on actual structure if different)
// This should ideally be imported from @filearchitect/core if available
// interface StructureOperation { <--- Remove local definition
//   type: string;
//   targetPath: string;
//   sourcePath?: string;
//   isDirectory: boolean;
//   depth: number;
//   // Add other properties if needed
// }

interface StructureEditorProps {
  structure: string;
  onStructureChange: (newStructure: string) => void;
  previewOperations: StructureOperation[];
  onPreviewOperationsChange: (operations: StructureOperation[]) => void;
  error: string | null;
  onErrorChange: (error: string | null) => void;
}

// Renamed to StructureEditor
// It orchestrates the editor and the output preview
export function StructureEditor({
  structure,
  onStructureChange,
  previewOperations,
  onPreviewOperationsChange,
  error,
  onErrorChange,
}: StructureEditorProps) {
  useEffect(() => {
    const updatePreview = async () => {
      onErrorChange(null);
      try {
        const fs = new BrowserFileSystem();
        const options: GetStructureOptions = {
          fs,
          rootDir: "/",
        };
        const result = await getStructure(structure, options);
        if (result && Array.isArray(result.operations)) {
          onPreviewOperationsChange(result.operations);
          onErrorChange(null);
        } else {
          console.error(
            "Unexpected result structure from getStructure:",
            result
          );
          onErrorChange("Error: Invalid data format received for preview.");
          onPreviewOperationsChange([]);
        }
      } catch (err: any) {
        console.error("Error in getStructure:", err);
        onErrorChange(`Error parsing structure: ${err.message}`);
        onPreviewOperationsChange([]);
      }
    };
    updatePreview();
  }, [structure, onErrorChange, onPreviewOperationsChange]);

  return (
    // Main grid layout. Removed h-full from grid to allow content (specifically input) to define height.
    // Grid items in the same row will stretch to the height of the tallest item.
    <div className="">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 font-sans">
        {/* Column 1: Input Component */}
        {/* This column's height will be determined by StructureInput's content */}
        <StructureInput
          value={structure}
          onStructureChange={onStructureChange}
        />

        {/* Column 2: Preview Component */}
        {/* This div will take the height of the grid cell (which matches Column 1's height) */}
        {/* and provide scrolling for StructurePreview if its content is taller. */}
        <div className="h-full overflow-y-auto">
          <StructurePreview operations={previewOperations} error={error} />
        </div>
      </div>
    </div>
  );
}
