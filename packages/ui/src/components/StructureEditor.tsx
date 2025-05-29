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
  const placeholderText = `folder-name
	sub-folder
		file.js
	another-sub-folder
		document.docx`;

  const Quadrant = ({
    title,
    children,
  }: {
    title: string;
    children: React.ReactNode;
  }) => (
    <div className="p-2 border border-gray-100 dark:border-gray-700 rounded-md flex flex-col h-full">
      <h5 className="font-semibold text-sm mb-1.5 text-gray-700 dark:text-gray-300">
        {title}
      </h5>
      <div className="text-xs space-y-1 text-gray-600 dark:text-gray-400 flex-grow">
        {children}
      </div>
    </div>
  );

  const helpItems = [
    {
      title: "Nesting",
      content: (
        <>
          <p>
            <strong>Tabs</strong> indentation nest folders and files.
          </p>
          <p className="mt-3">
            <pre className="bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200 px-1 py-0.5 rounded font-mono">
              folder
              <br />| subfolder
            </pre>
          </p>
        </>
      ),
    },
    {
      title: "Folders",
      content: (
        <>
          <p>
            Names <strong>with no extensions</strong> are directories.
          </p>
          <p className="mt-3">
            <code className="bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200 px-1 py-0.5 rounded font-mono">
              my-folder
            </code>
          </p>
        </>
      ),
    },
    {
      title: "Files",
      content: (
        <>
          <p>
            Names <strong>with extensions</strong> are files.
          </p>
          <p className="mt-3">
            <code className="bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200 px-1 py-0.5 rounded font-mono">
              file.txt
            </code>
          </p>
        </>
      ),
    },
    {
      title: "Copy Operations",
      content: (
        <>
          <p>Use square brackets for the source.</p>
          <p className="mt-3">
            <code className="bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200 px-1 py-0.5 rounded font-mono">
              [source] &gt; target-copy
            </code>
          </p>
        </>
      ),
    },
    {
      title: "Move Operations",
      content: (
        <>
          <p>Use parentheses for the source.</p>
          <p className="mt-3">
            <code className="bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200 px-1 py-0.5 rounded font-mono">
              (source) &gt; target-move
            </code>
          </p>
        </>
      ),
    },
  ];

  const helpContent = (
    <div className="grid grid-cols-2 gap-3">
      {helpItems.map((item) => (
        <Quadrant key={item.title} title={item.title}>
          {item.content}
        </Quadrant>
      ))}
    </div>
  );

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
        <div>
          <StructureInput
            value={structure}
            onStructureChange={onStructureChange}
            maxLines={maxLines}
            disabled={disabled}
            placeholder={placeholderText}
            helpContent={helpContent}
          />
        </div>

        {/* Column 2: Preview Component */}
        <div className="h-full overflow-y-auto">
          <StructurePreview operations={previewOperations} error={error} />
        </div>
      </div>
    </div>
  );
}
