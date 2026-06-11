const PALETTE = [
  "#0D3B6E",
  "#6D28D9",
  "#7C3AED",
  "#0F766E",
  "#B45309",
  "#BE185D",
  "#1D4ED8",
  "#15803D",
] as const;

export function programColor(id: string): string {
  let hash = 0;
  for (const char of id) hash = (hash * 31 + char.charCodeAt(0)) >>> 0;
  return PALETTE[hash % PALETTE.length];
}
