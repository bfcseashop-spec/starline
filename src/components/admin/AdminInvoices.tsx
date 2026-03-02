import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { generateInvoicePdf } from "@/lib/generateInvoicePdf";
import { toast } from "sonner";
import { FileText, Loader2, Printer, Eye, Search, Plus, DollarSign, ChevronDown } from "lucide-react";
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
  image_url: string | null;
  customer_name?: string;
  project_name?: string;
}

interface InvoiceSettings {
  prefix: string;
  next_number: string;
}

const AdminInvoices = () => {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [invoiceSettings, setInvoiceSettings] = useState<InvoiceSettings>({ prefix: "INV-", next_number: "1001" });

  useEffect(() => {
    const fetchData = async () => {
      const [payRes, profRes, projRes, settingsRes] = await Promise.all([
        supabase.from("payments").select("*").order("payment_date", { ascending: false }),
        supabase.from("profiles").select("user_id, full_name"),
        supabase.from("customer_projects").select("id, project_name"),
        supabase.from("site_settings").select("setting_key, setting_value").eq("setting_key", "invoice"),
      ]);

      const nameMap: Record<string, string> = {};
      (profRes.data || []).forEach((p) => { nameMap[p.user_id] = p.full_name || "Unnamed"; });
      const projMap: Record<string, string> = {};
      (projRes.data || []).forEach((p) => { projMap[p.id] = p.project_name; });

      if (settingsRes.data?.[0]) {
        setInvoiceSettings({ ...invoiceSettings, ...settingsRes.data[0].setting_value as any });
      }

      setPayments(
        (payRes.data || []).map((p) => ({
          ...p,
          customer_name: nameMap[p.user_id] || "Unknown",
          project_name: p.project_id ? projMap[p.project_id] || "Unknown" : "—",
        })) as Payment[]
      );
      setLoading(false);
    };
    fetchData();
  }, []);

  const filtered = payments.filter((p) => {
    const q = search.toLowerCase();
    return !q || (p.customer_name || "").toLowerCase().includes(q) || (p.reference_no || "").toLowerCase().includes(q) || (p.project_name || "").toLowerCase().includes(q);
  });

  const totalInvoiced = payments.reduce((s, p) => s + p.amount, 0);
  const paidCount = payments.filter((p) => p.status === "completed").length;
  const pendingCount = payments.filter((p) => p.status === "pending").length;

  if (loading) return <div className="flex justify-center py-20"><Loader2 className="animate-spin text-gold" size={32} /></div>;

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <h2 className="font-heading text-2xl font-bold text-foreground flex items-center gap-3">
          <FileText size={24} className="text-dash-purple" /> Invoices
        </h2>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        {[
          { label: "Total Invoices", value: payments.length, color: "bg-dash-blue" },
          { label: "Total Amount", value: `৳${totalInvoiced.toLocaleString()}`, color: "bg-dash-green" },
          { label: "Paid", value: paidCount, color: "bg-dash-teal" },
          { label: "Pending", value: pendingCount, color: "bg-dash-orange" },
        ].map((s, i) => (
          <motion.div key={i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
            className={`${s.color} rounded-2xl p-4 text-white shadow-lg`}>
            <p className="text-white/70 text-xs font-medium mb-1">{s.label}</p>
            <p className="font-heading text-xl font-bold">{s.value}</p>
          </motion.div>
        ))}
      </div>

      {/* Search */}
      <div className="relative mb-6">
        <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" />
        <input value={search} onChange={(e) => setSearch(e.target.value)}
          placeholder="Search invoices..." className="w-full bg-card text-foreground rounded-xl pl-11 pr-4 py-3 text-sm outline-none border border-border focus:ring-2 focus:ring-ring" />
      </div>

      {/* Invoice List */}
      <div className="space-y-3">
        {filtered.map((p, idx) => (
          <motion.div key={p.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.02 }}
            className="bg-card rounded-2xl border border-border p-5 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
              <div className="flex items-center gap-4 flex-1 min-w-0">
                <div className={`w-11 h-11 rounded-xl flex items-center justify-center text-white shrink-0 ${p.status === "completed" ? "bg-dash-green" : "bg-dash-orange"}`}>
                  <FileText size={20} />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold text-foreground">{invoiceSettings.prefix}{(p.reference_no || p.id.slice(0, 8)).toUpperCase()}</h3>
                    <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-full ${p.status === "completed" ? "bg-dash-green/15 text-dash-green" : "bg-gold/15 text-gold"}`}>{p.status}</span>
                  </div>
                  <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground mt-1">
                    <span className="font-medium">👤 {p.customer_name}</span>
                    <span>📁 {p.project_name}</span>
                    <span>{new Date(p.payment_date).toLocaleDateString()}</span>
                    <span className="font-bold text-foreground">৳{p.amount.toLocaleString()}</span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-1.5 shrink-0">
                <button onClick={() => generateInvoicePdf(p)} title="Generate PDF"
                  className="p-2 rounded-lg bg-dash-purple/10 text-dash-purple hover:bg-dash-purple/20 transition-colors flex items-center gap-1.5 px-3">
                  <Printer size={15} /> <span className="text-xs font-medium">PDF</span>
                </button>
              </div>
            </div>
          </motion.div>
        ))}
        {filtered.length === 0 && (
          <div className="text-center py-20 text-muted-foreground">
            <FileText size={48} className="mx-auto mb-4 opacity-40" />
            <p>No invoices found.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminInvoices;
