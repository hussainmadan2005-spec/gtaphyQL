export function formatKB(n) {
  const kb = Number(n) / 1000;         
  if (kb >= 1000) return (kb / 1000).toFixed(2) + " MB";
  return kb.toFixed(0) + " kB";
}