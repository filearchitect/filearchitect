# @filearchitect/ui

This package contains the core React UI components for the File Architect application. These components provide the user interface for defining file structures and previewing the resulting operations.

## Installation

This package is part of the `@filearchitect` monorepo and is managed using `pnpm` workspaces. Ensure dependencies are installed from the root of the monorepo:

```bash
pnpm install
```

## Core Components

The main components exported by this package are:

-   [`StructureEditor`](#structureeditor)
-   [`StructureInput`](#structureinput)
-   [`StructurePreview`](#structurepreview)

---

### `StructureEditor`

**Purpose:**
The `StructureEditor` is a high-level component that orchestrates the text input for defining a file/directory structure and a live preview of the operations that would be performed. It integrates the `StructureInput` for text entry and the `StructurePreview` to display the outcome. It also handles parsing the input, generating preview operations, and displaying errors.

**Props:**

| Prop                        | Type                                         | Description                                                                                                |
| :-------------------------- | :------------------------------------------- | :--------------------------------------------------------------------------------------------------------- |
| `structure`                 | `string`                                     | The current structure definition string.                                                                   |
| `onStructureChange`         | `(newStructure: string) => void`             | Callback invoked when the structure string changes.                                                        |
| `previewOperations`         | `StructureOperation[]`                       | Array of operations to be previewed, derived from the structure.                                           |
| `onPreviewOperationsChange` | `(operations: StructureOperation[]) => void` | Callback invoked when the preview operations change.                                                       |
| `error`                     | `string \| null`                             | Current error message, if any. `null` if no error.                                                         |
| `onErrorChange`             | `(error: string \| null) => void`            | Callback invoked when an error occurs or is cleared.                                                       |
| `maxLines` (optional)       | `number`                                     | Maximum number of lines for the input. New lines are prevented if exceeded, but the input is not disabled. |
| `disabled` (optional)       | `boolean`                                    | Disables the input field.                                                                                  |
| `className` (optional)      | `string`                                     | CSS class name to apply to the root element of the editor.                                                 |

**Basic Usage:**

```tsx
import { StructureEditor } from "@filearchitect/ui";
import { useState } from "react";
import type { StructureOperation } from "@filearchitect/core";

function MyFeature() {
    const [structure, setStructure] = useState("");
    const [operations, setOperations] = useState<StructureOperation[]>([]);
    const [error, setError] = useState<string | null>(null);

    return (
        <StructureEditor
            structure={structure}
            onStructureChange={setStructure}
            previewOperations={operations}
            onPreviewOperationsChange={setOperations}
            error={error}
            onErrorChange={setError}
            maxLines={50}
        />
    );
}
```

---

### `StructureInput`

**Purpose:**
The `StructureInput` is a custom textarea component tailored for inputting hierarchical structure definitions (like file trees). It's designed to provide a smooth editing experience for this specific task.

**Features:**

-   Automatic handling of Tab and Shift+Tab for indentation.
-   Smart Enter key behavior for maintaining indentation on new lines.
-   Prevention of new lines when Enter is pressed on an empty line.
-   Optional line limiting (truncates pasted text if over limit, prevents new lines via Enter).
-   Visual tab indicators for better readability of indentation.

**Props:**

| Prop                  | Type                      | Description                                                                                            |
| :-------------------- | :------------------------ | :----------------------------------------------------------------------------------------------------- |
| `value`               | `string`                  | The current value of the textarea.                                                                     |
| `onStructureChange`   | `(value: string) => void` | Callback invoked when the textarea value changes.                                                      |
| `disabled` (optional) | `boolean`                 | Disables the textarea. Defaults to `false`.                                                            |
| `maxLines` (optional) | `number`                  | Maximum number of lines. If exceeded, new lines via Enter are prevented, and pasted text is truncated. |

**Basic Usage:**
(Typically used within `StructureEditor`, but can be used standalone if needed)

```tsx
import { StructureInput } from "@filearchitect/ui";
import { useState } from "react";

function MyRawInput() {
    const [inputValue, setInputValue] = useState("");

    return (
        <StructureInput
            value={inputValue}
            onStructureChange={setInputValue}
            maxLines={30}
        />
    );
}
```

---

### `StructurePreview`

**Purpose:**
The `StructurePreview` component is responsible for displaying the list of file system operations (like creating files or directories) that are derived from the user's input in the `StructureInput`. It also displays any parsing errors.

**Props:**

| Prop         | Type                   | Description                                                              |
| :----------- | :--------------------- | :----------------------------------------------------------------------- |
| `operations` | `StructureOperation[]` | An array of operations (create file, create directory, etc.) to display. |
| `error`      | `string \| null`       | An error message string to display if parsing failed. `null` otherwise.  |

**Basic Usage:**

```tsx
import { StructurePreview } from "@filearchitect/ui";
import type { StructureOperation } from "@filearchitect/core";

function MyPreview({
    ops,
    err,
}: {
    ops: StructureOperation[];
    err: string | null;
}) {
    return <StructurePreview operations={ops} error={err} />;
}
```

## Development

This package uses React and TypeScript. Ensure you have Node.js and `pnpm` installed.

To run tests or build the package (if applicable as a standalone build), refer to the scripts in the root `package.json` of the monorepo. Components are styled using Tailwind CSS.
