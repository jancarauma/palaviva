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
      return "Difficult";
    case 3:
      return "Medium";
    case 4:
      return "Comfortable";
    case 5:
      return "Mastered";
    default:
      return "Unknown";
  }
}

export function getComfortColor(level: number): string {
  return [
    "bg-gray-300",
    "bg-red-300",
    "bg-yellow-300",
    "bg-blue-300",
    "bg-green-300",
  ][level - 1];
}
