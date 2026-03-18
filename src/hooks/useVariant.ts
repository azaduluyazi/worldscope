"use client";

import { usePathname } from "next/navigation";
import { VARIANTS, DEFAULT_VARIANT, type VariantId, type Variant } from "@/config/variants";

const PATHNAME_MAP: Record<string, VariantId> = {
  "/": "world",
  "/tech": "tech",
  "/finance": "finance",
};

export function useVariant(): {
  variant: Variant;
  variantId: VariantId;
  isActive: (id: VariantId) => boolean;
} {
  const pathname = usePathname();
  const variantId = PATHNAME_MAP[pathname] || DEFAULT_VARIANT;
  const variant = VARIANTS[variantId];

  return {
    variant,
    variantId,
    isActive: (id: VariantId) => id === variantId,
  };
}
