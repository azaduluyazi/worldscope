"use client";

import { useEffect, useRef } from "react";
import { useTranslations } from "next-intl";
import * as d3 from "d3";
import type { IntelItem } from "@/types/intel";

interface ActivityHeatmapProps {
  items: IntelItem[];
}

const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const HOURS = Array.from({ length: 24 }, (_, i) => i);
const CELL_SIZE = 18;
const MARGIN = { top: 20, right: 10, bottom: 10, left: 32 };

export function ActivityHeatmap({ items }: ActivityHeatmapProps) {
  const t = useTranslations("analytics");
  const svgRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    if (!svgRef.current || !items.length) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove();

    // Build day x hour matrix
    const matrix: number[][] = Array.from({ length: 7 }, () => Array(24).fill(0));
    for (const item of items) {
      const d = new Date(item.publishedAt);
      if (isNaN(d.getTime())) continue;
      matrix[d.getDay()][d.getHours()]++;
    }

    const maxVal = Math.max(1, ...matrix.flat());
    const colorScale = d3.scaleSequential(d3.interpolateViridis).domain([0, maxVal]);

    const width = MARGIN.left + HOURS.length * CELL_SIZE + MARGIN.right;
    const height = MARGIN.top + DAYS.length * CELL_SIZE + MARGIN.bottom;

    svg.attr("viewBox", `0 0 ${width} ${height}`);

    // Hour labels (top)
    svg.selectAll(".hour-label")
      .data(HOURS.filter((h) => h % 3 === 0))
      .join("text")
      .attr("class", "hour-label")
      .attr("x", (d) => MARGIN.left + d * CELL_SIZE + CELL_SIZE / 2)
      .attr("y", MARGIN.top - 5)
      .attr("text-anchor", "middle")
      .attr("fill", "#5a7a9a")
      .attr("font-size", 7)
      .attr("font-family", "var(--font-mono), monospace")
      .text((d) => `${d}:00`);

    // Day labels (left)
    svg.selectAll(".day-label")
      .data(DAYS)
      .join("text")
      .attr("class", "day-label")
      .attr("x", MARGIN.left - 4)
      .attr("y", (_, i) => MARGIN.top + i * CELL_SIZE + CELL_SIZE / 2 + 1)
      .attr("text-anchor", "end")
      .attr("dominant-baseline", "central")
      .attr("fill", "#5a7a9a")
      .attr("font-size", 7)
      .attr("font-family", "var(--font-mono), monospace")
      .text((d) => d);

    // Cells
    const cellGroup = svg.append("g").attr("transform", `translate(${MARGIN.left},${MARGIN.top})`);

    for (let day = 0; day < 7; day++) {
      for (let hour = 0; hour < 24; hour++) {
        const val = matrix[day][hour];
        cellGroup.append("rect")
          .attr("x", hour * CELL_SIZE)
          .attr("y", day * CELL_SIZE)
          .attr("width", CELL_SIZE - 2)
          .attr("height", CELL_SIZE - 2)
          .attr("rx", 2)
          .attr("fill", val === 0 ? "#0a1628" : colorScale(val))
          .attr("stroke", "#1a2a4a")
          .attr("stroke-width", 0.5)
          .append("title")
          .text(`${DAYS[day]} ${hour}:00 — ${val} events`);
      }
    }
  }, [items]);

  return (
    <div className="bg-hud-surface border border-hud-border rounded-md p-4">
      <div className="font-mono text-[9px] font-bold text-hud-accent tracking-wider mb-3">
        ◆ {t("title")} — Activity Heatmap
      </div>
      {items.length === 0 ? (
        <p className="font-mono text-[8px] text-hud-muted text-center py-8">{t("noData")}</p>
      ) : (
        <svg ref={svgRef} className="w-full" style={{ maxHeight: 180 }} />
      )}
    </div>
  );
}
