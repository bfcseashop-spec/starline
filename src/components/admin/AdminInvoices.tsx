import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { generateInvoicePdf } from "@/lib/generateInvoicePdf";
import { toast } from "sonner";
import {
  FileText, Loader2, Printer, Search, Plus, X, Save, Receipt,
  User, Building2, Calendar, CreditCard, Hash, StickyNote,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

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
  image_url: string | null;
  customer_name?: string;
  project_name?: string;
}

interface Profile {
  user_id: string;
  full_name: string | null;
}

interface Project {
  id: string;
  project_name: string;
  user_id: string;
}

interface InvoiceSettings {
  prefix: string;
  next_number: string;
}

const paymentMethods = [
  { id: "bank_transfer", label: "Bank Transfer" },
  { id: "bkash", label: "bKash" },
  { id: "nagad", label: "Nagad" },
  { id: "rocket", label: "Rocket" },
  { id: "cash", label: "Cash" },
  { id: "check", label: "Check" },
  { id: "stripe", label: "Stripe" },
  { id: "paypal", label: "PayPal" },
  { id: "other", label: "Other" },
];

const AdminInvoices = () => {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [invoiceSettings, setInvoiceSettings] = useState<InvoiceSettings>({ prefix: "INV-", next_number: "1001" });
  const [showCreate, setShowCreate] = useState(false);
  const [saving, setSaving] = useState(false);
  const [slipForm, setSlipForm] = useState({
    user_id: "",
    project_id: "",
    amount: "",
    payment_method: "bank_transfer",
    payment_date: new Date().toISOString().slice(0, 10),
    reference_no: "",
    notes: "",
    status: "completed",
  });

  const fetchData = async () => {
    const [payRes, profRes, projRes, settingsRes] = await Promise.all([
      supabase.from("payments").select("*").order("payment_date", { ascending: false }),
      supabase.from("profiles").select("user_id, full_name"),
      supabase.from("customer_projects").select("id, project_name, user_id"),
      supabase.from("site_settings").select("setting_key, setting_value").eq("setting_key", "invoice"),
    ]);

    const profs = (profRes.data || []) as Profile[];
    const projs = (projRes.data || []) as Project[];
    setProfiles(profs);
    setProjects(projs);

    const nameMap: Record<string, string> = {};
    profs.forEach(p => { nameMap[p.user_id] = p.full_name || "Unnamed"; });
    const projMap: Record<string, string> = {};
    projs.forEach(p => { projMap[p.id] = p.project_name; });

    if (settingsRes.data?.[0]) {
      setInvoiceSettings({ ...invoiceSettings, ...settingsRes.data[0].setting_value as any });
    }

    setPayments(
      (payRes.data || []).map(p => ({
        ...p,
        customer_name: nameMap[p.user_id] || "Unknown",
        project_name: p.project_id ? projMap[p.project_id] || "Unknown" : "—",
      })) as Payment[]
    );
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, []);

  // Filter projects by selected customer
  const customerProjects = slipForm.user_id
    ? projects.filter(p => p.user_id === slipForm.user_id)
    : projects;

  const resetSlipForm = () => {
    setSlipForm({
      user_id: "", project_id: "", amount: "", payment_method: "bank_transfer",
      payment_date: new Date().toISOString().slice(0, 10), reference_no: "", notes: "", status: "completed",
    });
    setShowCreate(false);
  };

  const handleCreateSlip = async () => {
    if (!slipForm.user_id) { toast.error("Please select a customer"); return; }
    if (!slipForm.amount || Number(slipForm.amount) <= 0) { toast.error("Please enter a valid amount"); return; }

    setSaving(true);
    const { error, data } = await supabase.from("payments").insert({
      user_id: slipForm.user_id,
      project_id: slipForm.project_id || null,
      amount: Number(slipForm.amount),
      payment_method: slipForm.payment_method,
      payment_date: slipForm.payment_date,
      reference_no: slipForm.reference_no || null,
      notes: slipForm.notes || null,
      status: slipForm.status,
    }).select().single();

    setSaving(false);
    if (error) { toast.error(error.message); return; }

    toast.success("Payment slip created successfully!");

    // Build payment data for PDF
    const customerName = profiles.find(p => p.user_id === slipForm.user_id)?.full_name || "Unknown";
    const projectName = slipForm.project_id
      ? projects.find(p => p.id === slipForm.project_id)?.project_name || "—"
      : "—";

    const pdfPayment: Payment = {
      ...(data as any),
      customer_name: customerName,
      project_name: projectName,
    };

    // Ask if they want to generate PDF immediately
    if (confirm("Payment slip created! Generate PDF now?")) {
      generateInvoicePdf(pdfPayment);
    }

    resetSlipForm();
    fetchData();
  };

  const filtered = payments.filter(p => {
    const q = search.toLowerCase();
    return !q || (p.customer_name || "").toLowerCase().includes(q) || (p.reference_no || "").toLowerCase().includes(q) || (p.project_name || "").toLowerCase().includes(q);
  });

  const totalInvoiced = payments.reduce((s, p) => s + p.amount, 0);
  const paidCount = payments.filter(p => p.status === "completed").length;
  const pendingCount = payments.filter(p => p.status === "pending").length;

  if (loading) return <div className="flex justify-center py-20"><Loader2 className="animate-spin text-primary" size={32} /></div>;

  return (
    <div>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h2 className="font-heading text-2xl font-bold text-foreground">Invoices & Payment Slips</h2>
          <p className="text-sm text-muted-foreground">Create and manage payment receipts</p>
        </div>
        <Button onClick={() => { resetSlipForm(); setShowCreate(true); }} className="bg-primary text-primary-foreground hover:bg-primary/90 gap-2">
          <Plus size={16} /> Create Payment Slip
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
        {[
          { label: "TOTAL INVOICES", value: payments.length, icon: FileText, color: "text-blue-600", bgColor: "bg-blue-100 dark:bg-blue-500/15" },
          { label: "TOTAL AMOUNT", value: `৳${totalInvoiced.toLocaleString()}`, icon: CreditCard, color: "text-emerald-600", bgColor: "bg-emerald-100 dark:bg-emerald-500/15" },
          { label: "PAID", value: paidCount, icon: Receipt, color: "text-teal-600", bgColor: "bg-teal-100 dark:bg-teal-500/15" },
          { label: "PENDING", value: pendingCount, icon: Calendar, color: "text-amber-600", bgColor: "bg-amber-100 dark:bg-amber-500/15" },
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

      {/* Search */}
      <div className="relative mb-6">
        <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" />
        <Input value={search} onChange={e => setSearch(e.target.value)}
          placeholder="Search invoices by customer, reference, or project..."
          className="pl-11" />
      </div>

      {/* Invoice List */}
      <div className="bg-card rounded-2xl border border-border shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b-2 border-primary/20 bg-muted/50">
                <th className="text-left px-5 py-3 font-bold text-primary text-xs">Invoice #</th>
                <th className="text-left px-5 py-3 font-bold text-primary text-xs">Customer</th>
                <th className="text-left px-5 py-3 font-bold text-primary text-xs">Project</th>
                <th className="text-left px-5 py-3 font-bold text-primary text-xs">Date</th>
                <th className="text-left px-5 py-3 font-bold text-primary text-xs">Amount</th>
                <th className="text-left px-5 py-3 font-bold text-primary text-xs">Status</th>
                <th className="text-right px-5 py-3 font-bold text-primary text-xs">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((p, idx) => (
                <motion.tr key={p.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: idx * 0.02 }}
                  className="border-b border-border last:border-0 hover:bg-muted/30 transition-colors">
                  <td className="px-5 py-3.5">
                    <span className="font-semibold text-foreground">{invoiceSettings.prefix}{(p.reference_no || p.id.slice(0, 8)).toUpperCase()}</span>
                  </td>
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-full bg-blue-100 dark:bg-blue-500/15 flex items-center justify-center">
                        <User size={12} className="text-blue-600" />
                      </div>
                      <span className="text-foreground">{p.customer_name}</span>
                    </div>
                  </td>
                  <td className="px-5 py-3.5 text-muted-foreground">{p.project_name}</td>
                  <td className="px-5 py-3.5 text-muted-foreground">{new Date(p.payment_date).toLocaleDateString()}</td>
                  <td className="px-5 py-3.5 font-bold text-foreground">৳{p.amount.toLocaleString()}</td>
                  <td className="px-5 py-3.5">
                    <span className={`inline-flex items-center gap-1.5 text-[10px] uppercase font-bold px-2.5 py-1 rounded-full ${
                      p.status === "completed"
                        ? "bg-emerald-100 dark:bg-emerald-500/15 text-emerald-700 dark:text-emerald-400"
                        : "bg-amber-100 dark:bg-amber-500/15 text-amber-700 dark:text-amber-400"
                    }`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${p.status === "completed" ? "bg-emerald-500" : "bg-amber-500"}`} />
                      {p.status}
                    </span>
                  </td>
                  <td className="px-5 py-3.5">
                    <div className="flex items-center justify-end gap-1.5">
                      <Button variant="outline" size="sm" onClick={() => generateInvoicePdf(p)} className="gap-1.5 text-xs h-8">
                        <Printer size={13} /> PDF
                      </Button>
                    </div>
                  </td>
                </motion.tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={7} className="text-center py-16 text-muted-foreground">
                    <FileText size={48} className="mx-auto mb-4 opacity-30" />
                    <p className="font-medium">No invoices found.</p>
                    <p className="text-xs mt-1">Create a payment slip to get started.</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create Payment Slip Modal */}
      <AnimatePresence>
        {showCreate && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={resetSlipForm}>
            <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-card rounded-2xl border border-border shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>

              {/* Modal Header */}
              <div className="flex items-center justify-between p-6 border-b border-border sticky top-0 bg-card z-10 rounded-t-2xl">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-violet-100 dark:bg-violet-500/15 flex items-center justify-center">
                    <Receipt size={20} className="text-violet-600" />
                  </div>
                  <div>
                    <h3 className="font-heading text-lg font-bold text-foreground">Create Payment Slip</h3>
                    <p className="text-xs text-muted-foreground">Generate a receipt for customer payment</p>
                  </div>
                </div>
                <button onClick={resetSlipForm} className="p-2 rounded-lg hover:bg-muted transition-colors text-muted-foreground"><X size={18} /></button>
              </div>

              {/* Modal Body */}
              <div className="p-6 space-y-4">
                {/* Customer */}
                <div>
                  <Label className="text-xs font-semibold text-foreground flex items-center gap-1.5 mb-1.5">
                    <User size={12} className="text-blue-600" /> Customer *
                  </Label>
                  <Select value={slipForm.user_id} onValueChange={v => setSlipForm({ ...slipForm, user_id: v, project_id: "" })}>
                    <SelectTrigger className="bg-muted/50"><SelectValue placeholder="Select customer" /></SelectTrigger>
                    <SelectContent>
                      {profiles.map(p => (
                        <SelectItem key={p.user_id} value={p.user_id}>{p.full_name || "Unnamed"}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Project */}
                <div>
                  <Label className="text-xs font-semibold text-foreground flex items-center gap-1.5 mb-1.5">
                    <Building2 size={12} className="text-orange-600" /> Project
                  </Label>
                  <Select value={slipForm.project_id} onValueChange={v => setSlipForm({ ...slipForm, project_id: v })}>
                    <SelectTrigger className="bg-muted/50"><SelectValue placeholder="Select project (optional)" /></SelectTrigger>
                    <SelectContent>
                      {customerProjects.map(p => (
                        <SelectItem key={p.id} value={p.id}>{p.project_name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Amount & Date */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-xs font-semibold text-foreground flex items-center gap-1.5 mb-1.5">
                      <CreditCard size={12} className="text-emerald-600" /> Amount (৳) *
                    </Label>
                    <Input type="number" value={slipForm.amount} onChange={e => setSlipForm({ ...slipForm, amount: e.target.value })}
                      className="bg-muted/50" placeholder="0.00" />
                  </div>
                  <div>
                    <Label className="text-xs font-semibold text-foreground flex items-center gap-1.5 mb-1.5">
                      <Calendar size={12} className="text-sky-600" /> Date *
                    </Label>
                    <Input type="date" value={slipForm.payment_date} onChange={e => setSlipForm({ ...slipForm, payment_date: e.target.value })}
                      className="bg-muted/50" />
                  </div>
                </div>

                {/* Payment Method & Status */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-xs font-semibold text-foreground flex items-center gap-1.5 mb-1.5">
                      <CreditCard size={12} className="text-violet-600" /> Payment Method
                    </Label>
                    <Select value={slipForm.payment_method} onValueChange={v => setSlipForm({ ...slipForm, payment_method: v })}>
                      <SelectTrigger className="bg-muted/50"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {paymentMethods.map(m => (
                          <SelectItem key={m.id} value={m.id}>{m.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label className="text-xs font-semibold text-foreground flex items-center gap-1.5 mb-1.5">
                      <FileText size={12} className="text-teal-600" /> Status
                    </Label>
                    <Select value={slipForm.status} onValueChange={v => setSlipForm({ ...slipForm, status: v })}>
                      <SelectTrigger className="bg-muted/50"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="completed">Completed</SelectItem>
                        <SelectItem value="pending">Pending</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Reference Number */}
                <div>
                  <Label className="text-xs font-semibold text-foreground flex items-center gap-1.5 mb-1.5">
                    <Hash size={12} className="text-rose-600" /> Reference / Transaction ID
                  </Label>
                  <Input value={slipForm.reference_no} onChange={e => setSlipForm({ ...slipForm, reference_no: e.target.value })}
                    className="bg-muted/50" placeholder="e.g., TXN-12345" />
                </div>

                {/* Notes */}
                <div>
                  <Label className="text-xs font-semibold text-foreground flex items-center gap-1.5 mb-1.5">
                    <StickyNote size={12} className="text-amber-600" /> Notes (optional)
                  </Label>
                  <Textarea value={slipForm.notes} onChange={e => setSlipForm({ ...slipForm, notes: e.target.value })}
                    className="bg-muted/50" rows={3} placeholder="Additional notes for this payment..." />
                </div>

                {/* Preview Summary */}
                {slipForm.user_id && slipForm.amount && (
                  <div className="bg-muted/30 rounded-xl border border-border p-4">
                    <p className="text-xs font-bold text-muted-foreground mb-2 uppercase tracking-wider">Slip Preview</p>
                    <div className="space-y-1.5 text-sm">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Customer:</span>
                        <span className="font-semibold text-foreground">{profiles.find(p => p.user_id === slipForm.user_id)?.full_name || "—"}</span>
                      </div>
                      {slipForm.project_id && (
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Project:</span>
                          <span className="font-medium text-foreground">{projects.find(p => p.id === slipForm.project_id)?.project_name || "—"}</span>
                        </div>
                      )}
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Amount:</span>
                        <span className="font-bold text-emerald-600">৳{Number(slipForm.amount).toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Method:</span>
                        <span className="font-medium text-foreground">{paymentMethods.find(m => m.id === slipForm.payment_method)?.label}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Date:</span>
                        <span className="font-medium text-foreground">{new Date(slipForm.payment_date).toLocaleDateString()}</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Modal Footer */}
              <div className="flex items-center justify-end gap-3 p-6 border-t border-border sticky bottom-0 bg-card rounded-b-2xl">
                <Button variant="outline" onClick={resetSlipForm}>Cancel</Button>
                <Button onClick={handleCreateSlip} disabled={saving} className="bg-primary text-primary-foreground hover:bg-primary/90 gap-2">
                  {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
                  Create & Generate PDF
                </Button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default AdminInvoices;
