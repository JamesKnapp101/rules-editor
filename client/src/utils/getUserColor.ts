const USER_COLORS = [
  "#2563eb",
  "#16a34a",
  "#9333ea",
  "#db2777",
  "#ea580c",
  "#0d9488",
  "#4f46e5",
  "#65a30d",
];

export function getUserColor(name: string): string {
  let hash = 0;

  for (let i = 0; i < name.length; i++) {
    hash = (hash * 31 + name.charCodeAt(i)) | 0;
  }

  const idx = Math.abs(hash) % USER_COLORS.length;
  return USER_COLORS[idx];
}
