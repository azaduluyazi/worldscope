"use client";

import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import useSWR from "swr";
import { useRef, useEffect, useState } from "react";

// react-force-graph uses canvas + measurements that break on SSR — disable.
// The library's strict generic types clash with custom node/link shapes, so
// we relax to a loosely-typed component wrapper. Runtime shape is enforced
// by the GraphData type below.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const ForceGraph2D = dynamic(() => import("react-force-graph-2d"), {
  ssr: false,
  loading: () => (
    <div className="h-[500px] grid place-items-center text-white/40 font-mono text-xs">
      Loading graph…
    </div>
  ),
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
}) as unknown as React.FC<any>;

const TYPE_COLORS: Record<string, string> = {
  person: "#00e5ff",
  organization: "#8a5cf6",
  country: "#ffd000",
  topic: "#00ff88",
};

type GraphData = {
  nodes: Array<{
    id: number;
    slug: string;
    name: string;
    type: string;
    val: number;
  }>;
  links: Array<{ source: number; target: number; value: number }>;
};

const fetcher = (url: string) => fetch(url).then((r) => r.json());

export default function EntityGraph({ slug }: { slug: string }) {
  const router = useRouter();
  const { data, error } = useSWR<GraphData>(
    `/api/entities/${slug}/graph`,
    fetcher
  );
  const containerRef = useRef<HTMLDivElement>(null);
  const [dims, setDims] = useState({ width: 800, height: 500 });

  useEffect(() => {
    if (!containerRef.current) return;
    const el = containerRef.current;
    const ro = new ResizeObserver((entries) => {
      for (const entry of entries) {
        setDims({
          width: Math.floor(entry.contentRect.width),
          height: 500,
        });
      }
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  if (error) {
    return (
      <div className="h-[500px] grid place-items-center text-red-400 font-mono text-xs">
        Graph load failed.
      </div>
    );
  }
  if (!data?.nodes) {
    return (
      <div className="h-[500px] grid place-items-center text-white/40 font-mono text-xs">
        Loading graph…
      </div>
    );
  }
  if (data.nodes.length <= 1) {
    return (
      <div className="h-[500px] grid place-items-center text-white/40 font-mono text-xs">
        No connections yet — this entity needs more co-occurrences before a
        graph is meaningful.
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className="h-[500px] w-full border border-white/10 rounded bg-black"
    >
      <ForceGraph2D
        graphData={data}
        width={dims.width}
        height={dims.height}
        backgroundColor="#000"
        nodeColor={(n: { type?: string }) => TYPE_COLORS[n.type || "topic"] || "#888"}
        nodeLabel={(n: { name?: string; type?: string }) => `${n.name} (${n.type})`}
        nodeRelSize={6}
        linkColor={() => "rgba(255,255,255,0.18)"}
        linkWidth={(l: { value?: number }) => Math.log((l.value ?? 1) + 1) + 0.3}
        enableNodeDrag={false}
        cooldownTicks={80}
        onNodeClick={(node: { slug?: string }) => {
          if (node?.slug) router.push(`/entity/${node.slug}`);
        }}
      />
    </div>
  );
}
