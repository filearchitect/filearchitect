import type { FileSystem, StructureOperation } from "../types.js";

export class OperationProcessor {
  constructor(private fs: FileSystem) {}

  async process(operation: StructureOperation): Promise<void> {
    switch (operation.type) {
      case "create":
        return this.handleCreate(operation);
      case "copy":
        return this.handleCopy(operation);
      case "move":
        return this.handleMove(operation);
    }
  }

  private async handleCreate(op: StructureOperation) {
    if (op.isDirectory) {
      await this.fs.mkdir(op.targetPath);
    } else {
      await this.fs.writeFile(op.targetPath, "");
    }
  }

  private async handleCopy(op: StructureOperation) {
    if (!op.sourcePath) throw new Error("Copy operation requires sourcePath");
    await this.fs.copy(op.sourcePath, op.targetPath);
  }

  private async handleMove(op: StructureOperation) {
    if (!op.sourcePath) throw new Error("Move operation requires sourcePath");
    await this.fs.move(op.sourcePath, op.targetPath);
  }
}
