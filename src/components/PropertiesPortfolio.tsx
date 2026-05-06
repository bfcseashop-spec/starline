import { Card, CardContent } from "@/components/ui/card";
import { MapPin, Building2 } from "lucide-react";
import type { ProjectSummary } from "@/data/siteContent";
import { Link } from "react-router-dom";

interface Props {
  items: ProjectSummary[];
  statusLabel: string;
  loading?: boolean;
}

const PropertiesPortfolio = ({ items, statusLabel, loading = false }: Props) => {
  const renderCard = (p: ProjectSummary) => (
    <Card className="overflow-hidden border-border/80 rounded-2xl shadow-sm hover:shadow-lg transition-shadow">
      <div className="grid md:grid-cols-[360px_1fr]">
        <div className="relative min-h-[220px] md:min-h-full">
          <img src={p.image} alt={p.name} className="absolute inset-0 w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/65 via-black/20 to-transparent" />
          <div className="absolute left-4 top-4 bg-gold-gradient text-accent-foreground text-xs font-semibold px-3 py-1 rounded-full">
            {statusLabel}
          </div>
          <div className="absolute bottom-4 left-4 right-4 text-white">
            <h3 className="font-heading text-xl leading-tight">{p.name}</h3>
          </div>
        </div>
        <CardContent className="p-6 flex flex-col gap-4">
          <div className="inline-flex items-center gap-2 text-xs font-medium text-gold bg-gold/10 px-3 py-1 rounded-full w-fit">
            <Building2 size={14} />
            Starline Properties
          </div>
          <p className="text-muted-foreground text-sm flex items-start gap-2 leading-relaxed">
            <MapPin size={16} className="text-gold mt-0.5 shrink-0" />
            <span>
              {p.address}, {p.city}
            </span>
          </p>
          {p.notes && <p className="text-muted-foreground leading-relaxed">{p.notes}</p>}
        </CardContent>
      </div>
    </Card>
  );

  if (loading) {
    return (
      <div className="grid gap-6">
        {Array.from({ length: 3 }).map((_, i) => (
          <Card key={i} className="overflow-hidden border-border/80 rounded-2xl">
            <div className="grid md:grid-cols-[360px_1fr] animate-pulse">
              <div className="h-[240px] bg-muted" />
              <CardContent className="p-6 space-y-3">
                <div className="h-6 w-40 bg-muted rounded" />
                <div className="h-4 w-64 bg-muted rounded" />
                <div className="h-4 w-full bg-muted rounded" />
                <div className="h-4 w-4/5 bg-muted rounded" />
              </CardContent>
            </div>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="grid gap-6">
      {items.map((p) =>
        p.slug ? (
          <Link key={p.name} to={`/property/${p.slug}`} className="block">
            {renderCard(p)}
          </Link>
        ) : (
          <div key={p.name}>{renderCard(p)}</div>
        ),
      )}
    </div>
  );
};

export default PropertiesPortfolio;

