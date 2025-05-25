import yaml from "yaml";
import type {
  FileNameReplacement,
  GetStructureOptions,
  StructureFrontmatter,
} from "../types.js"; // Import necessary types from ../types.js

// Re-exporting Replacements type if needed elsewhere, or define locally if only used here
export interface Replacements {
  all?: FileNameReplacement[];
  files?: FileNameReplacement[];
  folders?: FileNameReplacement[];
}

/**
 * Parses YAML frontmatter from the input string if present
 */
export function parseFrontmatter(input: string): {
  frontmatter: StructureFrontmatter | null;
  content: string;
} {
  const match = input.match(/^\s*---\s*([\s\S]*?)\s*---\s*([\s\S]*)$/);
  if (!match) {
    return { frontmatter: null, content: input };
  }

  try {
    // Replace tabs with spaces for YAML parser compatibility
    const yamlContent = match[1].replace(/\t/g, "  ");

    const parsed = yaml.parse(yamlContent);

    // Basic validation/structure assumption
    const frontmatter: StructureFrontmatter = {
      replacements: {
        files: parsed?.replacements?.files || parsed?.fileReplacements || [],
        folders: parsed?.replacements?.folders || parsed?.folderReplacements || [],
        all: parsed?.replacements?.all || parsed?.allReplacements || [],
      },
    };

    // Further validation could be added here if needed

    return { frontmatter, content: match[2] };
  } catch (error) {
    console.error("Failed to parse YAML frontmatter:", error);
    // If YAML parsing fails, treat the whole input as content
    return { frontmatter: null, content: input };
  }
}

/**
 * Merges replacements from frontmatter and options, giving priority to options.
 * De-duplicates replacements based on the 'search' key.
 */
export function mergeReplacements(
  frontmatter: StructureFrontmatter | null,
  options: GetStructureOptions
): Replacements {
  const frontmatterReplacements = frontmatter?.replacements;
  const optionsReplacements = options.replacements;

  // Helper to de-duplicate an array of replacements
  const deduplicate = (
    arr: FileNameReplacement[] = []
  ): FileNameReplacement[] => {
    const seen = new Set<string>();
    return arr.filter((item) => {
      if (seen.has(item.search)) {
        return false;
      }
      seen.add(item.search);
      return true;
    });
  };

  // Combine and de-duplicate 'all' replacements (options priority)
  const combinedAll = deduplicate([
    ...(optionsReplacements?.all || []),
    ...(frontmatterReplacements?.all || []),
  ]);

  // Combine and de-duplicate 'files' replacements (options > frontmatter > combined all)
  const combinedFiles = deduplicate([
    ...(optionsReplacements?.files || []),
    ...(frontmatterReplacements?.files || []),
    ...combinedAll, // Add 'all' replacements as lowest priority for files
  ]);

  // Combine and de-duplicate 'folders' replacements (options > frontmatter > combined all)
  const combinedFolders = deduplicate([
    ...(optionsReplacements?.folders || []),
    ...(frontmatterReplacements?.folders || []),
    ...combinedAll, // Add 'all' replacements as lowest priority for folders
  ]);

  return {
    files: combinedFiles,
    folders: combinedFolders,
    all: combinedAll, // Return the de-duplicated 'all' for reference if needed
  };
}
