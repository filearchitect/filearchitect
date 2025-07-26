import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Textarea } from "@/components/ui/textarea";
import { HelpCircle } from "lucide-react";
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
  /** Optional placeholder for the textarea. */
  placeholder?: string;
  /** Optional content for the help popover */
  helpContent?: React.ReactNode;
  /** Optional CSS class name to apply to the root element of the component. */
  className?: string;
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
  placeholder,
  helpContent,
  className,
}: StructureInputProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const indicatorRef = useRef<HTMLDivElement>(null);
  const [desiredSelection, setDesiredSelection] =
    useState<DesiredSelection>(null);

  // Effect to apply desired selection
  useEffect(() => {
    if (desiredSelection && textareaRef.current) {
      textareaRef.current.setSelectionRange(
        desiredSelection.start,
        desiredSelection.end
      );
      setDesiredSelection(null); // Reset after applying
    }
  }, [desiredSelection]);

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
      if (!textareaRef.current) return;

      if (event.key === "Tab") {
        event.preventDefault();
        if (event.shiftKey) {
          handleShiftTabKeyPress(
            textareaRef.current,
            onStructureChange,
            setDesiredSelection
          );
        } else {
          handleTabKeyPress(
            textareaRef.current,
            onStructureChange,
            setDesiredSelection
          );
        }
        return;
      }

      if (event.key === "Enter") {
        event.preventDefault();
        handleEnterKeyPress(
          textareaRef.current,
          onStructureChange,
          maxLines,
          setDesiredSelection
        );
        return;
      }
    },
    [onStructureChange, maxLines, setDesiredSelection]
  );

  const handleChange = (event: ChangeEvent<HTMLTextAreaElement>) => {
    let newValue = event.target.value;
    if (maxLines !== undefined && newValue.split("\n").length > maxLines) {
      newValue = newValue.split("\n").slice(0, maxLines).join("\n");
    }
    if (newValue !== value) {
      // Only call if value actually changed
      onStructureChange(newValue);
    }
  };

  // Calculate current number of lines
  const currentLines = value.split("\n").length;

  return (
    <div className="relative h-full flex flex-col">
      <TabIndicator text={value} ref={indicatorRef} />
      <Textarea
        ref={textareaRef}
        value={value}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        onScroll={handleScroll}
        disabled={disabled}
        placeholder={placeholder}
        className={`flex-1 placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-50 outline-none ring-0 focus:outline-none focus-visible:outline-none focus-visible:ring-0 font-mono text-sm border border-gray-300 rounded p-4 pr-10 resize-none z-20 bg-transparent [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none] overflow-y-auto w-full placeholder:text-gray-400 ${
          className || ""
        }`.trim()}
        style={{
          lineHeight: `${LINE_HEIGHT_PX}px`,
          minHeight: `${LINE_HEIGHT_PX * 3}px`,
          tabSize: TAB_WIDTH_CH,
        }}
      />
      {helpContent && (
        <Popover>
          <PopoverTrigger asChild className="absolute top-3 right-3 z-30">
            <Button variant="ghost" size="icon" className="w-6 h-6">
              <HelpCircle className="w-4 h-4 text-muted-foreground" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-[600px] p-0">
            <div>{helpContent}</div>
          </PopoverContent>
        </Popover>
      )}
      {maxLines && maxLines > 0 && (
        <div className="absolute bottom-2 right-3 text-xs text-gray-500 pointer-events-none select-none z-30">
          {currentLines} / {maxLines}
        </div>
      )}
    </div>
  );
}
