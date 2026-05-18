import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Download, MapPin, Calendar, Home, Maximize, Check } from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import StatusBadge from "@/components/StatusBadge";
import ShareButtons from "@/components/ShareButtons";
import InquiryForm from "@/components/InquiryForm";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useSiteSettings } from "@/hooks/useSiteSettings";

const fmtBdt = (n?: number | null) => {
  if (!n && n !== 0) return "—";
  if (n >= 10000000) return `৳${(n / 10000000).toFixed(2)} Cr`;
  if (n >= 100000) return `৳${(n / 100000).toFixed(1)} L`;
  return `৳${n.toLocaleString()}`;
};

const youtubeEmbed = (url: string) => {
  const match = url.match(/(?:youtu\.be\/|v=)([\w-]{6,})/);
  return match ? `https://www.youtube.com/embed/${match[1]}` : url;
};

const ProjectDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { company, social, socialPlatforms, headerConfig, footerContent } = useSiteSettings();
  const [project, setProject] = useState<any>(null);
  const [media, setMedia] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      if (!id) return;
      const { data: proj } = await supabase.from("projects").select("*").eq("slug", id).maybeSingle();
      if (!proj) { setLoading(false); return; }
      setProject(proj);
      const { data: m } = await supabase.from("project_media").select("*").eq("project_id", proj.id).order("sort_order");
      setMedia(m || []);
      setLoading(false);
    })();
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar company={company} headerConfig={headerConfig} social={social} socialPlatforms={socialPlatforms} />
        <div className="container py-32 text-center text-muted-foreground">Loading project...</div>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar company={company} headerConfig={headerConfig} social={social} socialPlatforms={socialPlatforms} />
        <div className="container py-32 text-center">
          <h2 className="text-foreground">Project not found</h2>
          <Button className="mt-4" onClick={() => navigate("/projects")}>Browse all projects</Button>
        </div>
      </div>
    );
  }

  const amenities: string[] = Array.isArray(project.amenities) ? project.amenities : [];
  const images = media.filter((m) => m.media_type === "image");
  const videos = media.filter((m) => m.media_type === "youtube");

  return (
    <div className="min-h-screen bg-background">
      <Navbar company={company} headerConfig={headerConfig} social={social} socialPlatforms={socialPlatforms} />
      <main>
        {/* Hero */}
        <section className="relative h-[60vh] min-h-[420px] overflow-hidden">
          {project.video_url ? (
            <video src={project.video_url} autoPlay muted loop playsInline className="absolute inset-0 w-full h-full object-cover" />
          ) : (
            <img src={project.cover_url} alt={project.name} className="absolute inset-0 w-full h-full object-cover" />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />
          <div className="relative h-full container flex flex-col justify-end pb-12">
            <StatusBadge status={project.status} className="bg-white/90 mb-4 self-start" />
            <h1 className="text-white max-w-3xl">{project.name}</h1>
            {project.location && (
              <div className="flex items-center gap-2 text-white/90 mt-2"><MapPin size={16} /> {project.location}</div>
            )}
          </div>
        </section>

        <section className="py-12">
          <div className="container grid lg:grid-cols-3 gap-8">
            {/* Left: details */}
            <div className="lg:col-span-2 space-y-10">
              <div className="flex items-center justify-between flex-wrap gap-4">
                <div className="flex items-center gap-3">
                  {project.brochure_url && (
                    <a href={project.brochure_url} target="_blank" rel="noreferrer">
                      <Button><Download size={16} className="mr-2" /> Download brochure</Button>
                    </a>
                  )}
                </div>
                <ShareButtons title={project.name} />
              </div>

              {project.description && (
                <div>
                  <h3 className="text-foreground mb-3">About this project</h3>
                  <p className="text-muted-foreground leading-relaxed whitespace-pre-line">{project.description}</p>
                </div>
              )}

              {/* Key details */}
              <div className="bg-card border border-border rounded-2xl p-6">
                <h3 className="text-foreground mb-4">Project details</h3>
                <div className="grid sm:grid-cols-2 gap-4 text-sm">
                  <Detail icon={<Home size={16} />} label={`${project.unit_type === "plot" ? "Total plots" : "Total units"}`} value={project.plots_count?.toString() || "—"} />
                  <Detail icon={<Maximize size={16} />} label="Size range (sq ft)" value={`${project.size_min || "—"} - ${project.size_max || "—"}`} />
                  <Detail icon={<Calendar size={16} />} label="Handover date" value={project.handover_date ? new Date(project.handover_date).toLocaleDateString(undefined, { month: "long", year: "numeric" }) : "TBA"} />
                  <Detail label="Price range" value={`${fmtBdt(project.price_min)} - ${fmtBdt(project.price_max)}`} />
                  <Detail label="Down payment" value={fmtBdt(project.down_payment)} />
                  <Detail label="Monthly installment" value={fmtBdt(project.monthly_installment)} />
                  <Detail label="Installment duration" value={project.installment_months ? `${project.installment_months} months` : "—"} />
                </div>
              </div>

              {amenities.length > 0 && (
                <div>
                  <h3 className="text-foreground mb-4">Amenities</h3>
                  <ul className="grid sm:grid-cols-2 gap-2 text-sm">
                    {amenities.map((a) => (
                      <li key={a} className="flex items-center gap-2 text-foreground">
                        <span className="w-6 h-6 rounded-full bg-primary/10 text-primary flex items-center justify-center"><Check size={14} /></span>
                        {a}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Gallery */}
              {(images.length > 0 || project.cover_url) && (
                <div>
                  <h3 className="text-foreground mb-4">Media gallery</h3>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    {[project.cover_url, ...images.map((i) => i.url)].filter(Boolean).map((src, i) => (
                      <a key={`${src}-${i}`} href={src} target="_blank" rel="noreferrer" className="group block overflow-hidden rounded-xl aspect-square">
                        <img src={src} alt={`${project.name} ${i + 1}`} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" loading="lazy" />
                      </a>
                    ))}
                  </div>
                </div>
              )}

              {videos.length > 0 && (
                <div className="grid sm:grid-cols-2 gap-4">
                  {videos.map((v) => (
                    <div key={v.id} className="aspect-video rounded-xl overflow-hidden">
                      <iframe src={youtubeEmbed(v.url)} title={v.caption || "Project video"} className="w-full h-full" allowFullScreen />
                    </div>
                  ))}
                </div>
              )}

              {/* Floor plan / map */}
              {project.floor_plan_url && (
                <div>
                  <h3 className="text-foreground mb-4">Floor plan</h3>
                  <a href={project.floor_plan_url} target="_blank" rel="noreferrer">
                    <img src={project.floor_plan_url} alt="Floor plan" className="rounded-xl border border-border" />
                  </a>
                </div>
              )}

              {project.map_embed && (
                <div>
                  <h3 className="text-foreground mb-4">Location</h3>
                  <div className="aspect-[16/9] rounded-xl overflow-hidden border border-border">
                    <iframe src={project.map_embed} title="Project location" className="w-full h-full" loading="lazy" />
                  </div>
                </div>
              )}
            </div>

            {/* Right: inquiry form */}
            <aside className="lg:col-span-1">
              <div className="sticky top-24 bg-card border border-border rounded-2xl p-6">
                <div className="mb-4">
                  <div className="text-xs text-accent uppercase tracking-[0.2em] font-semibold">Starting from</div>
                  <div className="text-3xl font-heading font-bold text-foreground mt-1">{fmtBdt(project.price_min)}</div>
                  {project.monthly_installment && (
                    <div className="text-sm text-muted-foreground mt-1">or {fmtBdt(project.monthly_installment)}/month</div>
                  )}
                </div>
                <div className="border-t border-border pt-4">
                  <h4 className="font-semibold text-foreground mb-3">Request information</h4>
                  <InquiryForm projectId={project.id} projectName={project.name} />
                </div>
              </div>
            </aside>
          </div>
        </section>
      </main>
      <Footer company={company} social={social} content={footerContent} />
    </div>
  );
};

const Detail = ({ label, value, icon }: { label: string; value: string; icon?: React.ReactNode }) => (
  <div className="flex items-start gap-3">
    {icon && <span className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center flex-shrink-0">{icon}</span>}
    <div>
      <div className="text-xs text-muted-foreground uppercase tracking-wider">{label}</div>
      <div className="font-semibold text-foreground">{value}</div>
    </div>
  </div>
);

export default ProjectDetail;
