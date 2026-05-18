import { Link } from "react-router-dom";
import { MapPin, Home, Maximize } from "lucide-react";
import StatusBadge from "@/components/StatusBadge";

interface ProjectCardData {
  id: string;
  slug: string;
  name: string;
  location?: string | null;
  status: string;
  cover_url?: string | null;
  short_description?: string | null;
  price_min?: number | null;
  price_max?: number | null;
  plots_count?: number | null;
  unit_type?: string | null;
  size_min?: number | null;
  size_max?: number | null;
}

const formatBdt = (n?: number | null) => {
  if (!n) return "—";
  if (n >= 10000000) return `৳${(n / 10000000).toFixed(2)} Cr`;
  if (n >= 100000) return `৳${(n / 100000).toFixed(1)} L`;
  return `৳${n.toLocaleString()}`;
};

const ProjectCard = ({ p }: { p: ProjectCardData }) => (
  <Link
    to={`/projects/${p.slug}`}
    className="group bg-card border border-border rounded-2xl overflow-hidden hover:shadow-xl hover:-translate-y-1 transition-all"
  >
    <div className="relative aspect-[16/10] overflow-hidden bg-secondary">
      {p.cover_url ? (
        <img
          src={p.cover_url}
          alt={p.name}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
          loading="lazy"
        />
      ) : (
        <div className="w-full h-full bg-gradient-to-br from-primary/20 to-accent/20" />
      )}
      <div className="absolute top-4 left-4">
        <StatusBadge status={p.status} className="bg-background/90 backdrop-blur" />
      </div>
    </div>
    <div className="p-5">
      <h3 className="text-xl font-semibold text-foreground mb-1 group-hover:text-primary transition-colors">{p.name}</h3>
      {p.location && (
        <div className="flex items-center gap-1.5 text-sm text-muted-foreground mb-3">
          <MapPin size={14} /> {p.location}
        </div>
      )}
      {p.short_description && (
        <p className="text-sm text-muted-foreground line-clamp-2 mb-4">{p.short_description}</p>
      )}
      <div className="grid grid-cols-3 gap-2 text-xs border-t border-border pt-4">
        <div>
          <div className="text-muted-foreground">Price</div>
          <div className="font-semibold text-foreground">{formatBdt(p.price_min)}+</div>
        </div>
        <div>
          <div className="text-muted-foreground flex items-center gap-1"><Home size={12} /> {p.unit_type === "plot" ? "Plots" : "Units"}</div>
          <div className="font-semibold text-foreground">{p.plots_count || "—"}</div>
        </div>
        <div>
          <div className="text-muted-foreground flex items-center gap-1"><Maximize size={12} /> Size</div>
          <div className="font-semibold text-foreground">{p.size_min || "—"}-{p.size_max || "—"}</div>
        </div>
      </div>
    </div>
  </Link>
);

export default ProjectCard;
