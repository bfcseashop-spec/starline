import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { toast } from "sonner";
import {
  CreditCard, Plus, Loader2, Save, X, Eye, Pencil, Trash2, Printer,
  Search, ChevronDown, DollarSign,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface Payment {
  id: string;
  user_id: string;
  project_id: string | null;
  amount: number;
  payment_method: string;
  payment_date: string;
  status: string;
  reference_no: string | null;
  notes: string | null;
  customer_name?: string;
  project_name?: string;
}

interface CustomerOption { user_id: string; full_name: string | null; }
interface ProjectOption { id: string; project_name: string; user_id: string; }

const methodOptions = ["bank_transfer", "cash", "cheque", "online", "other"];
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
  payment_date: new Date().toISOString().split("T")[0], status: "completed", reference_no: "", notes: "",
};

const AdminPayments = () => {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [customers, setCustomers] = useState<CustomerOption[]>([]);
  const [projects, setProjects] = useState<ProjectOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Modals
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [viewPayment, setViewPayment] = useState<Payment | null>(null);
  const [form, setForm] = useState({ ...emptyForm });

  // Search & Filter
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<FilterStatus>("all");
  const [showFilterMenu, setShowFilterMenu] = useState(false);

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

  const openAdd = () => {
    setForm({ ...emptyForm });
    setEditId(null);
    setShowForm(true);
  };

  const openEdit = (p: Payment) => {
    setForm({
      user_id: p.user_id,
      project_id: p.project_id || "",
      amount: String(p.amount),
      payment_method: p.payment_method,
      payment_date: p.payment_date,
      status: p.status,
      reference_no: p.reference_no || "",
      notes: p.notes || "",
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
      payment_date: form.payment_date,
      status: form.status,
      reference_no: form.reference_no.trim() || null,
      notes: form.notes.trim() || null,
    };

    let error;
    if (editId) {
      ({ error } = await supabase.from("payments").update(payload).eq("id", editId));
    } else {
      ({ error } = await supabase.from("payments").insert(payload));
      // Update paid_amount on the project for new completed payments
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

  const handlePrint = (p: Payment) => {
    const doc = new jsPDF();
    const navy = [15, 23, 42];
    const gold = [212, 175, 55];

    // Header
    doc.setFillColor(navy[0], navy[1], navy[2]);
    doc.rect(0, 0, 210, 40, "F");
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(20);
    doc.setFont("helvetica", "bold");
    doc.text("Payment Receipt", 15, 22);
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.text("Starline Builder's Ltd", 15, 32);
    doc.setTextColor(gold[0], gold[1], gold[2]);
    doc.text(`Receipt #${(p.reference_no || p.id.slice(0, 8)).toUpperCase()}`, 195, 22, { align: "right" });
    doc.text(`Date: ${new Date(p.payment_date).toLocaleDateString()}`, 195, 32, { align: "right" });

    // Details
    doc.setTextColor(50, 50, 50);
    doc.setFontSize(11);
    let y = 55;
    const details = [
      ["Customer", p.customer_name || "Unknown"],
      ["Project", p.project_name || "—"],
      ["Amount", `৳${p.amount.toLocaleString()}`],
      ["Method", p.payment_method.replace("_", " ")],
      ["Status", p.status],
      ["Reference", p.reference_no || "—"],
    ];
    if (p.notes) details.push(["Notes", p.notes]);

    details.forEach(([label, value]) => {
      doc.setFont("helvetica", "bold");
      doc.text(label + ":", 15, y);
      doc.setFont("helvetica", "normal");
      doc.text(value, 70, y);
      y += 10;
    });

    // Footer
    doc.setDrawColor(gold[0], gold[1], gold[2]);
    doc.setLineWidth(0.5);
    doc.line(15, y + 5, 195, y + 5);
    doc.setFontSize(9);
    doc.setTextColor(130, 130, 130);
    doc.text("This is a computer-generated receipt.", 105, y + 15, { align: "center" });

    const blob = doc.output("blob");
    const url = URL.createObjectURL(blob);
    const win = window.open(url);
    if (win) win.onload = () => win.print();
  };

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
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by customer, project, or reference..."
            className="w-full bg-card text-foreground rounded-xl pl-11 pr-4 py-3 text-sm outline-none border border-border focus:ring-2 focus:ring-ring transition-shadow"
          />
        </div>
        <div className="relative">
          <button
            onClick={() => setShowFilterMenu(!showFilterMenu)}
            className="bg-card border border-border rounded-xl px-4 py-3 text-sm font-medium text-foreground flex items-center gap-2 hover:bg-muted transition-colors min-w-[160px]"
          >
            <span className={`w-2 h-2 rounded-full ${filter === "all" ? "bg-dash-blue" : filter === "completed" ? "bg-dash-green" : filter === "pending" ? "bg-gold" : "bg-destructive"}`} />
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

      {/* Payment List */}
      <div className="space-y-3">
        {filtered.map((p, idx) => (
          <motion.div
            key={p.id}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.03 }}
            className="bg-card rounded-2xl border border-border p-5 shadow-sm hover:shadow-md transition-shadow"
          >
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
              <div className="flex items-center gap-4 flex-1 min-w-0">
                <div className={`w-11 h-11 rounded-xl flex items-center justify-center text-white shrink-0 ${
                  p.status === "completed" ? "bg-dash-green" : p.status === "pending" ? "bg-dash-orange" : "bg-destructive"
                }`}>
                  <DollarSign size={20} />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold text-foreground text-base">{formatCurrency(p.amount)}</h3>
                    <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-full ${
                      p.status === "completed" ? "bg-dash-green/15 text-dash-green"
                      : p.status === "pending" ? "bg-gold/15 text-gold"
                      : "bg-destructive/15 text-destructive"
                    }`}>{p.status}</span>
                  </div>
                  <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground mt-1">
                    <span className="font-medium">👤 {p.customer_name}</span>
                    <span>📁 {p.project_name}</span>
                    <span>{new Date(p.payment_date).toLocaleDateString()}</span>
                    <span className="bg-muted px-2 py-0.5 rounded-full capitalize">{p.payment_method.replace("_", " ")}</span>
                    {p.reference_no && <span className="text-[11px]">Ref: {p.reference_no}</span>}
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-1.5 shrink-0">
                <button onClick={() => setViewPayment(p)} title="View" className="p-2 rounded-lg bg-dash-blue/10 text-dash-blue hover:bg-dash-blue/20 transition-colors"><Eye size={15} /></button>
                <button onClick={() => openEdit(p)} title="Edit" className="p-2 rounded-lg bg-dash-orange/10 text-dash-orange hover:bg-dash-orange/20 transition-colors"><Pencil size={15} /></button>
                <button onClick={() => handlePrint(p)} title="Print Receipt" className="p-2 rounded-lg bg-dash-purple/10 text-dash-purple hover:bg-dash-purple/20 transition-colors"><Printer size={15} /></button>
                <button onClick={() => handleDelete(p)} title="Delete" className="p-2 rounded-lg bg-destructive/10 text-destructive hover:bg-destructive/20 transition-colors"><Trash2 size={15} /></button>
              </div>
            </div>
          </motion.div>
        ))}
        {filtered.length === 0 && (
          <div className="text-center py-20 text-muted-foreground">
            <CreditCard size={48} className="mx-auto mb-4 opacity-40" />
            <p>{search || filter !== "all" ? "No payments match your search/filter." : "No payments recorded yet."}</p>
          </div>
        )}
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
                    <label className="text-sm font-medium text-foreground mb-1.5 block">Method</label>
                    <select value={form.payment_method} onChange={(e) => setForm((f) => ({ ...f, payment_method: e.target.value }))} className={inputClass}>
                      {methodOptions.map((m) => <option key={m} value={m}>{m.replace("_", " ")}</option>)}
                    </select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-sm font-medium text-foreground mb-1.5 block">Date</label>
                    <input type="date" value={form.payment_date} onChange={(e) => setForm((f) => ({ ...f, payment_date: e.target.value }))} className={inputClass} />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-foreground mb-1.5 block">Status</label>
                    <select value={form.status} onChange={(e) => setForm((f) => ({ ...f, status: e.target.value }))} className={inputClass}>
                      {statusOptions.map((s) => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium text-foreground mb-1.5 block">Reference No.</label>
                  <input value={form.reference_no} onChange={(e) => setForm((f) => ({ ...f, reference_no: e.target.value }))} className={inputClass} placeholder="TXN-2026-XXX" maxLength={50} />
                </div>
                <div>
                  <label className="text-sm font-medium text-foreground mb-1.5 block">Notes</label>
                  <input value={form.notes} onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))} className={inputClass} placeholder="Optional notes" maxLength={200} />
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
                  { label: "Method", value: viewPayment.payment_method.replace("_", " ") },
                  { label: "Reference", value: viewPayment.reference_no || "—" },
                  { label: "Notes", value: viewPayment.notes || "—" },
                ].map((item, i) => (
                  <div key={i} className="flex items-center justify-between py-2 border-b border-border last:border-0">
                    <span className="text-sm text-muted-foreground">{item.label}</span>
                    <span className="text-sm font-medium text-foreground capitalize">{item.value}</span>
                  </div>
                ))}
              </div>

              <button onClick={() => { handlePrint(viewPayment); }} className="w-full mt-5 bg-dash-purple text-white py-3 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 hover:opacity-90 transition-opacity shadow-md">
                <Printer size={16} /> Print Receipt
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default AdminPayments;
