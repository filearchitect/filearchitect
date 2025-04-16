import { Textarea } from "@/components/ui/textarea";
import { ChangeEvent } from "react";

interface StructureInputProps {
  value: string;
  onStructureChange: (value: string) => void;
}

export function StructureInput({
  value,
  onStructureChange,
}: StructureInputProps) {
  return (
    <div>
      <h2 className="text-xl font-semibold mb-2">Enter File Structure</h2>
      <p className="text-sm text-gray-600 mb-3">
        Use tabs for indentation. Directories are created without extensions,
        files with extensions. Use <code>[source] &gt; target</code> for copies
        and <code>(source) &gt; target</code> for moves.
      </p>
      <Textarea
        value={value}
        onChange={(e: ChangeEvent<HTMLTextAreaElement>) =>
          onStructureChange(e.target.value)
        }
        placeholder="Define your file structure here..."
        className="min-h-[400px] font-mono text-sm mb-4 w-full"
      />
    </div>
  );
}
