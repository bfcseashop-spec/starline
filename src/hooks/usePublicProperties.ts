import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { ProjectSummary } from "@/data/siteContent";

export type PublicPropertyCategory = "upcoming" | "ongoing" | "handover";

const STATUS_BY_CATEGORY: Record<PublicPropertyCategory, string[]> = {
  upcoming: ["planned"],
  ongoing: ["in_progress", "on_hold", "for_sale", "for_rent"],
  handover: ["completed"],
};

interface CustomerProjectRow {
  id: string;
  project_name: string;
  location: string | null;
  status: string;
  building_image_url: string | null;
}

interface ProjectImageRow {
  project_id: string;
  image_url: string;
  sort_order: number;
}

const splitLocation = (value: string | null): { address: string; city: string } => {
  if (!value) return { address: "Location details coming soon", city: "Dhaka" };
  const parts = value.split(",").map((p) => p.trim()).filter(Boolean);
  if (parts.length === 1) return { address: parts[0], city: "Dhaka" };
  return { address: parts.slice(0, parts.length - 1).join(", "), city: parts[parts.length - 1] };
};

export const usePublicProperties = (
  category: PublicPropertyCategory,
  fallback: ProjectSummary[],
) => {
  const [items, setItems] = useState<ProjectSummary[]>(fallback);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const run = async () => {
      setLoading(true);

      const statuses = STATUS_BY_CATEGORY[category];
      const { data: projects, error } = await supabase
        .from("customer_projects")
        .select("id, project_name, location, status, building_image_url")
        .in("status", statuses)
        .order("created_at", { ascending: false });

      if (error || !projects || projects.length === 0) {
        setItems(fallback);
        setLoading(false);
        return;
      }

      const ids = projects.map((p) => p.id);
      const { data: images } = await supabase
        .from("project_images")
        .select("project_id, image_url, sort_order")
        .in("project_id", ids)
        .order("sort_order", { ascending: true });

      const firstImageByProject: Record<string, string> = {};
      (images as ProjectImageRow[] | null)?.forEach((img) => {
        if (!firstImageByProject[img.project_id]) firstImageByProject[img.project_id] = img.image_url;
      });

      const normalized = (projects as CustomerProjectRow[]).map((p) => {
        const location = splitLocation(p.location);
        const label =
          category === "upcoming"
            ? "Planned Starline property with modern planning and practical use of space."
            : category === "handover"
              ? "Completed and handed-over Starline property with quality-focused delivery."
              : "Active Starline property under development with monitored progress.";

        const fallbackImage =
          fallback.find((f) => f.name.toLowerCase().includes(p.project_name.toLowerCase()))?.image ||
          fallback[0]?.image ||
          "";

        return {
          name: p.project_name,
          address: location.address,
          city: location.city,
          notes: label,
          image: p.building_image_url || firstImageByProject[p.id] || fallbackImage,
        } as ProjectSummary;
      });

      setItems(normalized.length > 0 ? normalized : fallback);
      setLoading(false);
    };

    run();
  }, [category, fallback]);

  return { items, loading };
};

