import { properties } from "@/data/properties";

/** First image per property, deduped — used when no hero slides are configured. */
export function getDefaultHeroSlides(max = 5): string[] {
  return Array.from(new Set(properties.map((p) => p.images?.[0]).filter(Boolean) as string[])).slice(
    0,
    Math.max(1, max),
  );
}
