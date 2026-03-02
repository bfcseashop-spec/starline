import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { Loader2, Landmark, Download, Search, Calendar, ArrowUpRight, ArrowDownLeft } from "lucide-react";
import { motion } from "framer-motion";

interface Transaction {
  id: string;
  amount: number;
  type: "income" | "expense";
  description: string;
  date: string;
  reference: string;
  balance: number;
}

const AdminBankStatement = () => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [dateFrom, setDateFrom] = useState(() => {
    const d = new Date(); d.setMonth(d.getMonth() - 1);
    return d.toISOString().split("T")[0];
  });
  const [dateTo, setDateTo] = useState(() => new Date().toISOString().split("T")[0]);
  const [search, setSearch] = useState("");

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      // Fetch payments (income) and expenses
      const [payRes, expRes] = await Promise.all([
        supabase.from("payments").select("id, amount, payment_method, payment_date, reference_no, status, notes")
          .gte("payment_date", dateFrom).lte("payment_date", dateTo).eq("status", "completed").order("payment_date", { ascending: true }),
        supabase.from("expenses").select("id, amount, title, expense_date, category, status, vendor")
          .gte("expense_date", dateFrom).lte("expense_date", dateTo).eq("status", "approved").order("expense_date", { ascending: true }),
      ]);

      const all: Transaction[] = [];
      (payRes.data || []).forEach((p) => {
        all.push({ id: p.id, amount: Number(p.amount), type: "income", description: p.notes || `Payment - ${p.payment_method}`, date: p.payment_date, reference: p.reference_no || p.id.slice(0, 8), balance: 0 });
      });
      (expRes.data || []).forEach((e) => {
        all.push({ id: e.id, amount: Number(e.amount), type: "expense", description: e.title + (e.vendor ? ` (${e.vendor})` : ""), date: e.expense_date, reference: e.category, balance: 0 });
      });

      all.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

      // Running balance
      let balance = 0;
      all.forEach((t) => {
        balance += t.type === "income" ? t.amount : -t.amount;
        t.balance = balance;
      });

      setTransactions(all);
      setLoading(false);
    };
    fetchData();
  }, [dateFrom, dateTo]);

  const filtered = transactions.filter((t) => {
    const q = search.toLowerCase();
    return !q || t.description.toLowerCase().includes(q) || t.reference.toLowerCase().includes(q);
  });

  const totalIncome = transactions.filter((t) => t.type === "income").reduce((s, t) => s + t.amount, 0);
  const totalExpense = transactions.filter((t) => t.type === "expense").reduce((s, t) => s + t.amount, 0);
  const netBalance = totalIncome - totalExpense;

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
    doc.text(`Net Balance: ৳${netBalance.toLocaleString()}`, 195, 18, { align: "right" });

    autoTable(doc, {
      startY: 42,
      head: [["Date", "Description", "Reference", "Income", "Expense", "Balance"]],
      body: filtered.map((t) => [
        new Date(t.date).toLocaleDateString(),
        t.description,
        t.reference,
        t.type === "income" ? `৳${t.amount.toLocaleString()}` : "",
        t.type === "expense" ? `৳${t.amount.toLocaleString()}` : "",
        `৳${t.balance.toLocaleString()}`,
      ]),
      headStyles: { fillColor: [15, 23, 42], textColor: [255, 255, 255], fontSize: 9 },
      bodyStyles: { fontSize: 9 },
      alternateRowStyles: { fillColor: [245, 245, 245] },
      margin: { left: 10, right: 10 },
    });

    doc.save(`bank-statement-${dateFrom}-to-${dateTo}.pdf`);
    toast("Statement downloaded!");
  };

  // Need to import toast
  const toast = (msg: string) => {
    import("sonner").then((m) => m.toast.success(msg));
  };

  if (loading) return <div className="flex justify-center py-20"><Loader2 className="animate-spin text-gold" size={32} /></div>;

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <h2 className="font-heading text-2xl font-bold text-foreground flex items-center gap-3">
          <Landmark size={24} className="text-dash-teal" /> Bank Statement
        </h2>
        <button onClick={exportPdf} className="bg-dash-teal text-white px-4 py-2.5 rounded-xl text-sm font-semibold flex items-center gap-2 hover:opacity-90 transition-opacity shadow-md">
          <Download size={16} /> Export PDF
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        {[
          { label: "Total Income", value: `৳${totalIncome.toLocaleString()}`, color: "bg-dash-green" },
          { label: "Total Expenses", value: `৳${totalExpense.toLocaleString()}`, color: "bg-dash-pink" },
          { label: "Net Balance", value: `৳${netBalance.toLocaleString()}`, color: netBalance >= 0 ? "bg-dash-blue" : "bg-destructive" },
        ].map((s, i) => (
          <motion.div key={i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
            className={`${s.color} rounded-2xl p-4 text-white shadow-lg`}>
            <p className="text-white/70 text-xs font-medium mb-1">{s.label}</p>
            <p className="font-heading text-xl font-bold">{s.value}</p>
          </motion.div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="flex items-center gap-2">
          <Calendar size={14} className="text-muted-foreground" />
          <input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)}
            className="bg-card text-foreground rounded-xl px-3 py-2.5 text-sm outline-none border border-border" />
          <span className="text-muted-foreground text-sm">to</span>
          <input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)}
            className="bg-card text-foreground rounded-xl px-3 py-2.5 text-sm outline-none border border-border" />
        </div>
        <div className="flex-1 relative">
          <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search transactions..."
            className="w-full bg-card text-foreground rounded-xl pl-11 pr-4 py-2.5 text-sm outline-none border border-border focus:ring-2 focus:ring-ring" />
        </div>
      </div>

      {/* Transaction List */}
      <div className="bg-card rounded-2xl border border-border overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted">
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Date</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Description</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground hidden sm:table-cell">Reference</th>
                <th className="text-right px-4 py-3 font-medium text-muted-foreground">Income</th>
                <th className="text-right px-4 py-3 font-medium text-muted-foreground">Expense</th>
                <th className="text-right px-4 py-3 font-medium text-muted-foreground">Balance</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((t) => (
                <tr key={t.id} className="border-b border-border last:border-0 hover:bg-muted/50 transition-colors">
                  <td className="px-4 py-3 text-foreground text-xs">{new Date(t.date).toLocaleDateString()}</td>
                  <td className="px-4 py-3 text-foreground">
                    <div className="flex items-center gap-2">
                      {t.type === "income"
                        ? <ArrowDownLeft size={14} className="text-dash-green shrink-0" />
                        : <ArrowUpRight size={14} className="text-dash-pink shrink-0" />}
                      <span className="truncate max-w-[200px]">{t.description}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground hidden sm:table-cell text-xs">{t.reference}</td>
                  <td className="px-4 py-3 text-right font-medium text-dash-green">{t.type === "income" ? `৳${t.amount.toLocaleString()}` : ""}</td>
                  <td className="px-4 py-3 text-right font-medium text-dash-pink">{t.type === "expense" ? `৳${t.amount.toLocaleString()}` : ""}</td>
                  <td className="px-4 py-3 text-right font-bold text-foreground">৳{t.balance.toLocaleString()}</td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr><td colSpan={6} className="text-center py-12 text-muted-foreground">No transactions in this period.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default AdminBankStatement;
