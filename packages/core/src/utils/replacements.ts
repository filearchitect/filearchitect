export function applyReplacements(
  name: string,
  replacements?: Array<{ search: string; replace: string }>
): string {
  return (
    replacements?.reduce(
      (acc, { search, replace }) => acc.split(search).join(replace),
      name
    ) ?? name
  );
}
