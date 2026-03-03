import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { generateInvoicePdf } from "@/lib/generateInvoicePdf";
import { toast } from "sonner";
import {
  CreditCard, Plus, Loader2, Save, X, Eye, Pencil, Trash2, Printer,
  Search, ChevronDown, DollarSign, Upload, Image,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface Payment {
  id: string;
  user_id: string;
  project_id: string | null;
  amount: number;
  payment_method: string;
  payment_type: string;
  payment_date: string;
  status: string;
  reference_no: string | null;
  notes: string | null;
  image_url: string | null;
  customer_name?: string;
  project_name?: string;
}

interface CustomerOption { user_id: string; full_name: string | null; }
interface ProjectOption { id: string; project_name: string; user_id: string; }

const paymentTypeOptions = ["down_payment", "installment", "advance", "due", "booking", "other"];
const paymentTypeLabels: Record<string, string> = {
  down_payment: "Down Payment",
  installment: "Installment",
  advance: "Advance",
  due: "Due",
  booking: "Booking",
  other: "Other",
};

const methodOptions = ["bank_transfer", "cash", "cheque", "online", "bkash", "nagad", "rocket", "other"];
const methodLabels: Record<string, string> = {
  bank_transfer: "Bank Transfer",
  cash: "Cash",
  cheque: "Cheque",
  online: "Online",
  bkash: "bKash",
  nagad: "Nagad",
  rocket: "Rocket",
  other: "Other",
};

const statusOptions = ["completed", "pending", "failed", "refunded"];

type FilterStatus = "all" | "completed" | "pending" | "failed" | "refunded";
const filterLabels: Record<FilterStatus, string> = {
  all: "All Statuses",
  completed: "Completed",
  pending: "Pending",
  failed: "Failed",
  refunded: "Refunded",
};

const emptyForm = {
  user_id: "", project_id: "", amount: "", payment_method: "bank_transfer",
  payment_type: "installment",
  payment_date: new Date().toISOString().split("T")[0], status: "completed", reference_no: "", notes: "", image_url: "",
};

const AdminPayments = () => {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [customers, setCustomers] = useState<CustomerOption[]>([]);
  const [projects, setProjects] = useState<ProjectOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [viewPayment, setViewPayment] = useState<Payment | null>(null);
  const [form, setForm] = useState({ ...emptyForm });

  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<FilterStatus>("all");
  const [showFilterMenu, setShowFilterMenu] = useState(false);
  const [viewSlip, setViewSlip] = useState<string | null>(null);

  const fetchData = async () => {
    const [payRes, profRes, projRes, rolesRes] = await Promise.all([
      supabase.from("payments").select("*").order("payment_date", { ascending: false }),
      supabase.from("profiles").select("user_id, full_name"),
      supabase.from("customer_projects").select("id, project_name, user_id"),
      supabase.from("user_roles").select("user_id, role").eq("role", "customer"),
    ]);

    const custIds = new Set((rolesRes.data || []).map((r) => r.user_id));
    const nameMap: Record<string, string> = {};
    (profRes.data || []).forEach((p) => { nameMap[p.user_id] = p.full_name || "Unnamed"; });
    const projMap: Record<string, string> = {};
    (projRes.data || []).forEach((p) => { projMap[p.id] = p.project_name; });

    setCustomers((profRes.data || []).filter((p) => custIds.has(p.user_id)));
    setProjects(projRes.data || []);
    setPayments(
      (payRes.data || []).map((p) => ({
        ...p,
        customer_name: nameMap[p.user_id] || "Unknown",
        project_name: p.project_id ? projMap[p.project_id] || "Unknown" : "—",
      })) as Payment[]
    );
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, []);

  const filteredProjects = projects.filter((p) => p.user_id === form.user_id);

  const filtered = payments.filter((p) => {
    const q = search.toLowerCase();
    const matchesSearch = !q || (p.customer_name || "").toLowerCase().includes(q) || (p.project_name || "").toLowerCase().includes(q) || (p.reference_no || "").toLowerCase().includes(q);
    if (!matchesSearch) return false;
    if (filter !== "all" && p.status !== filter) return false;
    return true;
  });

  const resetForm = () => {
    setForm({ ...emptyForm });
    setEditId(null);
    setShowForm(false);
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) { toast.error("Please select an image file"); return; }
    if (file.size > 5 * 1024 * 1024) { toast.error("Image must be under 5MB"); return; }
    setUploading(true);
    const ext = file.name.split(".").pop();
    const path = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
    const { error } = await supabase.storage.from("payment-images").upload(path, file);
    if (error) { toast.error("Upload failed: " + error.message); setUploading(false); return; }
    const { data: urlData } = supabase.storage.from("payment-images").getPublicUrl(path);
    setForm((f) => ({ ...f, image_url: urlData.publicUrl }));
    setUploading(false);
    toast.success("Image uploaded!");
  };

  const openAdd = () => { setForm({ ...emptyForm }); setEditId(null); setShowForm(true); };

  const openEdit = (p: Payment) => {
    setForm({
      user_id: p.user_id,
      project_id: p.project_id || "",
      amount: String(p.amount),
      payment_method: p.payment_method,
      payment_type: p.payment_type || "installment",
      payment_date: p.payment_date,
      status: p.status,
      reference_no: p.reference_no || "",
      notes: p.notes || "",
      image_url: p.image_url || "",
    });
    setEditId(p.id);
    setShowForm(true);
  };

  const handleSave = async () => {
    if (!form.user_id || !form.amount) { toast.error("Customer and amount are required"); return; }
    setSaving(true);

    const payload = {
      user_id: form.user_id,
      project_id: form.project_id || null,
      amount: Number(form.amount),
      payment_method: form.payment_method,
      payment_type: form.payment_type,
      payment_date: form.payment_date,
      status: form.status,
      reference_no: form.reference_no.trim() || null,
      notes: form.notes.trim() || null,
      image_url: form.image_url || null,
    };

    let error;
    if (editId) {
      ({ error } = await supabase.from("payments").update(payload).eq("id", editId));
    } else {
      ({ error } = await supabase.from("payments").insert(payload));
      if (!error && form.project_id && form.status === "completed") {
        const { data: proj } = await supabase.from("customer_projects").select("paid_amount").eq("id", form.project_id).maybeSingle();
        if (proj) {
          await supabase.from("customer_projects").update({ paid_amount: Number(proj.paid_amount) + Number(form.amount) }).eq("id", form.project_id);
        }
      }
    }

    setSaving(false);
    if (error) { toast.error(error.message); return; }
    toast.success(editId ? "Payment updated!" : "Payment recorded!");
    resetForm();
    fetchData();
  };

  const handleDelete = async (p: Payment) => {
    if (!confirm(`Delete payment of ৳${p.amount.toLocaleString()} for ${p.customer_name}?`)) return;
    const { error } = await supabase.from("payments").delete().eq("id", p.id);
    if (error) { toast.error(error.message); return; }
    toast.success("Payment deleted");
    fetchData();
  };

  const handlePrint = (p: Payment) => { generateInvoicePdf(p); };

  const formatCurrency = (n: number) => `৳${n.toLocaleString()}`;
  const inputClass = "w-full bg-muted text-foreground rounded-xl px-4 py-3 text-sm outline-none border border-border focus:ring-2 focus:ring-ring transition-shadow";

  if (loading) return <div className="flex justify-center py-20"><Loader2 className="animate-spin text-gold" size={32} /></div>;

  return (
    <div>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-3">
          <h2 className="font-heading text-2xl font-bold text-foreground">Payments</h2>
          <span className="bg-dash-green text-white text-xs font-bold px-3 py-1.5 rounded-full">{filtered.length}</span>
        </div>
        <button onClick={openAdd} className="bg-dash-green text-white px-4 py-2.5 rounded-xl text-sm font-semibold flex items-center gap-2 hover:opacity-90 transition-opacity shadow-md">
          <Plus size={16} /> Record Payment
        </button>
      </div>

      {/* Search & Filter */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="flex-1 relative">
          <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search by customer, project, or reference..."
            className="w-full bg-card text-foreground rounded-xl pl-11 pr-4 py-3 text-sm outline-none border border-border focus:ring-2 focus:ring-ring transition-shadow" />
        </div>
        <div className="relative">
          <button onClick={() => setShowFilterMenu(!showFilterMenu)}
            className="bg-card border border-border rounded-xl px-4 py-3 text-sm font-medium text-foreground flex items-center gap-2 hover:bg-muted transition-colors min-w-[160px]">
            <span className={`w-2 h-2 rounded-full ${filter === "all" ? "bg-dash-blue" : filter === "completed" ? "bg-dash-green" : filter === "pending" ? "bg-gold" : "bg-destructive"}`} />
            {filterLabels[filter]}
            <ChevronDown size={14} className="ml-auto" />
          </button>
          {showFilterMenu && (
            <div className="absolute right-0 top-full mt-1 bg-card border border-border rounded-xl shadow-xl z-30 overflow-hidden min-w-[180px]">
              {(Object.keys(filterLabels) as FilterStatus[]).map((f) => (
                <button key={f} onClick={() => { setFilter(f); setShowFilterMenu(false); }}
                  className={`w-full text-left px-4 py-2.5 text-sm hover:bg-muted transition-colors ${filter === f ? "bg-muted font-semibold text-foreground" : "text-muted-foreground"}`}>
                  {filterLabels[f]}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        {[
          { label: "Total Payments", value: payments.length, color: "bg-dash-blue", icon: <CreditCard size={16} /> },
          { label: "Total Amount", value: formatCurrency(payments.reduce((s, p) => s + p.amount, 0)), color: "bg-dash-green", icon: <DollarSign size={16} /> },
          { label: "Completed", value: payments.filter((p) => p.status === "completed").length, color: "bg-dash-teal", icon: <CreditCard size={16} /> },
          { label: "Pending", value: payments.filter((p) => p.status === "pending").length, color: "bg-dash-orange", icon: <CreditCard size={16} /> },
        ].map((stat, i) => (
          <motion.div key={i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
            className={`${stat.color} rounded-2xl p-4 text-white shadow-lg`}>
            <div className="flex items-center gap-2 text-white/70 text-xs font-medium mb-1">{stat.icon} {stat.label}</div>
            <p className="font-heading text-xl font-bold">{stat.value}</p>
          </motion.div>
        ))}
      </div>

      {/* Payment Table */}
      <div className="bg-card rounded-2xl border border-border shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/60">
                <th className="text-left px-4 py-3 font-semibold text-muted-foreground text-xs uppercase tracking-wider">Date</th>
                <th className="text-left px-4 py-3 font-semibold text-muted-foreground text-xs uppercase tracking-wider">Customer</th>
                <th className="text-left px-4 py-3 font-semibold text-muted-foreground text-xs uppercase tracking-wider hidden md:table-cell">Project</th>
                <th className="text-right px-4 py-3 font-semibold text-muted-foreground text-xs uppercase tracking-wider">Amount</th>
                <th className="text-left px-4 py-3 font-semibold text-muted-foreground text-xs uppercase tracking-wider hidden lg:table-cell">Type</th>
                <th className="text-left px-4 py-3 font-semibold text-muted-foreground text-xs uppercase tracking-wider hidden lg:table-cell">Pay By</th>
                <th className="text-left px-4 py-3 font-semibold text-muted-foreground text-xs uppercase tracking-wider hidden xl:table-cell">Ref / TXN</th>
                <th className="text-center px-4 py-3 font-semibold text-muted-foreground text-xs uppercase tracking-wider hidden sm:table-cell">Slip</th>
                <th className="text-left px-4 py-3 font-semibold text-muted-foreground text-xs uppercase tracking-wider hidden sm:table-cell">Status</th>
                <th className="text-right px-4 py-3 font-semibold text-muted-foreground text-xs uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((p) => (
                <tr key={p.id} className="border-b border-border last:border-0 hover:bg-muted/30 transition-colors">
                  <td className="px-4 py-3 text-foreground whitespace-nowrap">
                    {new Date(p.payment_date).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })}
                  </td>
                  <td className="px-4 py-3 text-foreground font-medium">{p.customer_name}</td>
                  <td className="px-4 py-3 text-muted-foreground hidden md:table-cell max-w-[180px] truncate">{p.project_name}</td>
                  <td className="px-4 py-3 text-foreground font-bold text-right whitespace-nowrap">{formatCurrency(p.amount)}</td>
                  <td className="px-4 py-3 hidden lg:table-cell">
                    <span className="bg-accent text-accent-foreground text-xs font-medium px-2.5 py-1 rounded-full whitespace-nowrap">
                      {paymentTypeLabels[p.payment_type] || p.payment_type || "—"}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground hidden lg:table-cell whitespace-nowrap">
                    {methodLabels[p.payment_method] || p.payment_method}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground hidden xl:table-cell font-mono text-xs">{p.reference_no || "—"}</td>
                  <td className="px-4 py-3 hidden sm:table-cell text-center">
                    {p.image_url ? (
                      <button onClick={() => setViewSlip(p.image_url)} className="inline-block w-9 h-9 rounded-lg border border-border overflow-hidden hover:ring-2 hover:ring-dash-green/50 transition-all group relative">
                        <img src={p.image_url} alt="Slip" className="w-full h-full object-cover" />
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                          <Image size={12} className="text-white" />
                        </div>
                      </button>
                    ) : (
                      <span className="text-muted-foreground/40 text-xs">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3 hidden sm:table-cell">
                    <span className={`text-[10px] uppercase font-bold px-2.5 py-1 rounded-full whitespace-nowrap ${
                      p.status === "completed" ? "bg-dash-green/15 text-dash-green"
                      : p.status === "pending" ? "bg-gold/15 text-gold"
                      : p.status === "failed" ? "bg-destructive/15 text-destructive"
                      : "bg-muted text-muted-foreground"
                    }`}>{p.status}</span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-1">
                      <button onClick={() => setViewPayment(p)} title="View" className="p-1.5 rounded-lg hover:bg-dash-blue/10 text-dash-blue transition-colors"><Eye size={15} /></button>
                      <button onClick={() => openEdit(p)} title="Edit" className="p-1.5 rounded-lg hover:bg-dash-orange/10 text-dash-orange transition-colors"><Pencil size={15} /></button>
                      <button onClick={() => handlePrint(p)} title="Print" className="p-1.5 rounded-lg hover:bg-dash-purple/10 text-dash-purple transition-colors"><Printer size={15} /></button>
                      <button onClick={() => handleDelete(p)} title="Delete" className="p-1.5 rounded-lg hover:bg-destructive/10 text-destructive transition-colors"><Trash2 size={15} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {filtered.length === 0 && (
            <div className="text-center py-20 text-muted-foreground">
              <CreditCard size={48} className="mx-auto mb-4 opacity-40" />
              <p>{search || filter !== "all" ? "No payments match your search/filter." : "No payments recorded yet."}</p>
            </div>
          )}
        </div>
      </div>

      {/* ADD/EDIT MODAL */}
      <AnimatePresence>
        {showForm && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={resetForm}>
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
              className="bg-card rounded-2xl border border-border p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex justify-between items-center mb-5">
                <h3 className="font-heading text-lg font-bold text-foreground">{editId ? "Edit Payment" : "Record Payment"}</h3>
                <button onClick={resetForm} className="text-muted-foreground hover:text-foreground"><X size={20} /></button>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-foreground mb-1.5 block">Customer *</label>
                  <select value={form.user_id} onChange={(e) => setForm((f) => ({ ...f, user_id: e.target.value, project_id: "" }))} className={inputClass}>
                    <option value="">Select customer...</option>
                    {customers.map((c) => <option key={c.user_id} value={c.user_id}>{c.full_name || "Unnamed"}</option>)}
                  </select>
                </div>
                {form.user_id && filteredProjects.length > 0 && (
                  <div>
                    <label className="text-sm font-medium text-foreground mb-1.5 block">Project</label>
                    <select value={form.project_id} onChange={(e) => setForm((f) => ({ ...f, project_id: e.target.value }))} className={inputClass}>
                      <option value="">No specific project</option>
                      {filteredProjects.map((p) => <option key={p.id} value={p.id}>{p.project_name}</option>)}
                    </select>
                  </div>
                )}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-sm font-medium text-foreground mb-1.5 block">Amount *</label>
                    <input type="number" value={form.amount} onChange={(e) => setForm((f) => ({ ...f, amount: e.target.value }))} className={inputClass} placeholder="0" />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-foreground mb-1.5 block">Payment Type</label>
                    <select value={form.payment_type} onChange={(e) => setForm((f) => ({ ...f, payment_type: e.target.value }))} className={inputClass}>
                      {paymentTypeOptions.map((t) => <option key={t} value={t}>{paymentTypeLabels[t]}</option>)}
                    </select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-sm font-medium text-foreground mb-1.5 block">Pay By</label>
                    <select value={form.payment_method} onChange={(e) => setForm((f) => ({ ...f, payment_method: e.target.value }))} className={inputClass}>
                      {methodOptions.map((m) => <option key={m} value={m}>{methodLabels[m]}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-foreground mb-1.5 block">Date</label>
                    <input type="date" value={form.payment_date} onChange={(e) => setForm((f) => ({ ...f, payment_date: e.target.value }))} className={inputClass} />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-sm font-medium text-foreground mb-1.5 block">Status</label>
                    <select value={form.status} onChange={(e) => setForm((f) => ({ ...f, status: e.target.value }))} className={inputClass}>
                      {statusOptions.map((s) => <option key={s} value={s} className="capitalize">{s}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-foreground mb-1.5 block">Ref / TXN ID</label>
                    <input value={form.reference_no} onChange={(e) => setForm((f) => ({ ...f, reference_no: e.target.value }))} className={inputClass} placeholder="TXN-2026-XXX" maxLength={50} />
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium text-foreground mb-1.5 block">Notes</label>
                  <input value={form.notes} onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))} className={inputClass} placeholder="Optional notes" maxLength={200} />
                </div>
                {/* Image Upload */}
                <div>
                  <label className="text-sm font-medium text-foreground mb-1.5 block">Payment Image</label>
                  {form.image_url ? (
                    <div className="relative rounded-xl overflow-hidden border border-border">
                      <img src={form.image_url} alt="Payment" className="w-full h-40 object-cover" />
                      <button type="button" onClick={() => setForm((f) => ({ ...f, image_url: "" }))}
                        className="absolute top-2 right-2 bg-destructive text-destructive-foreground rounded-full p-1 hover:opacity-80 transition-opacity">
                        <X size={14} />
                      </button>
                    </div>
                  ) : (
                    <label className={`flex flex-col items-center justify-center gap-2 border-2 border-dashed border-border rounded-xl py-6 cursor-pointer hover:border-ring hover:bg-muted/50 transition-colors ${uploading ? "opacity-50 pointer-events-none" : ""}`}>
                      {uploading ? <Loader2 size={24} className="animate-spin text-muted-foreground" /> : <Upload size={24} className="text-muted-foreground" />}
                      <span className="text-xs text-muted-foreground">{uploading ? "Uploading..." : "Click to upload image"}</span>
                      <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
                    </label>
                  )}
                </div>
                <button onClick={handleSave} disabled={saving} className="w-full bg-gold-gradient text-accent-foreground py-3 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 disabled:opacity-50 hover:opacity-90 transition-opacity shadow-md">
                  {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                  {editId ? "Update Payment" : "Record Payment"}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* VIEW MODAL */}
      <AnimatePresence>
        {viewPayment && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setViewPayment(null)}>
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
              className="bg-card rounded-2xl border border-border p-6 w-full max-w-md shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex justify-between items-center mb-5">
                <h3 className="font-heading text-lg font-bold text-foreground">Payment Details</h3>
                <button onClick={() => setViewPayment(null)} className="text-muted-foreground hover:text-foreground"><X size={20} /></button>
              </div>

              <div className="text-center mb-5">
                <div className={`w-16 h-16 rounded-2xl mx-auto flex items-center justify-center text-white mb-3 ${
                  viewPayment.status === "completed" ? "bg-dash-green" : viewPayment.status === "pending" ? "bg-dash-orange" : "bg-destructive"
                }`}>
                  <DollarSign size={28} />
                </div>
                <p className="font-heading text-3xl font-bold text-foreground">{formatCurrency(viewPayment.amount)}</p>
                <span className={`text-xs uppercase font-bold px-3 py-1 rounded-full mt-2 inline-block ${
                  viewPayment.status === "completed" ? "bg-dash-green/15 text-dash-green"
                  : viewPayment.status === "pending" ? "bg-gold/15 text-gold"
                  : "bg-destructive/15 text-destructive"
                }`}>{viewPayment.status}</span>
              </div>

              <div className="space-y-3">
                {[
                  { label: "Customer", value: viewPayment.customer_name },
                  { label: "Project", value: viewPayment.project_name },
                  { label: "Date", value: new Date(viewPayment.payment_date).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" }) },
                  { label: "Payment Type", value: paymentTypeLabels[viewPayment.payment_type] || viewPayment.payment_type },
                  { label: "Pay By", value: methodLabels[viewPayment.payment_method] || viewPayment.payment_method },
                  { label: "Ref / TXN", value: viewPayment.reference_no || "—" },
                  { label: "Notes", value: viewPayment.notes || "—" },
                ].map((item, i) => (
                  <div key={i} className="flex items-center justify-between py-2 border-b border-border last:border-0">
                    <span className="text-sm text-muted-foreground">{item.label}</span>
                    <span className="text-sm font-medium text-foreground capitalize">{item.value}</span>
                  </div>
                ))}
              </div>

              {viewPayment.image_url && (
                <div className="mt-4">
                  <p className="text-sm font-medium text-foreground mb-2">Payment Slip</p>
                  <button onClick={() => { setViewPayment(null); setViewSlip(viewPayment.image_url); }} className="w-full rounded-xl overflow-hidden border border-border hover:ring-2 hover:ring-dash-green/50 transition-all cursor-pointer">
                    <img src={viewPayment.image_url} alt="Payment slip" className="w-full max-h-48 object-contain bg-muted" />
                  </button>
                </div>
              )}

              <button onClick={() => { handlePrint(viewPayment); }} className="w-full mt-5 bg-dash-purple text-white py-3 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 hover:opacity-90 transition-opacity shadow-md">
                <Printer size={16} /> Print Receipt
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* SLIP LIGHTBOX */}
      {viewSlip && (
        <div className="fixed inset-0 z-[60] bg-black/80 flex items-center justify-center p-4" onClick={() => setViewSlip(null)}>
          <div className="relative max-w-2xl w-full" onClick={(e) => e.stopPropagation()}>
            <button onClick={() => setViewSlip(null)} className="absolute -top-3 -right-3 bg-card border border-border p-2 rounded-full text-muted-foreground hover:text-foreground transition-colors z-10">
              <X size={18} />
            </button>
            <img src={viewSlip} alt="Payment slip" className="w-full rounded-xl max-h-[80vh] object-contain bg-card" />
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminPayments;
