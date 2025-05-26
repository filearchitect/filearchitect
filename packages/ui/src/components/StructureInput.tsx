import { Textarea } from "@/components/ui/textarea";
import React, {
  ChangeEvent,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";

/**
 * Props for the StructureInput component.
 */
interface StructureInputProps {
  /** The current value of the textarea. */
  value: string;
  /** Callback function invoked when the textarea value changes. */
  onStructureChange: (value: string) => void;
  /** Optional flag to disable the textarea. Defaults to false. */
  disabled?: boolean;
  /**
   * Optional maximum number of lines for the textarea.
   * If exceeded, new lines via Enter key are prevented, and pasted text is truncated.
   */
  maxLines?: number;
}

const LINE_HEIGHT_PX = 24;
const TAB_WIDTH_CH = 2;

/**
 * `TabIndicator` is a purely visual component that renders tab character indicators
 * overlaid on the `Textarea` within `StructureInput`.
 * It helps visualize the indentation levels.
 * @private Not intended for direct external use.
 */
const TabIndicator = React.forwardRef<HTMLDivElement, { text: string }>(
  ({ text }, ref) => {
    const lines = text.split("\n");

    return (
      <div
        ref={ref}
        className="absolute inset-0 pointer-events-none whitespace-pre font-mono text-sm z-10 overflow-hidden px-0 py-4 text-black/20"
        style={{
          top: 0,
          left: "10px",
          right: "1px",
          bottom: 0,
          marginLeft: "-3px",
          lineHeight: `${LINE_HEIGHT_PX}px`,
          zIndex: 1,
        }}
      >
        {lines.map((line, lineIndex) => {
          const tabs = line.match(/^\t*/)?.[0] || "";
          return (
            <div key={lineIndex} style={{ height: `${LINE_HEIGHT_PX}px` }}>
              {tabs.split("").map((_, tabIndex, arr) => (
                <span
                  key={tabIndex}
                  className="inline-block text-center text-black/20 font-light"
                  style={{
                    width: `${TAB_WIDTH_CH}ch`,
                    marginLeft: tabIndex === 0 ? "0.5ch" : "0ch",
                    marginRight: tabIndex === arr.length - 1 ? "0.5ch" : "0ch",
                  }}
                >
                  |
                </span>
              ))}
            </div>
          );
        })}
      </div>
    );
  }
);
TabIndicator.displayName = "TabIndicator";

// Type for desired selection state
type DesiredSelection = { start: number; end: number } | null;

// Helper function for Shift+Tab
function handleShiftTabKeyPress(
  textarea: HTMLTextAreaElement,
  onStructureChange: (value: string) => void,
  setDesiredSelection: (selection: DesiredSelection) => void
) {
  const start = textarea.selectionStart;
  const val = textarea.value;
  const lineStart = val.lastIndexOf("\n", start - 1) + 1;
  const currentLineContentBeforeCursor = val.substring(lineStart, start);
  const indentMatch = currentLineContentBeforeCursor.match(/^(\t*)/);
  const currentLineIndentation = indentMatch ? indentMatch[0] : "";

  if (currentLineIndentation.length > 0) {
    const newValue =
      val.substring(0, lineStart) +
      currentLineIndentation.substring(1) +
      val.substring(lineStart + currentLineIndentation.length);

    onStructureChange(newValue);
    const newCursorPos = Math.max(lineStart, start - 1);
    setDesiredSelection({ start: newCursorPos, end: newCursorPos });
  }
}

// Helper function for Tab
function handleTabKeyPress(
  textarea: HTMLTextAreaElement,
  onStructureChange: (value: string) => void,
  setDesiredSelection: (selection: DesiredSelection) => void
) {
  const start = textarea.selectionStart;
  const end = textarea.selectionEnd;
  const val = textarea.value;

  const selectedText = val.substring(start, end);

  if (start !== end && selectedText.includes("\n")) {
    const firstLineStart = val.lastIndexOf("\n", start - 1) + 1;
    const blockToIndent = val.substring(firstLineStart, end);
    const lines = blockToIndent.split("\n");
    const linesAffectedCount = lines.length;
    const indentedBlock = lines.map((line) => "\t" + line).join("\n");
    const newValue =
      val.substring(0, firstLineStart) + indentedBlock + val.substring(end);
    onStructureChange(newValue);
    setDesiredSelection({
      start: start + 1,
      end: end + linesAffectedCount,
    });
  } else {
    const currentLineStart = val.lastIndexOf("\n", start - 1) + 1;
    const newValue =
      val.substring(0, currentLineStart) +
      "\t" +
      val.substring(currentLineStart);
    onStructureChange(newValue);
    setDesiredSelection({ start: start + 1, end: end + 1 });
  }
}

// Helper function for Enter
function handleEnterKeyPress(
  textarea: HTMLTextAreaElement,
  onStructureChange: (value: string) => void,
  maxLines: number | undefined,
  setDesiredSelection: (selection: DesiredSelection) => void
) {
  const val = textarea.value;
  if (maxLines !== undefined && val.split("\n").length >= maxLines) {
    return;
  }

  const start = textarea.selectionStart;
  const currentLineStartIndex = val.lastIndexOf("\n", start - 1) + 1;
  let currentLineEndIndex = val.indexOf("\n", currentLineStartIndex);
  if (currentLineEndIndex === -1) {
    currentLineEndIndex = val.length;
  }
  const currentLineContent = val.substring(
    currentLineStartIndex,
    currentLineEndIndex
  );

  if (currentLineContent.trim() === "") {
    return;
  }

  const end = textarea.selectionEnd;
  const textBeforeCursorOnCurrentLine = val.slice(currentLineStartIndex, start);
  const indentation = textBeforeCursorOnCurrentLine.match(/^\t*/)?.[0] || "";
  const newValue =
    val.substring(0, start) + "\n" + indentation + val.substring(end);
  onStructureChange(newValue);
  const newCursorPos = start + 1 + indentation.length;
  setDesiredSelection({ start: newCursorPos, end: newCursorPos });
}

/**
 * `StructureInput` is a custom textarea component designed for inputting hierarchical
 * structure definitions (like file trees). It provides features such as:
 * - Automatic handling of Tab and Shift+Tab for indentation.
 * - Smart Enter key behavior for maintaining indentation on new lines.
 * - Prevention of new lines on empty lines.
 * - Optional line limiting.
 * - Visual tab indicators.
 */
export function StructureInput({
  value,
  onStructureChange,
  disabled,
  maxLines,
}: StructureInputProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const indicatorRef = useRef<HTMLDivElement>(null);
  const [desiredSelection, setDesiredSelection] =
    useState<DesiredSelection>(null);

  // Effect to apply desired selection
  useEffect(() => {
    if (textareaRef.current && desiredSelection) {
      textareaRef.current.selectionStart = desiredSelection.start;
      textareaRef.current.selectionEnd = desiredSelection.end;
      setDesiredSelection(null); // Reset after applying
    }
  }, [desiredSelection]);

  // Effect for auto-height (remains the same)
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      const newHeight = textareaRef.current.scrollHeight;
      textareaRef.current.style.height = `${newHeight}px`;
    }
  }, [value]);

  const handleScroll = useCallback(
    (event: React.UIEvent<HTMLTextAreaElement>) => {
      if (indicatorRef.current) {
        indicatorRef.current.scrollTop = event.currentTarget.scrollTop;
        indicatorRef.current.scrollLeft = event.currentTarget.scrollLeft;
      }
    },
    []
  );

  const handleKeyDown = useCallback(
    (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
      const textarea = event.target as HTMLTextAreaElement;
      if (event.key === "Tab") {
        event.preventDefault();
        if (event.shiftKey) {
          handleShiftTabKeyPress(
            textarea,
            onStructureChange,
            setDesiredSelection
          );
        } else {
          handleTabKeyPress(textarea, onStructureChange, setDesiredSelection);
        }
        return;
      } else if (event.key === "Enter") {
        event.preventDefault();
        handleEnterKeyPress(
          textarea,
          onStructureChange,
          maxLines,
          setDesiredSelection
        );
        return;
      }
    },
    [onStructureChange, maxLines, setDesiredSelection]
  );

  return (
    <div className="relative">
      <div className="relative">
        <TabIndicator ref={indicatorRef} text={value} />
        <Textarea
          ref={textareaRef}
          value={value}
          onChange={(e: ChangeEvent<HTMLTextAreaElement>) => {
            let newValue = e.target.value;
            if (maxLines !== undefined) {
              const lines = newValue.split("\n");
              if (lines.length > maxLines) {
                newValue = lines.slice(0, maxLines).join("\n");
              }
            }
            // Only call onStructureChange if the effective new value is different from the current prop value
            if (newValue !== value) {
              onStructureChange(newValue);
            }
            // When text changes directly (typing/pasting), we don't want a stale desiredSelection to apply.
            // So, we clear it. The browser will handle natural cursor movement.
            setDesiredSelection(null);
          }}
          onKeyDown={handleKeyDown}
          onScroll={handleScroll}
          placeholder="Define your file structure here..."
          className="outline-none ring-0 focus:outline-none font-mono text-sm border border-gray-300 rounded p-4 resize-none z-20 bg-transparent [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none] overflow-y-hidden w-full"
          style={{
            tabSize: TAB_WIDTH_CH,
            lineHeight: `${LINE_HEIGHT_PX}px`,
            fontSize: "0.875rem",
            minHeight: "72px",
          }}
          disabled={disabled}
        />
      </div>
    </div>
  );
}
