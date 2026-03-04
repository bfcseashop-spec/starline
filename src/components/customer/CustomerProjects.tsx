import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { HardHat, MapPin, Calendar, Loader2, Clock, CheckCircle, AlertCircle, Images, X, ChevronLeft, ChevronRight } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface Project {
  id: string;
  project_name: string;
  building_image_url: string | null;
  location: string | null;
  total_amount: number;
  paid_amount: number;
  monthly_installment: number;
  status: string;
  start_date: string | null;
  expected_completion: string | null;
}

interface WorkUpdate {
  id: string;
  title: string;
  description: string | null;
  image_url: string | null;
  progress_percent: number;
  update_date: string;
}

interface ProjectImage {
  id: string;
  image_url: string;
  caption: string | null;
  sort_order: number;
}

const statusConfig: Record<string, { label: string; color: string; icon: typeof CheckCircle }> = {
  planned: { label: "Planned", color: "text-muted-foreground", icon: Clock },
  in_progress: { label: "In Progress", color: "text-gold", icon: HardHat },
  completed: { label: "Completed", color: "text-green-500", icon: CheckCircle },
  on_hold: { label: "On Hold", color: "text-destructive", icon: AlertCircle },
};

const CustomerProjects = () => {
  const { user } = useAuth();
  const [projects, setProjects] = useState<Project[]>([]);
  const [updates, setUpdates] = useState<Record<string, WorkUpdate[]>>({});
  const [images, setImages] = useState<Record<string, ProjectImage[]>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedProject, setExpandedProject] = useState<string | null>(null);
  const [lightbox, setLightbox] = useState<{ images: ProjectImage[]; index: number } | null>(null);

  const fetchProjects = async () => {
    if (!user) return;
    setError(null);
    setLoading(true);
    const { data, error: err } = await supabase
      .from("customer_projects")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });
    if (err) {
      setError(err.message);
      setLoading(false);
      return;
    }
    setProjects((data as Project[]) || []);
    if (data && data.length > 0) setExpandedProject(data[0].id);
    setLoading(false);
  };

  useEffect(() => {
    fetchProjects();
  }, [user]);

  const loadUpdates = async (projectId: string) => {
    if (updates[projectId]) return;
    const { data } = await supabase
      .from("work_updates")
      .select("*")
      .eq("project_id", projectId)
      .order("update_date", { ascending: false });
    setUpdates((prev) => ({ ...prev, [projectId]: (data as WorkUpdate[]) || [] }));
  };

  const loadImages = async (projectId: string) => {
    if (images[projectId]) return;
    const { data } = await supabase
      .from("project_images")
      .select("*")
      .eq("project_id", projectId)
      .order("sort_order", { ascending: true });
    setImages((prev) => ({ ...prev, [projectId]: (data as ProjectImage[]) || [] }));
  };

  useEffect(() => {
    if (expandedProject) {
      loadUpdates(expandedProject);
      loadImages(expandedProject);
    }
  }, [expandedProject]);

  if (loading) return <div className="flex justify-center py-20"><Loader2 className="animate-spin text-gold" size={32} /></div>;

  if (error) {
    return (
      <div className="text-center py-20">
        <AlertCircle className="h-12 w-12 text-destructive mx-auto mb-4" />
        <h2 className="font-heading text-xl font-semibold text-foreground mb-2">Something went wrong</h2>
        <p className="text-muted-foreground text-sm mb-4">{error}</p>
        <button onClick={() => fetchProjects()} className="text-sm font-medium text-primary hover:underline">
          Try again
        </button>
      </div>
    );
  }

  if (projects.length === 0) {
    return (
      <div className="text-center py-20">
        <HardHat size={48} className="text-muted-foreground mx-auto mb-4" />
        <h2 className="font-heading text-xl font-semibold text-foreground mb-2">No Projects Yet</h2>
        <p className="text-muted-foreground text-sm">Your building projects will appear here once assigned by the admin.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h2 className="font-heading text-2xl font-bold text-foreground">My Building Projects</h2>

      {projects.map((project) => {
        const status = statusConfig[project.status] || statusConfig.planned;
        const dueAmount = project.total_amount - project.paid_amount;
        const progressPercent = project.total_amount > 0 ? Math.round((project.paid_amount / project.total_amount) * 100) : 0;
        const isExpanded = expandedProject === project.id;

        return (
          <div key={project.id} className="bg-card rounded-xl border border-border overflow-hidden">
            {/* Project header */}
            <button onClick={() => setExpandedProject(isExpanded ? null : project.id)} className="w-full text-left p-6">
              <div className="flex flex-col md:flex-row gap-6">
                {/* Building image */}
                {project.building_image_url ? (
                  <img src={project.building_image_url} alt={project.project_name} className="w-full md:w-48 h-36 object-cover rounded-lg" />
                ) : (
                  <div className="w-full md:w-48 h-36 bg-muted rounded-lg flex items-center justify-center">
                    <HardHat size={40} className="text-muted-foreground" />
                  </div>
                )}

                <div className="flex-1 space-y-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="font-heading text-xl font-bold text-card-foreground">{project.project_name}</h3>
                      {project.location && (
                        <p className="text-muted-foreground text-sm flex items-center gap-1 mt-1">
                          <MapPin size={14} /> {project.location}
                        </p>
                      )}
                    </div>
                    <span className={`flex items-center gap-1.5 text-sm font-medium ${status.color}`}>
                      <status.icon size={16} /> {status.label}
                    </span>
                  </div>

                  {/* Payment summary */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <div className="bg-muted rounded-lg p-3">
                      <p className="text-xs text-muted-foreground">Total Amount</p>
                      <p className="text-foreground font-bold text-lg">৳{project.total_amount.toLocaleString()}</p>
                    </div>
                    <div className="bg-muted rounded-lg p-3">
                      <p className="text-xs text-muted-foreground">Paid</p>
                      <p className="text-green-500 font-bold text-lg">৳{project.paid_amount.toLocaleString()}</p>
                    </div>
                    <div className="bg-muted rounded-lg p-3">
                      <p className="text-xs text-muted-foreground">Due</p>
                      <p className="text-destructive font-bold text-lg">৳{dueAmount.toLocaleString()}</p>
                    </div>
                    <div className="bg-muted rounded-lg p-3">
                      <p className="text-xs text-muted-foreground">Monthly EMI</p>
                      <p className="text-gold font-bold text-lg">৳{project.monthly_installment.toLocaleString()}</p>
                    </div>
                  </div>

                  {/* Payment progress bar */}
                  <div>
                    <div className="flex justify-between text-xs text-muted-foreground mb-1">
                      <span>Payment Progress</span>
                      <span>{progressPercent}%</span>
                    </div>
                    <div className="w-full bg-muted rounded-full h-2.5">
                      <div className="bg-gold-gradient h-2.5 rounded-full transition-all" style={{ width: `${progressPercent}%` }} />
                    </div>
                  </div>

                  {project.start_date && (
                    <p className="text-xs text-muted-foreground flex items-center gap-1">
                      <Calendar size={12} /> Started: {new Date(project.start_date).toLocaleDateString()} 
                      {project.expected_completion && ` • Expected: ${new Date(project.expected_completion).toLocaleDateString()}`}
                    </p>
                  )}
                </div>
              </div>
            </button>

            {/* Image Gallery & Work Updates */}
            {isExpanded && (
              <div className="border-t border-border px-6 py-5 space-y-6">
                {/* Project Image Gallery */}
                {images[project.id] && images[project.id].length > 0 && (
                  <div>
                    <h4 className="font-heading text-lg font-semibold text-card-foreground mb-4 flex items-center gap-2">
                      <Images size={18} className="text-gold" /> Project Gallery
                    </h4>
                    <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3">
                      {images[project.id].map((img, idx) => (
                        <button
                          key={img.id}
                          onClick={() => setLightbox({ images: images[project.id], index: idx })}
                          className="aspect-square rounded-lg overflow-hidden border border-border hover:border-gold/50 transition-all hover:scale-[1.02]"
                        >
                          <img src={img.image_url} alt={img.caption || `Photo ${idx + 1}`} className="w-full h-full object-cover" />
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Work Updates */}
                <div>
                  <h4 className="font-heading text-lg font-semibold text-card-foreground mb-4 flex items-center gap-2">
                    <Clock size={18} className="text-gold" /> Work Updates
                  </h4>
                  {(!updates[project.id] || updates[project.id].length === 0) ? (
                    <p className="text-muted-foreground text-sm">No work updates yet.</p>
                  ) : (
                    <div className="space-y-4">
                      {updates[project.id].map((update) => (
                        <div key={update.id} className="flex gap-4 bg-muted rounded-lg p-4">
                          {update.image_url && (
                            <img src={update.image_url} alt={update.title} className="w-20 h-20 rounded-lg object-cover shrink-0" />
                          )}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between mb-1">
                              <h5 className="font-semibold text-sm text-foreground">{update.title}</h5>
                              <span className="text-xs text-muted-foreground">{new Date(update.update_date).toLocaleDateString()}</span>
                            </div>
                            {update.description && <p className="text-muted-foreground text-sm">{update.description}</p>}
                            {update.progress_percent > 0 && (
                              <div className="mt-2">
                                <div className="w-full bg-background rounded-full h-1.5">
                                  <div className="bg-gold-gradient h-1.5 rounded-full" style={{ width: `${update.progress_percent}%` }} />
                                </div>
                                <p className="text-xs text-gold mt-1">{update.progress_percent}% complete</p>
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        );
      })}
      {/* Lightbox */}
      <AnimatePresence>
        {lightbox && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4"
            onClick={() => setLightbox(null)}
          >
            <button onClick={() => setLightbox(null)} className="absolute top-4 right-4 text-white/70 hover:text-white">
              <X size={28} />
            </button>
            <button
              className="absolute left-4 top-1/2 -translate-y-1/2 text-white/70 hover:text-white p-2"
              onClick={(e) => { e.stopPropagation(); setLightbox((lb) => lb ? { ...lb, index: lb.index === 0 ? lb.images.length - 1 : lb.index - 1 } : null); }}
            >
              <ChevronLeft size={32} />
            </button>
            <button
              className="absolute right-4 top-1/2 -translate-y-1/2 text-white/70 hover:text-white p-2"
              onClick={(e) => { e.stopPropagation(); setLightbox((lb) => lb ? { ...lb, index: lb.index === lb.images.length - 1 ? 0 : lb.index + 1 } : null); }}
            >
              <ChevronRight size={32} />
            </button>
            <motion.img
              key={lightbox.index}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              src={lightbox.images[lightbox.index].image_url}
              alt={lightbox.images[lightbox.index].caption || "Project photo"}
              className="max-h-[85vh] max-w-[90vw] object-contain rounded-lg"
              onClick={(e) => e.stopPropagation()}
            />
            {lightbox.images[lightbox.index].caption && (
              <p className="absolute bottom-6 text-white/80 text-sm text-center">{lightbox.images[lightbox.index].caption}</p>
            )}
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-1.5">
              {lightbox.images.map((_, i) => (
                <button key={i} onClick={(e) => { e.stopPropagation(); setLightbox((lb) => lb ? { ...lb, index: i } : null); }}
                  className={`w-2 h-2 rounded-full transition-all ${i === lightbox.index ? "bg-gold w-5" : "bg-white/40"}`}
                />
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default CustomerProjects;
