import { useEffect, useState, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Images, Upload, Loader2, Trash2, X } from "lucide-react";
import { motion } from "framer-motion";

interface ProjectOption {
  id: string;
  project_name: string;
  customer_name?: string;
}

interface ProjectImage {
  id: string;
  project_id: string;
  image_url: string;
  caption: string | null;
  sort_order: number;
}

const AdminImages = () => {
  const [projects, setProjects] = useState<ProjectOption[]>([]);
  const [selectedProject, setSelectedProject] = useState("");
  const [images, setImages] = useState<ProjectImage[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const fetch = async () => {
      const [projRes, profRes] = await Promise.all([
        supabase.from("customer_projects").select("id, project_name, user_id").order("project_name"),
        supabase.from("profiles").select("user_id, full_name"),
      ]);
      const nameMap: Record<string, string> = {};
      (profRes.data || []).forEach((p) => { nameMap[p.user_id] = p.full_name || "Unnamed"; });
      setProjects((projRes.data || []).map((p) => ({ id: p.id, project_name: p.project_name, customer_name: nameMap[p.user_id] })));
      setLoading(false);
    };
    fetch();
  }, []);

  useEffect(() => {
    if (!selectedProject) { setImages([]); return; }
    supabase.from("project_images").select("*").eq("project_id", selectedProject).order("sort_order").then(({ data }) => {
      setImages((data as ProjectImage[]) || []);
    });
  }, [selectedProject]);

  const handleUpload = async (files: FileList | null) => {
    if (!files || !selectedProject) return;
    setUploading(true);
    const maxOrder = images.length > 0 ? Math.max(...images.map((i) => i.sort_order)) + 1 : 0;

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      if (!file.type.startsWith("image/")) { toast.error(`${file.name} is not an image`); continue; }
      if (file.size > 5 * 1024 * 1024) { toast.error(`${file.name} is too large (max 5MB)`); continue; }

      const ext = file.name.split(".").pop();
      const path = `${selectedProject}/${Date.now()}-${i}.${ext}`;
      const { error: uploadErr } = await supabase.storage.from("project-images").upload(path, file);
      if (uploadErr) { toast.error(`Upload failed: ${uploadErr.message}`); continue; }

      const { data: urlData } = supabase.storage.from("project-images").getPublicUrl(path);
      const { error: insertErr } = await supabase.from("project_images").insert({
        project_id: selectedProject,
        image_url: urlData.publicUrl,
        caption: file.name.replace(/\.[^.]+$/, ""),
        sort_order: maxOrder + i,
      });
      if (insertErr) toast.error(insertErr.message);
    }

    toast.success("Images uploaded!");
    setUploading(false);
    // Refresh
    const { data } = await supabase.from("project_images").select("*").eq("project_id", selectedProject).order("sort_order");
    setImages((data as ProjectImage[]) || []);
  };

  const handleDelete = async (img: ProjectImage) => {
    // Extract path from URL
    const url = new URL(img.image_url);
    const pathParts = url.pathname.split("/project-images/");
    if (pathParts[1]) {
      await supabase.storage.from("project-images").remove([pathParts[1]]);
    }
    const { error } = await supabase.from("project_images").delete().eq("id", img.id);
    if (error) { toast.error(error.message); return; }
    setImages((prev) => prev.filter((i) => i.id !== img.id));
    toast.success("Image deleted");
  };

  if (loading) return <div className="flex justify-center py-20"><Loader2 className="animate-spin text-gold" size={32} /></div>;

  return (
    <div>
      <h2 className="font-heading text-2xl font-bold text-foreground mb-6">Project Images</h2>

      {/* Project Selector */}
      <div className="bg-card rounded-2xl border border-border p-5 mb-6 shadow-sm">
        <label className="text-sm font-medium text-foreground mb-2 block">Select Project</label>
        <select
          value={selectedProject}
          onChange={(e) => setSelectedProject(e.target.value)}
          className="w-full bg-muted text-foreground rounded-xl px-4 py-3 text-sm outline-none border border-border focus:ring-2 focus:ring-ring"
        >
          <option value="">Choose a project...</option>
          {projects.map((p) => (
            <option key={p.id} value={p.id}>{p.project_name} — {p.customer_name}</option>
          ))}
        </select>
      </div>

      {selectedProject && (
        <>
          {/* Upload Area */}
          <div
            className="bg-card rounded-2xl border-2 border-dashed border-border hover:border-gold/50 p-8 mb-6 text-center cursor-pointer transition-colors shadow-sm"
            onClick={() => fileRef.current?.click()}
          >
            <input ref={fileRef} type="file" accept="image/*" multiple className="hidden" onChange={(e) => handleUpload(e.target.files)} />
            {uploading ? (
              <Loader2 size={32} className="animate-spin text-gold mx-auto" />
            ) : (
              <>
                <Upload size={32} className="text-muted-foreground mx-auto mb-3" />
                <p className="text-foreground font-medium">Click to upload images</p>
                <p className="text-muted-foreground text-sm mt-1">JPG, PNG, WebP • Max 5MB each</p>
              </>
            )}
          </div>

          {/* Image Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {images.map((img, idx) => (
              <motion.div
                key={img.id}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: idx * 0.03 }}
                className="relative group aspect-square rounded-xl overflow-hidden border border-border shadow-sm"
              >
                <img src={img.image_url} alt={img.caption || ""} className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors flex items-center justify-center">
                  <button
                    onClick={() => handleDelete(img)}
                    className="opacity-0 group-hover:opacity-100 bg-destructive text-white p-2 rounded-lg transition-opacity shadow-lg"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
                {img.caption && (
                  <div className="absolute bottom-0 left-0 right-0 bg-black/60 text-white text-xs p-2 truncate opacity-0 group-hover:opacity-100 transition-opacity">
                    {img.caption}
                  </div>
                )}
              </motion.div>
            ))}
          </div>

          {images.length === 0 && (
            <div className="text-center py-12 text-muted-foreground">
              <Images size={48} className="mx-auto mb-4 opacity-40" />
              <p>No images yet. Upload some above.</p>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default AdminImages;
