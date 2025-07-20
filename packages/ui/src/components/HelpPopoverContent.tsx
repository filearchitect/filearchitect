import React from "react";

interface HelpPopoverContentProps {
  supportCopy: boolean;
  supportMove: boolean;
}

const Quadrant = ({
  title,
  children,
  index,
  totalItems,
}: {
  title: string;
  children: React.ReactNode;
  index: number;
  totalItems: number;
}) => {
  const borderColorClass = "border-gray-200 dark:border-gray-700"; // Slightly darker for better visibility if needed
  let borderClasses = "";

  // Apply border-r if in the first column and not the absolute last item if total is odd
  if (index % 2 === 0 && index < totalItems - 1) {
    borderClasses += ` border-r ${borderColorClass} pr-2`;
  }

  // Apply border-b if not in the last visual row
  if (Math.floor(index / 2) < Math.floor((totalItems - 1) / 2)) {
    borderClasses += ` border-b ${borderColorClass} pb-2`;
  }

  return (
    <div className={`p-4 flex flex-col gap-2 h-full ${borderClasses}`.trim()}>
      <h5 className="font-semibold text-sm mb-1.5 text-gray-700 dark:text-gray-300">
        {title}
      </h5>
      <div className="text-xs space-y-1 text-gray-600 dark:text-gray-400 flex-grow pb-2 space-y-2">
        {children}
      </div>
    </div>
  );
};

const helpItems = [
  {
    title: "Nesting",
    content: (
      <>
        <p>
          <strong>Tabs</strong> indentation nest folders and files.
        </p>

        <pre className="bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200 px-1 py-0.5 rounded font-mono">
          folder
          <br />| subfolder
        </pre>
      </>
    ),
  },
  {
    title: "Files",
    content: (
      <>
        <p>
          Lines <strong>with extensions</strong> create files.
        </p>

        <code className="bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200 px-1 py-0.5 rounded font-mono">
          file.txt
        </code>
      </>
    ),
  },
  {
    title: "Folders",
    content: (
      <>
        <p>
          Lines <strong>without extensions</strong> create directories.
        </p>

        <code className="bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200 px-1 py-0.5 rounded font-mono">
          my-folder
        </code>

        <p className="text-xs text-gray-600 mt-4 ">
          To create a directory with a dot in its name, use{" "}
          <strong>backslash escape</strong>.
        </p>

        <code className="bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200 px-1 py-0.5 rounded font-mono">
          01\.directory
        </code>
      </>
    ),
  },

  {
    title: "Copy",
    content: (
      <>
        <p>
          Square brackets <strong>copy</strong> the source.
        </p>

        <code className="bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200 px-1 py-0.5 rounded font-mono">
          [path/to/source]
        </code>
      </>
    ),
  },
  {
    title: "Move",
    content: (
      <>
        <p>
          Parentheses <strong>move</strong> the source.
        </p>

        <code className="bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200 px-1 py-0.5 rounded font-mono">
          (path/to/source)
        </code>
      </>
    ),
  },
  {
    title: "Full Documentation",
    content: (
      <p>
        For more details, visit our documentation site:{" "}
        <a
          href="https://filearchitect.com/docs"
          target="_blank"
          rel="noopener noreferrer"
          className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 underline"
        >
          filearchitect.com/docs
        </a>
      </p>
    ),
  },
];

export function HelpPopoverContent({
  supportCopy,
  supportMove,
}: HelpPopoverContentProps) {
  const filteredHelpItems = helpItems.filter((item) => {
    if (item.title === "Copy" && !supportCopy) {
      return false;
    }
    if (item.title === "Move" && !supportMove) {
      return false;
    }
    return true;
  });

  return (
    <div className="grid grid-cols-2 ">
      {filteredHelpItems.map((item, index) => (
        <Quadrant
          key={item.title}
          title={item.title}
          index={index}
          totalItems={filteredHelpItems.length}
        >
          {item.content}
        </Quadrant>
      ))}
    </div>
  );
}
