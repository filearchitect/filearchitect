import { Textarea } from "@/components/ui/textarea";
import React, { ChangeEvent, useCallback, useEffect, useRef } from "react";

interface StructureInputProps {
  value: string;
  onStructureChange: (value: string) => void;
  disabled?: boolean;
  maxLines?: number;
}

const TabIndicator = React.forwardRef<HTMLDivElement, { text: string }>(
  ({ text }, ref) => {
    const lines = text.split("\n");
    const tabWidth = 2;
    const lineHeight = 24;

    return (
      <div
        ref={ref}
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
  }
);
TabIndicator.displayName = "TabIndicator";

export function StructureInput({
  value,
  onStructureChange,
  disabled,
  maxLines,
}: StructureInputProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const indicatorRef = useRef<HTMLDivElement>(null);

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
      if (event.key === "Tab") {
        event.preventDefault();
        const textarea = event.target as HTMLTextAreaElement;
        const start = textarea.selectionStart;
        const end = textarea.selectionEnd;
        const val = textarea.value;

        if (event.shiftKey) {
          const lineStart = val.lastIndexOf("\n", start - 1) + 1;
          const currentLineContentBeforeCursor = val.substring(
            lineStart,
            start
          );
          const indentMatch = currentLineContentBeforeCursor.match(/^(\t*)/);
          const currentLineIndentation = indentMatch ? indentMatch[0] : "";

          if (currentLineIndentation.length > 0) {
            const newValue =
              val.substring(0, lineStart) +
              currentLineIndentation.substring(1) +
              val.substring(lineStart + currentLineIndentation.length);

            onStructureChange(newValue);

            setTimeout(() => {
              const newCursorPos = Math.max(lineStart, start - 1);
              textarea.selectionStart = textarea.selectionEnd = newCursorPos;
            }, 0);
            return;
          }
          return;
        }

        const lineStart = val.lastIndexOf("\n", start - 1) + 1;
        const lineEnd = val.indexOf("\n", end);
        const actualEnd = lineEnd === -1 ? val.length : lineEnd;

        const selectedText = val.substring(start, end);
        const lines = selectedText.split("\n");
        const numSelectedLines = val
          .substring(lineStart, end)
          .split("\n").length;

        if (start !== end && selectedText.includes("\n")) {
          let linesAffected = 0;
          const newText = val
            .substring(lineStart, end)
            .split("\n")
            .map((line) => {
              linesAffected++;
              return "\t" + line;
            })
            .join("\n");

          const finalValue =
            val.substring(0, lineStart) + newText + val.substring(end);
          onStructureChange(finalValue);
          setTimeout(() => {
            textarea.selectionStart = start + 1;
            textarea.selectionEnd = end + linesAffected;
          }, 0);
        } else {
          const newValue = val.substring(0, start) + "\t" + val.substring(end);
          onStructureChange(newValue);
          setTimeout(() => {
            textarea.selectionStart = textarea.selectionEnd = start + 1;
          }, 0);
        }
      } else if (event.key === "Enter") {
        const textarea = event.target as HTMLTextAreaElement;
        const val = textarea.value;
        if (maxLines !== undefined && val.split("\n").length >= maxLines) {
          event.preventDefault();
          return;
        }

        event.preventDefault();
        const start = textarea.selectionStart;
        const end = textarea.selectionEnd;

        const lineStart = val.lastIndexOf("\n", start - 1) + 1;
        const currentLine = val.slice(lineStart, start);
        const indentation = currentLine.match(/^\t*/)?.[0] || "";

        const newValue =
          val.substring(0, start) + "\n" + indentation + val.substring(end);
        onStructureChange(newValue);

        setTimeout(() => {
          textarea.selectionStart = textarea.selectionEnd =
            start + 1 + indentation.length;
        }, 0);
      }
    },
    [onStructureChange, maxLines]
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
            onStructureChange(newValue);
          }}
          onKeyDown={handleKeyDown}
          onScroll={handleScroll}
          placeholder="Define your file structure here..."
          className="outline-none ring-0 focus:outline-none font-mono text-sm border border-gray-300 rounded p-4 resize-none z-20 bg-transparent [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none] overflow-y-hidden w-full"
          style={{
            tabSize: 2,
            lineHeight: "24px",
            fontSize: "0.875rem",
            minHeight: "72px",
          }}
          disabled={disabled}
        />
      </div>
    </div>
  );
}
