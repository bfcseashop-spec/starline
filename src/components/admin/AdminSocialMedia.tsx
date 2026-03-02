import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { Share2, Plus, Loader2, Trash2, Pencil, X, Save, Facebook, Instagram, Globe, MessageCircle } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface Post {
  id: string;
  platform: string;
  content: string;
  image_url: string | null;
  scheduled_at: string | null;
  status: string;
  published_at: string | null;
  created_at: string;
}

const platforms = [
  { id: "facebook", label: "Facebook", icon: Facebook, color: "bg-blue-600" },
  { id: "instagram", label: "Instagram", icon: Instagram, color: "bg-pink-600" },
  { id: "whatsapp", label: "WhatsApp", icon: MessageCircle, color: "bg-green-600" },
  { id: "website", label: "Website", icon: Globe, color: "bg-dash-purple" },
];

const statusColors: Record<string, string> = {
  draft: "bg-muted text-muted-foreground",
  scheduled: "bg-dash-orange/15 text-dash-orange",
  published: "bg-dash-green/15 text-dash-green",
};

const emptyForm = { platform: "facebook", content: "", image_url: "", scheduled_at: "", status: "draft" };

const AdminSocialMedia = () => {
  const { user } = useAuth();
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState({ ...emptyForm });
  const [saving, setSaving] = useState(false);

  const fetchPosts = async () => {
    const { data } = await supabase.from("social_media_posts").select("*").order("created_at", { ascending: false });
    setPosts((data || []) as Post[]);
    setLoading(false);
  };

  useEffect(() => { fetchPosts(); }, []);

  const resetForm = () => { setForm({ ...emptyForm }); setEditId(null); setShowForm(false); };

  const openEdit = (p: Post) => {
    setForm({ platform: p.platform, content: p.content, image_url: p.image_url || "", scheduled_at: p.scheduled_at?.slice(0, 16) || "", status: p.status });
    setEditId(p.id); setShowForm(true);
  };

  const handleSave = async () => {
    if (!form.content.trim()) { toast.error("Content is required"); return; }
    setSaving(true);
    const payload = {
      platform: form.platform,
      content: form.content,
      image_url: form.image_url || null,
      scheduled_at: form.scheduled_at || null,
      status: form.status,
      created_by: user?.id || "",
      ...(form.status === "published" ? { published_at: new Date().toISOString() } : {}),
    };

    let error;
    if (editId) {
      ({ error } = await supabase.from("social_media_posts").update(payload).eq("id", editId));
    } else {
      ({ error } = await supabase.from("social_media_posts").insert(payload));
    }
    setSaving(false);
    if (error) { toast.error(error.message); return; }
    toast.success(editId ? "Post updated!" : "Post created!");
    resetForm(); fetchPosts();
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this post?")) return;
    const { error } = await supabase.from("social_media_posts").delete().eq("id", id);
    if (error) { toast.error(error.message); return; }
    toast.success("Post deleted"); fetchPosts();
  };

  const draftCount = posts.filter((p) => p.status === "draft").length;
  const scheduledCount = posts.filter((p) => p.status === "scheduled").length;
  const publishedCount = posts.filter((p) => p.status === "published").length;

  const inputClass = "w-full bg-muted text-foreground rounded-xl px-4 py-3 text-sm outline-none border border-border focus:ring-2 focus:ring-ring transition-shadow";

  if (loading) return <div className="flex justify-center py-20"><Loader2 className="animate-spin text-gold" size={32} /></div>;

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <h2 className="font-heading text-2xl font-bold text-foreground flex items-center gap-3">
          <Share2 size={24} className="text-dash-blue" /> Social Media
        </h2>
        <button onClick={() => { resetForm(); setShowForm(true); }} className="bg-dash-blue text-white px-4 py-2.5 rounded-xl text-sm font-semibold flex items-center gap-2 hover:opacity-90 transition-opacity shadow-md">
          <Plus size={16} /> New Post
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        {[
          { label: "Drafts", value: draftCount, color: "bg-muted border border-border", textColor: "text-foreground" },
          { label: "Scheduled", value: scheduledCount, color: "bg-dash-orange", textColor: "text-white" },
          { label: "Published", value: publishedCount, color: "bg-dash-green", textColor: "text-white" },
        ].map((s, i) => (
          <div key={i} className={`${s.color} rounded-2xl p-4 shadow-sm`}>
            <p className={`${s.textColor} opacity-70 text-xs font-medium mb-1`}>{s.label}</p>
            <p className={`font-heading text-2xl font-bold ${s.textColor}`}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* Posts */}
      <div className="space-y-3">
        {posts.map((p, idx) => {
          const plat = platforms.find((pl) => pl.id === p.platform);
          const Icon = plat?.icon || Globe;
          return (
            <motion.div key={p.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.02 }}
              className="bg-card rounded-2xl border border-border p-5 shadow-sm">
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-4 flex-1 min-w-0">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-white shrink-0 ${plat?.color || "bg-muted"}`}>
                    <Icon size={18} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-sm font-semibold text-foreground capitalize">{p.platform}</span>
                      <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-full ${statusColors[p.status] || statusColors.draft}`}>{p.status}</span>
                    </div>
                    <p className="text-sm text-muted-foreground line-clamp-2">{p.content}</p>
                    {p.scheduled_at && <p className="text-xs text-muted-foreground mt-1">📅 Scheduled: {new Date(p.scheduled_at).toLocaleString()}</p>}
                  </div>
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  <button onClick={() => openEdit(p)} className="p-2 rounded-lg bg-dash-orange/10 text-dash-orange hover:bg-dash-orange/20 transition-colors"><Pencil size={14} /></button>
                  <button onClick={() => handleDelete(p.id)} className="p-2 rounded-lg bg-destructive/10 text-destructive hover:bg-destructive/20 transition-colors"><Trash2 size={14} /></button>
                </div>
              </div>
            </motion.div>
          );
        })}
        {posts.length === 0 && (
          <div className="text-center py-20 text-muted-foreground">
            <Share2 size={48} className="mx-auto mb-4 opacity-40" />
            <p>No social media posts yet.</p>
          </div>
        )}
      </div>

      {/* Form Modal */}
      <AnimatePresence>
        {showForm && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={resetForm}>
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
              className="bg-card rounded-2xl border border-border p-6 w-full max-w-lg shadow-2xl" onClick={(e) => e.stopPropagation()}>
              <div className="flex justify-between items-center mb-5">
                <h3 className="font-heading text-lg font-bold text-foreground">{editId ? "Edit Post" : "New Post"}</h3>
                <button onClick={resetForm} className="text-muted-foreground hover:text-foreground"><X size={20} /></button>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-foreground mb-1.5 block">Platform</label>
                  <select value={form.platform} onChange={(e) => setForm({ ...form, platform: e.target.value })} className={inputClass}>
                    {platforms.map((p) => <option key={p.id} value={p.id}>{p.label}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-sm font-medium text-foreground mb-1.5 block">Content *</label>
                  <textarea value={form.content} onChange={(e) => setForm({ ...form, content: e.target.value })} className={`${inputClass} min-h-[100px]`} placeholder="Write your post..." />
                </div>
                <div>
                  <label className="text-sm font-medium text-foreground mb-1.5 block">Image URL (optional)</label>
                  <input value={form.image_url} onChange={(e) => setForm({ ...form, image_url: e.target.value })} className={inputClass} placeholder="https://..." />
                </div>
                <div>
                  <label className="text-sm font-medium text-foreground mb-1.5 block">Schedule (optional)</label>
                  <input type="datetime-local" value={form.scheduled_at} onChange={(e) => setForm({ ...form, scheduled_at: e.target.value })} className={inputClass} />
                </div>
                <div>
                  <label className="text-sm font-medium text-foreground mb-1.5 block">Status</label>
                  <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })} className={inputClass}>
                    <option value="draft">Draft</option>
                    <option value="scheduled">Scheduled</option>
                    <option value="published">Published</option>
                  </select>
                </div>
                <button onClick={handleSave} disabled={saving}
                  className="w-full bg-gold-gradient text-accent-foreground py-3 rounded-xl text-sm font-semibold hover:opacity-90 disabled:opacity-50 flex items-center justify-center gap-2">
                  {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />} {editId ? "Update Post" : "Create Post"}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default AdminSocialMedia;
