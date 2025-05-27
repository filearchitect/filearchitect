import {
  BrowserFileSystem,
  getStructure,
  type GetStructureOptions,
  type StructureOperation,
} from "@filearchitect/core";
import { useEffect } from "react";
import { StructureInput } from "./StructureInput";
import { StructurePreview } from "./StructurePreview";

/**
 * Props for the StructureEditor component.
 */
export interface StructureEditorProps {
  /** The current structure definition string. */
  structure: string;
  /** Callback function invoked when the structure string changes. */
  onStructureChange: (newStructure: string) => void;
  /** Array of operations to be previewed, derived from the structure. */
  previewOperations: StructureOperation[];
  /** Callback function invoked when the preview operations change. */
  onPreviewOperationsChange: (operations: StructureOperation[]) => void;
  /** Current error message, if any. Null if no error. */
  error: string | null;
  /** Callback function invoked when an error occurs or is cleared. */
  onErrorChange: (error: string | null) => void;
  /** Optional maximum number of lines for the input. Input is not disabled, but new lines are prevented. */
  maxLines?: number;
  /** Optional flag to disable the input. */
  disabled?: boolean;
  /** Optional CSS class name to apply to the root element of the editor. */
  className?: string;
}

/**
 * `StructureEditor` is a component that orchestrates the text input for defining
 * a file/directory structure and a live preview of the operations that would be performed.
 * It handles parsing the input, generating preview operations, and displaying errors.
 */
export function StructureEditor({
  structure,
  onStructureChange,
  previewOperations,
  onPreviewOperationsChange,
  error,
  onErrorChange,
  maxLines,
  disabled,
  className,
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
    <div className={className}>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 font-sans">
        {/* StructureInput no longer needs to be wrapped in a relative div here */}
        <StructureInput
          value={structure}
          onStructureChange={onStructureChange}
          maxLines={maxLines}
          disabled={disabled}
        />

        {/* Column 2: Preview Component */}
        <div className="h-full overflow-y-auto">
          <StructurePreview operations={previewOperations} error={error} />
        </div>
      </div>
    </div>
  );
}
