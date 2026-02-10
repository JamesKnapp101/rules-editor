const USER_COLORS = [
  "#2563eb", // blue
  "#16a34a", // green
  "#9333ea", // purple
  "#db2777", // pink
  "#ea580c", // orange
  "#0d9488", // teal
  "#4f46e5", // indigo
  "#65a30d", // lime
];

export function getUserColor(name: string): string {
  let hash = 0;

  for (let i = 0; i < name.length; i++) {
    hash = (hash * 31 + name.charCodeAt(i)) | 0;
  }

  const idx = Math.abs(hash) % USER_COLORS.length;
  return USER_COLORS[idx];
}
