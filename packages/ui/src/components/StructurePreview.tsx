import { getBasename } from "@filearchitect/core";
import { File, Folder } from "lucide-react";

// Define type for the operation (copied from FileArchitectPreview)
interface StructureOperation {
  type: string;
  targetPath: string;
  sourcePath?: string;
  isDirectory: boolean;
  depth: number;
}

interface StructurePreviewProps {
  operations: StructureOperation[];
  error: string | null;
}

export function StructurePreview({ operations, error }: StructurePreviewProps) {
  return (
    <div>
      <h2 className="text-xl font-semibold mb-2">Live Preview</h2>
      {error && (
        <pre className="bg-red-100 text-red-700 p-4 rounded mb-4 whitespace-pre-wrap break-words">
          {error}
        </pre>
      )}
      <div className="bg-gray-100 p-4 rounded min-h-[400px] font-mono text-sm overflow-auto">
        {operations.length > 0 ? (
          operations.map((op) => (
            <div
              key={op.targetPath}
              className="flex items-center mb-1"
              style={{ paddingLeft: `${op.depth * 1.5}rem` }} // Indentation based on depth
            >
              {op.isDirectory ? (
                <Folder className="w-4 h-4 mr-2 text-blue-600 flex-shrink-0" />
              ) : (
                <File className="w-4 h-4 mr-2 text-gray-600 flex-shrink-0" />
              )}
              <span className="break-all">{getBasename(op.targetPath)}</span>
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
  );
}
