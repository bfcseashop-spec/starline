import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import {
  Share2, Plus, Loader2, Trash2, Pencil, X, Save, Facebook, Instagram, Globe,
  MessageCircle, Send, Twitter, Linkedin, Youtube, Music2, Filter, LayoutGrid, List,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

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
  { id: "facebook", label: "Facebook", icon: Facebook, color: "bg-blue-600", textColor: "text-blue-600", lightBg: "bg-blue-100 dark:bg-blue-500/15" },
  { id: "instagram", label: "Instagram", icon: Instagram, color: "bg-gradient-to-br from-purple-600 via-pink-500 to-orange-400", textColor: "text-pink-600", lightBg: "bg-pink-100 dark:bg-pink-500/15" },
  { id: "whatsapp", label: "WhatsApp", icon: MessageCircle, color: "bg-emerald-500", textColor: "text-emerald-600", lightBg: "bg-emerald-100 dark:bg-emerald-500/15" },
  { id: "telegram", label: "Telegram", icon: Send, color: "bg-sky-500", textColor: "text-sky-600", lightBg: "bg-sky-100 dark:bg-sky-500/15" },
  { id: "twitter", label: "Twitter / X", icon: Twitter, color: "bg-neutral-900 dark:bg-neutral-700", textColor: "text-neutral-800 dark:text-neutral-300", lightBg: "bg-neutral-100 dark:bg-neutral-500/15" },
  { id: "linkedin", label: "LinkedIn", icon: Linkedin, color: "bg-blue-700", textColor: "text-blue-700", lightBg: "bg-blue-100 dark:bg-blue-600/15" },
  { id: "youtube", label: "YouTube", icon: Youtube, color: "bg-red-600", textColor: "text-red-600", lightBg: "bg-red-100 dark:bg-red-500/15" },
  { id: "tiktok", label: "TikTok", icon: Music2, color: "bg-neutral-900 dark:bg-neutral-700", textColor: "text-neutral-800 dark:text-neutral-300", lightBg: "bg-neutral-100 dark:bg-neutral-500/15" },
  { id: "website", label: "Website", icon: Globe, color: "bg-violet-600", textColor: "text-violet-600", lightBg: "bg-violet-100 dark:bg-violet-500/15" },
];

const statusConfig: Record<string, { bg: string; text: string; dot: string }> = {
  draft: { bg: "bg-muted", text: "text-muted-foreground", dot: "bg-muted-foreground" },
  scheduled: { bg: "bg-amber-100 dark:bg-amber-500/15", text: "text-amber-700 dark:text-amber-400", dot: "bg-amber-500" },
  published: { bg: "bg-emerald-100 dark:bg-emerald-500/15", text: "text-emerald-700 dark:text-emerald-400", dot: "bg-emerald-500" },
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
  const [activeFilter, setActiveFilter] = useState("all");
  const [viewMode, setViewMode] = useState<"grid" | "list">("list");

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

  const filteredPosts = activeFilter === "all" ? posts : posts.filter(p => p.platform === activeFilter);

  const draftCount = posts.filter(p => p.status === "draft").length;
  const scheduledCount = posts.filter(p => p.status === "scheduled").length;
  const publishedCount = posts.filter(p => p.status === "published").length;

  // Count posts per platform
  const platformCounts = platforms.map(p => ({
    ...p,
    count: posts.filter(post => post.platform === p.id).length,
  }));

  if (loading) return <div className="flex justify-center py-20"><Loader2 className="animate-spin text-primary" size={32} /></div>;

  return (
    <div>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h2 className="font-heading text-2xl font-bold text-foreground">Social Media</h2>
          <p className="text-sm text-muted-foreground">Manage posts across all platforms</p>
        </div>
        <Button onClick={() => { resetForm(); setShowForm(true); }} className="bg-primary text-primary-foreground hover:bg-primary/90 gap-2">
          <Plus size={16} /> New Post
        </Button>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
        {[
          { label: "TOTAL POSTS", value: posts.length, icon: Share2, color: "text-blue-600", bgColor: "bg-blue-100 dark:bg-blue-500/15" },
          { label: "DRAFTS", value: draftCount, icon: Pencil, color: "text-amber-600", bgColor: "bg-amber-100 dark:bg-amber-500/15" },
          { label: "SCHEDULED", value: scheduledCount, icon: Filter, color: "text-violet-600", bgColor: "bg-violet-100 dark:bg-violet-500/15" },
          { label: "PUBLISHED", value: publishedCount, icon: Globe, color: "text-emerald-600", bgColor: "bg-emerald-100 dark:bg-emerald-500/15" },
        ].map((s, i) => (
          <motion.div key={i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
            className="bg-card rounded-2xl border border-border p-5 shadow-sm">
            <div className="flex items-center gap-3 mb-2">
              <div className={`w-9 h-9 rounded-lg ${s.bgColor} flex items-center justify-center`}>
                <s.icon size={16} className={s.color} />
              </div>
              <span className="text-[10px] font-bold tracking-wider text-muted-foreground uppercase">{s.label}</span>
            </div>
            <p className="font-heading text-2xl font-bold text-foreground">{s.value}</p>
          </motion.div>
        ))}
      </div>

      {/* Platform Cards */}
      <div className="mb-6">
        <h3 className="font-heading text-base font-bold text-foreground mb-3">Platforms</h3>
        <div className="grid grid-cols-3 sm:grid-cols-5 lg:grid-cols-9 gap-2">
          {platformCounts.map((p, i) => {
            const Icon = p.icon;
            const isActive = activeFilter === p.id;
            return (
              <motion.button key={p.id} initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: i * 0.03 }}
                onClick={() => setActiveFilter(isActive ? "all" : p.id)}
                className={`relative flex flex-col items-center gap-1.5 p-3 rounded-xl border transition-all duration-200 ${
                  isActive
                    ? "border-primary bg-primary/5 shadow-md scale-105"
                    : "border-border bg-card hover:border-primary/30 hover:shadow-sm"
                }`}>
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-white ${p.color}`}>
                  <Icon size={18} />
                </div>
                <span className="text-[10px] font-semibold text-foreground truncate w-full text-center">{p.label}</span>
                {p.count > 0 && (
                  <span className={`absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full text-[9px] font-bold flex items-center justify-center text-white ${p.color.includes("gradient") ? "bg-pink-500" : p.color}`}>
                    {p.count}
                  </span>
                )}
              </motion.button>
            );
          })}
        </div>
      </div>

      {/* Filter Bar */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <button onClick={() => setActiveFilter("all")}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${activeFilter === "all" ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:text-foreground"}`}>
            All ({posts.length})
          </button>
          {["draft", "scheduled", "published"].map(status => {
            const count = posts.filter(p => p.status === status).length;
            const cfg = statusConfig[status];
            return (
              <button key={status} onClick={() => setActiveFilter("all")}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold ${cfg.bg} ${cfg.text} capitalize`}>
                {status} ({count})
              </button>
            );
          })}
        </div>
        <div className="flex items-center gap-1 bg-muted rounded-lg p-0.5">
          <button onClick={() => setViewMode("list")}
            className={`p-1.5 rounded-md transition-colors ${viewMode === "list" ? "bg-card shadow-sm text-foreground" : "text-muted-foreground"}`}>
            <List size={14} />
          </button>
          <button onClick={() => setViewMode("grid")}
            className={`p-1.5 rounded-md transition-colors ${viewMode === "grid" ? "bg-card shadow-sm text-foreground" : "text-muted-foreground"}`}>
            <LayoutGrid size={14} />
          </button>
        </div>
      </div>

      {/* Posts */}
      <div className={viewMode === "grid" ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4" : "space-y-3"}>
        {filteredPosts.map((p, idx) => {
          const plat = platforms.find(pl => pl.id === p.platform);
          const Icon = plat?.icon || Globe;
          const status = statusConfig[p.status] || statusConfig.draft;
          return (
            <motion.div key={p.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.02 }}
              className="bg-card rounded-2xl border border-border p-5 shadow-sm hover:shadow-md transition-shadow">
              <div className={viewMode === "list" ? "flex items-start justify-between gap-4" : "flex flex-col gap-3"}>
                <div className={viewMode === "list" ? "flex items-start gap-4 flex-1 min-w-0" : "flex items-start gap-3"}>
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-white shrink-0 ${plat?.color || "bg-muted"}`}>
                    <Icon size={18} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <span className={`text-sm font-semibold ${plat?.textColor || "text-foreground"}`}>{plat?.label || p.platform}</span>
                      <span className={`inline-flex items-center gap-1 text-[10px] uppercase font-bold px-2 py-0.5 rounded-full ${status.bg} ${status.text}`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${status.dot}`} />
                        {p.status}
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground line-clamp-2">{p.content}</p>
                    {p.scheduled_at && <p className="text-xs text-muted-foreground mt-1.5">📅 {new Date(p.scheduled_at).toLocaleString()}</p>}
                    {p.published_at && <p className="text-xs text-emerald-600 mt-1">✅ Published {new Date(p.published_at).toLocaleDateString()}</p>}
                  </div>
                </div>
                <div className={`flex items-center gap-1.5 shrink-0 ${viewMode === "grid" ? "self-end" : ""}`}>
                  <button onClick={() => openEdit(p)} className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"><Pencil size={14} /></button>
                  <button onClick={() => handleDelete(p.id)} className="p-2 rounded-lg text-destructive/70 hover:text-destructive hover:bg-destructive/10 transition-colors"><Trash2 size={14} /></button>
                </div>
              </div>
            </motion.div>
          );
        })}
        {filteredPosts.length === 0 && (
          <div className={`text-center py-16 text-muted-foreground ${viewMode === "grid" ? "col-span-full" : ""}`}>
            <Share2 size={48} className="mx-auto mb-4 opacity-30" />
            <p className="font-medium">No posts found{activeFilter !== "all" ? ` for ${platforms.find(p => p.id === activeFilter)?.label || activeFilter}` : ""}.</p>
            <p className="text-xs mt-1">Create your first post to get started.</p>
          </div>
        )}
      </div>

      {/* Form Modal */}
      <AnimatePresence>
        {showForm && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={resetForm}>
            <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-card rounded-2xl border border-border shadow-2xl w-full max-w-lg" onClick={e => e.stopPropagation()}>
              
              {/* Modal Header */}
              <div className="flex items-center justify-between p-6 border-b border-border">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center">
                    <Share2 size={18} className="text-primary" />
                  </div>
                  <div>
                    <h3 className="font-heading text-lg font-bold text-foreground">{editId ? "Edit Post" : "New Post"}</h3>
                    <p className="text-xs text-muted-foreground">Compose for any platform</p>
                  </div>
                </div>
                <button onClick={resetForm} className="p-2 rounded-lg hover:bg-muted transition-colors text-muted-foreground"><X size={18} /></button>
              </div>

              {/* Modal Body */}
              <div className="p-6 space-y-4">
                {/* Platform Selector */}
                <div>
                  <Label className="text-xs font-semibold text-foreground mb-2 block">Select Platform</Label>
                  <div className="grid grid-cols-5 gap-2">
                    {platforms.map(p => {
                      const Icon = p.icon;
                      const isSelected = form.platform === p.id;
                      return (
                        <button key={p.id} onClick={() => setForm({ ...form, platform: p.id })}
                          className={`flex flex-col items-center gap-1 p-2 rounded-xl border transition-all ${
                            isSelected ? "border-primary bg-primary/5 shadow-sm" : "border-border hover:border-primary/30"
                          }`}>
                          <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-white ${p.color}`}>
                            <Icon size={14} />
                          </div>
                          <span className="text-[9px] font-semibold text-foreground truncate w-full text-center">{p.label}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div>
                  <Label className="text-xs font-semibold text-foreground">Content *</Label>
                  <Textarea value={form.content} onChange={e => setForm({ ...form, content: e.target.value })}
                    className="mt-1.5 bg-muted/50 min-h-[100px]" placeholder="Write your post content..." />
                </div>

                <div>
                  <Label className="text-xs font-semibold text-foreground">Image URL (optional)</Label>
                  <Input value={form.image_url} onChange={e => setForm({ ...form, image_url: e.target.value })}
                    className="mt-1.5 bg-muted/50" placeholder="https://..." />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-xs font-semibold text-foreground">Schedule</Label>
                    <Input type="datetime-local" value={form.scheduled_at} onChange={e => setForm({ ...form, scheduled_at: e.target.value })}
                      className="mt-1.5 bg-muted/50" />
                  </div>
                  <div>
                    <Label className="text-xs font-semibold text-foreground">Status</Label>
                    <Select value={form.status} onValueChange={v => setForm({ ...form, status: v })}>
                      <SelectTrigger className="mt-1.5 bg-muted/50"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="draft">Draft</SelectItem>
                        <SelectItem value="scheduled">Scheduled</SelectItem>
                        <SelectItem value="published">Published</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              {/* Modal Footer */}
              <div className="flex items-center justify-end gap-3 p-6 border-t border-border">
                <Button variant="outline" onClick={resetForm}>Cancel</Button>
                <Button onClick={handleSave} disabled={saving} className="bg-primary text-primary-foreground hover:bg-primary/90 gap-2">
                  {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
                  {editId ? "Update Post" : "Create Post"}
                </Button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default AdminSocialMedia;
