import { useEffect, useMemo, useRef, useState } from "react";
import { backend } from "@/lib/backendClient";
import { toast } from "@/components/ui/use-toast";
import {
  Share2, Plus, Loader2, Trash2, X, Save, Facebook, Instagram, Globe,
  MessageCircle, Send, Twitter, Linkedin, Youtube, Music2, Filter, LayoutGrid, List,
  Link as LinkIcon, QrCode, Phone, Users, Settings2, Upload, CheckCircle2, AlertCircle,
  XCircle, RefreshCw, ExternalLink, Plug, Unplug, ShieldAlert,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ConfirmDialog } from "@/components/common/ConfirmDialog";
import {
  socialApi,
  type Broadcast,
  type BroadcastTarget,
  type PlatformInfo,
  type Platform,
  type SocialConnection,
} from "@/lib/socialApi";
import { PlatformSetupGuide } from "@/components/admin/social/PlatformSetupGuide";

interface PlatformConfig {
  link: string;
  group_link: string;
  qr_code_url: string;
  phone: string;
}

const defaultPlatformConfig: PlatformConfig = { link: "", group_link: "", qr_code_url: "", phone: "" };

const platformChrome: Record<Platform, { icon: any; color: string; textColor: string; lightBg: string }> = {
  facebook: { icon: Facebook, color: "bg-blue-600", textColor: "text-blue-600", lightBg: "bg-blue-100 dark:bg-blue-500/15" },
  instagram: { icon: Instagram, color: "bg-gradient-to-br from-purple-600 via-pink-500 to-orange-400", textColor: "text-pink-600", lightBg: "bg-pink-100 dark:bg-pink-500/15" },
  whatsapp: { icon: MessageCircle, color: "bg-emerald-500", textColor: "text-emerald-600", lightBg: "bg-emerald-100 dark:bg-emerald-500/15" },
  telegram: { icon: Send, color: "bg-sky-500", textColor: "text-sky-600", lightBg: "bg-sky-100 dark:bg-sky-500/15" },
  twitter: { icon: Twitter, color: "bg-neutral-900 dark:bg-neutral-700", textColor: "text-neutral-800 dark:text-neutral-300", lightBg: "bg-neutral-100 dark:bg-neutral-500/15" },
  linkedin: { icon: Linkedin, color: "bg-blue-700", textColor: "text-blue-700", lightBg: "bg-blue-100 dark:bg-blue-600/15" },
  youtube: { icon: Youtube, color: "bg-red-600", textColor: "text-red-600", lightBg: "bg-red-100 dark:bg-red-500/15" },
  tiktok: { icon: Music2, color: "bg-neutral-900 dark:bg-neutral-700", textColor: "text-neutral-800 dark:text-neutral-300", lightBg: "bg-neutral-100 dark:bg-neutral-500/15" },
  website: { icon: Globe, color: "bg-violet-600", textColor: "text-violet-600", lightBg: "bg-violet-100 dark:bg-violet-500/15" },
};

const targetStatusBadge: Record<BroadcastTarget["status"], { bg: string; text: string; icon: any; dot: string }> = {
  pending: { bg: "bg-amber-100 dark:bg-amber-500/15", text: "text-amber-700 dark:text-amber-400", icon: Loader2, dot: "bg-amber-500" },
  publishing: { bg: "bg-blue-100 dark:bg-blue-500/15", text: "text-blue-700 dark:text-blue-400", icon: Loader2, dot: "bg-blue-500" },
  published: { bg: "bg-emerald-100 dark:bg-emerald-500/15", text: "text-emerald-700 dark:text-emerald-400", icon: CheckCircle2, dot: "bg-emerald-500" },
  failed: { bg: "bg-red-100 dark:bg-red-500/15", text: "text-red-700 dark:text-red-400", icon: XCircle, dot: "bg-red-500" },
  skipped: { bg: "bg-muted", text: "text-muted-foreground", icon: AlertCircle, dot: "bg-muted-foreground" },
  cancelled: { bg: "bg-muted", text: "text-muted-foreground", icon: AlertCircle, dot: "bg-muted-foreground" },
};

const broadcastStatusConfig: Record<Broadcast["status"], { bg: string; text: string; dot: string; label: string }> = {
  draft: { bg: "bg-muted", text: "text-muted-foreground", dot: "bg-muted-foreground", label: "DRAFT" },
  pending: { bg: "bg-amber-100 dark:bg-amber-500/15", text: "text-amber-700 dark:text-amber-400", dot: "bg-amber-500", label: "QUEUED" },
  publishing: { bg: "bg-blue-100 dark:bg-blue-500/15", text: "text-blue-700 dark:text-blue-400", dot: "bg-blue-500", label: "PUBLISHING" },
  completed: { bg: "bg-emerald-100 dark:bg-emerald-500/15", text: "text-emerald-700 dark:text-emerald-400", dot: "bg-emerald-500", label: "DONE" },
  partial: { bg: "bg-amber-100 dark:bg-amber-500/15", text: "text-amber-700 dark:text-amber-400", dot: "bg-amber-500", label: "PARTIAL" },
  failed: { bg: "bg-red-100 dark:bg-red-500/15", text: "text-red-700 dark:text-red-400", dot: "bg-red-500", label: "FAILED" },
  cancelled: { bg: "bg-muted", text: "text-muted-foreground", dot: "bg-muted-foreground", label: "CANCELLED" },
};

const emptyForm = {
  content: "",
  image_url: "",
  video_url: "",
  link: "",
  scheduled_at: "",
  status: "pending" as "pending" | "draft",
};

const AdminSocialMedia = () => {
  const [platformInfo, setPlatformInfo] = useState<PlatformInfo[]>([]);
  const [connections, setConnections] = useState<SocialConnection[]>([]);
  const [broadcasts, setBroadcasts] = useState<Broadcast[]>([]);
  const [loading, setLoading] = useState(true);

  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ ...emptyForm });
  const [selectedTargets, setSelectedTargets] = useState<Record<string, boolean>>({});
  const [saving, setSaving] = useState(false);

  const [activeFilter, setActiveFilter] = useState<"all" | Platform>("all");
  const [viewMode, setViewMode] = useState<"grid" | "list">("list");

  // Public links / config (legacy site_settings)
  const [platformConfigs, setPlatformConfigs] = useState<Record<string, PlatformConfig>>({});
  const [editPlatformId, setEditPlatformId] = useState<Platform | null>(null);
  const [editPlatformTab, setEditPlatformTab] = useState<"connection" | "links">("connection");
  const [platformForm, setPlatformForm] = useState<PlatformConfig>({ ...defaultPlatformConfig });
  const [savingPlatform, setSavingPlatform] = useState(false);
  const [uploadingQr, setUploadingQr] = useState(false);

  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [deleteConnectionId, setDeleteConnectionId] = useState<string | null>(null);

  const fetchAll = async () => {
    try {
      const [platforms, conns, casts] = await Promise.all([
        socialApi.listPlatforms(),
        socialApi.listConnections(),
        socialApi.listBroadcasts(),
      ]);
      setPlatformInfo(platforms);
      setConnections(conns);
      setBroadcasts(casts);
    } catch (err) {
      toast.error((err as Error).message || "Failed to load social data");
    } finally {
      setLoading(false);
    }
  };

  const fetchPlatformConfigs = async () => {
    const { data } = await backend
      .from("site_settings")
      .select("setting_value")
      .eq("setting_key", "social_platforms")
      .single();
    if (data?.setting_value && typeof data.setting_value === "object") {
      setPlatformConfigs(data.setting_value as unknown as Record<string, PlatformConfig>);
    }
  };

  useEffect(() => {
    fetchAll();
    fetchPlatformConfigs();
    const t = setInterval(fetchAll, 12_000);
    return () => clearInterval(t);
  }, []);

  const platformsById = useMemo(() => {
    const map: Record<string, PlatformInfo> = {};
    for (const p of platformInfo) map[p.id] = p;
    return map;
  }, [platformInfo]);

  const connectionsByPlatform = useMemo(() => {
    const map: Record<Platform, SocialConnection[]> = {} as any;
    for (const c of connections) {
      (map[c.platform] = map[c.platform] || []).push(c);
    }
    return map;
  }, [connections]);

  const orderedPlatforms: Platform[] = useMemo(
    () => ["facebook", "instagram", "whatsapp", "telegram", "twitter", "linkedin", "youtube", "tiktok", "website"],
    [],
  );

  const resetForm = () => {
    setForm({ ...emptyForm });
    setSelectedTargets({});
    setShowForm(false);
  };

  const openComposer = () => {
    const initial: Record<string, boolean> = {};
    for (const c of connections) {
      if (c.status === "active") initial[`${c.platform}:${c.id}`] = true;
    }
    if (platformsById.website) initial[`website:auto`] = true;
    setSelectedTargets(initial);
    setForm({ ...emptyForm });
    setShowForm(true);
  };

  const handleSave = async () => {
    if (!form.content.trim() && !form.image_url && !form.video_url) {
      toast.error("Add some content, an image, or a video before posting");
      return;
    }
    const targets: Array<{ platform: Platform; connection_id?: string }> = [];
    for (const [key, on] of Object.entries(selectedTargets)) {
      if (!on) continue;
      const [platform, connId] = key.split(":") as [Platform, string];
      if (connId === "auto") targets.push({ platform });
      else targets.push({ platform, connection_id: connId });
    }
    if (!targets.length) {
      toast.error("Select at least one platform to post to");
      return;
    }

    setSaving(true);
    try {
      await socialApi.createBroadcast({
        content: form.content || null,
        image_url: form.image_url || null,
        video_url: form.video_url || null,
        link: form.link || null,
        scheduled_at: form.scheduled_at || null,
        status: form.status,
        targets,
      });
      toast.success(form.status === "draft" ? "Saved as draft" : "Broadcast queued");
      resetForm();
      fetchAll();
    } catch (err) {
      toast.error((err as Error).message || "Failed to create broadcast");
    } finally {
      setSaving(false);
    }
  };

  const handleConfirmDeleteBroadcast = async () => {
    if (!deleteTargetId) return;
    setDeleteLoading(true);
    try {
      await socialApi.deleteBroadcast(deleteTargetId);
      toast.success("Broadcast deleted");
      setDeleteTargetId(null);
      fetchAll();
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setDeleteLoading(false);
    }
  };

  const handleRetryTarget = async (id: string) => {
    try {
      await socialApi.retryTarget(id);
      toast.success("Retrying...");
      setTimeout(fetchAll, 1000);
    } catch (err) {
      toast.error((err as Error).message);
    }
  };

  const handleCancelBroadcast = async (id: string) => {
    try {
      await socialApi.cancelBroadcast(id);
      toast.success("Broadcast cancelled");
      fetchAll();
    } catch (err) {
      toast.error((err as Error).message);
    }
  };

  // Connection actions
  const handleDeleteConnection = async (id: string) => {
    setDeleteLoading(true);
    try {
      await socialApi.deleteConnection(id);
      toast.success("Disconnected");
      setDeleteConnectionId(null);
      fetchAll();
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setDeleteLoading(false);
    }
  };

  // Public-link config
  const openPlatformConfig = (id: Platform) => {
    const existing = platformConfigs[id] || { ...defaultPlatformConfig };
    setPlatformForm({ ...defaultPlatformConfig, ...existing });
    setEditPlatformId(id);
    setEditPlatformTab("connection");
  };

  const handleQrUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingQr(true);
    const ext = file.name.split(".").pop();
    const filePath = `qr-codes/${Date.now()}.${ext}`;
    const { error } = await backend.storage.from("company-assets").upload(filePath, file);
    setUploadingQr(false);
    if (error) {
      toast.error("Upload failed");
      return;
    }
    const { data: pub } = backend.storage.from("company-assets").getPublicUrl(filePath);
    setPlatformForm((prev) => ({ ...prev, qr_code_url: pub.publicUrl }));
  };

  const savePlatformConfig = async () => {
    if (!editPlatformId) return;
    setSavingPlatform(true);
    const updated = { ...platformConfigs, [editPlatformId]: platformForm };
    const socialLinks: Record<string, string> = {};
    Object.entries(updated).forEach(([key, val]) => {
      if (val.link) socialLinks[key] = val.link;
    });
    const { error } = await backend
      .from("site_settings")
      .upsert({ setting_key: "social_platforms", setting_value: updated as any }, { onConflict: "setting_key" });
    if (!error) {
      await backend
        .from("site_settings")
        .upsert({ setting_key: "social_links", setting_value: socialLinks as any }, { onConflict: "setting_key" });
    }
    setSavingPlatform(false);
    if (error) {
      toast.error("Failed to save");
      return;
    }
    toast.success("Platform settings saved!");
    setPlatformConfigs(updated);
  };

  // Stats
  const totalBroadcasts = broadcasts.length;
  const draftCount = broadcasts.filter((b) => b.status === "draft").length;
  const queuedCount = broadcasts.filter((b) => b.status === "pending" || b.status === "publishing").length;
  const completedCount = broadcasts.filter((b) => b.status === "completed").length;

  const filteredBroadcasts =
    activeFilter === "all"
      ? broadcasts
      : broadcasts.filter((b) => b.targets.some((t) => t.platform === activeFilter));

  if (loading)
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="animate-spin text-primary" size={32} />
      </div>
    );

  return (
    <div>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h2 className="font-heading text-2xl font-bold text-foreground">Social Media</h2>
          <p className="text-sm text-muted-foreground">Compose once — broadcast to all connected channels</p>
        </div>
        <Button onClick={openComposer} className="bg-primary text-primary-foreground hover:bg-primary/90 gap-2">
          <Plus size={16} /> New Broadcast
        </Button>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
        {[
          { label: "BROADCASTS", value: totalBroadcasts, icon: Share2, color: "text-blue-600", bgColor: "bg-blue-100 dark:bg-blue-500/15" },
          { label: "QUEUED", value: queuedCount, icon: Filter, color: "text-amber-600", bgColor: "bg-amber-100 dark:bg-amber-500/15" },
          { label: "COMPLETED", value: completedCount, icon: CheckCircle2, color: "text-emerald-600", bgColor: "bg-emerald-100 dark:bg-emerald-500/15" },
          { label: "CONNECTIONS", value: connections.filter((c) => c.status === "active").length, icon: Plug, color: "text-violet-600", bgColor: "bg-violet-100 dark:bg-violet-500/15" },
        ].map((s, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            className="bg-card rounded-2xl border border-border p-5 shadow-sm"
          >
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

      {/* Platform cards */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-heading text-base font-bold text-foreground">Platforms</h3>
          <span className="text-xs text-muted-foreground">Click the gear to connect / configure</span>
        </div>
        <div className="grid grid-cols-3 sm:grid-cols-5 lg:grid-cols-9 gap-2">
          {orderedPlatforms.map((id, i) => {
            const info = platformsById[id];
            const chrome = platformChrome[id];
            const Icon = chrome.icon;
            const conns = connectionsByPlatform[id] || [];
            const isInternal = info?.connectKind === "internal";
            const isConnected = isInternal || conns.some((c) => c.status === "active");
            const isActive = activeFilter === id;
            return (
              <motion.div
                key={id}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: i * 0.03 }}
                className={`relative flex flex-col items-center gap-1.5 p-3 rounded-xl border transition-all duration-200 ${
                  isActive
                    ? "border-primary bg-primary/5 shadow-md scale-105"
                    : "border-border bg-card hover:border-primary/30 hover:shadow-sm"
                }`}
              >
                <button
                  onClick={() => setActiveFilter(isActive ? "all" : id)}
                  className="flex flex-col items-center gap-1.5 w-full"
                >
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-white ${chrome.color}`}>
                    <Icon size={18} />
                  </div>
                  <span className="text-[10px] font-semibold text-foreground truncate w-full text-center">
                    {info?.label || id}
                  </span>
                </button>
                <button
                  onClick={() => openPlatformConfig(id)}
                  className={`absolute top-1 right-1 p-1 rounded-md transition-colors ${
                    isConnected ? "text-emerald-500" : "text-muted-foreground/40"
                  } hover:text-primary hover:bg-primary/10`}
                  title="Configure / Connect"
                >
                  <Settings2 size={10} />
                </button>
                {isConnected && (
                  <span className="absolute -top-1.5 -left-1.5 w-3.5 h-3.5 rounded-full bg-emerald-500 ring-2 ring-card" />
                )}
                {info?.experimental && (
                  <span
                    title="Experimental"
                    className="absolute -bottom-1 -right-1 w-3.5 h-3.5 rounded-full bg-amber-500 ring-2 ring-card flex items-center justify-center"
                  >
                    <ShieldAlert size={8} className="text-white" />
                  </span>
                )}
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* Filter Bar */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => setActiveFilter("all")}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
              activeFilter === "all" ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:text-foreground"
            }`}
          >
            All ({broadcasts.length})
          </button>
          {(["draft", "pending", "completed", "failed"] as const).map((s) => {
            const count = broadcasts.filter((b) => b.status === s).length;
            const cfg = broadcastStatusConfig[s];
            return (
              <button
                key={s}
                onClick={() => setActiveFilter("all")}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold ${cfg.bg} ${cfg.text} capitalize`}
              >
                {s} ({count})
              </button>
            );
          })}
        </div>
        <div className="flex items-center gap-1 bg-muted rounded-lg p-0.5">
          <button
            onClick={() => setViewMode("list")}
            className={`p-1.5 rounded-md transition-colors ${
              viewMode === "list" ? "bg-card shadow-sm text-foreground" : "text-muted-foreground"
            }`}
          >
            <List size={14} />
          </button>
          <button
            onClick={() => setViewMode("grid")}
            className={`p-1.5 rounded-md transition-colors ${
              viewMode === "grid" ? "bg-card shadow-sm text-foreground" : "text-muted-foreground"
            }`}
          >
            <LayoutGrid size={14} />
          </button>
        </div>
      </div>

      {/* Broadcasts */}
      <div className={viewMode === "grid" ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4" : "space-y-3"}>
        {filteredBroadcasts.map((b, idx) => {
          const status = broadcastStatusConfig[b.status] || broadcastStatusConfig.draft;
          return (
            <motion.div
              key={b.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.02 }}
              className="bg-card rounded-2xl border border-border p-5 shadow-sm hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between gap-4 mb-3">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 mb-2 flex-wrap">
                    <span
                      className={`inline-flex items-center gap-1 text-[10px] uppercase font-bold px-2 py-0.5 rounded-full ${status.bg} ${status.text}`}
                    >
                      <span className={`w-1.5 h-1.5 rounded-full ${status.dot}`} />
                      {status.label}
                    </span>
                    <span className="text-[10px] text-muted-foreground">
                      {new Date(b.created_at).toLocaleString()}
                    </span>
                    {b.scheduled_at && new Date(b.scheduled_at) > new Date() && (
                      <span className="text-[10px] text-amber-600">
                        scheduled {new Date(b.scheduled_at).toLocaleString()}
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-foreground whitespace-pre-line line-clamp-3">{b.content || "(no text)"}</p>
                  {b.image_url && (
                    <div className="mt-2">
                      <img
                        src={b.image_url}
                        alt=""
                        className="rounded-lg max-h-32 w-auto border border-border"
                      />
                    </div>
                  )}
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  {(b.status === "pending" || b.status === "publishing") && (
                    <button
                      onClick={() => handleCancelBroadcast(b.id)}
                      className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted"
                      title="Cancel"
                    >
                      <XCircle size={14} />
                    </button>
                  )}
                  <button
                    onClick={() => setDeleteTargetId(b.id)}
                    className="p-2 rounded-lg text-destructive/70 hover:text-destructive hover:bg-destructive/10"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {b.targets.map((t) => {
                  const cfg = targetStatusBadge[t.status];
                  const StatusIcon = cfg.icon;
                  const chrome = platformChrome[t.platform];
                  const PlatformIcon = chrome?.icon || Globe;
                  const tooltip = t.error_message || t.external_url || `${t.platform}: ${t.status}`;
                  const spinning = t.status === "pending" || t.status === "publishing";
                  return (
                    <div
                      key={t.id}
                      title={tooltip}
                      className={`group inline-flex items-center gap-1.5 px-2 py-1 rounded-full text-[11px] font-semibold ${cfg.bg} ${cfg.text}`}
                    >
                      <PlatformIcon size={11} />
                      <span className="capitalize">{t.platform}</span>
                      <StatusIcon size={11} className={spinning ? "animate-spin" : ""} />
                      {t.external_url && (
                        <a
                          href={t.external_url}
                          target="_blank"
                          rel="noreferrer"
                          className="ml-0.5 hover:underline"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <ExternalLink size={10} />
                        </a>
                      )}
                      {t.status === "failed" && (
                        <button
                          onClick={() => handleRetryTarget(t.id)}
                          className="ml-0.5 hover:underline"
                          title="Retry"
                        >
                          <RefreshCw size={10} />
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            </motion.div>
          );
        })}
        {filteredBroadcasts.length === 0 && (
          <div className={`text-center py-16 text-muted-foreground ${viewMode === "grid" ? "col-span-full" : ""}`}>
            <Share2 size={48} className="mx-auto mb-4 opacity-30" />
            <p className="font-medium">No broadcasts yet.</p>
            <p className="text-xs mt-1">Connect a platform from the gear icon, then click "New Broadcast".</p>
          </div>
        )}
      </div>

      {/* Composer Modal */}
      <AnimatePresence>
        {showForm && (
          <ComposerModal
            form={form}
            setForm={setForm}
            selectedTargets={selectedTargets}
            setSelectedTargets={setSelectedTargets}
            platformsById={platformsById}
            connections={connections}
            saving={saving}
            onCancel={resetForm}
            onSave={handleSave}
          />
        )}
      </AnimatePresence>

      {/* Platform Config Modal (split: Connection / Public Links) */}
      <AnimatePresence>
        {editPlatformId && (
          <PlatformPanel
            platformId={editPlatformId}
            info={platformsById[editPlatformId]}
            connections={connectionsByPlatform[editPlatformId] || []}
            tab={editPlatformTab}
            setTab={setEditPlatformTab}
            platformForm={platformForm}
            setPlatformForm={setPlatformForm}
            onClose={() => setEditPlatformId(null)}
            onUploadQr={handleQrUpload}
            uploadingQr={uploadingQr}
            savingPlatform={savingPlatform}
            onSaveLinks={savePlatformConfig}
            onDisconnect={(id) => setDeleteConnectionId(id)}
            onConnected={fetchAll}
          />
        )}
      </AnimatePresence>

      <ConfirmDialog
        open={!!deleteTargetId}
        onOpenChange={(open) => {
          if (!open && !deleteLoading) setDeleteTargetId(null);
        }}
        title="Delete this broadcast?"
        description="This removes the record from the database. Already-published platform posts are NOT deleted on those platforms."
        confirmLabel="Delete"
        cancelLabel="Cancel"
        confirmVariant="destructive"
        loading={deleteLoading}
        onConfirm={handleConfirmDeleteBroadcast}
      />

      <ConfirmDialog
        open={!!deleteConnectionId}
        onOpenChange={(open) => {
          if (!open && !deleteLoading) setDeleteConnectionId(null);
        }}
        title="Disconnect this account?"
        description="The server will forget the saved credentials. Future broadcasts will not include this account."
        confirmLabel="Disconnect"
        cancelLabel="Cancel"
        confirmVariant="destructive"
        loading={deleteLoading}
        onConfirm={() => deleteConnectionId && handleDeleteConnection(deleteConnectionId)}
      />
    </div>
  );
};

/* --------------------------- Composer subcomponent --------------------------- */

const ComposerModal = ({
  form,
  setForm,
  selectedTargets,
  setSelectedTargets,
  platformsById,
  connections,
  saving,
  onCancel,
  onSave,
}: {
  form: typeof emptyForm;
  setForm: React.Dispatch<React.SetStateAction<typeof emptyForm>>;
  selectedTargets: Record<string, boolean>;
  setSelectedTargets: React.Dispatch<React.SetStateAction<Record<string, boolean>>>;
  platformsById: Record<string, PlatformInfo>;
  connections: SocialConnection[];
  saving: boolean;
  onCancel: () => void;
  onSave: () => void;
}) => {
  const ordered: Platform[] = ["facebook", "instagram", "whatsapp", "telegram", "twitter", "linkedin", "youtube", "tiktok", "website"];
  const minCharLimit = useMemo(() => {
    let limit = Infinity;
    for (const [key, on] of Object.entries(selectedTargets)) {
      if (!on) continue;
      const platform = key.split(":")[0] as Platform;
      const info = platformsById[platform];
      if (info?.charLimit && info.charLimit < limit) limit = info.charLimit;
    }
    return limit === Infinity ? null : limit;
  }, [selectedTargets, platformsById]);

  const remaining = minCharLimit !== null ? minCharLimit - form.content.length : null;
  const tooLong = remaining !== null && remaining < 0;

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 overflow-y-auto" onClick={onCancel}>
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="bg-card rounded-2xl border border-border shadow-2xl w-full max-w-2xl my-8"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-6 border-b border-border">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center">
              <Share2 size={18} className="text-primary" />
            </div>
            <div>
              <h3 className="font-heading text-lg font-bold text-foreground">New Broadcast</h3>
              <p className="text-xs text-muted-foreground">One post — many platforms</p>
            </div>
          </div>
          <button onClick={onCancel} className="p-2 rounded-lg hover:bg-muted transition-colors text-muted-foreground">
            <X size={18} />
          </button>
        </div>

        <div className="p-6 space-y-4">
          <div>
            <Label className="text-xs font-semibold text-foreground mb-2 block">Send to</Label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {ordered.map((id) => {
                const info = platformsById[id];
                if (!info) return null;
                const chrome = platformChrome[id];
                const Icon = chrome.icon;
                if (info.connectKind === "internal") {
                  const key = `${id}:auto`;
                  const checked = !!selectedTargets[key];
                  return (
                    <label
                      key={key}
                      className={`flex items-center gap-2 p-2.5 rounded-xl border cursor-pointer transition-all ${
                        checked ? "border-primary bg-primary/5" : "border-border hover:border-primary/30"
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={(e) =>
                          setSelectedTargets({ ...selectedTargets, [key]: e.target.checked })
                        }
                        className="accent-primary"
                      />
                      <div className={`w-6 h-6 rounded-md flex items-center justify-center text-white ${chrome.color}`}>
                        <Icon size={12} />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-semibold truncate">{info.label}</p>
                        <p className="text-[10px] text-muted-foreground truncate">Internal</p>
                      </div>
                    </label>
                  );
                }
                const conns = connections.filter((c) => c.platform === id);
                if (!conns.length) {
                  return (
                    <div
                      key={id}
                      className="flex items-center gap-2 p-2.5 rounded-xl border border-dashed border-border opacity-60"
                      title="Connect this platform first"
                    >
                      <div className={`w-6 h-6 rounded-md flex items-center justify-center text-white ${chrome.color}`}>
                        <Icon size={12} />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-semibold truncate">{info.label}</p>
                        <p className="text-[10px] text-muted-foreground">Not connected</p>
                      </div>
                    </div>
                  );
                }
                return conns.map((c) => {
                  const key = `${id}:${c.id}`;
                  const checked = !!selectedTargets[key];
                  const disabled = c.status !== "active";
                  return (
                    <label
                      key={key}
                      className={`flex items-center gap-2 p-2.5 rounded-xl border transition-all ${
                        disabled
                          ? "border-border opacity-50 cursor-not-allowed"
                          : checked
                          ? "border-primary bg-primary/5 cursor-pointer"
                          : "border-border hover:border-primary/30 cursor-pointer"
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={checked}
                        disabled={disabled}
                        onChange={(e) =>
                          setSelectedTargets({ ...selectedTargets, [key]: e.target.checked })
                        }
                        className="accent-primary"
                      />
                      <div className={`w-6 h-6 rounded-md flex items-center justify-center text-white ${chrome.color}`}>
                        <Icon size={12} />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-semibold truncate">{info.label}</p>
                        <p className="text-[10px] text-muted-foreground truncate">
                          {c.account_label || (disabled ? "needs login" : "ready")}
                        </p>
                      </div>
                    </label>
                  );
                });
              })}
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <Label className="text-xs font-semibold text-foreground">Content</Label>
              {minCharLimit !== null && (
                <span className={`text-[10px] ${tooLong ? "text-destructive" : "text-muted-foreground"}`}>
                  {remaining} chars left (min limit on selected: {minCharLimit})
                </span>
              )}
            </div>
            <Textarea
              value={form.content}
              onChange={(e) => setForm({ ...form, content: e.target.value })}
              className="bg-muted/50 min-h-[120px]"
              placeholder="Write your post..."
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <Label className="text-xs font-semibold text-foreground">Image URL (optional)</Label>
              <Input
                value={form.image_url}
                onChange={(e) => setForm({ ...form, image_url: e.target.value })}
                className="mt-1.5 bg-muted/50"
                placeholder="https://..."
              />
            </div>
            <div>
              <Label className="text-xs font-semibold text-foreground">Video URL (optional)</Label>
              <Input
                value={form.video_url}
                onChange={(e) => setForm({ ...form, video_url: e.target.value })}
                className="mt-1.5 bg-muted/50"
                placeholder="https://..."
              />
            </div>
            <div>
              <Label className="text-xs font-semibold text-foreground">Link (optional)</Label>
              <Input
                value={form.link}
                onChange={(e) => setForm({ ...form, link: e.target.value })}
                className="mt-1.5 bg-muted/50"
                placeholder="https://..."
              />
            </div>
            <div>
              <Label className="text-xs font-semibold text-foreground">Schedule (optional)</Label>
              <Input
                type="datetime-local"
                value={form.scheduled_at}
                onChange={(e) => setForm({ ...form, scheduled_at: e.target.value })}
                className="mt-1.5 bg-muted/50"
              />
            </div>
            <div className="sm:col-span-2">
              <Label className="text-xs font-semibold text-foreground">Status</Label>
              <Select value={form.status} onValueChange={(v) => setForm({ ...form, status: v as any })}>
                <SelectTrigger className="mt-1.5 bg-muted/50">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pending">Publish (or queue if scheduled)</SelectItem>
                  <SelectItem value="draft">Save as draft</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 p-6 border-t border-border">
          <Button variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button
            onClick={onSave}
            disabled={saving || tooLong}
            className="bg-primary text-primary-foreground hover:bg-primary/90 gap-2"
          >
            {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
            {form.status === "draft" ? "Save Draft" : "Send Broadcast"}
          </Button>
        </div>
      </motion.div>
    </div>
  );
};

/* --------------------------- Platform panel (Connection + Public Links) --------------------------- */

const PlatformPanel = ({
  platformId,
  info,
  connections,
  tab,
  setTab,
  platformForm,
  setPlatformForm,
  onClose,
  onUploadQr,
  uploadingQr,
  savingPlatform,
  onSaveLinks,
  onDisconnect,
  onConnected,
}: {
  platformId: Platform;
  info?: PlatformInfo;
  connections: SocialConnection[];
  tab: "connection" | "links";
  setTab: (t: "connection" | "links") => void;
  platformForm: PlatformConfig;
  setPlatformForm: React.Dispatch<React.SetStateAction<PlatformConfig>>;
  onClose: () => void;
  onUploadQr: (e: React.ChangeEvent<HTMLInputElement>) => void;
  uploadingQr: boolean;
  savingPlatform: boolean;
  onSaveLinks: () => void;
  onDisconnect: (id: string) => void;
  onConnected: () => void;
}) => {
  const chrome = platformChrome[platformId];
  const Icon = chrome.icon;
  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 overflow-y-auto" onClick={onClose}>
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="bg-card rounded-2xl border border-border shadow-2xl w-full max-w-lg my-8"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-6 border-b border-border">
          <div className="flex items-center gap-3">
            <div className={`w-9 h-9 rounded-lg flex items-center justify-center text-white ${chrome.color}`}>
              <Icon size={18} />
            </div>
            <div>
              <h3 className="font-heading text-lg font-bold text-foreground">{info?.label || platformId}</h3>
              <p className="text-xs text-muted-foreground">{info?.note || "Configure this platform"}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-muted transition-colors text-muted-foreground">
            <X size={18} />
          </button>
        </div>

        <div className="px-6 pt-4 flex gap-2 border-b border-border">
          <button
            onClick={() => setTab("connection")}
            className={`px-3 py-2 text-xs font-bold border-b-2 transition-colors ${
              tab === "connection"
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            Connection
          </button>
          <button
            onClick={() => setTab("links")}
            className={`px-3 py-2 text-xs font-bold border-b-2 transition-colors ${
              tab === "links"
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            Public Links
          </button>
        </div>

        {tab === "connection" ? (
          <ConnectionTab
            platformId={platformId}
            info={info}
            connections={connections}
            onDisconnect={onDisconnect}
            onConnected={onConnected}
          />
        ) : (
          <LinksTab
            form={platformForm}
            setForm={setPlatformForm}
            onUploadQr={onUploadQr}
            uploadingQr={uploadingQr}
            saving={savingPlatform}
            onSave={onSaveLinks}
          />
        )}
      </motion.div>
    </div>
  );
};

const ConnectionTab = ({
  platformId,
  info,
  connections,
  onDisconnect,
  onConnected,
}: {
  platformId: Platform;
  info?: PlatformInfo;
  connections: SocialConnection[];
  onDisconnect: (id: string) => void;
  onConnected: () => void;
}) => {
  if (!info) return <div className="p-6 text-sm text-muted-foreground">Loading…</div>;

  const hasActive = connections.some((c) => c.status === "active");

  return (
    <div className="p-6 space-y-4">
      {info.experimental && (
        <div className="flex items-start gap-2 p-3 bg-amber-100 dark:bg-amber-500/15 border border-amber-200 dark:border-amber-500/30 rounded-lg text-amber-800 dark:text-amber-300 text-xs">
          <ShieldAlert size={14} className="shrink-0 mt-0.5" />
          <p>
            Experimental integration. {info.note || "May break without notice."}
          </p>
        </div>
      )}

      <PlatformSetupGuide platform={platformId} defaultOpen={!hasActive} />

      {connections.length > 0 && (
        <div className="space-y-2">
          <Label className="text-xs font-semibold text-foreground">Connected accounts</Label>
          {connections.map((c) => (
            <div
              key={c.id}
              className="flex items-center justify-between p-3 bg-muted/40 rounded-lg border border-border"
            >
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold truncate">{c.account_label || c.account_external_id || "Account"}</span>
                  <StatusPill status={c.status} />
                </div>
                {c.last_error && <p className="text-[11px] text-destructive mt-0.5 truncate">{c.last_error}</p>}
                {c.expires_at && (
                  <p className="text-[10px] text-muted-foreground mt-0.5">
                    Token expires {new Date(c.expires_at).toLocaleDateString()}
                  </p>
                )}
              </div>
              <button
                onClick={() => onDisconnect(c.id)}
                className="p-2 rounded-lg text-destructive/70 hover:text-destructive hover:bg-destructive/10"
                title="Disconnect"
              >
                <Unplug size={14} />
              </button>
            </div>
          ))}
        </div>
      )}

      {info.connectKind === "internal" && (
        <div className="p-3 bg-muted/40 rounded-lg text-xs text-muted-foreground">
          Internal channel — no setup required. Posts to this platform are stored in your own database and rendered on the public site.
        </div>
      )}

      {info.connectKind === "manual" && platformId === "telegram" && (
        <TelegramConnectForm onConnected={onConnected} />
      )}

      {info.connectKind === "api" && (
        <OAuthConnectButton platformId={platformId} info={info} onConnected={onConnected} />
      )}

      {info.connectKind === "automation" && platformId === "whatsapp" && (
        <WhatsAppConnectFlow connections={connections} onConnected={onConnected} />
      )}
    </div>
  );
};

const StatusPill = ({ status }: { status: SocialConnection["status"] }) => {
  const map: Record<SocialConnection["status"], { bg: string; text: string; label: string }> = {
    active: { bg: "bg-emerald-100 dark:bg-emerald-500/15", text: "text-emerald-700 dark:text-emerald-400", label: "ACTIVE" },
    expired: { bg: "bg-amber-100 dark:bg-amber-500/15", text: "text-amber-700 dark:text-amber-400", label: "EXPIRED" },
    needs_login: { bg: "bg-amber-100 dark:bg-amber-500/15", text: "text-amber-700 dark:text-amber-400", label: "NEEDS LOGIN" },
    error: { bg: "bg-red-100 dark:bg-red-500/15", text: "text-red-700 dark:text-red-400", label: "ERROR" },
    pending: { bg: "bg-blue-100 dark:bg-blue-500/15", text: "text-blue-700 dark:text-blue-400", label: "PENDING" },
    disabled: { bg: "bg-muted", text: "text-muted-foreground", label: "DISABLED" },
  };
  const cfg = map[status];
  return (
    <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[9px] font-bold ${cfg.bg} ${cfg.text}`}>
      {cfg.label}
    </span>
  );
};

/* --------------------------- Telegram connect form --------------------------- */

const TelegramConnectForm = ({ onConnected }: { onConnected: () => void }) => {
  const [botToken, setBotToken] = useState("");
  const [chatId, setChatId] = useState("");
  const [label, setLabel] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    if (!botToken.trim() || !chatId.trim()) {
      toast.error("Bot token and chat id are required");
      return;
    }
    setBusy(true);
    try {
      await socialApi.connectTelegram({
        bot_token: botToken.trim(),
        chat_id: chatId.trim(),
        account_label: label.trim() || undefined,
      });
      toast.success("Telegram connected");
      setBotToken("");
      setChatId("");
      setLabel("");
      onConnected();
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-3 p-3 border border-dashed border-border rounded-lg">
      <p className="text-xs text-muted-foreground">
        Create a bot via{" "}
        <a className="underline" href="https://t.me/BotFather" target="_blank" rel="noreferrer">
          @BotFather
        </a>
        , add it as an admin to your channel/group, then paste its token + the channel id below.
      </p>
      <div>
        <Label className="text-[11px] font-semibold">Bot token</Label>
        <Input value={botToken} onChange={(e) => setBotToken(e.target.value)} placeholder="123456:ABC-..." className="mt-1 bg-muted/50" />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label className="text-[11px] font-semibold">Channel / chat id</Label>
          <Input value={chatId} onChange={(e) => setChatId(e.target.value)} placeholder="@channelname or -100..." className="mt-1 bg-muted/50" />
        </div>
        <div>
          <Label className="text-[11px] font-semibold">Label (optional)</Label>
          <Input value={label} onChange={(e) => setLabel(e.target.value)} placeholder="Starline announcements" className="mt-1 bg-muted/50" />
        </div>
      </div>
      <Button onClick={submit} disabled={busy} className="w-full gap-2">
        {busy ? <Loader2 size={14} className="animate-spin" /> : <Plug size={14} />}
        Connect Telegram
      </Button>
    </div>
  );
};

/* --------------------------- OAuth connect button --------------------------- */

const OAuthConnectButton = ({
  platformId,
  info,
  onConnected,
}: {
  platformId: Platform;
  info: PlatformInfo;
  onConnected: () => void;
}) => {
  const [busy, setBusy] = useState(false);
  const popupRef = useRef<Window | null>(null);

  useEffect(() => {
    const handler = (ev: MessageEvent) => {
      const data = ev.data;
      if (!data || data.type !== "starline_social_oauth") return;
      if (data.payload?.ok) {
        toast.success(`Connected: ${data.payload.account_label || platformId}`);
        onConnected();
      } else {
        toast.error(data.payload?.error || "OAuth failed");
      }
      setBusy(false);
      try {
        popupRef.current?.close();
      } catch {
        /* noop */
      }
    };
    window.addEventListener("message", handler);
    return () => window.removeEventListener("message", handler);
  }, [platformId, onConnected]);

  const start = () => {
    if (!info.oauth_configured) {
      toast.error(`OAuth credentials for ${info.label} are not configured on the server.`);
      return;
    }
    if (platformId === "twitter" && info.twitter_enabled === false) {
      toast.error("Twitter posting is disabled. Set TWITTER_ENABLED=true once your paid API plan is active.");
      return;
    }
    setBusy(true);
    const url = socialApi.oauthStartUrl(platformId);
    popupRef.current = window.open(url, "social_oauth", "width=600,height=720,noopener=no");
    if (!popupRef.current) {
      toast.error("Popup blocked — please allow popups for this site");
      setBusy(false);
    }
  };

  return (
    <div className="space-y-2">
      <Button onClick={start} disabled={busy} className="w-full gap-2">
        {busy ? <Loader2 size={14} className="animate-spin" /> : <Plug size={14} />}
        Connect {info.label}
      </Button>
      {!info.oauth_configured && (
        <p className="text-[11px] text-amber-600 dark:text-amber-400">
          Server-side OAuth credentials are not configured. Set the relevant env vars (see <code>.env.example</code>) and restart the API.
        </p>
      )}
    </div>
  );
};

/* --------------------------- WhatsApp connect flow --------------------------- */

const WhatsAppConnectFlow = ({
  connections,
  onConnected,
}: {
  connections: SocialConnection[];
  onConnected: () => void;
}) => {
  const [creating, setCreating] = useState(false);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [qr, setQr] = useState<string | null>(null);
  const [status, setStatus] = useState<string>("idle");
  const [error, setError] = useState<string | null>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const stopPolling = () => {
    if (pollRef.current) clearInterval(pollRef.current);
    pollRef.current = null;
  };

  useEffect(() => () => stopPolling(), []);

  const startPolling = (id: string) => {
    stopPolling();
    pollRef.current = setInterval(async () => {
      try {
        const s = await socialApi.whatsAppStatus(id);
        setStatus(s.status);
        setQr(s.qr);
        setError(s.error);
        if (s.status === "authenticated") {
          stopPolling();
          toast.success("WhatsApp connected");
          onConnected();
        } else if (s.status === "error") {
          stopPolling();
        }
      } catch (err) {
        setError((err as Error).message);
        stopPolling();
      }
    }, 2500);
  };

  const beginLogin = async (id: string) => {
    setActiveId(id);
    setStatus("starting");
    setError(null);
    setQr(null);
    try {
      const s = await socialApi.startWhatsAppLogin(id);
      setStatus(s.status);
      setQr(s.qr);
      setError(s.error);
      startPolling(id);
    } catch (err) {
      setError((err as Error).message);
      setStatus("error");
    }
  };

  const createAndLogin = async () => {
    setCreating(true);
    try {
      const conn = await socialApi.createWhatsAppConnection({});
      onConnected();
      await beginLogin(conn.id);
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="space-y-3">
      {!connections.length && (
        <Button onClick={createAndLogin} disabled={creating} className="w-full gap-2">
          {creating ? <Loader2 size={14} className="animate-spin" /> : <Plug size={14} />}
          Add WhatsApp account
        </Button>
      )}

      {connections.map((c) => (
        <div key={c.id} className="border border-dashed border-border rounded-lg p-3 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm font-semibold">{c.account_label || "WhatsApp"}</span>
            <Button size="sm" variant="outline" onClick={() => beginLogin(c.id)} className="gap-1.5">
              <RefreshCw size={12} /> {c.status === "active" ? "Re-authenticate" : "Scan QR"}
            </Button>
          </div>

          {activeId === c.id && (
            <div className="text-center space-y-2">
              <p className="text-[11px] text-muted-foreground">{statusLabel(status)}</p>
              {qr ? (
                <img src={qr} alt="WhatsApp QR" className="mx-auto rounded-lg border border-border bg-white p-2 max-w-[220px]" />
              ) : (
                <div className="flex items-center justify-center h-40">
                  <Loader2 className="animate-spin text-muted-foreground" />
                </div>
              )}
              {error && <p className="text-[11px] text-destructive">{error}</p>}
              <p className="text-[10px] text-muted-foreground">
                Open WhatsApp → Settings → Linked Devices → Link a Device, then scan this code.
              </p>
            </div>
          )}
        </div>
      ))}
    </div>
  );
};

const statusLabel = (status: string): string => {
  switch (status) {
    case "starting":
      return "Booting browser...";
    case "qr":
      return "Waiting for you to scan";
    case "authenticated":
      return "Authenticated";
    case "error":
      return "Login failed";
    case "closed":
      return "Closed";
    default:
      return status;
  }
};

/* --------------------------- Public links tab --------------------------- */

const LinksTab = ({
  form,
  setForm,
  onUploadQr,
  uploadingQr,
  saving,
  onSave,
}: {
  form: PlatformConfig;
  setForm: React.Dispatch<React.SetStateAction<PlatformConfig>>;
  onUploadQr: (e: React.ChangeEvent<HTMLInputElement>) => void;
  uploadingQr: boolean;
  saving: boolean;
  onSave: () => void;
}) => {
  return (
    <>
      <div className="p-6 space-y-4">
        <div>
          <Label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
            <LinkIcon size={12} /> Profile / Page Link
          </Label>
          <Input
            value={form.link}
            onChange={(e) => setForm({ ...form, link: e.target.value })}
            className="mt-1.5 bg-muted/50"
            placeholder="https://..."
          />
        </div>
        <div>
          <Label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
            <Users size={12} /> Group / Channel Link
          </Label>
          <Input
            value={form.group_link}
            onChange={(e) => setForm({ ...form, group_link: e.target.value })}
            className="mt-1.5 bg-muted/50"
            placeholder="https://..."
          />
        </div>
        <div>
          <Label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
            <Phone size={12} /> Phone Number
          </Label>
          <Input
            value={form.phone}
            onChange={(e) => setForm({ ...form, phone: e.target.value })}
            className="mt-1.5 bg-muted/50"
            placeholder="+880..."
          />
        </div>
        <div>
          <Label className="text-xs font-semibold text-foreground flex items-center gap-1.5 mb-1.5">
            <QrCode size={12} /> QR Code
          </Label>
          {form.qr_code_url ? (
            <div className="flex items-center gap-3">
              <img
                src={form.qr_code_url}
                alt="QR"
                className="w-20 h-20 rounded-xl border border-border object-contain bg-white"
              />
              <div className="space-y-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => document.getElementById("qr-upload")?.click()}
                  className="gap-1.5 text-xs"
                >
                  <Upload size={12} /> Change
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setForm({ ...form, qr_code_url: "" })}
                  className="gap-1.5 text-xs text-destructive hover:text-destructive"
                >
                  <X size={12} /> Remove
                </Button>
              </div>
            </div>
          ) : (
            <div
              className="border-2 border-dashed border-border rounded-xl p-4 text-center cursor-pointer hover:border-primary/30 transition-colors"
              onClick={() => document.getElementById("qr-upload")?.click()}
            >
              <QrCode size={24} className="mx-auto mb-1 text-muted-foreground" />
              <p className="text-xs text-muted-foreground">Click to upload QR code</p>
            </div>
          )}
          <input id="qr-upload" type="file" accept="image/*" className="hidden" onChange={onUploadQr} />
          {uploadingQr && <p className="text-xs text-primary animate-pulse mt-1">Uploading...</p>}
        </div>
      </div>

      <div className="flex items-center justify-end gap-3 p-6 border-t border-border">
        <Button onClick={onSave} disabled={saving} className="bg-primary text-primary-foreground hover:bg-primary/90 gap-2">
          {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
          Save Settings
        </Button>
      </div>
    </>
  );
};

export default AdminSocialMedia;
