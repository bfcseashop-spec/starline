import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { HardHat, Plus, Loader2, MapPin, Calendar, X, Save, Trash2 } from "lucide-react";
import { motion } from "framer-motion";

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

const statusOptions = ["planned", "in_progress", "completed", "on_hold"];

const AdminProjects = () => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [customers, setCustomers] = useState<CustomerOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
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

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this project? This will also remove all related images, updates, and payments.")) return;
    const { error } = await supabase.from("customer_projects").delete().eq("id", id);
    if (error) toast.error(error.message);
    else { toast.success("Project deleted"); fetchData(); }
  };

  const formatCurrency = (n: number) => `৳${n.toLocaleString()}`;
  const inputClass = "w-full bg-muted text-foreground rounded-xl px-4 py-3 text-sm outline-none border border-border focus:ring-2 focus:ring-ring transition-shadow";

  if (loading) return <div className="flex justify-center py-20"><Loader2 className="animate-spin text-gold" size={32} /></div>;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="font-heading text-2xl font-bold text-foreground">Projects</h2>
        <button onClick={() => { resetForm(); setShowForm(true); }} className="bg-dash-blue text-white px-4 py-2.5 rounded-xl text-sm font-semibold flex items-center gap-2 hover:opacity-90 transition-opacity shadow-md">
          <Plus size={16} /> Add Project
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
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="text-sm font-medium text-foreground mb-1.5 block">Total Amount</label>
                  <input type="number" value={form.total_amount} onChange={(e) => setForm((f) => ({ ...f, total_amount: e.target.value }))} className={inputClass} placeholder="0" />
                </div>
                <div>
                  <label className="text-sm font-medium text-foreground mb-1.5 block">Paid Amount</label>
                  <input type="number" value={form.paid_amount} onChange={(e) => setForm((f) => ({ ...f, paid_amount: e.target.value }))} className={inputClass} placeholder="0" />
                </div>
                <div>
                  <label className="text-sm font-medium text-foreground mb-1.5 block">Monthly EMI</label>
                  <input type="number" value={form.monthly_installment} onChange={(e) => setForm((f) => ({ ...f, monthly_installment: e.target.value }))} className={inputClass} placeholder="0" />
                </div>
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

      {/* Project List */}
      <div className="space-y-3">
        {projects.map((p, idx) => (
          <motion.div
            key={p.id}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.03 }}
            className="bg-card rounded-2xl border border-border p-5 shadow-sm"
          >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-dash-orange flex items-center justify-center text-white">
                  <HardHat size={22} />
                </div>
                <div>
                  <h3 className="font-semibold text-foreground">{p.project_name}</h3>
                  <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground mt-1">
                    <span className="flex items-center gap-1 font-medium">👤 {p.customer_name}</span>
                    {p.location && <span className="flex items-center gap-1"><MapPin size={12} /> {p.location}</span>}
                    <span className={`capitalize font-medium ${p.status === "completed" ? "text-dash-green" : p.status === "in_progress" ? "text-gold" : "text-muted-foreground"}`}>
                      {p.status.replace("_", " ")}
                    </span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="text-right text-sm">
                  <p className="text-muted-foreground text-xs">Total / Paid</p>
                  <p className="font-bold text-foreground">{formatCurrency(p.total_amount)} / <span className="text-dash-green">{formatCurrency(p.paid_amount)}</span></p>
                </div>
                <button onClick={() => openEdit(p)} className="text-xs bg-muted hover:bg-muted/80 text-foreground px-3 py-2 rounded-lg font-medium transition-colors">Edit</button>
                <button onClick={() => handleDelete(p.id)} className="text-xs text-destructive hover:bg-destructive/10 px-2 py-2 rounded-lg transition-colors"><Trash2 size={14} /></button>
              </div>
            </div>
          </motion.div>
        ))}
        {projects.length === 0 && (
          <div className="text-center py-20 text-muted-foreground">
            <HardHat size={48} className="mx-auto mb-4 opacity-40" />
            <p>No projects yet. Click "Add Project" to create one.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminProjects;
