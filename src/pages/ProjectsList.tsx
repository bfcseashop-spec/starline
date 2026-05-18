import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import ProjectCard from "@/components/ProjectCard";
import { supabase } from "@/integrations/supabase/client";
import { useSiteSettings } from "@/hooks/useSiteSettings";
import { cn } from "@/lib/utils";

const FILTERS = [
  { key: "all", label: "All Projects" },
  { key: "upcoming", label: "Upcoming" },
  { key: "ready", label: "Ready" },
  { key: "ongoing", label: "Ongoing" },
];

const ProjectsList = () => {
  const { company, social, socialPlatforms, headerConfig, footerContent } = useSiteSettings();
  const [searchParams, setSearchParams] = useSearchParams();
  const initial = searchParams.get("status") || "all";
  const [filter, setFilter] = useState<string>(initial);
  const [projects, setProjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from("projects")
        .select("id, slug, name, location, status, cover_url, short_description, price_min, price_max, plots_count, unit_type, size_min, size_max, sort_order")
        .order("sort_order", { ascending: true });
      setProjects(data || []);
      setLoading(false);
    })();
  }, []);

  const filtered = useMemo(() => {
    if (filter === "all") return projects;
    return projects.filter((p) => p.status === filter);
  }, [projects, filter]);

  const counts = useMemo(() => ({
    all: projects.length,
    upcoming: projects.filter((p) => p.status === "upcoming").length,
    ready: projects.filter((p) => p.status === "ready").length,
    ongoing: projects.filter((p) => p.status === "ongoing").length,
  }), [projects]);

  return (
    <div className="min-h-screen bg-background">
      <Navbar company={company} headerConfig={headerConfig} social={social} socialPlatforms={socialPlatforms} />
      <main>
        <section className="relative pt-32 pb-12 bg-gradient-to-br from-primary via-primary to-[hsl(160_70%_22%)] text-primary-foreground">
          <div className="container">
            <span className="text-accent uppercase tracking-[0.25em] text-xs font-semibold">Our Portfolio</span>
            <h1 className="mt-3 text-primary-foreground">Discover our projects</h1>
            <p className="mt-3 max-w-2xl text-primary-foreground/80">
              Hand-picked residential developments across Dhaka — from move-in ready homes to upcoming flagship addresses.
            </p>
          </div>
        </section>

        <section className="py-10">
          <div className="container">
            <div className="flex flex-wrap gap-2 mb-8 border-b border-border">
              {FILTERS.map((f) => (
                <button
                  key={f.key}
                  type="button"
                  onClick={() => { setFilter(f.key); setSearchParams(f.key === "all" ? {} : { status: f.key }); }}
                  className={cn(
                    "px-5 py-3 text-sm font-semibold border-b-2 transition-colors",
                    filter === f.key
                      ? "border-primary text-primary"
                      : "border-transparent text-muted-foreground hover:text-foreground",
                  )}
                >
                  {f.label}
                  <span className="ml-2 text-xs px-2 py-0.5 rounded-full bg-secondary text-foreground">{(counts as any)[f.key]}</span>
                </button>
              ))}
            </div>

            {loading ? (
              <div className="text-center py-20 text-muted-foreground">Loading projects...</div>
            ) : filtered.length === 0 ? (
              <div className="text-center py-20 text-muted-foreground">No projects in this category yet.</div>
            ) : (
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {filtered.map((p) => (
                  <ProjectCard key={p.id} p={p} />
                ))}
              </div>
            )}
          </div>
        </section>
      </main>
      <Footer company={company} social={social} content={footerContent} />
    </div>
  );
};

export default ProjectsList;
