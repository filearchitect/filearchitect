import { getBasename, type StructureOperation } from "@filearchitect/core";
import { File, Folder } from "lucide-react";

// Define type for the operation (copied from FileArchitectPreview)
// interface StructureOperation { // <-- Remove local definition
//   type: string;
//   targetPath: string;
//   sourcePath?: string;
//   isDirectory: boolean;
//   depth: number;
// }

interface StructurePreviewProps {
  operations: StructureOperation[]; // Use imported StructureOperation
  error: string | null;
}

export function StructurePreview({ operations, error }: StructurePreviewProps) {
  return (
    <div className="h-full">
      {error && (
        <pre className="bg-red-100 text-red-700 p-4 rounded mb-4 whitespace-pre-wrap break-words">
          {error}
        </pre>
      )}
      <div className="bg-gray-50 border border-gray-200 p-4 rounded h-full font-mono text-sm overflow-auto">
        {operations.length > 0 ? (
          operations.map((op) => (
            <div
              key={op.targetPath}
              className="flex items-center mb-1"
              style={{ minHeight: "20px", lineHeight: "20px" }}
            >
              {/* Pale tab indicators */}
              {Array.from({ length: op.depth }).map((_, i) => (
                <span
                  key={i}
                  style={{
                    display: "inline-block",
                    width: "1ch",
                    marginLeft: ".5ch",
                    marginRight: "1ch",
                    textAlign: "center",
                    color: "rgba(0,0,0,0.08)",
                    fontWeight: 300,
                  }}
                  aria-hidden="true"
                >
                  |
                </span>
              ))}
              {op.isDirectory ? (
                <Folder
                  className="w-4.5 h-4.5 mr-2 flex-shrink-0"
                  style={{ minWidth: 18, minHeight: 18 }}
                />
              ) : (
                <File
                  className="w-4.5 h-4.5 mr-2 flex-shrink-0"
                  style={{ minWidth: 18, minHeight: 18 }}
                />
              )}
              <span
                className={op.isDirectory ? "break-all font-bold" : "break-all"}
              >
                {getBasename(op.targetPath)}
                {op.type === "copy" ? (
                  <span className="ml-2 px-1.5 py-0.5 text-xs rounded-md bg-green-100 text-green-800">
                    copy
                  </span>
                ) : op.type === "move" ? (
                  <span className="ml-2 px-1.5 py-0.5 text-xs rounded-md bg-purple-100 text-purple-800">
                    move
                  </span>
                ) : null}
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
  );
}
