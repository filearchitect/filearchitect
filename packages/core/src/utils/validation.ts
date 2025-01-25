import { FSError } from "../errors.js";
import type { StructureOperation } from "../types.js";

export function validateOperation(operation: StructureOperation): void {
  if (operation.type === "copy" || operation.type === "move") {
    if (!operation.sourcePath) {
      throw new FSError(`${operation.type} operations require a source path`, {
        code: "EINVAL",
      });
    }
  }
}
