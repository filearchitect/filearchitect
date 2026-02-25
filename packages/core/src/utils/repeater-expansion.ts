const REPEATER_PATTERN = /\$\*(\d+)/g;
const MAX_REPEAT_COUNT = 1000;

/**
 * Expands Emmet-like repeaters in structure lines.
 * Example: `file_$*3.txt` becomes file_1..file_3 on separate lines.
 */
export function expandRepeaters(content: string): string {
  if (!content.includes("$*")) {
    return content;
  }

  const lines = content.split("\n");
  return expandLines(lines).join("\n");
}

function expandLines(lines: string[]): string[] {
  const expandedLines: string[] = [];
  let index = 0;

  while (index < lines.length) {
    const line = lines[index];
    const matches = [...line.matchAll(REPEATER_PATTERN)];

    if (matches.length === 0) {
      expandedLines.push(line);
      index += 1;
      continue;
    }

    const counts = new Set(
      matches.map((match) => Number.parseInt(match[1], 10))
    );

    // Keep line unchanged when repeater counts are mixed (e.g. $*2 and $*3).
    if (counts.size !== 1) {
      expandedLines.push(line);
      index += 1;
      continue;
    }

    const repeatCount = counts.values().next().value as number;
    if (!Number.isFinite(repeatCount) || repeatCount < 1) {
      expandedLines.push(line);
      index += 1;
      continue;
    }

    const currentLevel = getIndentationLevel(line);
    let blockEnd = index + 1;

    // Capture the full indented subtree under this line.
    while (blockEnd < lines.length) {
      const candidate = lines[blockEnd];
      if (candidate.trim().length === 0) {
        blockEnd += 1;
        continue;
      }
      if (getIndentationLevel(candidate) <= currentLevel) {
        break;
      }
      blockEnd += 1;
    }

    const childLines = lines.slice(index + 1, blockEnd);
    const boundedRepeatCount = Math.min(repeatCount, MAX_REPEAT_COUNT);

    for (let i = 1; i <= boundedRepeatCount; i += 1) {
      expandedLines.push(line.replace(REPEATER_PATTERN, String(i)));
      if (childLines.length > 0) {
        expandedLines.push(...expandLines(childLines));
      }
    }

    index = blockEnd;
  }

  return expandedLines;
}

function getIndentationLevel(line: string): number {
  const indentation = line.match(/^\s+/)?.[0] || "";
  return indentation.includes("\t")
    ? indentation.split("\t").length - 1
    : indentation.length / 4;
}
