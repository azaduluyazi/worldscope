"use client";

import { useEffect, useState, useCallback, useRef, type MouseEvent as ReactMouseEvent } from "react";

// ── Types ──────────────────────────────────────────────────────────

interface GraphNode {
  id: string;
  label: string;
  region: string;
  size: number;
  x: number;
  y: number;
}

interface GraphEdge {
  source: string;
  target: string;
  weight: number;
  type: "conflict" | "trade" | "alliance" | "diplomatic";
}

interface RelationshipGraph {
  nodes: GraphNode[];
  edges: GraphEdge[];
}

// ── Constants ──────────────────────────────────────────────────────

const REGION_COLORS: Record<string, string> = {
  americas: "#00e5ff",
  europe: "#00ff88",
  asia: "#ffd000",
  middle_east: "#ff4757",
  africa: "#8a5cf6",
  oceania: "#ff6b81",
};

const EDGE_COLORS: Record<string, string> = {
  conflict: "#ff4757",
  trade: "#ffd000",
  diplomatic: "#8a5cf6",
  alliance: "#00e5ff",
};

const COUNTRY_FLAGS: Record<string, string> = {
  US: "\uD83C\uDDFA\uD83C\uDDF8", CA: "\uD83C\uDDE8\uD83C\uDDE6", MX: "\uD83C\uDDF2\uD83C\uDDFD",
  BR: "\uD83C\uDDE7\uD83C\uDDF7", AR: "\uD83C\uDDE6\uD83C\uDDF7", CO: "\uD83C\uDDE8\uD83C\uDDF4",
  CL: "\uD83C\uDDE8\uD83C\uDDF1", PE: "\uD83C\uDDF5\uD83C\uDDEA", GB: "\uD83C\uDDEC\uD83C\uDDE7",
  DE: "\uD83C\uDDE9\uD83C\uDDEA", FR: "\uD83C\uDDEB\uD83C\uDDF7", IT: "\uD83C\uDDEE\uD83C\uDDF9",
  ES: "\uD83C\uDDEA\uD83C\uDDF8", PL: "\uD83C\uDDF5\uD83C\uDDF1", NL: "\uD83C\uDDF3\uD83C\uDDF1",
  SE: "\uD83C\uDDF8\uD83C\uDDEA", NO: "\uD83C\uDDF3\uD83C\uDDF4", FI: "\uD83C\uDDEB\uD83C\uDDEE",
  UA: "\uD83C\uDDFA\uD83C\uDDE6", RO: "\uD83C\uDDF7\uD83C\uDDF4", GR: "\uD83C\uDDEC\uD83C\uDDF7",
  PT: "\uD83C\uDDF5\uD83C\uDDF9", CZ: "\uD83C\uDDE8\uD83C\uDDFF", HU: "\uD83C\uDDED\uD83C\uDDFA",
  AT: "\uD83C\uDDE6\uD83C\uDDF9", CH: "\uD83C\uDDE8\uD83C\uDDED", BE: "\uD83C\uDDE7\uD83C\uDDEA",
  DK: "\uD83C\uDDE9\uD83C\uDDF0", RU: "\uD83C\uDDF7\uD83C\uDDFA", CN: "\uD83C\uDDE8\uD83C\uDDF3",
  JP: "\uD83C\uDDEF\uD83C\uDDF5", KR: "\uD83C\uDDF0\uD83C\uDDF7", KP: "\uD83C\uDDF0\uD83C\uDDF5",
  IN: "\uD83C\uDDEE\uD83C\uDDF3", PK: "\uD83C\uDDF5\uD83C\uDDF0", BD: "\uD83C\uDDE7\uD83C\uDDE9",
  TH: "\uD83C\uDDF9\uD83C\uDDED", VN: "\uD83C\uDDFB\uD83C\uDDF3", ID: "\uD83C\uDDEE\uD83C\uDDE9",
  MY: "\uD83C\uDDF2\uD83C\uDDFE", PH: "\uD83C\uDDF5\uD83C\uDDED", TW: "\uD83C\uDDF9\uD83C\uDDFC",
  MM: "\uD83C\uDDF2\uD83C\uDDF2", AF: "\uD83C\uDDE6\uD83C\uDDEB", TR: "\uD83C\uDDF9\uD83C\uDDF7",
  IL: "\uD83C\uDDEE\uD83C\uDDF1", IR: "\uD83C\uDDEE\uD83C\uDDF7", IQ: "\uD83C\uDDEE\uD83C\uDDF6",
  SA: "\uD83C\uDDF8\uD83C\uDDE6", AE: "\uD83C\uDDE6\uD83C\uDDEA", SY: "\uD83C\uDDF8\uD83C\uDDFE",
  YE: "\uD83C\uDDFE\uD83C\uDDEA", LB: "\uD83C\uDDF1\uD83C\uDDE7", JO: "\uD83C\uDDEF\uD83C\uDDF4",
  PS: "\uD83C\uDDF5\uD83C\uDDF8", EG: "\uD83C\uDDEA\uD83C\uDDEC", ZA: "\uD83C\uDDFF\uD83C\uDDE6",
  NG: "\uD83C\uDDF3\uD83C\uDDEC", KE: "\uD83C\uDDF0\uD83C\uDDEA", ET: "\uD83C\uDDEA\uD83C\uDDF9",
  SD: "\uD83C\uDDF8\uD83C\uDDE9", LY: "\uD83C\uDDF1\uD83C\uDDFE", SO: "\uD83C\uDDF8\uD83C\uDDF4",
  CD: "\uD83C\uDDE8\uD83C\uDDE9", ML: "\uD83C\uDDF2\uD83C\uDDF1", AU: "\uD83C\uDDE6\uD83C\uDDFA",
  NZ: "\uD83C\uDDF3\uD83C\uDDFF",
};

const SVG_W = 800;
const SVG_H = 600;

// ── Component ──────────────────────────────────────────────────────

export default function RelationshipGraph() {
  const [graph, setGraph] = useState<RelationshipGraph | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [zoom, setZoom] = useState(1);
  const [tooltip, setTooltip] = useState<{ x: number; y: number; text: string } | null>(null);
  const [dragNode, setDragNode] = useState<string | null>(null);
  const svgRef = useRef<SVGSVGElement>(null);

  // Fetch graph data
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/geo/relationships");
        if (!res.ok) throw new Error("Failed to fetch");
        const data: RelationshipGraph = await res.json();
        if (!cancelled) {
          setGraph(data);
          setLoading(false);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Unknown error");
          setLoading(false);
        }
      }
    })();
    return () => { cancelled = true; };
  }, []);

  // Get SVG point from mouse event
  const getSVGPoint = useCallback((e: ReactMouseEvent) => {
    const svg = svgRef.current;
    if (!svg) return { x: 0, y: 0 };
    const rect = svg.getBoundingClientRect();
    return {
      x: ((e.clientX - rect.left) / rect.width) * SVG_W / zoom,
      y: ((e.clientY - rect.top) / rect.height) * SVG_H / zoom,
    };
  }, [zoom]);

  // Drag handlers
  const handleMouseDown = useCallback((nodeId: string) => {
    setDragNode(nodeId);
  }, []);

  const handleMouseMove = useCallback((e: ReactMouseEvent) => {
    if (!dragNode || !graph) return;
    const pt = getSVGPoint(e);
    setGraph((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        nodes: prev.nodes.map((n) =>
          n.id === dragNode
            ? { ...n, x: Math.max(20, Math.min(SVG_W - 20, pt.x)), y: Math.max(20, Math.min(SVG_H - 20, pt.y)) }
            : n
        ),
      };
    });
  }, [dragNode, graph, getSVGPoint]);

  const handleMouseUp = useCallback(() => {
    setDragNode(null);
  }, []);

  // Zoom handlers
  const zoomIn = useCallback(() => setZoom((z) => Math.min(z * 1.25, 3)), []);
  const zoomOut = useCallback(() => setZoom((z) => Math.max(z / 1.25, 0.5)), []);

  // Node lookup for edges
  const nodeMap = new Map<string, GraphNode>();
  if (graph) {
    for (const n of graph.nodes) nodeMap.set(n.id, n);
  }

  // Max edge weight for opacity scaling
  const maxWeight = graph
    ? Math.max(1, ...graph.edges.map((e) => e.weight))
    : 1;

  // Node radius scaling
  const maxSize = graph
    ? Math.max(1, ...graph.nodes.map((n) => n.size))
    : 1;

  const getNodeRadius = (size: number) => 8 + (size / maxSize) * 16;

  // ── Render ────────────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full min-h-[400px] bg-hud-base/80 rounded-lg border border-hud-border">
        <div className="text-hud-muted font-mono text-xs animate-pulse">
          Loading relationship graph...
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-full min-h-[400px] bg-hud-base/80 rounded-lg border border-hud-border">
        <div className="text-red-400 font-mono text-xs">
          Error: {error}
        </div>
      </div>
    );
  }

  if (!graph || graph.nodes.length === 0) {
    return (
      <div className="flex items-center justify-center h-full min-h-[400px] bg-hud-base/80 rounded-lg border border-hud-border">
        <div className="text-hud-muted font-mono text-xs">
          No relationship data available. Events need country codes to build the graph.
        </div>
      </div>
    );
  }

  return (
    <div className="relative w-full bg-[#050a12] rounded-lg border border-hud-border overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-hud-border bg-hud-base/60">
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-mono text-hud-muted uppercase tracking-wider">
            Geopolitical Relationships
          </span>
          <span className="text-[10px] font-mono text-hud-accent">
            {graph.nodes.length} nations / {graph.edges.length} links
          </span>
        </div>
        {/* Zoom controls */}
        <div className="flex items-center gap-1">
          <button
            onClick={zoomOut}
            className="w-6 h-6 flex items-center justify-center rounded bg-hud-base/80 border border-hud-border text-hud-muted hover:text-hud-text hover:border-hud-accent transition-colors text-xs font-mono"
            aria-label="Zoom out"
          >
            -
          </button>
          <span className="text-[10px] font-mono text-hud-muted w-10 text-center">
            {Math.round(zoom * 100)}%
          </span>
          <button
            onClick={zoomIn}
            className="w-6 h-6 flex items-center justify-center rounded bg-hud-base/80 border border-hud-border text-hud-muted hover:text-hud-text hover:border-hud-accent transition-colors text-xs font-mono"
            aria-label="Zoom in"
          >
            +
          </button>
        </div>
      </div>

      {/* SVG Graph */}
      <svg
        ref={svgRef}
        viewBox={`0 0 ${SVG_W} ${SVG_H}`}
        className="w-full"
        style={{ aspectRatio: `${SVG_W}/${SVG_H}`, cursor: dragNode ? "grabbing" : "default" }}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      >
        {/* Background */}
        <rect width={SVG_W} height={SVG_H} fill="#050a12" />

        {/* Grid lines */}
        {Array.from({ length: 9 }, (_, i) => (
          <line
            key={`vg-${i}`}
            x1={(i + 1) * 80}
            y1={0}
            x2={(i + 1) * 80}
            y2={SVG_H}
            stroke="#0a1628"
            strokeWidth={0.5}
          />
        ))}
        {Array.from({ length: 7 }, (_, i) => (
          <line
            key={`hg-${i}`}
            x1={0}
            y1={(i + 1) * 75}
            x2={SVG_W}
            y2={(i + 1) * 75}
            stroke="#0a1628"
            strokeWidth={0.5}
          />
        ))}

        {/* Zoom transform group */}
        <g transform={`scale(${zoom})`}>
          {/* Edges */}
          {graph.edges.map((edge) => {
            const src = nodeMap.get(edge.source);
            const tgt = nodeMap.get(edge.target);
            if (!src || !tgt) return null;
            const opacity = 0.2 + (edge.weight / maxWeight) * 0.6;
            return (
              <line
                key={`${edge.source}-${edge.target}`}
                x1={src.x}
                y1={src.y}
                x2={tgt.x}
                y2={tgt.y}
                stroke={EDGE_COLORS[edge.type]}
                strokeWidth={1 + (edge.weight / maxWeight) * 2}
                strokeOpacity={opacity}
              />
            );
          })}

          {/* Nodes */}
          {graph.nodes.map((node) => {
            const r = getNodeRadius(node.size);
            const color = REGION_COLORS[node.region] || "#ffffff";
            return (
              <g
                key={node.id}
                style={{ cursor: "grab" }}
                onMouseDown={() => handleMouseDown(node.id)}
                onMouseEnter={(e) => {
                  const rect = svgRef.current?.getBoundingClientRect();
                  if (rect) {
                    setTooltip({
                      x: e.clientX - rect.left,
                      y: e.clientY - rect.top - 30,
                      text: `${COUNTRY_FLAGS[node.id] || ""} ${node.label} — ${node.size} events`,
                    });
                  }
                }}
                onMouseLeave={() => setTooltip(null)}
              >
                {/* Glow */}
                <circle
                  cx={node.x}
                  cy={node.y}
                  r={r + 4}
                  fill={color}
                  opacity={0.15}
                />
                {/* Node circle */}
                <circle
                  cx={node.x}
                  cy={node.y}
                  r={r}
                  fill="#0a1628"
                  stroke={color}
                  strokeWidth={1.5}
                />
                {/* Country code label */}
                <text
                  x={node.x}
                  y={node.y + 1}
                  textAnchor="middle"
                  dominantBaseline="central"
                  fill={color}
                  fontSize={r > 14 ? 10 : 8}
                  fontFamily="var(--font-mono), monospace"
                  fontWeight={500}
                  style={{ pointerEvents: "none", userSelect: "none" }}
                >
                  {node.id}
                </text>
              </g>
            );
          })}
        </g>
      </svg>

      {/* Tooltip overlay */}
      {tooltip && (
        <div
          className="absolute pointer-events-none bg-black/90 border border-hud-border rounded px-2 py-1 text-[10px] font-mono text-hud-text whitespace-nowrap z-10"
          style={{ left: tooltip.x, top: tooltip.y, transform: "translateX(-50%)" }}
        >
          {tooltip.text}
        </div>
      )}

      {/* Legend */}
      <div className="absolute bottom-2 left-2 flex flex-col gap-1 bg-black/70 rounded px-2 py-1.5 border border-hud-border/50">
        <span className="text-[8px] font-mono text-hud-muted uppercase tracking-wider mb-0.5">
          Edge Types
        </span>
        {Object.entries(EDGE_COLORS).map(([type, color]) => (
          <div key={type} className="flex items-center gap-1.5">
            <span className="w-3 h-0.5 inline-block rounded" style={{ backgroundColor: color }} />
            <span className="text-[8px] font-mono text-hud-muted capitalize">{type}</span>
          </div>
        ))}
      </div>

      {/* Region legend */}
      <div className="absolute bottom-2 right-2 flex flex-col gap-1 bg-black/70 rounded px-2 py-1.5 border border-hud-border/50">
        <span className="text-[8px] font-mono text-hud-muted uppercase tracking-wider mb-0.5">
          Regions
        </span>
        {Object.entries(REGION_COLORS).map(([region, color]) => (
          <div key={region} className="flex items-center gap-1.5">
            <span className="w-2 h-2 inline-block rounded-full" style={{ backgroundColor: color }} />
            <span className="text-[8px] font-mono text-hud-muted capitalize">
              {region.replace("_", " ")}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
