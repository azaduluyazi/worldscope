"use client";

import { useState, useCallback, ReactNode } from "react";
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
  arrayMove,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

const STORAGE_KEY = "ws-panel-order";

interface PanelConfig {
  id: string;
  label: string;
  node: ReactNode;
}

function SortablePanel({ id, label, children }: { id: string; label: string; children: ReactNode }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 50 : undefined,
    opacity: isDragging ? 0.8 : 1,
  };

  return (
    <div ref={setNodeRef} style={style} className="flex-1 min-h-0 relative group">
      {/* Drag handle — only visible on hover */}
      <div
        {...attributes}
        {...listeners}
        className="absolute top-0.5 left-1/2 -translate-x-1/2 z-40 opacity-0 group-hover:opacity-100 transition-opacity cursor-grab active:cursor-grabbing"
        title={`Drag to reorder: ${label}`}
      >
        <div className="flex items-center gap-0.5 px-2 py-0.5 bg-hud-surface/90 border border-hud-border rounded backdrop-blur-sm">
          <svg width={10} height={10} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="text-hud-muted">
            <circle cx="9" cy="6" r="1" fill="currentColor" />
            <circle cx="15" cy="6" r="1" fill="currentColor" />
            <circle cx="9" cy="12" r="1" fill="currentColor" />
            <circle cx="15" cy="12" r="1" fill="currentColor" />
            <circle cx="9" cy="18" r="1" fill="currentColor" />
            <circle cx="15" cy="18" r="1" fill="currentColor" />
          </svg>
          <span className="font-mono text-[6px] text-hud-muted tracking-wider">{label}</span>
        </div>
      </div>
      {children}
    </div>
  );
}

interface SortablePanelsProps {
  panels: PanelConfig[];
  className?: string;
}

export function SortablePanels({ panels, className = "" }: SortablePanelsProps) {
  // Load saved order from localStorage
  const [order, setOrder] = useState<string[]>(() => {
    if (typeof window === "undefined") return panels.map((p) => p.id);
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored) as string[];
        // Validate: all panel IDs must exist
        const panelIds = new Set(panels.map((p) => p.id));
        if (parsed.every((id: string) => panelIds.has(id)) && parsed.length === panels.length) {
          return parsed;
        }
      }
    } catch { /* ignore */ }
    return panels.map((p) => p.id);
  });

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } })
  );

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      const { active, over } = event;
      if (!over || active.id === over.id) return;

      setOrder((prev) => {
        const oldIndex = prev.indexOf(String(active.id));
        const newIndex = prev.indexOf(String(over.id));
        const next = arrayMove(prev, oldIndex, newIndex);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
        return next;
      });
    },
    []
  );

  // Sort panels by saved order
  const sortedPanels = order
    .map((id) => panels.find((p) => p.id === id))
    .filter(Boolean) as PanelConfig[];

  return (
    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
      <SortableContext items={order} strategy={verticalListSortingStrategy}>
        <div className={`flex flex-col gap-1 ${className}`}>
          {sortedPanels.map((panel) => (
            <SortablePanel key={panel.id} id={panel.id} label={panel.label}>
              {panel.node}
            </SortablePanel>
          ))}
        </div>
      </SortableContext>
    </DndContext>
  );
}
