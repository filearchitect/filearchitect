import React from "react";

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
    borderClasses += ` border-r ${borderColorClass}`;
  }

  // Apply border-b if not in the last visual row
  if (Math.floor(index / 2) < Math.floor((totalItems - 1) / 2)) {
    borderClasses += ` border-b ${borderColorClass}`;
  }

  return (
    <div className={`p-2 flex flex-col h-full ${borderClasses}`.trim()}>
      <h5 className="font-semibold text-sm mb-1.5 text-gray-700 dark:text-gray-300">
        {title}
      </h5>
      <div className="text-xs space-y-1 text-gray-600 dark:text-gray-400 flex-grow pb-2">
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
        <p className="mt-3">
          <pre className="bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200 px-1 py-0.5 rounded font-mono">
            folder
            <br />| subfolder
          </pre>
        </p>
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
        <p className="mt-3">
          <code className="bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200 px-1 py-0.5 rounded font-mono">
            file.txt
          </code>
        </p>
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
        <p className="mt-3">
          <code className="bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200 px-1 py-0.5 rounded font-mono">
            my-folder
          </code>
        </p>
      </>
    ),
  },

  {
    title: "Copy Operations",
    content: (
      <>
        <p>Use square brackets for the source.</p>
        <p className="mt-3">
          <code className="bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200 px-1 py-0.5 rounded font-mono">
            [source] &gt; target-copy
          </code>
        </p>
      </>
    ),
  },
  {
    title: "Move Operations",
    content: (
      <>
        <p>Use parentheses for the source.</p>
        <p className="mt-3">
          <code className="bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200 px-1 py-0.5 rounded font-mono">
            (source) &gt; target-move
          </code>
        </p>
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

export function HelpPopoverContent() {
  return (
    <div className="grid grid-cols-2 gap-3">
      {helpItems.map((item, index) => (
        <Quadrant
          key={item.title}
          title={item.title}
          index={index}
          totalItems={helpItems.length}
        >
          {item.content}
        </Quadrant>
      ))}
    </div>
  );
}
