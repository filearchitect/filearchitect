import * as React from "react";
import {
  Panel as PrimitivePanel,
  PanelGroup as PrimitivePanelGroup,
  PanelResizeHandle as PrimitiveResizeHandle,
  type ImperativePanelGroupHandle,
  type PanelGroupProps,
  type PanelProps,
  type PanelResizeHandleProps,
} from "react-resizable-panels";

import { cn } from "@/lib/utils";

// ResizablePanelGroup wraps the PrimitivePanelGroup providing default styles.
const ResizablePanelGroup = React.forwardRef<
  ImperativePanelGroupHandle,
  PanelGroupProps
>(({ className, ...props }, ref) => (
  <PrimitivePanelGroup
    ref={ref}
    className={cn("flex w-full h-full", className)}
    {...props}
  />
));
ResizablePanelGroup.displayName = "ResizablePanelGroup";

// Direct re-export for the panel primitive (forwarding ref is handled by the lib).
const ResizablePanel = PrimitivePanel as unknown as React.FC<PanelProps>;

interface ResizableHandleProps extends PanelResizeHandleProps {
  className?: string;
  /** Show a visible grabber indicator inside the handle. */
  withHandle?: boolean;
}

const ResizableHandle: React.FC<ResizableHandleProps> = ({
  className,
  withHandle: _omit,
  ...props
}) => (
  <PrimitiveResizeHandle
    className={cn(
      // Base appearance
      "relative flex h-full w-2 cursor-col-resize bg-transparent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40",
      // Divider line (transparent until hover/drag)
      "before:absolute before:left-1/2 before:top-0 before:h-full before:w-px before:-translate-x-1/2 before:bg-transparent hover:before:bg-border data-[dragging]:before:bg-border before:transition-colors",
      className
    )}
    {...props}
  />
);
ResizableHandle.displayName = "ResizableHandle";

export { ResizableHandle, ResizablePanel, ResizablePanelGroup };
