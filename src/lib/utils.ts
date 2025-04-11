// lib/utils.ts
export function formatDate(timestamp: number): string {
  return new Date(timestamp).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function getComfortLevelName(comfort: number): string {
  switch (comfort) {
    case 1:
      return "Unknown";
    case 2:
      return "Hard";
    case 3:
      return "Medium";
    case 4:
      return "Easy";
    case 5:
      return "Known";
    default:
      return "Unknown";
  }
}

export function getComfortColor(level: number): string {
  return [
    "bg-red-500",
    "bg-orange-500",
    "bg-yellow-500",
    "bg-green-300",
    "bg-green-500",
  ][level - 1];
}
