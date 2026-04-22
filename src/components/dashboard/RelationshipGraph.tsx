"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import * as d3 from "d3";

// ── Types ──────────────────────────────────────────────────────────

interface GraphNode extends d3.SimulationNodeDatum {
  id: string;
  label: string;
  region: string;
  size: number;
}

interface GraphEdge {
  source: string;
  target: string;
  weight: number;
  type: "conflict" | "trade" | "alliance" | "diplomatic";
}

interface RelationshipGraphData {
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

const SVG_W = 900;
const SVG_H = 650;

// ── Component ──────────────────────────────────────────────────────

export default function RelationshipGraph() {
  const svgRef = useRef<SVGSVGElement>(null);
  const simulationRef = useRef<d3.Simulation<GraphNode, d3.SimulationLinkDatum<GraphNode>> | null>(null);
  const [graph, setGraph] = useState<RelationshipGraphData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hoveredNode, setHoveredNode] = useState<string | null>(null);
  const [tooltip, setTooltip] = useState<{ x: number; y: number; text: string } | null>(null);

  // Fetch graph data
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/geo/relationships");
        if (!res.ok) throw new Error("Failed to fetch");
        const data: RelationshipGraphData = await res.json();
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

  // Get connected node IDs for highlight
  const getConnectedIds = useCallback((nodeId: string) => {
    if (!graph) return new Set<string>();
    const ids = new Set<string>([nodeId]);
    for (const e of graph.edges) {
      if (e.source === nodeId || (e.source as unknown as GraphNode)?.id === nodeId) {
        const tid = typeof e.target === "string" ? e.target : (e.target as unknown as GraphNode).id;
        ids.add(tid);
      }
      if (e.target === nodeId || (e.target as unknown as GraphNode)?.id === nodeId) {
        const sid = typeof e.source === "string" ? e.source : (e.source as unknown as GraphNode).id;
        ids.add(sid);
      }
    }
    return ids;
  }, [graph]);

  // D3 Force Simulation
  useEffect(() => {
    if (!graph || !svgRef.current || graph.nodes.length === 0) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove();

    const maxSize = Math.max(1, ...graph.nodes.map((n) => n.size));
    const maxWeight = Math.max(1, ...graph.edges.map((e) => e.weight));
    const getRadius = (size: number) => 10 + (size / maxSize) * 18;

    // Background
    svg.append("rect").attr("width", SVG_W).attr("height", SVG_H).attr("fill", "#050a12");

    // Grid
    const gridG = svg.append("g").attr("class", "grid");
    for (let i = 1; i < 10; i++) {
      gridG.append("line").attr("x1", i * 90).attr("y1", 0).attr("x2", i * 90).attr("y2", SVG_H).attr("stroke", "#0a1628").attr("stroke-width", 0.5);
    }
    for (let i = 1; i < 8; i++) {
      gridG.append("line").attr("x1", 0).attr("y1", i * 81).attr("x2", SVG_W).attr("y2", i * 81).attr("stroke", "#0a1628").attr("stroke-width", 0.5);
    }

    // Defs for glow filter
    const defs = svg.append("defs");
    const filter = defs.append("filter").attr("id", "glow");
    filter.append("feGaussianBlur").attr("stdDeviation", "3").attr("result", "coloredBlur");
    const feMerge = filter.append("feMerge");
    feMerge.append("feMergeNode").attr("in", "coloredBlur");
    feMerge.append("feMergeNode").attr("in", "SourceGraphic");

    // Container for zoom
    const container = svg.append("g");

    // Zoom behavior
    const zoomBehavior = d3.zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.4, 3])
      .on("zoom", (event) => {
        container.attr("transform", event.transform);
      });
    svg.call(zoomBehavior);

    // Create links
    const linkG = container.append("g").attr("class", "links");
    const links = linkG.selectAll("line")
      .data(graph.edges)
      .join("line")
      .attr("stroke", (d) => EDGE_COLORS[d.type] || "#ffffff")
      .attr("stroke-width", (d) => 1 + (d.weight / maxWeight) * 2.5)
      .attr("stroke-opacity", (d) => 0.15 + (d.weight / maxWeight) * 0.5)
      .attr("stroke-dasharray", (d) => d.type === "conflict" ? "6,3" : d.type === "trade" ? "none" : "3,3");

    // Create node groups
    const nodeG = container.append("g").attr("class", "nodes");
    const nodes = nodeG.selectAll("g")
      .data(graph.nodes)
      .join("g")
      .attr("cursor", "grab")
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .call(d3.drag<any, GraphNode>()
        .on("start", (event, d) => {
          if (!event.active) simulation.alphaTarget(0.3).restart();
          d.fx = d.x;
          d.fy = d.y;
        })
        .on("drag", (event, d) => {
          d.fx = event.x;
          d.fy = event.y;
        })
        .on("end", (event, d) => {
          if (!event.active) simulation.alphaTarget(0);
          d.fx = null;
          d.fy = null;
        })
      );

    // Node glow circle
    nodes.append("circle")
      .attr("r", (d) => getRadius(d.size) + 6)
      .attr("fill", (d) => REGION_COLORS[d.region] || "#ffffff")
      .attr("opacity", 0.12)
      .attr("filter", "url(#glow)");

    // Node main circle
    nodes.append("circle")
      .attr("r", (d) => getRadius(d.size))
      .attr("fill", "#0a1628")
      .attr("stroke", (d) => REGION_COLORS[d.region] || "#ffffff")
      .attr("stroke-width", 2);

    // Node label
    nodes.append("text")
      .attr("text-anchor", "middle")
      .attr("dominant-baseline", "central")
      .attr("fill", (d) => REGION_COLORS[d.region] || "#ffffff")
      .attr("font-size", (d) => getRadius(d.size) > 16 ? 11 : 9)
      .attr("font-family", "var(--font-mono), monospace")
      .attr("font-weight", 600)
      .attr("pointer-events", "none")
      .text((d) => d.id);

    // Hover handlers
    nodes.on("mouseenter", (event, d) => {
      setHoveredNode(d.id);
      const rect = svgRef.current?.getBoundingClientRect();
      if (rect) {
        setTooltip({
          x: event.clientX - rect.left,
          y: event.clientY - rect.top - 36,
          text: `${COUNTRY_FLAGS[d.id] || ""} ${d.label} — ${d.size} events`,
        });
      }
    }).on("mouseleave", () => {
      setHoveredNode(null);
      setTooltip(null);
    });

    // Force simulation
    const simulation = d3.forceSimulation(graph.nodes)
      .force("link", d3.forceLink(graph.edges)
        .id((d) => (d as GraphNode).id)
        .distance((d) => 80 - ((d as GraphEdge).weight / maxWeight) * 30)
        .strength((d) => 0.3 + ((d as GraphEdge).weight / maxWeight) * 0.4)
      )
      .force("charge", d3.forceManyBody().strength(-200))
      .force("center", d3.forceCenter(SVG_W / 2, SVG_H / 2))
      .force("collision", d3.forceCollide().radius((d) => getRadius((d as GraphNode).size) + 8))
      .force("x", d3.forceX(SVG_W / 2).strength(0.05))
      .force("y", d3.forceY(SVG_H / 2).strength(0.05))
      .alpha(1)
      .alphaDecay(0.02);

    simulation.on("tick", () => {
      links
        .attr("x1", (d) => ((d.source as unknown as GraphNode).x ?? 0))
        .attr("y1", (d) => ((d.source as unknown as GraphNode).y ?? 0))
        .attr("x2", (d) => ((d.target as unknown as GraphNode).x ?? 0))
        .attr("y2", (d) => ((d.target as unknown as GraphNode).y ?? 0));

      nodes.attr("transform", (d) => `translate(${d.x ?? 0},${d.y ?? 0})`);
    });

    simulationRef.current = simulation;

    return () => {
      // Unbind tick handler so it can't fire with stale DOM refs during
      // the teardown window, then halt the physics loop and release the
      // ref so the simulation object is GC-eligible.
      simulation.on("tick", null);
      simulation.stop();
      simulationRef.current = null;
    };
  }, [graph]);

  // Highlight connected nodes on hover
  useEffect(() => {
    if (!svgRef.current || !graph) return;
    const svg = d3.select(svgRef.current);

    if (hoveredNode) {
      const connected = getConnectedIds(hoveredNode);
      svg.selectAll(".nodes g").attr("opacity", (d) =>
        connected.has((d as GraphNode).id) ? 1 : 0.15
      );
      svg.selectAll(".links line").attr("opacity", (d) => {
        const edge = d as GraphEdge;
        const sid = typeof edge.source === "string" ? edge.source : (edge.source as unknown as GraphNode).id;
        const tid = typeof edge.target === "string" ? edge.target : (edge.target as unknown as GraphNode).id;
        return (sid === hoveredNode || tid === hoveredNode) ? 0.9 : 0.05;
      });
    } else {
      svg.selectAll(".nodes g").attr("opacity", 1);
      svg.selectAll(".links line").attr("opacity", null);
    }
  }, [hoveredNode, graph, getConnectedIds]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full min-h-[400px] bg-hud-base/80 rounded-lg border border-hud-border">
        <div className="text-hud-muted font-mono text-xs animate-pulse">Loading relationship graph...</div>
      </div>
    );
  }

  if (error || !graph || graph.nodes.length === 0) {
    return (
      <div className="flex items-center justify-center h-full min-h-[400px] bg-hud-base/80 rounded-lg border border-hud-border">
        <div className="text-hud-muted font-mono text-xs">
          {error ? `Error: ${error}` : "No relationship data available."}
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
        <span className="text-[9px] font-mono text-hud-muted">Scroll to zoom / Drag nodes</span>
      </div>

      {/* D3 SVG */}
      <svg
        ref={svgRef}
        viewBox={`0 0 ${SVG_W} ${SVG_H}`}
        className="w-full"
        style={{ aspectRatio: `${SVG_W}/${SVG_H}` }}
      />

      {/* Tooltip */}
      {tooltip && (
        <div
          className="absolute pointer-events-none bg-black/90 border border-hud-border rounded px-2 py-1 text-[10px] font-mono text-hud-text whitespace-nowrap z-10"
          style={{ left: tooltip.x, top: tooltip.y, transform: "translateX(-50%)" }}
        >
          {tooltip.text}
        </div>
      )}

      {/* Edge Legend */}
      <div className="absolute bottom-2 left-2 flex flex-col gap-1 bg-black/70 rounded px-2 py-1.5 border border-hud-border/50">
        <span className="text-[8px] font-mono text-hud-muted uppercase tracking-wider mb-0.5">Edge Types</span>
        {Object.entries(EDGE_COLORS).map(([type, color]) => (
          <div key={type} className="flex items-center gap-1.5">
            <span className="w-3 h-0.5 inline-block rounded" style={{ backgroundColor: color }} />
            <span className="text-[8px] font-mono text-hud-muted capitalize">{type}</span>
          </div>
        ))}
      </div>

      {/* Region Legend */}
      <div className="absolute bottom-2 right-2 flex flex-col gap-1 bg-black/70 rounded px-2 py-1.5 border border-hud-border/50">
        <span className="text-[8px] font-mono text-hud-muted uppercase tracking-wider mb-0.5">Regions</span>
        {Object.entries(REGION_COLORS).map(([region, color]) => (
          <div key={region} className="flex items-center gap-1.5">
            <span className="w-2 h-2 inline-block rounded-full" style={{ backgroundColor: color }} />
            <span className="text-[8px] font-mono text-hud-muted capitalize">{region.replace("_", " ")}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
