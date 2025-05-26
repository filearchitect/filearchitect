/// <reference types="vitest/globals" />
/// <reference types="@testing-library/jest-dom" />

import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { vi } from "vitest";
import { StructureInput } from "./StructureInput";

const user = userEvent.setup();

describe("StructureInput", () => {
  const mockOnStructureChange = vi.fn();

  beforeEach(() => {
    mockOnStructureChange.mockClear();
    // vi.useRealTimers(); // No longer strictly necessary here as we're not mixing fake/real as much
  });

  test("renders with initial value and placeholder", async () => {
    render(
      <StructureInput
        value="initial value"
        onStructureChange={mockOnStructureChange}
      />
    );
    expect(
      screen.getByPlaceholderText("Define your file structure here...")
    ).toBeInTheDocument();
    expect(screen.getByRole("textbox")).toHaveValue("initial value");
  });

  test("calls onStructureChange with the latest value when text is typed", async () => {
    let currentValue = "";
    const handleChange = (newValue: string) => {
      currentValue = newValue;
      mockOnStructureChange(newValue);
      // eslint-disable-next-line @typescript-eslint/no-use-before-define
      rerender(
        <StructureInput value={currentValue} onStructureChange={handleChange} />
      );
    };

    const { rerender } = render(
      <StructureInput value={currentValue} onStructureChange={handleChange} />
    );
    const textarea = screen.getByRole("textbox");

    // Type 'hello' character by character to ensure assertions are made after each update
    await user.type(textarea, "h");
    // handleChange is called, currentValue="h", mockOnStructureChange("h"), rerendered with value="h"

    await user.type(textarea, "e");
    // handleChange is called with "he", currentValue="he", mockOnStructureChange("he"), rerendered with value="he"

    await user.type(textarea, "l");
    await user.type(textarea, "l");
    await user.type(textarea, "o");

    expect(mockOnStructureChange).toHaveBeenCalledTimes(5);
    expect(mockOnStructureChange).toHaveBeenNthCalledWith(1, "h");
    expect(mockOnStructureChange).toHaveBeenNthCalledWith(2, "he");
    expect(mockOnStructureChange).toHaveBeenNthCalledWith(3, "hel");
    expect(mockOnStructureChange).toHaveBeenNthCalledWith(4, "hell");
    expect(mockOnStructureChange).toHaveBeenNthCalledWith(5, "hello");
  });

  test("indents current line on Tab press and updates selection", async () => {
    render(
      <StructureInput value="hello" onStructureChange={mockOnStructureChange} />
    );
    const textarea = screen.getByRole("textbox") as HTMLTextAreaElement;
    textarea.focus();
    textarea.setSelectionRange(0, 0);

    await user.tab();
    // After await user.tab(), React should have updated state and run the useEffect for selection.

    expect(mockOnStructureChange).toHaveBeenCalledWith("\thello");
    // Verify selection (important for this refactor)
    expect(textarea.selectionStart).toBe(1); // Cursor after the inserted tab at the line start
    expect(textarea.selectionEnd).toBe(1);
  });

  test("Shift+Tab unindents current line and updates selection", async () => {
    render(
      <StructureInput value="	hello" onStructureChange={mockOnStructureChange} />
    );
    const textarea = screen.getByRole("textbox") as HTMLTextAreaElement;
    textarea.focus();
    textarea.setSelectionRange(1, 1); // Cursor after the tab

    await user.tab({ shift: true });

    expect(mockOnStructureChange).toHaveBeenCalledWith("hello");
    // Verify selection (cursor should be at the start of the line, or where it was relative to "hello")
    // If original cursor was at index 1 (after 	), after removing 	, it should be at index 0 of "hello"
    expect(textarea.selectionStart).toBe(0);
    expect(textarea.selectionEnd).toBe(0);
  });

  test("adds new line with indentation on Enter press and updates selection", async () => {
    let currentValue = "\tparent";
    const handleChange = (newValue: string) => {
      currentValue = newValue;
      mockOnStructureChange(newValue);
      // eslint-disable-next-line @typescript-eslint/no-use-before-define
      rerender(
        <StructureInput value={currentValue} onStructureChange={handleChange} />
      );
    };
    const { rerender } = render(
      <StructureInput value={currentValue} onStructureChange={handleChange} />
    );
    const textarea = screen.getByRole("textbox") as HTMLTextAreaElement;
    textarea.focus();
    const endOfFirstLine = currentValue.length;
    textarea.setSelectionRange(endOfFirstLine, endOfFirstLine);

    await user.keyboard("{Enter}");

    expect(mockOnStructureChange).toHaveBeenCalledWith("\tparent\n\t");
    // Verify selection (cursor after the new line and new indentation)
    const expectedCursorPos = "\tparent\n\t".length;
    expect(textarea.selectionStart).toBe(expectedCursorPos);
    expect(textarea.selectionEnd).toBe(expectedCursorPos);
  });

  test("does not add new line if on an empty line and Enter is pressed", async () => {
    let currentValue = "first line\n\nthird line";
    const handleChange = (newValue: string) => {
      currentValue = newValue;
      mockOnStructureChange(newValue);
      // eslint-disable-next-line @typescript-eslint/no-use-before-define
      rerender(
        <StructureInput value={currentValue} onStructureChange={handleChange} />
      );
    };

    const { rerender } = render(
      <StructureInput value={currentValue} onStructureChange={handleChange} />
    );
    const textarea = screen.getByRole("textbox") as HTMLTextAreaElement;
    textarea.focus();
    const startOfEmptyLine = "first line\n".length;
    textarea.setSelectionRange(startOfEmptyLine, startOfEmptyLine);
    const originalSelectionStart = textarea.selectionStart;

    await user.keyboard("{Enter}");
    expect(mockOnStructureChange).not.toHaveBeenCalled();
    // Cursor should remain in the same position
    expect(textarea.selectionStart).toBe(originalSelectionStart);
  });

  test("prevents adding new lines via Enter if maxLines is reached", async () => {
    let currentValue = "line1\nline2";
    const maxLines = 2;
    const handleChange = (newValue: string) => {
      currentValue = newValue;
      mockOnStructureChange(newValue);
      // eslint-disable-next-line @typescript-eslint/no-use-before-define
      rerender(
        <StructureInput
          value={currentValue}
          onStructureChange={handleChange}
          maxLines={maxLines}
        />
      );
    };

    const { rerender } = render(
      <StructureInput
        value={currentValue}
        onStructureChange={handleChange}
        maxLines={maxLines}
      />
    );
    const textarea = screen.getByRole("textbox") as HTMLTextAreaElement;
    textarea.focus();
    textarea.setSelectionRange(textarea.value.length, textarea.value.length);
    const originalSelectionStart = textarea.selectionStart;

    await user.keyboard("{Enter}");
    expect(mockOnStructureChange).not.toHaveBeenCalled();
    expect(textarea.selectionStart).toBe(originalSelectionStart);
  });

  test("truncates pasted text that exceeds maxLines", async () => {
    let currentValue = "";
    const maxLines = 2;
    const handleChange = (newValue: string) => {
      currentValue = newValue;
      mockOnStructureChange(newValue);
      // eslint-disable-next-line @typescript-eslint/no-use-before-define
      rerender(
        <StructureInput
          value={currentValue}
          onStructureChange={handleChange}
          maxLines={maxLines}
        />
      );
    };
    const { rerender } = render(
      <StructureInput
        value={currentValue}
        onStructureChange={handleChange}
        maxLines={maxLines}
      />
    );
    const textarea = screen.getByRole("textbox");
    textarea.focus();
    await user.paste("line1\nline2\nline3\nline4");
    expect(mockOnStructureChange).toHaveBeenCalledWith("line1\nline2");
  });

  test("textarea is disabled when disabled prop is true", () => {
    render(
      <StructureInput
        value="test"
        onStructureChange={mockOnStructureChange}
        disabled={true}
      />
    );
    expect(screen.getByRole("textbox")).toBeDisabled();
  });
});
