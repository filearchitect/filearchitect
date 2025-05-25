import {
  BrowserFileSystem,
  createStructure,
  ZipArchiver,
} from "@filearchitect/core";
import { useCallback, useState } from "react";

interface DownloadZipButtonProps {
  structure: string;
  onError: (message: string | null) => void;
  className?: string; // Optional className for custom styling
}

export function DownloadZipButton({
  structure,
  onError,
  className = "bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded disabled:opacity-50",
}: DownloadZipButtonProps) {
  const [isDownloading, setIsDownloading] = useState(false);

  const handleDownload = useCallback(async () => {
    if (!structure.trim()) {
      alert("Please define a file structure first."); // Or use onError
      return;
    }
    setIsDownloading(true);
    onError(null); // Clear previous errors
    try {
      const inMemoryFs = new BrowserFileSystem();
      await createStructure(structure, {
        fs: inMemoryFs,
        rootDir: "/",
      });

      const archiver = new ZipArchiver({ fs: inMemoryFs, relativeTo: "/" });

      const directories = Array.from(inMemoryFs.getDirectories());
      for (const dir of directories) {
        if (dir === "" || dir === "/") continue;
        await archiver.addDirectory(dir);
      }

      const files = Array.from(inMemoryFs.getFiles().entries());
      for (const [path, content] of files) {
        await archiver.addFile(path, content);
      }

      const zipOutput = await archiver.generate("blob");

      const url = URL.createObjectURL(zipOutput.data as Blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "file-structure.zip";
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (e: any) {
      console.error("Error creating ZIP:", e);
      onError(`Error creating ZIP: ${e.message}`);
    } finally {
      setIsDownloading(false);
    }
  }, [structure, onError]);

  return (
    <button
      onClick={handleDownload}
      disabled={isDownloading}
      className={className}
    >
      {isDownloading ? "Downloading..." : "Download ZIP"}
    </button>
  );
}
