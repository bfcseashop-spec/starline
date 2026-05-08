import { motion } from "framer-motion";
import { Clock, Bell, Play } from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "@/components/ui/use-toast";
import type { ComingSoonProject } from "@/hooks/useSiteSettings";
import { properties as fallbackCatalog } from "@/data/properties";
import { upcomingProjects } from "@/data/siteContent";
import { usePropertyCatalog } from "@/hooks/usePropertyCatalog";

const defaultProjects: ComingSoonProject[] = [
  { title: "Starline Heights", location: "Downtown Metro", type: "Residential Tower", units: "120 Units", eta: "Q3 2026" },
  { title: "Emerald Business Park", location: "Tech Corridor", type: "Commercial Complex", units: "45 Offices", eta: "Q4 2026" },
  { title: "Sunset Villas", location: "Coastal Road", type: "Luxury Villas", units: "24 Villas", eta: "Q1 2027" },
];

interface Props {
  projects?: ComingSoonProject[];
}

const getEmbedUrl = (url: string) => {
  const ytMatch = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([\w-]+)/);
  if (ytMatch) return `https://www.youtube.com/embed/${ytMatch[1]}`;
  const vimeoMatch = url.match(/vimeo\.com\/(\d+)/);
  if (vimeoMatch) return `https://player.vimeo.com/video/${vimeoMatch[1]}`;
  return url;
};

const normalize = (value: string) =>
  value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();

const ComingSoon = ({ projects }: Props) => {
  const list = projects && projects.length > 0 ? projects : defaultProjects;
  const [notified, setNotified] = useState<Set<number>>(new Set());
  const [playingVideo, setPlayingVideo] = useState<number | null>(null);
  const { data: catalog } = usePropertyCatalog();
  const catalogRows = catalog ?? fallbackCatalog;

  const cards = useMemo(
    () =>
      list.map((project) => {
        const nameNorm = normalize(project.title || "");
        const match =
          catalogRows.find((p) => normalize(p.title) === nameNorm) ||
          catalogRows.find((p) => normalize(p.slug) === nameNorm) ||
          catalogRows.find((p) => normalize(p.title).includes(nameNorm) || nameNorm.includes(normalize(p.title)));
        const upcomingFallbackImage = upcomingProjects[i % upcomingProjects.length]?.image || "";
        return {
          ...project,
          image_url: project.image_url || match?.images?.[0] || upcomingFallbackImage,
        };
      }),
    [catalogRows, list],
  );

  const notify = (i: number) => {
    setNotified((prev) => new Set(prev).add(i));
    toast.success("You'll be notified when this project launches!");
  };

  return (
    <section className="py-14 md:py-20 bg-muted/35">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-10 md:mb-14"
        >
          <div className="inline-flex items-center gap-2 bg-gold/10 rounded-full px-4 py-2 mb-4">
            <Clock size={16} className="text-gold" />
            <span className="text-gold text-sm font-semibold">Launching Soon</span>
          </div>
          <h2 className="font-heading text-4xl md:text-5xl font-bold text-foreground">Properties Coming Soon</h2>
          <p className="text-muted-foreground mt-3 max-w-lg mx-auto">Be the first to know about our upcoming premium developments.</p>
        </motion.div>

        <div className="grid md:grid-cols-3 gap-6">
          {cards.map((project, i) => (
            <motion.div
              key={project.title + i}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="bg-card rounded-2xl border border-border overflow-hidden hover:shadow-xl transition-shadow group"
            >
              {/* Image / Video */}
              {(project.image_url || project.video_url) && (
                <div className="relative h-48 bg-muted">
                  {playingVideo === i && project.video_url ? (
                    <iframe
                      src={getEmbedUrl(project.video_url)}
                      className="w-full h-full"
                      allow="autoplay; encrypted-media"
                      allowFullScreen
                    />
                  ) : project.image_url ? (
                    <>
                      <img src={project.image_url} alt={project.title} className="w-full h-full object-cover" />
                      {project.video_url && (
                        <button
                          onClick={() => setPlayingVideo(i)}
                          className="absolute inset-0 flex items-center justify-center bg-black/30 hover:bg-black/40 transition-colors"
                        >
                          <div className="w-12 h-12 rounded-full bg-white/90 flex items-center justify-center">
                            <Play size={20} className="text-navy ml-0.5" />
                          </div>
                        </button>
                      )}
                    </>
                  ) : project.video_url ? (
                    <button
                      onClick={() => setPlayingVideo(i)}
                      className="w-full h-full flex items-center justify-center bg-navy/10 hover:bg-navy/20 transition-colors"
                    >
                      <div className="w-12 h-12 rounded-full bg-gold/20 flex items-center justify-center">
                        <Play size={20} className="text-gold ml-0.5" />
                      </div>
                    </button>
                  ) : null}
                </div>
              )}

              <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <span className="bg-gold/10 text-gold text-xs font-bold px-3 py-1 rounded-full">{project.eta}</span>
                  <span className="text-xs text-muted-foreground font-medium">{project.type}</span>
                </div>
                <h3 className="font-heading text-xl font-bold text-foreground mb-1">{project.title}</h3>
                <p className="text-muted-foreground text-sm mb-1">{project.location}</p>
                <p className="text-gold text-sm font-semibold mb-5">{project.units}</p>
                <button
                  onClick={() => notify(i)}
                  disabled={notified.has(i)}
                  className={`w-full flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-semibold transition-all ${
                    notified.has(i)
                      ? "bg-muted text-muted-foreground cursor-default"
                      : "bg-navy text-white hover:bg-navy-light"
                  }`}
                >
                  <Bell size={15} />
                  {notified.has(i) ? "Notified" : "Notify Me"}
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default ComingSoon;
