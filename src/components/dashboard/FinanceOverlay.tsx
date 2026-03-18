"use client";

import { useState, useMemo, memo } from "react";
import { Marker, Popup } from "react-map-gl/mapbox";
import {
  ALL_FINANCE_GEO,
  FINANCE_GEO_COLORS,
  FINANCE_GEO_ICONS,
  FINANCE_GEO_SIZES,
  type FinanceGeoPoint,
} from "@/config/finance-geo";

/**
 * FinanceOverlay — renders stock exchanges, financial centers,
 * central banks, and commodity hubs on the map when Finance variant is active.
 *
 * Uses smaller, subtle markers that don't interfere with intel event markers.
 */

interface FinanceOverlayProps {
  /** Which finance layers to show */
  layers?: {
    exchanges?: boolean;
    financialCenters?: boolean;
    centralBanks?: boolean;
    commodityHubs?: boolean;
  };
}

const DEFAULT_LAYERS = {
  exchanges: true,
  financialCenters: true,
  centralBanks: true,
  commodityHubs: false,
};

function FinanceOverlayInner({ layers = DEFAULT_LAYERS }: FinanceOverlayProps) {
  const [selected, setSelected] = useState<FinanceGeoPoint | null>(null);

  const visiblePoints = useMemo(() => {
    return ALL_FINANCE_GEO.filter((point) => {
      switch (point.type) {
        case "exchange": return layers.exchanges !== false;
        case "financial-center": return layers.financialCenters !== false;
        case "central-bank": return layers.centralBanks !== false;
        case "commodity-hub": return layers.commodityHubs !== false;
        default: return false;
      }
    });
  }, [layers]);

  return (
    <>
      {visiblePoints.map((point) => {
        const color = FINANCE_GEO_COLORS[point.type];
        const size = FINANCE_GEO_SIZES[point.tier];
        const icon = FINANCE_GEO_ICONS[point.type];
        const isSelected = selected?.id === point.id;

        return (
          <Marker
            key={point.id}
            latitude={point.lat}
            longitude={point.lng}
            anchor="center"
            onClick={(e) => {
              e.originalEvent.stopPropagation();
              setSelected(point);
            }}
          >
            <div
              className="cursor-pointer relative transition-transform duration-200"
              title={`${icon} ${point.shortName} — ${point.city}`}
              style={{ transform: isSelected ? "scale(1.6)" : "scale(1)" }}
            >
              {/* Glow ring */}
              <div
                className="absolute rounded-full"
                style={{
                  width: size * 2,
                  height: size * 2,
                  backgroundColor: `${color}10`,
                  border: `1px solid ${color}25`,
                  top: "50%",
                  left: "50%",
                  transform: "translate(-50%, -50%)",
                }}
              />
              {/* Main dot */}
              <div
                className="relative z-10 rounded-full border"
                style={{
                  width: size,
                  height: size,
                  backgroundColor: `${color}cc`,
                  borderColor: color,
                  boxShadow: `0 0 ${size}px ${color}60`,
                }}
              />
              {/* Label for mega tier */}
              {point.tier === "mega" && (
                <div
                  className="absolute whitespace-nowrap font-mono text-[6px] tracking-wider"
                  style={{
                    color: `${color}cc`,
                    top: size + 2,
                    left: "50%",
                    transform: "translateX(-50%)",
                    textShadow: "0 0 4px rgba(0,0,0,0.8)",
                  }}
                >
                  {point.shortName}
                </div>
              )}
            </div>
          </Marker>
        );
      })}

      {/* Popup for selected finance point */}
      {selected && (
        <Popup
          latitude={selected.lat}
          longitude={selected.lng}
          anchor="bottom"
          onClose={() => setSelected(null)}
          closeButton={false}
          className="tactical-popup"
          maxWidth="280px"
          offset={16}
        >
          <div
            className="glass-panel rounded-md p-2.5 min-w-[200px]"
            style={{
              borderLeft: `3px solid ${FINANCE_GEO_COLORS[selected.type]}`,
              background: `linear-gradient(90deg, ${FINANCE_GEO_COLORS[selected.type]}08 0%, rgba(5,10,18,0.92) 30%)`,
            }}
          >
            <div className="flex items-center gap-1.5 mb-1.5">
              <span className="text-sm">{FINANCE_GEO_ICONS[selected.type]}</span>
              <span
                className="font-mono text-[10px] font-bold tracking-wider"
                style={{ color: FINANCE_GEO_COLORS[selected.type] }}
              >
                {selected.shortName}
              </span>
            </div>
            <p className="text-[11px] text-hud-text leading-relaxed mb-1">
              {selected.name}
            </p>
            <p className="text-[9px] text-hud-muted leading-relaxed mb-1.5">
              {selected.detail}
            </p>
            <div className="flex items-center justify-between pt-1 border-t border-hud-border">
              <span className="font-mono text-[7px] text-hud-muted">
                {selected.city}, {selected.country}
              </span>
              {selected.marketCap && (
                <span
                  className="font-mono text-[8px] px-1 rounded"
                  style={{
                    backgroundColor: `${FINANCE_GEO_COLORS[selected.type]}15`,
                    color: FINANCE_GEO_COLORS[selected.type],
                    border: `1px solid ${FINANCE_GEO_COLORS[selected.type]}30`,
                  }}
                >
                  ${selected.marketCap}T
                </span>
              )}
            </div>
          </div>
        </Popup>
      )}
    </>
  );
}

export const FinanceOverlay = memo(FinanceOverlayInner);
