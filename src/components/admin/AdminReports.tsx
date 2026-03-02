import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, BarChart3, TrendingUp, TrendingDown, Calendar, DollarSign, Users, FileText } from "lucide-react";
import { motion } from "framer-motion";
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";

type Period = "daily" | "weekly" | "monthly" | "yearly";

const AdminReports = () => {
  const [period, setPeriod] = useState<Period>("monthly");
  const [loading, setLoading] = useState(true);
  const [payments, setPayments] = useState<any[]>([]);
  const [expenses, setExpenses] = useState<any[]>([]);
  const [customers, setCustomers] = useState(0);
  const [projects, setProjects] = useState(0);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      const [payRes, expRes, custRes, projRes] = await Promise.all([
        supabase.from("payments").select("amount, payment_date, status, payment_method").eq("status", "completed"),
        supabase.from("expenses").select("amount, expense_date, category, status").eq("status", "approved"),
        supabase.from("user_roles").select("id").eq("role", "customer"),
        supabase.from("customer_projects").select("id"),
      ]);
      setPayments(payRes.data || []);
      setExpenses(expRes.data || []);
      setCustomers((custRes.data || []).length);
      setProjects((projRes.data || []).length);
      setLoading(false);
    };
    fetchData();
  }, []);

  const totalRevenue = payments.reduce((s, p) => s + Number(p.amount), 0);
  const totalExpenses = expenses.reduce((s, e) => s + Number(e.amount), 0);
  const netProfit = totalRevenue - totalExpenses;

  // Group data by period
  const groupByPeriod = (items: any[], dateField: string) => {
    const groups: Record<string, number> = {};
    items.forEach((item) => {
      const d = new Date(item[dateField]);
      let key: string;
      if (period === "daily") key = d.toLocaleDateString();
      else if (period === "weekly") { const w = Math.ceil(d.getDate() / 7); key = `W${w} ${d.toLocaleString("default", { month: "short" })}`; }
      else if (period === "monthly") key = d.toLocaleString("default", { month: "short", year: "2-digit" });
      else key = String(d.getFullYear());
      groups[key] = (groups[key] || 0) + Number(item.amount);
    });
    return Object.entries(groups).map(([name, value]) => ({ name, value }));
  };

  const revenueData = groupByPeriod(payments, "payment_date");
  const expenseData = groupByPeriod(expenses, "expense_date");

  // Combined for comparison
  const allKeys = new Set([...revenueData.map((d) => d.name), ...expenseData.map((d) => d.name)]);
  const comparisonData = Array.from(allKeys).map((name) => ({
    name,
    revenue: revenueData.find((d) => d.name === name)?.value || 0,
    expenses: expenseData.find((d) => d.name === name)?.value || 0,
  }));

  // Payment method breakdown
  const methodBreakdown: Record<string, number> = {};
  payments.forEach((p) => {
    const m = p.payment_method || "other";
    methodBreakdown[m] = (methodBreakdown[m] || 0) + Number(p.amount);
  });
  const pieData = Object.entries(methodBreakdown).map(([name, value]) => ({ name: name.replace(/_/g, " "), value }));
  const PIE_COLORS = ["hsl(217, 91%, 60%)", "hsl(152, 69%, 50%)", "hsl(25, 95%, 60%)", "hsl(340, 82%, 62%)", "hsl(262, 83%, 65%)"];

  // Expense category breakdown
  const catBreakdown: Record<string, number> = {};
  expenses.forEach((e) => { catBreakdown[e.category || "general"] = (catBreakdown[e.category || "general"] || 0) + Number(e.amount); });
  const catData = Object.entries(catBreakdown).map(([name, value]) => ({ name, value }));

  if (loading) return <div className="flex justify-center py-20"><Loader2 className="animate-spin text-gold" size={32} /></div>;

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <h2 className="font-heading text-2xl font-bold text-foreground flex items-center gap-3">
          <BarChart3 size={24} className="text-dash-purple" /> Reports Dashboard
        </h2>
        <div className="flex items-center gap-1 bg-card border border-border rounded-xl p-1">
          {(["daily", "weekly", "monthly", "yearly"] as Period[]).map((p) => (
            <button key={p} onClick={() => setPeriod(p)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors capitalize ${period === p ? "bg-gold-gradient text-accent-foreground" : "text-muted-foreground hover:text-foreground"}`}>
              {p}
            </button>
          ))}
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
        {[
          { label: "Total Revenue", value: `৳${totalRevenue.toLocaleString()}`, icon: <TrendingUp size={16} />, color: "bg-dash-green" },
          { label: "Total Expenses", value: `৳${totalExpenses.toLocaleString()}`, icon: <TrendingDown size={16} />, color: "bg-dash-pink" },
          { label: "Net Profit", value: `৳${netProfit.toLocaleString()}`, icon: <DollarSign size={16} />, color: netProfit >= 0 ? "bg-dash-blue" : "bg-destructive" },
          { label: "Customers", value: customers, icon: <Users size={16} />, color: "bg-dash-orange" },
        ].map((s, i) => (
          <motion.div key={i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
            className={`${s.color} rounded-2xl p-4 text-white shadow-lg`}>
            <div className="flex items-center gap-2 text-white/70 text-xs font-medium mb-1">{s.icon} {s.label}</div>
            <p className="font-heading text-xl font-bold">{s.value}</p>
          </motion.div>
        ))}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
        {/* Revenue vs Expenses */}
        <div className="bg-card rounded-2xl border border-border p-5 shadow-sm">
          <h3 className="text-sm font-semibold text-foreground mb-4">Revenue vs Expenses ({period})</h3>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={comparisonData}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="name" tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} />
              <YAxis tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} />
              <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 12, fontSize: 12 }} />
              <Bar dataKey="revenue" fill="hsl(152, 69%, 50%)" radius={[6, 6, 0, 0]} />
              <Bar dataKey="expenses" fill="hsl(340, 82%, 62%)" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Revenue Trend */}
        <div className="bg-card rounded-2xl border border-border p-5 shadow-sm">
          <h3 className="text-sm font-semibold text-foreground mb-4">Revenue Trend</h3>
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={revenueData}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="name" tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} />
              <YAxis tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} />
              <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 12, fontSize: 12 }} />
              <Line type="monotone" dataKey="value" stroke="hsl(217, 91%, 60%)" strokeWidth={2} dot={{ r: 4 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Payment Methods Pie */}
        <div className="bg-card rounded-2xl border border-border p-5 shadow-sm">
          <h3 className="text-sm font-semibold text-foreground mb-4">Payment Methods</h3>
          {pieData.length > 0 ? (
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie data={pieData} cx="50%" cy="50%" innerRadius={50} outerRadius={90} paddingAngle={4} dataKey="value">
                  {pieData.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                </Pie>
                <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 12, fontSize: 12 }} />
              </PieChart>
            </ResponsiveContainer>
          ) : <p className="text-center py-12 text-muted-foreground text-sm">No payment data.</p>}
          <div className="flex flex-wrap gap-3 mt-2 justify-center">
            {pieData.map((d, i) => (
              <span key={i} className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <span className="w-2.5 h-2.5 rounded-full" style={{ background: PIE_COLORS[i % PIE_COLORS.length] }} />
                {d.name}: ৳{d.value.toLocaleString()}
              </span>
            ))}
          </div>
        </div>

        {/* Expense Categories */}
        <div className="bg-card rounded-2xl border border-border p-5 shadow-sm">
          <h3 className="text-sm font-semibold text-foreground mb-4">Expense Categories</h3>
          {catData.length > 0 ? (
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={catData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis type="number" tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} />
                <YAxis type="category" dataKey="name" tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} width={80} />
                <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 12, fontSize: 12 }} />
                <Bar dataKey="value" fill="hsl(262, 83%, 65%)" radius={[0, 6, 6, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : <p className="text-center py-12 text-muted-foreground text-sm">No expense data.</p>}
        </div>
      </div>
    </div>
  );
};

export default AdminReports;
