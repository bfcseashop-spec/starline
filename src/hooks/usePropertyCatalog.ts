import { useQuery } from "@tanstack/react-query";
import { backend } from "@/lib/backendClient";
import { properties as fallbackProperties, type Property } from "@/data/properties";

export type PortfolioTemplateOption = {
  slug: string;
  title: string;
  location: string;
  coverImage: string | null;
};

export function mapCatalogToPortfolioTemplates(catalog: Property[]): PortfolioTemplateOption[] {
  return catalog.map((p) => ({
    slug: p.slug,
    title: p.title,
    location: p.location,
    coverImage: p.images?.[0] ?? null,
  }));
}

export async function fetchPortfolioTemplates(): Promise<PortfolioTemplateOption[]> {
  const catalog = await fetchPropertyCatalog();
  return mapCatalogToPortfolioTemplates(catalog);
}

export function usePortfolioTemplates(enabled: boolean) {
  return useQuery({
    queryKey: ["portfolio-templates"],
    queryFn: fetchPortfolioTemplates,
    enabled,
    staleTime: 60_000,
  });
}

function catalogFromSettings(value: unknown): Property[] | null {
  if (!value || typeof value !== "object") return null;
  const items = (value as { items?: unknown }).items;
  if (!Array.isArray(items) || items.length === 0) return null;
  return items as Property[];
}

/** Loads featured portfolio from site_settings.marketing_properties; falls back to static data when unset. */
export async function fetchPropertyCatalog(): Promise<Property[]> {
  const { data: row, error } = await backend.from("site_settings").select().eq("setting_key", "marketing_properties").single();
  if (error || !row) return fallbackProperties;
  const catalog = catalogFromSettings((row as { setting_value?: unknown }).setting_value);
  return catalog ?? fallbackProperties;
}

export function usePropertyCatalog() {
  return useQuery({
    queryKey: ["property-catalog"],
    queryFn: fetchPropertyCatalog,
    staleTime: 60_000,
  });
}
