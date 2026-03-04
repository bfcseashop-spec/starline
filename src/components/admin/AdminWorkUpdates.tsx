import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/components/ui/use-toast";
import { ClipboardList, Plus, Loader2, X, Save, Trash2, Calendar, Percent } from "lucide-react";
import { motion } from "framer-motion";
import { ConfirmDialog } from "@/components/common/ConfirmDialog";

interface WorkUpdate {
  id: string;
  project_id: string;
  title: string;
  description: string | null;
  image_url: string | null;
  progress_percent: number | null;
  update_date: string;
  project_name?: string;
}

interface ProjectOption {
  id: string;
  project_name: string;
}

const AdminWorkUpdates = () => {
  const [updates, setUpdates] = useState<WorkUpdate[]>([]);
  const [projects, setProjects] = useState<ProjectOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState({
    project_id: "",
    title: "",
    description: "",
    image_url: "",
    progress_percent: "",
    update_date: new Date().toISOString().split("T")[0],
  });
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const fetchData = async () => {
    const [updRes, projRes] = await Promise.all([
      supabase.from("work_updates").select("*").order("update_date", { ascending: false }),
      supabase.from("customer_projects").select("id, project_name").order("project_name"),
    ]);

    const projMap: Record<string, string> = {};
    (projRes.data || []).forEach((p) => { projMap[p.id] = p.project_name; });

    setProjects(projRes.data || []);
    setUpdates(
      (updRes.data || []).map((u) => ({ ...u, project_name: projMap[u.project_id] || "Unknown" })) as WorkUpdate[]
    );
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, []);

  const resetForm = () => {
    setForm({ project_id: "", title: "", description: "", image_url: "", progress_percent: "", update_date: new Date().toISOString().split("T")[0] });
    setEditId(null);
    setShowForm(false);
  };

  const openEdit = (u: WorkUpdate) => {
    setForm({
      project_id: u.project_id,
      title: u.title,
      description: u.description || "",
      image_url: u.image_url || "",
      progress_percent: u.progress_percent != null ? String(u.progress_percent) : "",
      update_date: u.update_date ? u.update_date.split("T")[0] : "",
    });
    setEditId(u.id);
    setShowForm(true);
  };

  const handleSave = async () => {
    if (!form.project_id || !form.title) { toast.error("Project and title are required"); return; }
    setSaving(true);

    const payload = {
      project_id: form.project_id,
      title: form.title.trim(),
      description: form.description.trim() || null,
      image_url: form.image_url.trim() || null,
      progress_percent: form.progress_percent ? Number(form.progress_percent) : null,
      update_date: form.update_date || new Date().toISOString(),
    };

    let error;
    if (editId) {
      ({ error } = await supabase.from("work_updates").update(payload).eq("id", editId));
    } else {
      ({ error } = await supabase.from("work_updates").insert(payload));
    }

    setSaving(false);
    if (error) { toast.error(error.message); return; }
    toast.success(editId ? "Update edited!" : "Work update posted!");
    resetForm();
    fetchData();
  };

  const handleDelete = (id: string) => {
    setDeleteTargetId(id);
  };

  const handleConfirmDelete = async () => {
    if (!deleteTargetId) return;
    setDeleteLoading(true);
    const { error } = await supabase.from("work_updates").delete().eq("id", deleteTargetId);
    setDeleteLoading(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Deleted");
    setDeleteTargetId(null);
    fetchData();
  };

  const inputClass = "w-full bg-muted text-foreground rounded-xl px-4 py-3 text-sm outline-none border border-border focus:ring-2 focus:ring-ring transition-shadow";

  if (loading) return <div className="flex justify-center py-20"><Loader2 className="animate-spin text-gold" size={32} /></div>;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="font-heading text-2xl font-bold text-foreground">Work Updates</h2>
        <button onClick={() => { resetForm(); setShowForm(true); }} className="bg-dash-purple text-white px-4 py-2.5 rounded-xl text-sm font-semibold flex items-center gap-2 hover:opacity-90 transition-opacity shadow-md">
          <Plus size={16} /> Post Update
        </button>
      </div>

      {/* Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={resetForm}>
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-card rounded-2xl border border-border p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center mb-5">
              <h3 className="font-heading text-lg font-bold text-foreground">{editId ? "Edit Update" : "New Work Update"}</h3>
              <button onClick={resetForm} className="text-muted-foreground hover:text-foreground"><X size={20} /></button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-foreground mb-1.5 block">Project *</label>
                <select value={form.project_id} onChange={(e) => setForm((f) => ({ ...f, project_id: e.target.value }))} className={inputClass}>
                  <option value="">Select project...</option>
                  {projects.map((p) => <option key={p.id} value={p.id}>{p.project_name}</option>)}
                </select>
              </div>
              <div>
                <label className="text-sm font-medium text-foreground mb-1.5 block">Title *</label>
                <input value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))} className={inputClass} placeholder="e.g. Foundation work completed" maxLength={200} />
              </div>
              <div>
                <label className="text-sm font-medium text-foreground mb-1.5 block">Description</label>
                <textarea value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} className={`${inputClass} min-h-[80px]`} placeholder="Details about this progress update..." />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-sm font-medium text-foreground mb-1.5 block">Progress %</label>
                  <input type="number" min="0" max="100" value={form.progress_percent} onChange={(e) => setForm((f) => ({ ...f, progress_percent: e.target.value }))} className={inputClass} placeholder="0-100" />
                </div>
                <div>
                  <label className="text-sm font-medium text-foreground mb-1.5 block">Update Date</label>
                  <input type="date" value={form.update_date} onChange={(e) => setForm((f) => ({ ...f, update_date: e.target.value }))} className={inputClass} />
                </div>
              </div>
              <div>
                <label className="text-sm font-medium text-foreground mb-1.5 block">Image URL (optional)</label>
                <input value={form.image_url} onChange={(e) => setForm((f) => ({ ...f, image_url: e.target.value }))} className={inputClass} placeholder="https://..." />
              </div>
              <button onClick={handleSave} disabled={saving} className="w-full bg-gold-gradient text-accent-foreground py-3 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 disabled:opacity-50 hover:opacity-90 transition-opacity shadow-md">
                {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                {editId ? "Update" : "Post Update"}
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {/* Updates List */}
      <div className="space-y-3">
        {updates.map((u, idx) => (
          <motion.div
            key={u.id}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.03 }}
            className="bg-card rounded-2xl border border-border p-5 shadow-sm"
          >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-dash-purple flex items-center justify-center text-white">
                  <ClipboardList size={22} />
                </div>
                <div>
                  <h3 className="font-semibold text-foreground">{u.title}</h3>
                  <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground mt-1">
                    <span className="font-medium">🏗️ {u.project_name}</span>
                    <span className="flex items-center gap-1"><Calendar size={12} /> {u.update_date?.split("T")[0]}</span>
                    {u.progress_percent != null && (
                      <span className="flex items-center gap-1 text-dash-green font-medium"><Percent size={12} /> {u.progress_percent}%</span>
                    )}
                  </div>
                  {u.description && <p className="text-xs text-muted-foreground mt-1.5 line-clamp-2">{u.description}</p>}
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                {u.progress_percent != null && (
                  <div className="w-24 h-2 bg-muted rounded-full overflow-hidden">
                    <div className="h-full bg-dash-green rounded-full transition-all" style={{ width: `${u.progress_percent}%` }} />
                  </div>
                )}
                <button onClick={() => openEdit(u)} className="text-xs bg-muted hover:bg-muted/80 text-foreground px-3 py-2 rounded-lg font-medium transition-colors">Edit</button>
                <button onClick={() => handleDelete(u.id)} className="text-xs text-destructive hover:bg-destructive/10 px-2 py-2 rounded-lg transition-colors"><Trash2 size={14} /></button>
              </div>
            </div>
          </motion.div>
        ))}
        {updates.length === 0 && (
          <div className="text-center py-20 text-muted-foreground">
            <ClipboardList size={48} className="mx-auto mb-4 opacity-40" />
            <p>No work updates yet. Click "Post Update" to add one.</p>
          </div>
        )}
      </div>
      <ConfirmDialog
        open={!!deleteTargetId}
        onOpenChange={(open) => {
          if (!open && !deleteLoading) {
            setDeleteTargetId(null);
          }
        }}
        title="Delete this work update?"
        description="This will permanently remove the work update."
        confirmLabel="Delete"
        cancelLabel="Cancel"
        confirmVariant="destructive"
        loading={deleteLoading}
        onConfirm={handleConfirmDelete}
      />
    </div>
  );
};

export default AdminWorkUpdates;
