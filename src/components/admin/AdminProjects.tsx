import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/components/ui/use-toast";
import { HardHat, Plus, Loader2, MapPin, Calendar, X, Save, Trash2, Search, ChevronDown, DollarSign, Eye, List, LayoutGrid } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { ConfirmDialog } from "@/components/common/ConfirmDialog";

interface Project {
  id: string;
  user_id: string;
  project_name: string;
  location: string | null;
  status: string;
  total_amount: number;
  paid_amount: number;
  monthly_installment: number;
  start_date: string | null;
  expected_completion: string | null;
  building_image_url: string | null;
  customer_name?: string;
}

interface CustomerOption {
  user_id: string;
  full_name: string | null;
}

const statusOptions = ["planned", "in_progress", "completed", "on_hold", "for_sale", "for_rent"];

type FilterStatus = "all" | "planned" | "in_progress" | "completed" | "on_hold" | "for_sale" | "for_rent";
const filterLabels: Record<FilterStatus, string> = {
  all: "All Projects",
  planned: "Planned",
  in_progress: "In Progress",
  completed: "Completed",
  on_hold: "On Hold",
  for_sale: "For Sale",
  for_rent: "For Rent",
};

const AdminProjects = () => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [customers, setCustomers] = useState<CustomerOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<FilterStatus>("all");
  const [showFilterMenu, setShowFilterMenu] = useState(false);
  const [viewProject, setViewProject] = useState<Project | null>(null);
  const [viewMode, setViewMode] = useState<"list" | "grid">("list");
  const [form, setForm] = useState({
    user_id: "",
    project_name: "",
    location: "",
    status: "planned",
    total_amount: "",
    paid_amount: "",
    monthly_installment: "",
    start_date: "",
    expected_completion: "",
  });

  const fetchData = async () => {
    const [projRes, custRes, rolesRes] = await Promise.all([
      supabase.from("customer_projects").select("*").order("created_at", { ascending: false }),
      supabase.from("profiles").select("user_id, full_name"),
      supabase.from("user_roles").select("user_id, role").eq("role", "customer"),
    ]);

    const customerIds = new Set((rolesRes.data || []).map((r) => r.user_id));
    const custList = (custRes.data || []).filter((c) => customerIds.has(c.user_id));
    const custMap: Record<string, string> = {};
    custList.forEach((c) => { custMap[c.user_id] = c.full_name || "Unnamed"; });

    setCustomers(custList);
    setProjects(
      (projRes.data || []).map((p) => ({ ...p, customer_name: custMap[p.user_id] || "Unknown" })) as Project[]
    );
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, []);

  const resetForm = () => {
    setForm({ user_id: "", project_name: "", location: "", status: "planned", total_amount: "", paid_amount: "", monthly_installment: "", start_date: "", expected_completion: "" });
    setEditId(null);
    setShowForm(false);
  };

  const openEdit = (p: Project) => {
    setForm({
      user_id: p.user_id,
      project_name: p.project_name,
      location: p.location || "",
      status: p.status,
      total_amount: String(p.total_amount),
      paid_amount: String(p.paid_amount),
      monthly_installment: String(p.monthly_installment),
      start_date: p.start_date || "",
      expected_completion: p.expected_completion || "",
    });
    setEditId(p.id);
    setShowForm(true);
  };

  const handleSave = async () => {
    if (!form.user_id || !form.project_name) { toast.error("Customer and project name are required"); return; }
    setSaving(true);

    const payload = {
      user_id: form.user_id,
      project_name: form.project_name.trim(),
      location: form.location.trim() || null,
      status: form.status,
      total_amount: Number(form.total_amount) || 0,
      paid_amount: Number(form.paid_amount) || 0,
      monthly_installment: Number(form.monthly_installment) || 0,
      start_date: form.start_date || null,
      expected_completion: form.expected_completion || null,
    };

    let error;
    if (editId) {
      ({ error } = await supabase.from("customer_projects").update(payload).eq("id", editId));
    } else {
      ({ error } = await supabase.from("customer_projects").insert(payload));
    }

    setSaving(false);
    if (error) { toast.error(error.message); return; }
    toast.success(editId ? "Project updated!" : "Project created!");
    resetForm();
    fetchData();
  };

  const [deleteTarget, setDeleteTarget] = useState<Project | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const handleDelete = (id: string) => {
    const target = projects.find((p) => p.id === id) || null;
    setDeleteTarget(target);
  };

  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;
    setDeleteLoading(true);
    const { error } = await supabase.from("customer_projects").delete().eq("id", deleteTarget.id);
    setDeleteLoading(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Project deleted");
    setDeleteTarget(null);
    fetchData();
  };

  const formatCurrency = (n: number) => `৳${n.toLocaleString()}`;
  const inputClass = "w-full bg-muted text-foreground rounded-xl px-4 py-3 text-sm outline-none border border-border focus:ring-2 focus:ring-ring transition-shadow";

  const filtered = projects.filter((p) => {
    const q = search.toLowerCase();
    const matchesSearch = !q || p.project_name.toLowerCase().includes(q) || (p.customer_name || "").toLowerCase().includes(q) || (p.location || "").toLowerCase().includes(q);
    if (!matchesSearch) return false;
    if (filter !== "all" && p.status !== filter) return false;
    return true;
  });

  if (loading) return <div className="flex justify-center py-20"><Loader2 className="animate-spin text-gold" size={32} /></div>;

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-3">
          <h2 className="font-heading text-2xl font-bold text-foreground">Projects</h2>
          <span className="bg-dash-orange text-white text-xs font-bold px-3 py-1.5 rounded-full">{filtered.length}</span>
        </div>
        <button onClick={() => { resetForm(); setShowForm(true); }} className="bg-dash-blue text-white px-4 py-2.5 rounded-xl text-sm font-semibold flex items-center gap-2 hover:opacity-90 transition-opacity shadow-md">
          <Plus size={16} /> Add Project
        </button>
      </div>

      {/* Search & Filter */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="flex-1 relative">
          <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by project name, customer, or location..."
            className="w-full bg-card text-foreground rounded-xl pl-11 pr-4 py-3 text-sm outline-none border border-border focus:ring-2 focus:ring-ring transition-shadow"
          />
        </div>
        <div className="relative">
          <button
            onClick={() => setShowFilterMenu(!showFilterMenu)}
            className="bg-card border border-border rounded-xl px-4 py-3 text-sm font-medium text-foreground flex items-center gap-2 hover:bg-muted transition-colors min-w-[160px]"
          >
            <span className={`w-2 h-2 rounded-full ${filter === "all" ? "bg-dash-blue" : filter === "completed" ? "bg-dash-green" : filter === "in_progress" ? "bg-gold" : filter === "on_hold" ? "bg-destructive" : "bg-muted-foreground"}`} />
            {filterLabels[filter]}
            <ChevronDown size={14} className="ml-auto" />
          </button>
          {showFilterMenu && (
            <div className="absolute right-0 top-full mt-1 bg-card border border-border rounded-xl shadow-xl z-30 overflow-hidden min-w-[180px]">
              {(Object.keys(filterLabels) as FilterStatus[]).map((f) => (
                <button
                  key={f}
                  onClick={() => { setFilter(f); setShowFilterMenu(false); }}
                  className={`w-full text-left px-4 py-2.5 text-sm hover:bg-muted transition-colors ${filter === f ? "bg-muted font-semibold text-foreground" : "text-muted-foreground"}`}
                >
                  {filterLabels[f]}
                </button>
              ))}
            </div>
          )}
        </div>
        <div className="flex items-center bg-card border border-border rounded-xl overflow-hidden">
          <button onClick={() => setViewMode("list")} className={`p-3 transition-colors ${viewMode === "list" ? "bg-muted text-foreground" : "text-muted-foreground hover:text-foreground"}`} title="List view"><List size={16} /></button>
          <button onClick={() => setViewMode("grid")} className={`p-3 transition-colors ${viewMode === "grid" ? "bg-muted text-foreground" : "text-muted-foreground hover:text-foreground"}`} title="Grid view"><LayoutGrid size={16} /></button>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        {[
          { label: "Total Projects", value: projects.length, color: "bg-dash-blue", icon: <HardHat size={16} /> },
          { label: "In Progress", value: projects.filter((p) => p.status === "in_progress").length, color: "bg-dash-orange", icon: <HardHat size={16} /> },
          { label: "Completed", value: projects.filter((p) => p.status === "completed").length, color: "bg-dash-green", icon: <HardHat size={16} /> },
          { label: "Total Value", value: formatCurrency(projects.reduce((s, p) => s + p.total_amount, 0)), color: "bg-dash-purple", icon: <DollarSign size={16} /> },
        ].map((stat, i) => (
          <motion.div key={i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
            className={`${stat.color} rounded-2xl p-4 text-white shadow-lg`}>
            <div className="flex items-center gap-2 text-white/70 text-xs font-medium mb-1">{stat.icon} {stat.label}</div>
            <p className="font-heading text-xl font-bold">{stat.value}</p>
          </motion.div>
        ))}
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
              <h3 className="font-heading text-lg font-bold text-foreground">{editId ? "Edit Project" : "New Project"}</h3>
              <button onClick={resetForm} className="text-muted-foreground hover:text-foreground"><X size={20} /></button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-foreground mb-1.5 block">Customer *</label>
                <select value={form.user_id} onChange={(e) => setForm((f) => ({ ...f, user_id: e.target.value }))} className={inputClass}>
                  <option value="">Select customer...</option>
                  {customers.map((c) => <option key={c.user_id} value={c.user_id}>{c.full_name || "Unnamed"}</option>)}
                </select>
              </div>
              <div>
                <label className="text-sm font-medium text-foreground mb-1.5 block">Project Name *</label>
                <input value={form.project_name} onChange={(e) => setForm((f) => ({ ...f, project_name: e.target.value }))} className={inputClass} placeholder="e.g. Starline Heights - Unit 5B" maxLength={200} />
              </div>
              <div>
                <label className="text-sm font-medium text-foreground mb-1.5 block">Location</label>
                <input value={form.location} onChange={(e) => setForm((f) => ({ ...f, location: e.target.value }))} className={inputClass} placeholder="e.g. Bashundhara R/A, Dhaka" maxLength={200} />
              </div>
              <div>
                <label className="text-sm font-medium text-foreground mb-1.5 block">Status</label>
                <select value={form.status} onChange={(e) => setForm((f) => ({ ...f, status: e.target.value }))} className={inputClass}>
                  {statusOptions.map((s) => <option key={s} value={s}>{s.replace("_", " ")}</option>)}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-sm font-medium text-foreground mb-1.5 block">Total Project Budget</label>
                  <input type="number" value={form.total_amount} onChange={(e) => setForm((f) => ({ ...f, total_amount: e.target.value }))} className={inputClass} placeholder="0" />
                </div>
                <div>
                  <label className="text-sm font-medium text-foreground mb-1.5 block">Investment Amount</label>
                  <input type="number" value={form.paid_amount} onChange={(e) => setForm((f) => ({ ...f, paid_amount: e.target.value }))} className={inputClass} placeholder="0" />
                </div>
              </div>
              {/* Computed financial info */}
              {(Number(form.total_amount) > 0 || Number(form.paid_amount) > 0) && (() => {
                const total = Number(form.total_amount) || 0;
                const paid = Number(form.paid_amount) || 0;
                const remaining = Math.max(0, total - paid);
                const overpaidAmt = Math.max(0, paid - total);
                const isOver = paid > total;
                return (
                  <div className="grid grid-cols-2 gap-3">
                    <div className={`rounded-xl p-3 text-center ${remaining > 0 ? "bg-destructive/10" : "bg-dash-green/10"}`}>
                      <p className={`text-[10px] uppercase tracking-wider font-semibold mb-1 ${remaining > 0 ? "text-destructive" : "text-dash-green"}`}>Remaining</p>
                      <p className={`font-bold text-sm ${remaining > 0 ? "text-destructive" : "text-dash-green"}`}>৳{remaining.toLocaleString()}</p>
                    </div>
                    <div className={`rounded-xl p-3 text-center ${isOver ? "bg-dash-purple/10" : "bg-muted/50"}`}>
                      <p className={`text-[10px] uppercase tracking-wider font-semibold mb-1 ${isOver ? "text-dash-purple" : "text-muted-foreground"}`}>Overpaid</p>
                      <p className={`font-bold text-sm ${isOver ? "text-dash-purple" : "text-muted-foreground"}`}>৳{overpaidAmt.toLocaleString()}</p>
                    </div>
                  </div>
                );
              })()}
              <div>
                <label className="text-sm font-medium text-foreground mb-1.5 block">Monthly EMI</label>
                <input type="number" value={form.monthly_installment} onChange={(e) => setForm((f) => ({ ...f, monthly_installment: e.target.value }))} className={inputClass} placeholder="0" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-sm font-medium text-foreground mb-1.5 block">Start Date</label>
                  <input type="date" value={form.start_date} onChange={(e) => setForm((f) => ({ ...f, start_date: e.target.value }))} className={inputClass} />
                </div>
                <div>
                  <label className="text-sm font-medium text-foreground mb-1.5 block">Expected Completion</label>
                  <input type="date" value={form.expected_completion} onChange={(e) => setForm((f) => ({ ...f, expected_completion: e.target.value }))} className={inputClass} />
                </div>
              </div>
              <button onClick={handleSave} disabled={saving} className="w-full bg-gold-gradient text-accent-foreground py-3 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 disabled:opacity-50 hover:opacity-90 transition-opacity shadow-md">
                {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                {editId ? "Update Project" : "Create Project"}
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {/* Project List / Grid */}
      <div className={viewMode === "grid" ? "grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4" : "space-y-4"}>
        {filtered.map((p, idx) => {
          const paidPct = p.total_amount > 0 ? Math.min(100, Math.round((p.paid_amount / p.total_amount) * 100)) : 0;
          const remaining = Math.max(0, p.total_amount - p.paid_amount);
          const overpaid = Math.max(0, p.paid_amount - p.total_amount);
          const isOverpaid = p.paid_amount > p.total_amount;
          const statusColor = p.status === "completed" ? "bg-dash-green" : p.status === "in_progress" ? "bg-dash-orange" : p.status === "on_hold" ? "bg-destructive" : p.status === "for_sale" ? "bg-dash-teal" : p.status === "for_rent" ? "bg-dash-purple" : "bg-dash-blue";
          const statusBadge = p.status === "completed" ? "bg-dash-green/15 text-dash-green"
            : p.status === "in_progress" ? "bg-gold/15 text-gold"
            : p.status === "on_hold" ? "bg-destructive/15 text-destructive"
            : p.status === "for_sale" ? "bg-dash-teal/15 text-dash-teal"
            : p.status === "for_rent" ? "bg-dash-purple/15 text-dash-purple"
            : "bg-dash-blue/15 text-dash-blue";

          if (viewMode === "grid") {
            return (
              <motion.div
                key={p.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.03 }}
                className="bg-card rounded-2xl border border-border p-5 shadow-sm hover:shadow-md transition-shadow flex flex-col"
              >
                {/* Header */}
                <div className="flex items-start justify-between gap-2 mb-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-white shrink-0 ${statusColor}`}>
                      <HardHat size={18} />
                    </div>
                    <div className="min-w-0">
                      <h3 className="font-semibold text-foreground text-sm truncate">{p.project_name}</h3>
                      <p className="text-xs text-muted-foreground truncate">👤 {p.customer_name}</p>
                    </div>
                  </div>
                  <span className={`capitalize font-semibold px-2 py-0.5 rounded-full text-[9px] uppercase shrink-0 ${statusBadge}`}>
                    {p.status.replace("_", " ")}
                  </span>
                </div>

                {p.location && (
                  <p className="text-xs text-muted-foreground flex items-center gap-1 mb-3"><MapPin size={11} /> {p.location}</p>
                )}

                {/* Financial grid */}
                <div className="grid grid-cols-2 gap-2 mb-3">
                  <div className="bg-muted/50 rounded-lg p-2 text-center">
                    <p className="text-[9px] uppercase tracking-wider text-muted-foreground font-semibold">Budget</p>
                    <p className="font-bold text-foreground text-xs">{formatCurrency(p.total_amount)}</p>
                  </div>
                  <div className="bg-dash-green/10 rounded-lg p-2 text-center">
                    <p className="text-[9px] uppercase tracking-wider text-dash-green font-semibold">Investment</p>
                    <p className="font-bold text-dash-green text-xs">{formatCurrency(p.paid_amount)}</p>
                  </div>
                  <div className={`rounded-lg p-2 text-center ${remaining > 0 ? "bg-destructive/10" : "bg-dash-green/10"}`}>
                    <p className={`text-[9px] uppercase tracking-wider font-semibold ${remaining > 0 ? "text-destructive" : "text-dash-green"}`}>Remaining</p>
                    <p className={`font-bold text-xs ${remaining > 0 ? "text-destructive" : "text-dash-green"}`}>{formatCurrency(remaining)}</p>
                  </div>
                  <div className={`rounded-lg p-2 text-center ${isOverpaid ? "bg-dash-purple/10" : "bg-muted/50"}`}>
                    <p className={`text-[9px] uppercase tracking-wider font-semibold ${isOverpaid ? "text-dash-purple" : "text-muted-foreground"}`}>Overpaid</p>
                    <p className={`font-bold text-xs ${isOverpaid ? "text-dash-purple" : "text-muted-foreground"}`}>{formatCurrency(overpaid)}</p>
                  </div>
                </div>

                {/* Progress */}
                <div className="flex items-center gap-2 mb-3">
                  <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                    <div className={`h-full rounded-full transition-all ${isOverpaid ? "bg-gradient-to-r from-dash-purple to-dash-purple" : "bg-gradient-to-r from-dash-green to-dash-teal"}`} style={{ width: `${paidPct}%` }} />
                  </div>
                  <span className="text-[10px] font-bold text-muted-foreground">{paidPct}%</span>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-1.5 mt-auto pt-2 border-t border-border">
                  <button onClick={() => setViewProject(p)} title="View" className="p-2 rounded-lg bg-dash-blue/10 text-dash-blue hover:bg-dash-blue/20 transition-colors"><Eye size={14} /></button>
                  <button onClick={() => openEdit(p)} className="flex-1 text-xs bg-muted hover:bg-muted/80 text-foreground px-3 py-2 rounded-lg font-medium transition-colors text-center">Edit</button>
                  <button onClick={() => handleDelete(p.id)} className="p-2 rounded-lg bg-destructive/10 text-destructive hover:bg-destructive/20 transition-colors"><Trash2 size={14} /></button>
                </div>
              </motion.div>
            );
          }

          // List view (existing)
          return (
          <motion.div
            key={p.id}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.03 }}
            className="bg-card rounded-2xl border border-border p-5 shadow-sm hover:shadow-md transition-shadow"
          >
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
              <div className="flex items-center gap-4 flex-1 min-w-0">
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-white shrink-0 ${statusColor}`}>
                  <HardHat size={22} />
                </div>
                <div className="min-w-0">
                  <h3 className="font-semibold text-foreground text-base truncate">{p.project_name}</h3>
                  <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground mt-1">
                    <span className="flex items-center gap-1 font-medium">👤 {p.customer_name}</span>
                    {p.location && <span className="flex items-center gap-1"><MapPin size={12} /> {p.location}</span>}
                    <span className={`capitalize font-semibold px-2 py-0.5 rounded-full text-[10px] uppercase ${statusBadge}`}>
                      {p.status.replace("_", " ")}
                    </span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-1.5 shrink-0">
                <button onClick={() => setViewProject(p)} title="View" className="p-2 rounded-lg bg-dash-blue/10 text-dash-blue hover:bg-dash-blue/20 transition-colors"><Eye size={15} /></button>
                <button onClick={() => openEdit(p)} className="text-xs bg-muted hover:bg-muted/80 text-foreground px-4 py-2 rounded-lg font-medium transition-colors">Edit</button>
                <button onClick={() => handleDelete(p.id)} className="p-2 rounded-lg bg-destructive/10 text-destructive hover:bg-destructive/20 transition-colors"><Trash2 size={15} /></button>
              </div>
            </div>

            <div className="mt-4 grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="bg-muted/50 rounded-xl p-3 text-center">
                <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold mb-1">Total Budget</p>
                <p className="font-bold text-foreground text-sm">{formatCurrency(p.total_amount)}</p>
              </div>
              <div className="bg-dash-green/10 rounded-xl p-3 text-center">
                <p className="text-[10px] uppercase tracking-wider text-dash-green font-semibold mb-1">Investment</p>
                <p className="font-bold text-dash-green text-sm">{formatCurrency(p.paid_amount)}</p>
              </div>
              <div className={`rounded-xl p-3 text-center ${remaining > 0 ? "bg-destructive/10" : "bg-dash-green/10"}`}>
                <p className={`text-[10px] uppercase tracking-wider font-semibold mb-1 ${remaining > 0 ? "text-destructive" : "text-dash-green"}`}>Remaining</p>
                <p className={`font-bold text-sm ${remaining > 0 ? "text-destructive" : "text-dash-green"}`}>{formatCurrency(remaining)}</p>
              </div>
              <div className={`rounded-xl p-3 text-center ${isOverpaid ? "bg-dash-purple/10" : "bg-muted/50"}`}>
                <p className={`text-[10px] uppercase tracking-wider font-semibold mb-1 ${isOverpaid ? "text-dash-purple" : "text-muted-foreground"}`}>Overpaid</p>
                <p className={`font-bold text-sm ${isOverpaid ? "text-dash-purple" : "text-muted-foreground"}`}>{formatCurrency(overpaid)}</p>
              </div>
            </div>

            <div className="mt-3 flex items-center gap-3">
              <div className="flex-1 h-2.5 bg-muted rounded-full overflow-hidden">
                <div className={`h-full rounded-full transition-all ${isOverpaid ? "bg-gradient-to-r from-dash-purple to-dash-purple" : "bg-gradient-to-r from-dash-green to-dash-teal"}`} style={{ width: `${paidPct}%` }} />
              </div>
              <span className="text-xs font-bold text-muted-foreground w-10 text-right">{paidPct}%</span>
            </div>

            {(p.monthly_installment > 0 || p.start_date || p.expected_completion) && (
              <div className="mt-3 flex flex-wrap items-center gap-4 text-xs text-muted-foreground">
                {p.monthly_installment > 0 && (
                  <span className="flex items-center gap-1"><DollarSign size={12} /> EMI: <strong className="text-foreground">{formatCurrency(p.monthly_installment)}</strong>/mo</span>
                )}
                {p.start_date && (
                  <span className="flex items-center gap-1"><Calendar size={12} /> Start: {new Date(p.start_date).toLocaleDateString()}</span>
                )}
                {p.expected_completion && (
                  <span className="flex items-center gap-1"><Calendar size={12} /> Due: {new Date(p.expected_completion).toLocaleDateString()}</span>
                )}
              </div>
            )}
          </motion.div>
          );
        })}
        {filtered.length === 0 && (
          <div className="text-center py-20 text-muted-foreground col-span-full">
            <HardHat size={48} className="mx-auto mb-4 opacity-40" />
            <p>{search || filter !== "all" ? "No projects match your search/filter." : "No projects yet. Click \"Add Project\" to create one."}</p>
          </div>
        )}
      </div>

      {/* VIEW MODAL */}
      <AnimatePresence>
        {viewProject && (() => {
          const vp = viewProject;
          const paidPct = vp.total_amount > 0 ? Math.min(100, Math.round((vp.paid_amount / vp.total_amount) * 100)) : 0;
          const remaining = Math.max(0, vp.total_amount - vp.paid_amount);
          const overpaid = Math.max(0, vp.paid_amount - vp.total_amount);
          const isOverpaid = vp.paid_amount > vp.total_amount;
          return (
            <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setViewProject(null)}>
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
                className="bg-card rounded-2xl border border-border p-6 w-full max-w-md shadow-2xl"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="flex justify-between items-center mb-5">
                  <h3 className="font-heading text-lg font-bold text-foreground">Project Details</h3>
                  <button onClick={() => setViewProject(null)} className="text-muted-foreground hover:text-foreground"><X size={20} /></button>
                </div>

                <div className="text-center mb-5">
                  <div className={`w-16 h-16 rounded-2xl mx-auto flex items-center justify-center text-white mb-3 ${
                    vp.status === "completed" ? "bg-dash-green" : vp.status === "in_progress" ? "bg-dash-orange" : vp.status === "on_hold" ? "bg-destructive" : "bg-dash-blue"
                  }`}>
                    <HardHat size={28} />
                  </div>
                  <p className="font-heading text-xl font-bold text-foreground">{vp.project_name}</p>
                  <span className={`text-xs uppercase font-bold px-3 py-1 rounded-full mt-2 inline-block ${
                    vp.status === "completed" ? "bg-dash-green/15 text-dash-green"
                    : vp.status === "in_progress" ? "bg-gold/15 text-gold"
                    : vp.status === "on_hold" ? "bg-destructive/15 text-destructive"
                    : "bg-dash-blue/15 text-dash-blue"
                  }`}>{vp.status.replace("_", " ")}</span>
                </div>

                {/* Financial cards */}
                <div className="grid grid-cols-2 gap-2 mb-4">
                  <div className="bg-muted/50 rounded-xl p-3 text-center">
                    <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold mb-1">Total Budget</p>
                    <p className="font-bold text-foreground text-sm">{formatCurrency(vp.total_amount)}</p>
                  </div>
                  <div className="bg-dash-green/10 rounded-xl p-3 text-center">
                    <p className="text-[10px] uppercase tracking-wider text-dash-green font-semibold mb-1">Investment</p>
                    <p className="font-bold text-dash-green text-sm">{formatCurrency(vp.paid_amount)}</p>
                  </div>
                  <div className={`rounded-xl p-3 text-center ${remaining > 0 ? "bg-destructive/10" : "bg-dash-green/10"}`}>
                    <p className={`text-[10px] uppercase tracking-wider font-semibold mb-1 ${remaining > 0 ? "text-destructive" : "text-dash-green"}`}>Remaining</p>
                    <p className={`font-bold text-sm ${remaining > 0 ? "text-destructive" : "text-dash-green"}`}>{formatCurrency(remaining)}</p>
                  </div>
                  <div className={`rounded-xl p-3 text-center ${isOverpaid ? "bg-dash-purple/10" : "bg-muted/50"}`}>
                    <p className={`text-[10px] uppercase tracking-wider font-semibold mb-1 ${isOverpaid ? "text-dash-purple" : "text-muted-foreground"}`}>Overpaid</p>
                    <p className={`font-bold text-sm ${isOverpaid ? "text-dash-purple" : "text-muted-foreground"}`}>{formatCurrency(overpaid)}</p>
                  </div>
                </div>

                {/* Progress */}
                <div className="flex items-center gap-3 mb-4">
                  <div className="flex-1 h-2.5 bg-muted rounded-full overflow-hidden">
                    <div className={`h-full rounded-full transition-all ${isOverpaid ? "bg-gradient-to-r from-dash-purple to-dash-purple" : "bg-gradient-to-r from-dash-green to-dash-teal"}`} style={{ width: `${paidPct}%` }} />
                  </div>
                  <span className="text-xs font-bold text-muted-foreground">{paidPct}%</span>
                </div>

                {/* Details list */}
                <div className="space-y-3">
                  {[
                    { label: "Customer", value: vp.customer_name || "Unknown" },
                    { label: "Location", value: vp.location || "—" },
                    { label: "Monthly EMI", value: vp.monthly_installment > 0 ? formatCurrency(vp.monthly_installment) : "—" },
                    { label: "Start Date", value: vp.start_date ? new Date(vp.start_date).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" }) : "—" },
                    { label: "Expected Completion", value: vp.expected_completion ? new Date(vp.expected_completion).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" }) : "—" },
                  ].map((item, i) => (
                    <div key={i} className="flex items-center justify-between py-2 border-b border-border last:border-0">
                      <span className="text-sm text-muted-foreground">{item.label}</span>
                      <span className="text-sm font-medium text-foreground">{item.value}</span>
                    </div>
                  ))}
                </div>
              </motion.div>
            </div>
          );
        })()}
      </AnimatePresence>

      <ConfirmDialog
        open={!!deleteTarget}
        onOpenChange={(open) => {
          if (!open && !deleteLoading) {
            setDeleteTarget(null);
          }
        }}
        title={
          deleteTarget
            ? `Delete project "${deleteTarget.project_name}"?`
            : "Delete project?"
        }
        description="This will also remove related images, work updates, and payments for this project."
        confirmLabel="Delete"
        cancelLabel="Cancel"
        confirmVariant="destructive"
        loading={deleteLoading}
        onConfirm={handleConfirmDelete}
      />
    </div>
  );
};

export default AdminProjects;
