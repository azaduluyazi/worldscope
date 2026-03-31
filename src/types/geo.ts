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

export type LayerGroup =
  | "intel"
  | "conflict"
  | "military"
  | "natural"
  | "environmental"
  | "maritime"
  | "tracking"
  | "cyber"
  | "infrastructure"
  | "finance"
  | "geopolitical"
  | "indices";

export type LayerSourceType =
  | "builtin"       // existing intel-based layers
  | "static"        // GeoJSON/JSON files in public/geo/
  | "api"           // dynamic API endpoints
  | "computed"      // client-side computed (e.g. day/night terminator)
  | "promoted"      // existing data promoted to layer (finance-geo)
  | "choropleth";   // country-fill by index value

export type LayerRenderType =
  | "points"
  | "polygons"
  | "lines"
  | "choropleth"
  | "heatmap";

export interface MapLayer {
  id: string;
  label: string;
  icon: string;
  color: string;
  enabled: boolean;
  group: LayerGroup;
  description?: string;
  /** i18n key — falls back to label if missing */
  labelKey?: string;
  /** Data source type */
  sourceType?: LayerSourceType;
  /** URL for static GeoJSON files in /geo/ */
  sourceUrl?: string;
  /** API route for dynamic layers */
  apiEndpoint?: string;
  /** Refresh interval in ms for dynamic layers */
  refreshInterval?: number;
  /** Render type on map */
  renderType?: LayerRenderType;
  /** Max points to render (performance cap) */
  maxPoints?: number;
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
}
