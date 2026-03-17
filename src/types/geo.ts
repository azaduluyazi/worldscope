export interface Coordinate {
  lat: number;
  lng: number;
}

export interface MapEvent {
  id: string;
  coordinate: Coordinate;
  severity: "critical" | "high" | "medium" | "low" | "info";
  category: string;
  title: string;
  count?: number;
}

export interface MapLayer {
  id: string;
  label: string;
  icon: string;
  color: string;
  enabled: boolean;
}
