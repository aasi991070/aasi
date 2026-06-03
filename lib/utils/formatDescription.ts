export function splitDescriptionParagraphs(text: string | undefined | null): string[] {
  if (!text?.trim()) return [];
  return text
    .split(/\n\s*\n/)
    .map((p) => p.trim())
    .filter(Boolean);
}
