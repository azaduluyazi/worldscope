export interface ThreatCategory {
  id: string;
  label: string;
  weight: number;
  color: string;
}

export const THREAT_CATEGORIES: ThreatCategory[] = [
  { id: "military", label: "Military", weight: 0.3, color: "#ff4757" },
  { id: "economic", label: "Economic", weight: 0.25, color: "#ffd000" },
  { id: "cyber", label: "Cyber", weight: 0.2, color: "#00e5ff" },
  { id: "natural", label: "Natural", weight: 0.15, color: "#00ff88" },
  { id: "health", label: "Health", weight: 0.1, color: "#8a5cf6" },
];
