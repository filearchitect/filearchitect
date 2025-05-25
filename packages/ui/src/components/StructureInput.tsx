import { Textarea } from "@/components/ui/textarea";
import { ChangeEvent, useCallback, useRef } from "react";

interface StructureInputProps {
  value: string;
  onStructureChange: (value: string) => void;
}

const TabIndicator = ({ text }: { text: string }) => {
  const lines = text.split("\n");
  const tabWidth = 2;
  const lineHeight = 24;

  return (
    <div
      className="absolute inset-0 pointer-events-none whitespace-pre font-mono text-sm z-10 overflow-hidden"
      style={{
        top: 0,
        left: "10px",
        right: "1px",
        bottom: 0,
        marginLeft: "-3px",
        padding: "16px 0px",
        color: "rgba(0, 0, 0, 0.2)",
        lineHeight: `${lineHeight}px`,
        zIndex: 1,
      }}
    >
      {lines.map((line, lineIndex) => {
        const tabs = line.match(/^\t*/)?.[0] || "";
        return (
          <div key={lineIndex} style={{ height: `${lineHeight}px` }}>
            {tabs.split("").map((_, tabIndex, arr) => (
              <span
                key={tabIndex}
                style={{
                  display: "inline-block",
                  width: `${tabWidth}ch`,
                  textAlign: "center",
                  color: "rgba(0, 0, 0, 0.2)",
                  fontWeight: 300,
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
};

export function StructureInput({
  value,
  onStructureChange,
}: StructureInputProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const indicatorRef = useRef<HTMLDivElement>(null);

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
      if (event.key === "Tab") {
        event.preventDefault();
        const textarea = event.target as HTMLTextAreaElement;
        const start = textarea.selectionStart;
        const end = textarea.selectionEnd;
        const value = textarea.value;

        // Handle Shift+Tab to remove a tab
        if (event.shiftKey) {
          const lineStart = value.lastIndexOf("\n", start - 1) + 1;
          const currentLine = value.slice(lineStart, end);
          const firstTabIndex = currentLine.indexOf("\t");

          if (firstTabIndex !== -1) {
            const newValue =
              value.substring(0, lineStart) +
              currentLine.substring(firstTabIndex + 1) +
              value.substring(end);
            onStructureChange(newValue);
            setTimeout(() => {
              textarea.selectionStart = textarea.selectionEnd = start - 1;
            }, 0);
            return;
          }
        }

        // Regular tab insertion
        const lineStart = value.lastIndexOf("\n", start - 1) + 1;
        const lineBeforeCursor = value.slice(lineStart, start);
        const currentLine = value.slice(lineStart, end);

        if (currentLine.trim().length > 0) {
          const newValue =
            value.substring(0, lineStart) +
            "\t" +
            currentLine +
            value.substring(end);
          onStructureChange(newValue);
          setTimeout(() => {
            textarea.selectionStart = textarea.selectionEnd = start + 1;
          }, 0);
        } else if (/^\t*$/.test(lineBeforeCursor)) {
          const newValue =
            value.substring(0, start) + "\t" + value.substring(end);
          onStructureChange(newValue);
          setTimeout(() => {
            textarea.selectionStart = textarea.selectionEnd = start + 1;
          }, 0);
        }
      } else if (event.key === "Enter") {
        event.preventDefault();
        const textarea = event.target as HTMLTextAreaElement;
        const start = textarea.selectionStart;
        const end = textarea.selectionEnd;
        const value = textarea.value;

        const lineStart = value.lastIndexOf("\n", start - 1) + 1;
        const currentLine = value.slice(lineStart, start);
        const indentation = currentLine.match(/^\t*/)?.[0] || "";

        const newValue =
          value.substring(0, start) + "\n" + indentation + value.substring(end);
        onStructureChange(newValue);

        setTimeout(() => {
          textarea.selectionStart = textarea.selectionEnd =
            start + 1 + indentation.length;
        }, 0);
      }
    },
    [onStructureChange]
  );

  return (
    <div className="relative h-full">
      <div className="h-full overflow-hidden relative">
        <TabIndicator text={value} />
        <Textarea
          ref={textareaRef}
          value={value}
          onChange={(e: ChangeEvent<HTMLTextAreaElement>) =>
            onStructureChange(e.target.value)
          }
          onKeyDown={handleKeyDown}
          onScroll={handleScroll}
          placeholder="Define your file structure here..."
          className="absolute inset-0 outline-none ring-0 focus:outline-none h-full font-mono text-sm border border-gray-300 rounded p-4  resize-none z-20 bg-transparent [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]"
          style={{
            tabSize: 2,
            lineHeight: "24px",
            fontSize: "0.875rem",
          }}
        />
      </div>
    </div>
  );
}
