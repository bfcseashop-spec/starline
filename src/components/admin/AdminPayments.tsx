import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { CreditCard, Plus, Loader2, Save, X } from "lucide-react";
import { motion } from "framer-motion";

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

const AdminPayments = () => {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [customers, setCustomers] = useState<CustomerOption[]>([]);
  const [projects, setProjects] = useState<ProjectOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    user_id: "", project_id: "", amount: "", payment_method: "bank_transfer",
    payment_date: new Date().toISOString().split("T")[0], status: "completed", reference_no: "", notes: "",
  });

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

  const handleSave = async () => {
    if (!form.user_id || !form.amount) { toast.error("Customer and amount are required"); return; }
    setSaving(true);
    const { error } = await supabase.from("payments").insert({
      user_id: form.user_id,
      project_id: form.project_id || null,
      amount: Number(form.amount),
      payment_method: form.payment_method,
      payment_date: form.payment_date,
      status: form.status,
      reference_no: form.reference_no.trim() || null,
      notes: form.notes.trim() || null,
    });
    setSaving(false);
    if (error) { toast.error(error.message); return; }

    // Update paid_amount on the project
    if (form.project_id && form.status === "completed") {
      const { data: proj } = await supabase.from("customer_projects").select("paid_amount").eq("id", form.project_id).maybeSingle();
      if (proj) {
        await supabase.from("customer_projects").update({ paid_amount: Number(proj.paid_amount) + Number(form.amount) }).eq("id", form.project_id);
      }
    }

    toast.success("Payment recorded!");
    setShowForm(false);
    setForm({ user_id: "", project_id: "", amount: "", payment_method: "bank_transfer", payment_date: new Date().toISOString().split("T")[0], status: "completed", reference_no: "", notes: "" });
    fetchData();
  };

  const formatCurrency = (n: number) => `৳${n.toLocaleString()}`;
  const inputClass = "w-full bg-muted text-foreground rounded-xl px-4 py-3 text-sm outline-none border border-border focus:ring-2 focus:ring-ring transition-shadow";

  if (loading) return <div className="flex justify-center py-20"><Loader2 className="animate-spin text-gold" size={32} /></div>;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="font-heading text-2xl font-bold text-foreground">Payments</h2>
        <button onClick={() => setShowForm(true)} className="bg-dash-green text-white px-4 py-2.5 rounded-xl text-sm font-semibold flex items-center gap-2 hover:opacity-90 transition-opacity shadow-md">
          <Plus size={16} /> Record Payment
        </button>
      </div>

      {/* Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setShowForm(false)}>
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-card rounded-2xl border border-border p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center mb-5">
              <h3 className="font-heading text-lg font-bold text-foreground">Record Payment</h3>
              <button onClick={() => setShowForm(false)} className="text-muted-foreground hover:text-foreground"><X size={20} /></button>
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
                Record Payment
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {/* Payment List */}
      <div className="bg-card rounded-2xl border border-border shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/50">
                <th className="text-left px-5 py-3 text-muted-foreground font-medium">Date</th>
                <th className="text-left px-5 py-3 text-muted-foreground font-medium">Customer</th>
                <th className="text-left px-5 py-3 text-muted-foreground font-medium">Project</th>
                <th className="text-right px-5 py-3 text-muted-foreground font-medium">Amount</th>
                <th className="text-left px-5 py-3 text-muted-foreground font-medium">Method</th>
                <th className="text-left px-5 py-3 text-muted-foreground font-medium">Status</th>
                <th className="text-left px-5 py-3 text-muted-foreground font-medium">Ref</th>
              </tr>
            </thead>
            <tbody>
              {payments.map((p, idx) => (
                <tr key={p.id} className="border-b border-border last:border-0 hover:bg-muted/30 transition-colors">
                  <td className="px-5 py-3.5 text-foreground">{new Date(p.payment_date).toLocaleDateString()}</td>
                  <td className="px-5 py-3.5 text-foreground font-medium">{p.customer_name}</td>
                  <td className="px-5 py-3.5 text-muted-foreground">{p.project_name}</td>
                  <td className="px-5 py-3.5 text-right font-bold text-foreground">{formatCurrency(p.amount)}</td>
                  <td className="px-5 py-3.5 text-muted-foreground capitalize">{p.payment_method.replace("_", " ")}</td>
                  <td className="px-5 py-3.5">
                    <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${
                      p.status === "completed" ? "bg-dash-green/15 text-dash-green" :
                      p.status === "pending" ? "bg-gold/15 text-gold" :
                      "bg-destructive/15 text-destructive"
                    }`}>
                      {p.status}
                    </span>
                  </td>
                  <td className="px-5 py-3.5 text-muted-foreground text-xs">{p.reference_no || "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {payments.length === 0 && (
          <div className="text-center py-16 text-muted-foreground">
            <CreditCard size={48} className="mx-auto mb-4 opacity-40" />
            <p>No payments recorded yet.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminPayments;
