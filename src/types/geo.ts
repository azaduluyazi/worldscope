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

/** Active map filter state shared between sidebar and map */
export interface MapFilters {
  /** Active category filters — empty = show all */
  categories: Set<string>;
  /** Active severity filters — empty = show all */
  severities: Set<string>;
  /** Show heatmap overlay */
  heatmap: boolean;
  /** Show cluster grouping */
  clusters: boolean;
  /** Show ADS-B aircraft markers */
  flights: boolean;
  /** Show AIS vessel markers */
  vessels: boolean;
  /** Show GPS jamming zones */
  gpsJamming: boolean;
  /** Show submarine cable landing points */
  cables: boolean;
}
