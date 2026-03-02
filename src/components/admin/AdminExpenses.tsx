import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { Wallet, Plus, Loader2, Trash2, Pencil, X, Save, Eye, Search, DollarSign, ChevronDown } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface Expense {
  id: string;
  title: string;
  category: string;
  amount: number;
  expense_date: string;
  description: string | null;
  vendor: string | null;
  payment_method: string | null;
  status: string;
  receipt_url: string | null;
  created_at: string;
}

const categories = ["general", "materials", "labor", "utilities", "transport", "office", "marketing", "maintenance", "other"];
const statuses = ["approved", "pending", "rejected"];
const methods = ["cash", "bank_transfer", "cheque", "online", "other"];

type FilterStatus = "all" | "approved" | "pending" | "rejected";

const emptyForm = {
  title: "", category: "general", amount: "", expense_date: new Date().toISOString().split("T")[0],
  description: "", vendor: "", payment_method: "cash", status: "approved", receipt_url: "",
};

const AdminExpenses = () => {
  const { user } = useAuth();
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState({ ...emptyForm });
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<FilterStatus>("all");
  const [viewExpense, setViewExpense] = useState<Expense | null>(null);

  const fetchExpenses = async () => {
    const { data } = await supabase.from("expenses").select("*").order("expense_date", { ascending: false });
    setExpenses((data || []) as Expense[]);
    setLoading(false);
  };

  useEffect(() => { fetchExpenses(); }, []);

  const resetForm = () => { setForm({ ...emptyForm }); setEditId(null); setShowForm(false); };

  const openEdit = (e: Expense) => {
    setForm({
      title: e.title, category: e.category, amount: String(e.amount), expense_date: e.expense_date,
      description: e.description || "", vendor: e.vendor || "", payment_method: e.payment_method || "cash",
      status: e.status, receipt_url: e.receipt_url || "",
    });
    setEditId(e.id); setShowForm(true);
  };

  const handleSave = async () => {
    if (!form.title || !form.amount) { toast.error("Title and amount are required"); return; }
    setSaving(true);
    const payload = {
      title: form.title, category: form.category, amount: Number(form.amount), expense_date: form.expense_date,
      description: form.description || null, vendor: form.vendor || null, payment_method: form.payment_method,
      status: form.status, receipt_url: form.receipt_url || null, created_by: user?.id || "",
    };

    let error;
    if (editId) {
      ({ error } = await supabase.from("expenses").update(payload).eq("id", editId));
    } else {
      ({ error } = await supabase.from("expenses").insert(payload));
    }
    setSaving(false);
    if (error) { toast.error(error.message); return; }
    toast.success(editId ? "Expense updated!" : "Expense recorded!");
    resetForm(); fetchExpenses();
  };

  const handleDelete = async (e: Expense) => {
    if (!confirm(`Delete expense "${e.title}"?`)) return;
    const { error } = await supabase.from("expenses").delete().eq("id", e.id);
    if (error) { toast.error(error.message); return; }
    toast.success("Expense deleted"); fetchExpenses();
  };

  const filtered = expenses.filter((e) => {
    const q = search.toLowerCase();
    const matchSearch = !q || e.title.toLowerCase().includes(q) || (e.vendor || "").toLowerCase().includes(q) || e.category.toLowerCase().includes(q);
    if (!matchSearch) return false;
    if (filter !== "all" && e.status !== filter) return false;
    return true;
  });

  const totalExpenses = expenses.reduce((s, e) => s + Number(e.amount), 0);
  const approvedTotal = expenses.filter((e) => e.status === "approved").reduce((s, e) => s + Number(e.amount), 0);
  const pendingTotal = expenses.filter((e) => e.status === "pending").reduce((s, e) => s + Number(e.amount), 0);

  const inputClass = "w-full bg-muted text-foreground rounded-xl px-4 py-3 text-sm outline-none border border-border focus:ring-2 focus:ring-ring transition-shadow";

  if (loading) return <div className="flex justify-center py-20"><Loader2 className="animate-spin text-gold" size={32} /></div>;

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <h2 className="font-heading text-2xl font-bold text-foreground flex items-center gap-3">
          <Wallet size={24} className="text-dash-orange" /> Expense Management
        </h2>
        <button onClick={() => { resetForm(); setShowForm(true); }} className="bg-dash-orange text-white px-4 py-2.5 rounded-xl text-sm font-semibold flex items-center gap-2 hover:opacity-90 transition-opacity shadow-md">
          <Plus size={16} /> Add Expense
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        {[
          { label: "Total Expenses", value: `৳${totalExpenses.toLocaleString()}`, color: "bg-dash-pink" },
          { label: "Approved", value: `৳${approvedTotal.toLocaleString()}`, color: "bg-dash-green" },
          { label: "Pending", value: `৳${pendingTotal.toLocaleString()}`, color: "bg-dash-orange" },
        ].map((s, i) => (
          <motion.div key={i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
            className={`${s.color} rounded-2xl p-4 text-white shadow-lg`}>
            <p className="text-white/70 text-xs font-medium mb-1">{s.label}</p>
            <p className="font-heading text-xl font-bold">{s.value}</p>
          </motion.div>
        ))}
      </div>

      {/* Search & Filter */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="flex-1 relative">
          <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search expenses..."
            className="w-full bg-card text-foreground rounded-xl pl-11 pr-4 py-3 text-sm outline-none border border-border focus:ring-2 focus:ring-ring" />
        </div>
        <div className="flex items-center gap-1 bg-card border border-border rounded-xl p-1">
          {(["all", "approved", "pending", "rejected"] as FilterStatus[]).map((f) => (
            <button key={f} onClick={() => setFilter(f)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors capitalize ${filter === f ? "bg-gold-gradient text-accent-foreground" : "text-muted-foreground hover:text-foreground"}`}>
              {f}
            </button>
          ))}
        </div>
      </div>

      {/* Expense List */}
      <div className="space-y-3">
        {filtered.map((e, idx) => (
          <motion.div key={e.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.02 }}
            className="bg-card rounded-2xl border border-border p-5 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
              <div className="flex items-center gap-4 flex-1 min-w-0">
                <div className={`w-11 h-11 rounded-xl flex items-center justify-center text-white shrink-0 ${e.status === "approved" ? "bg-dash-green" : e.status === "pending" ? "bg-dash-orange" : "bg-destructive"}`}>
                  <DollarSign size={20} />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold text-foreground">{e.title}</h3>
                    <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-full ${
                      e.status === "approved" ? "bg-dash-green/15 text-dash-green" : e.status === "pending" ? "bg-gold/15 text-gold" : "bg-destructive/15 text-destructive"
                    }`}>{e.status}</span>
                  </div>
                  <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground mt-1">
                    <span className="bg-muted px-2 py-0.5 rounded-full capitalize">{e.category}</span>
                    {e.vendor && <span>🏢 {e.vendor}</span>}
                    <span>{new Date(e.expense_date).toLocaleDateString()}</span>
                    <span className="font-bold text-foreground">৳{Number(e.amount).toLocaleString()}</span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-1.5 shrink-0">
                <button onClick={() => setViewExpense(e)} className="p-2 rounded-lg bg-dash-blue/10 text-dash-blue hover:bg-dash-blue/20 transition-colors"><Eye size={15} /></button>
                <button onClick={() => openEdit(e)} className="p-2 rounded-lg bg-dash-orange/10 text-dash-orange hover:bg-dash-orange/20 transition-colors"><Pencil size={15} /></button>
                <button onClick={() => handleDelete(e)} className="p-2 rounded-lg bg-destructive/10 text-destructive hover:bg-destructive/20 transition-colors"><Trash2 size={15} /></button>
              </div>
            </div>
          </motion.div>
        ))}
        {filtered.length === 0 && (
          <div className="text-center py-20 text-muted-foreground">
            <Wallet size={48} className="mx-auto mb-4 opacity-40" />
            <p>{search || filter !== "all" ? "No expenses match your search." : "No expenses recorded yet."}</p>
          </div>
        )}
      </div>

      {/* View Modal */}
      <AnimatePresence>
        {viewExpense && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setViewExpense(null)}>
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
              className="bg-card rounded-2xl border border-border p-6 w-full max-w-md shadow-2xl" onClick={(e) => e.stopPropagation()}>
              <div className="flex justify-between items-center mb-4">
                <h3 className="font-heading text-lg font-bold text-foreground">Expense Details</h3>
                <button onClick={() => setViewExpense(null)} className="text-muted-foreground hover:text-foreground"><X size={20} /></button>
              </div>
              <div className="space-y-3">
                {[
                  ["Title", viewExpense.title], ["Category", viewExpense.category], ["Amount", `৳${Number(viewExpense.amount).toLocaleString()}`],
                  ["Date", new Date(viewExpense.expense_date).toLocaleDateString()], ["Vendor", viewExpense.vendor || "—"],
                  ["Payment Method", viewExpense.payment_method || "—"], ["Status", viewExpense.status], ["Description", viewExpense.description || "—"],
                ].map(([label, value]) => (
                  <div key={label as string} className="flex justify-between">
                    <span className="text-sm text-muted-foreground">{label}</span>
                    <span className="text-sm font-medium text-foreground text-right max-w-[60%]">{value}</span>
                  </div>
                ))}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Add/Edit Modal */}
      <AnimatePresence>
        {showForm && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={resetForm}>
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
              className="bg-card rounded-2xl border border-border p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto shadow-2xl" onClick={(e) => e.stopPropagation()}>
              <div className="flex justify-between items-center mb-5">
                <h3 className="font-heading text-lg font-bold text-foreground">{editId ? "Edit Expense" : "Add Expense"}</h3>
                <button onClick={resetForm} className="text-muted-foreground hover:text-foreground"><X size={20} /></button>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-foreground mb-1.5 block">Title *</label>
                  <input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} className={inputClass} placeholder="Expense title" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-foreground mb-1.5 block">Amount *</label>
                    <input type="number" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} className={inputClass} placeholder="0" />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-foreground mb-1.5 block">Date</label>
                    <input type="date" value={form.expense_date} onChange={(e) => setForm({ ...form, expense_date: e.target.value })} className={inputClass} />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-foreground mb-1.5 block">Category</label>
                    <select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} className={inputClass}>
                      {categories.map((c) => <option key={c} value={c} className="capitalize">{c}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-foreground mb-1.5 block">Payment Method</label>
                    <select value={form.payment_method} onChange={(e) => setForm({ ...form, payment_method: e.target.value })} className={inputClass}>
                      {methods.map((m) => <option key={m} value={m}>{m.replace(/_/g, " ")}</option>)}
                    </select>
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium text-foreground mb-1.5 block">Vendor</label>
                  <input value={form.vendor} onChange={(e) => setForm({ ...form, vendor: e.target.value })} className={inputClass} placeholder="Vendor name" />
                </div>
                <div>
                  <label className="text-sm font-medium text-foreground mb-1.5 block">Status</label>
                  <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })} className={inputClass}>
                    {statuses.map((s) => <option key={s} value={s} className="capitalize">{s}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-sm font-medium text-foreground mb-1.5 block">Description</label>
                  <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className={`${inputClass} min-h-[80px]`} placeholder="Optional notes..." />
                </div>
                <button onClick={handleSave} disabled={saving}
                  className="w-full bg-gold-gradient text-accent-foreground py-3 rounded-xl text-sm font-semibold hover:opacity-90 disabled:opacity-50 flex items-center justify-center gap-2">
                  {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />} {editId ? "Update Expense" : "Save Expense"}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default AdminExpenses;
