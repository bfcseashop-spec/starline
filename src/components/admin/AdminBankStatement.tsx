import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { toast } from "sonner";
import {
  Loader2, Landmark, Download, Plus, DollarSign, TrendingUp, X, Save,
  CreditCard, Banknote, Wallet, Globe, Smartphone, ChevronDown,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface Payment {
  id: string;
  amount: number;
  payment_method: string;
  payment_date: string;
  status: string;
  reference_no: string | null;
  notes: string | null;
  customer_name?: string;
}

const datePresets = [
  { label: "Today", getValue: () => { const d = new Date().toISOString().split("T")[0]; return { from: d, to: d }; } },
  { label: "This Week", getValue: () => { const now = new Date(); const d = new Date(now); d.setDate(now.getDate() - now.getDay()); return { from: d.toISOString().split("T")[0], to: now.toISOString().split("T")[0] }; } },
  { label: "This Month", getValue: () => { const now = new Date(); return { from: `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-01`, to: now.toISOString().split("T")[0] }; } },
  { label: "Last 30 Days", getValue: () => { const now = new Date(); const d = new Date(now); d.setDate(now.getDate() - 30); return { from: d.toISOString().split("T")[0], to: now.toISOString().split("T")[0] }; } },
  { label: "This Year", getValue: () => { const now = new Date(); return { from: `${now.getFullYear()}-01-01`, to: now.toISOString().split("T")[0] }; } },
  { label: "All Time", getValue: () => ({ from: "2020-01-01", to: new Date().toISOString().split("T")[0] }) },
];

const METHOD_META: Record<string, { label: string; icon: typeof CreditCard; borderColor: string; bgColor: string; textColor: string }> = {
  bank_transfer: { label: "Bank Transfer", icon: Landmark, borderColor: "border-blue-400", bgColor: "bg-blue-50 dark:bg-blue-950/30", textColor: "text-blue-600" },
  cash: { label: "Cash", icon: Banknote, borderColor: "border-emerald-400", bgColor: "bg-emerald-50 dark:bg-emerald-950/30", textColor: "text-emerald-600" },
  cheque: { label: "Cheque", icon: CreditCard, borderColor: "border-amber-400", bgColor: "bg-amber-50 dark:bg-amber-950/30", textColor: "text-amber-600" },
  online: { label: "Online", icon: Globe, borderColor: "border-purple-400", bgColor: "bg-purple-50 dark:bg-purple-950/30", textColor: "text-purple-600" },
  bkash: { label: "bKash", icon: Smartphone, borderColor: "border-pink-400", bgColor: "bg-pink-50 dark:bg-pink-950/30", textColor: "text-pink-600" },
  nagad: { label: "Nagad", icon: Smartphone, borderColor: "border-orange-400", bgColor: "bg-orange-50 dark:bg-orange-950/30", textColor: "text-orange-600" },
  rocket: { label: "Rocket", icon: Smartphone, borderColor: "border-violet-400", bgColor: "bg-violet-50 dark:bg-violet-950/30", textColor: "text-violet-600" },
  other: { label: "Other", icon: Wallet, borderColor: "border-gray-400", bgColor: "bg-gray-50 dark:bg-gray-950/30", textColor: "text-gray-600" },
};

const emptyManual = { amount: "", payment_method: "cash", payment_date: new Date().toISOString().split("T")[0], reference_no: "", notes: "" };

const AdminBankStatement = () => {
  const { user } = useAuth();
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [presetIdx, setPresetIdx] = useState(2); // This Month
  const [dateFrom, setDateFrom] = useState(datePresets[2].getValue().from);
  const [dateTo, setDateTo] = useState(datePresets[2].getValue().to);
  const [showPresets, setShowPresets] = useState(false);
  const [showManual, setShowManual] = useState(false);
  const [manualForm, setManualForm] = useState({ ...emptyManual });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      const [payRes, profRes] = await Promise.all([
        supabase.from("payments").select("*").gte("payment_date", dateFrom).lte("payment_date", dateTo).eq("status", "completed").order("payment_date", { ascending: false }),
        supabase.from("profiles").select("user_id, full_name"),
      ]);
      const nameMap: Record<string, string> = {};
      (profRes.data || []).forEach((p) => { nameMap[p.user_id] = p.full_name || "Unnamed"; });
      setPayments((payRes.data || []).map((p) => ({ ...p, customer_name: nameMap[p.user_id] || "Unknown" })) as Payment[]);
      setLoading(false);
    };
    fetchData();
  }, [dateFrom, dateTo]);

  const selectPreset = (idx: number) => {
    setPresetIdx(idx);
    const { from, to } = datePresets[idx].getValue();
    setDateFrom(from);
    setDateTo(to);
    setShowPresets(false);
  };

  // Summary stats
  const totalRevenue = payments.reduce((s, p) => s + Number(p.amount), 0);
  const totalTx = payments.length;
  const avgPerTx = totalTx > 0 ? totalRevenue / totalTx : 0;

  // Method breakdown
  const methodGroups: Record<string, { total: number; count: number }> = {};
  payments.forEach((p) => {
    const m = p.payment_method || "other";
    if (!methodGroups[m]) methodGroups[m] = { total: 0, count: 0 };
    methodGroups[m].total += Number(p.amount);
    methodGroups[m].count += 1;
  });

  // Include all known methods (even with 0)
  const allMethods = new Set([...Object.keys(METHOD_META), ...Object.keys(methodGroups)]);

  const handleManualSave = async () => {
    if (!manualForm.amount) { toast.error("Amount is required"); return; }
    setSaving(true);
    const { error } = await supabase.from("payments").insert({
      user_id: user?.id || "",
      amount: Number(manualForm.amount),
      payment_method: manualForm.payment_method,
      payment_date: manualForm.payment_date,
      reference_no: manualForm.reference_no || null,
      notes: manualForm.notes || null,
      status: "completed",
    });
    setSaving(false);
    if (error) { toast.error(error.message); return; }
    toast.success("Manual amount added!");
    setShowManual(false);
    setManualForm({ ...emptyManual });
    // Refresh
    const { from, to } = datePresets[presetIdx].getValue();
    setDateFrom(from);
    setDateTo(to);
  };

  const exportPdf = () => {
    const doc = new jsPDF();
    doc.setFillColor(15, 23, 42);
    doc.rect(0, 0, 210, 35, "F");
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(16);
    doc.setFont("helvetica", "bold");
    doc.text("Bank Statement", 15, 18);
    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");
    doc.text(`Period: ${dateFrom} to ${dateTo}`, 15, 28);
    doc.setTextColor(201, 165, 90);
    doc.text(`Total Revenue: ৳${totalRevenue.toLocaleString()}`, 195, 18, { align: "right" });
    doc.text(`${totalTx} transactions`, 195, 28, { align: "right" });

    // Method breakdown table
    const methodRows = Array.from(allMethods).map((m) => {
      const meta = METHOD_META[m] || METHOD_META.other;
      const g = methodGroups[m] || { total: 0, count: 0 };
      return [meta.label, `৳${g.total.toLocaleString()}`, `${g.count} transactions`];
    });

    autoTable(doc, {
      startY: 42,
      head: [["Payment Method", "Amount", "Transactions"]],
      body: methodRows,
      headStyles: { fillColor: [15, 23, 42], textColor: [255, 255, 255], fontSize: 10 },
      bodyStyles: { fontSize: 10 },
      alternateRowStyles: { fillColor: [245, 245, 245] },
      margin: { left: 15, right: 15 },
    });

    // Individual transactions
    const txY = (doc as any).lastAutoTable.finalY + 10;
    autoTable(doc, {
      startY: txY,
      head: [["Date", "Customer", "Method", "Reference", "Amount"]],
      body: payments.map((p) => [
        new Date(p.payment_date).toLocaleDateString(),
        p.customer_name || "—",
        (METHOD_META[p.payment_method] || METHOD_META.other).label,
        p.reference_no || "—",
        `৳${Number(p.amount).toLocaleString()}`,
      ]),
      headStyles: { fillColor: [201, 165, 90], textColor: [30, 30, 30], fontSize: 9 },
      bodyStyles: { fontSize: 9 },
      margin: { left: 15, right: 15 },
    });

    doc.save(`bank-statement-${dateFrom}-to-${dateTo}.pdf`);
    toast.success("Statement exported!");
  };

  const inputClass = "w-full bg-muted text-foreground rounded-xl px-4 py-3 text-sm outline-none border border-border focus:ring-2 focus:ring-ring transition-shadow";

  if (loading) return <div className="flex justify-center py-20"><Loader2 className="animate-spin text-gold" size={32} /></div>;

  return (
    <div>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h2 className="font-heading text-2xl font-bold text-foreground flex items-center gap-3">
            <Landmark size={24} className="text-dash-teal" /> Bank Statement
          </h2>
          <p className="text-sm text-muted-foreground mt-1">Payment dashboard and sales breakdown by payment method</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => { setManualForm({ ...emptyManual }); setShowManual(true); }}
            className="bg-dash-teal text-white px-4 py-2.5 rounded-xl text-sm font-semibold flex items-center gap-2 hover:opacity-90 transition-opacity shadow-md">
            <Plus size={16} /> Add Manual Amount
          </button>
          <button onClick={exportPdf}
            className="bg-card border border-border text-foreground px-4 py-2.5 rounded-xl text-sm font-semibold flex items-center gap-2 hover:bg-muted transition-colors">
            <Download size={16} /> Export Statement
          </button>
        </div>
      </div>

      {/* Date Range Filter */}
      <div className="bg-card rounded-2xl border border-border p-5 shadow-sm mb-6">
        <h3 className="text-sm font-semibold text-foreground mb-3">Filter by Date Range</h3>
        <div className="relative w-64">
          <button onClick={() => setShowPresets(!showPresets)}
            className="w-full bg-muted text-foreground rounded-xl px-4 py-2.5 text-sm outline-none border border-border flex items-center justify-between hover:bg-muted/80 transition-colors">
            {datePresets[presetIdx].label}
            <ChevronDown size={14} className="text-muted-foreground" />
          </button>
          {showPresets && (
            <div className="absolute left-0 top-full mt-1 bg-card border border-border rounded-xl shadow-xl z-30 overflow-hidden w-full">
              {datePresets.map((p, i) => (
                <button key={i} onClick={() => selectPreset(i)}
                  className={`w-full text-left px-4 py-2.5 text-sm hover:bg-muted transition-colors ${presetIdx === i ? "bg-muted font-semibold text-foreground" : "text-muted-foreground"}`}>
                  {p.label}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
        <div className="bg-card rounded-2xl border-2 border-emerald-300 dark:border-emerald-700 p-6 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm font-medium text-muted-foreground">Total Revenue</p>
            <div className="w-9 h-9 rounded-xl bg-emerald-100 dark:bg-emerald-900/40 flex items-center justify-center">
              <DollarSign size={18} className="text-emerald-600" />
            </div>
          </div>
          <p className="font-heading text-3xl font-bold text-emerald-600">৳{totalRevenue.toLocaleString()}</p>
          <p className="text-xs text-muted-foreground mt-1">{totalTx} completed transactions</p>
        </div>
        <div className="bg-card rounded-2xl border-2 border-blue-300 dark:border-blue-700 p-6 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm font-medium text-muted-foreground">Total Transactions</p>
            <div className="w-9 h-9 rounded-xl bg-blue-100 dark:bg-blue-900/40 flex items-center justify-center">
              <TrendingUp size={18} className="text-blue-600" />
            </div>
          </div>
          <p className="font-heading text-3xl font-bold text-blue-600">{totalTx}</p>
          <p className="text-xs text-muted-foreground mt-1">Avg: ৳{avgPerTx.toFixed(2)} per transaction</p>
        </div>
      </div>

      {/* Payment Dashboard - Method Breakdown */}
      <div className="bg-card rounded-2xl border border-border p-6 shadow-sm mb-6">
        <div className="mb-4">
          <h3 className="text-lg font-heading font-bold text-foreground">Payment Dashboard</h3>
          <p className="text-sm text-muted-foreground">Sales breakdown by payment method</p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from(allMethods).map((m) => {
            const meta = METHOD_META[m] || METHOD_META.other;
            const g = methodGroups[m] || { total: 0, count: 0 };
            const Icon = meta.icon;
            return (
              <motion.div key={m} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                className={`rounded-2xl border-2 ${meta.borderColor} ${meta.bgColor} p-5 transition-shadow hover:shadow-md`}>
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm font-semibold text-foreground">{meta.label}</span>
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${meta.bgColor}`}>
                    <Icon size={16} className={meta.textColor} />
                  </div>
                </div>
                <p className={`font-heading text-2xl font-bold ${meta.textColor}`}>৳{g.total.toLocaleString()}</p>
                <p className="text-xs text-muted-foreground mt-1">{g.count} transaction{g.count !== 1 ? "s" : ""}</p>
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* Add Manual Amount Modal */}
      <AnimatePresence>
        {showManual && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setShowManual(false)}>
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
              className="bg-card rounded-2xl border border-border p-6 w-full max-w-md shadow-2xl" onClick={(e) => e.stopPropagation()}>
              <div className="flex justify-between items-center mb-5">
                <h3 className="font-heading text-lg font-bold text-foreground">Add Manual Amount</h3>
                <button onClick={() => setShowManual(false)} className="text-muted-foreground hover:text-foreground"><X size={20} /></button>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-foreground mb-1.5 block">Amount *</label>
                  <input type="number" value={manualForm.amount} onChange={(e) => setManualForm({ ...manualForm, amount: e.target.value })} className={inputClass} placeholder="0" />
                </div>
                <div>
                  <label className="text-sm font-medium text-foreground mb-1.5 block">Payment Method</label>
                  <select value={manualForm.payment_method} onChange={(e) => setManualForm({ ...manualForm, payment_method: e.target.value })} className={inputClass}>
                    {Object.entries(METHOD_META).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-sm font-medium text-foreground mb-1.5 block">Date</label>
                  <input type="date" value={manualForm.payment_date} onChange={(e) => setManualForm({ ...manualForm, payment_date: e.target.value })} className={inputClass} />
                </div>
                <div>
                  <label className="text-sm font-medium text-foreground mb-1.5 block">Reference</label>
                  <input value={manualForm.reference_no} onChange={(e) => setManualForm({ ...manualForm, reference_no: e.target.value })} className={inputClass} placeholder="Optional" />
                </div>
                <div>
                  <label className="text-sm font-medium text-foreground mb-1.5 block">Notes</label>
                  <input value={manualForm.notes} onChange={(e) => setManualForm({ ...manualForm, notes: e.target.value })} className={inputClass} placeholder="Optional" />
                </div>
                <button onClick={handleManualSave} disabled={saving}
                  className="w-full bg-gold-gradient text-accent-foreground py-3 rounded-xl text-sm font-semibold hover:opacity-90 disabled:opacity-50 flex items-center justify-center gap-2">
                  {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />} Add Amount
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default AdminBankStatement;
