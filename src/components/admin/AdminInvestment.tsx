import React, { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { TrendingUp, DollarSign, Calendar, Building2, Search, Filter, ArrowUpRight, ArrowDownRight, Minus } from "lucide-react";
import { motion } from "framer-motion";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";

interface ProjectInvestment {
  id: string;
  project_name: string;
  location: string | null;
  total_amount: number;
  paid_amount: number;
  monthly_installment: number;
  status: string;
  start_date: string | null;
  expected_completion: string | null;
  user_name: string | null;
  user_email: string | null;
}

const statusColors: Record<string, string> = {
  in_progress: "bg-blue-500/10 text-blue-600 border-blue-500/20",
  completed: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20",
  on_hold: "bg-amber-500/10 text-amber-600 border-amber-500/20",
  cancelled: "bg-red-500/10 text-red-600 border-red-500/20",
};

const AdminInvestment = () => {
  const [projects, setProjects] = useState<ProjectInvestment[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  useEffect(() => {
    fetchInvestments();
  }, []);

  const fetchInvestments = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("customer_projects")
      .select("id, project_name, location, total_amount, paid_amount, monthly_installment, status, start_date, expected_completion, user_id");

    if (error) {
      toast.error("Failed to load investment data");
      setLoading(false);
      return;
    }

    // Fetch profile names
    const userIds = [...new Set((data || []).map((p) => p.user_id))];
    const { data: profiles } = await supabase
      .from("profiles")
      .select("user_id, full_name")
      .in("user_id", userIds);

    const profileMap = new Map((profiles || []).map((p) => [p.user_id, p.full_name]));

    const mapped: ProjectInvestment[] = (data || []).map((p) => ({
      ...p,
      user_name: profileMap.get(p.user_id) || null,
      user_email: null,
    }));

    setProjects(mapped);
    setLoading(false);
  };

  const filtered = projects.filter((p) => {
    const matchSearch =
      p.project_name.toLowerCase().includes(search.toLowerCase()) ||
      (p.user_name || "").toLowerCase().includes(search.toLowerCase()) ||
      (p.location || "").toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === "all" || p.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const totalInvestment = projects.reduce((s, p) => s + p.total_amount, 0);
  const totalCollected = projects.reduce((s, p) => s + p.paid_amount, 0);
  const totalOutstanding = totalInvestment - totalCollected;
  const totalMonthlyEMI = projects.reduce((s, p) => s + p.monthly_installment, 0);
  const collectionRate = totalInvestment > 0 ? Math.round((totalCollected / totalInvestment) * 100) : 0;

  const fmt = (n: number) =>
    new Intl.NumberFormat("en-US", { style: "currency", currency: "BDT", maximumFractionDigits: 0 }).format(n);

  const summaryCards = [
    { label: "Total Investment", value: fmt(totalInvestment), icon: TrendingUp, gradient: "bg-dash-blue", trend: null },
    { label: "Total Collected", value: fmt(totalCollected), icon: DollarSign, gradient: "bg-dash-green", trend: "up" as const },
    { label: "Outstanding", value: fmt(totalOutstanding), icon: ArrowDownRight, gradient: "bg-dash-orange", trend: "down" as const },
    { label: "Monthly EMI", value: fmt(totalMonthlyEMI), icon: Calendar, gradient: "bg-dash-purple", trend: null },
  ];

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {summaryCards.map((card, i) => (
          <motion.div
            key={card.label}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            className="bg-card rounded-2xl border border-border p-5 shadow-sm"
          >
            <div className="flex items-center justify-between mb-3">
              <div className={`p-2 rounded-xl ${card.gradient}`}>
                <card.icon size={18} className="text-white" />
              </div>
              {card.trend === "up" && <span className="text-emerald-500 text-xs font-bold flex items-center gap-0.5"><ArrowUpRight size={14} /> {collectionRate}%</span>}
              {card.trend === "down" && <span className="text-amber-500 text-xs font-bold flex items-center gap-0.5"><Minus size={14} /> pending</span>}
            </div>
            <p className="font-heading text-xl font-bold text-foreground">{card.value}</p>
            <p className="text-xs text-muted-foreground mt-1">{card.label}</p>
          </motion.div>
        ))}
      </div>

      {/* Collection Progress */}
      <div className="bg-card rounded-2xl border border-border p-5 shadow-sm">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold text-foreground">Overall Collection Progress</h3>
          <span className="text-sm font-bold text-primary">{collectionRate}%</span>
        </div>
        <Progress value={collectionRate} className="h-3" />
        <div className="flex justify-between mt-2 text-xs text-muted-foreground">
          <span>Collected: {fmt(totalCollected)}</span>
          <span>Remaining: {fmt(totalOutstanding)}</span>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by project, customer, or location..."
            className="pl-9 bg-card"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-44 bg-card">
            <Filter size={14} className="mr-2 text-muted-foreground" />
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="in_progress">In Progress</SelectItem>
            <SelectItem value="completed">Completed</SelectItem>
            <SelectItem value="on_hold">On Hold</SelectItem>
            <SelectItem value="cancelled">Cancelled</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Projects Table */}
      <div className="bg-card rounded-2xl border border-border shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/30">
                <th className="text-left px-5 py-3 font-semibold text-foreground">Project</th>
                <th className="text-left px-5 py-3 font-semibold text-foreground">Customer</th>
                <th className="text-right px-5 py-3 font-semibold text-foreground">Total</th>
                <th className="text-right px-5 py-3 font-semibold text-foreground">Paid</th>
                <th className="text-right px-5 py-3 font-semibold text-foreground">Due</th>
                <th className="text-right px-5 py-3 font-semibold text-foreground">EMI</th>
                <th className="text-center px-5 py-3 font-semibold text-foreground">Progress</th>
                <th className="text-center px-5 py-3 font-semibold text-foreground">Status</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={8} className="text-center py-12 text-muted-foreground">Loading...</td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan={8} className="text-center py-12 text-muted-foreground">No investment records found.</td></tr>
              ) : (
                filtered.map((p) => {
                  const progress = p.total_amount > 0 ? Math.round((p.paid_amount / p.total_amount) * 100) : 0;
                  const due = p.total_amount - p.paid_amount;
                  return (
                    <tr key={p.id} className="border-b border-border/50 hover:bg-muted/30 transition-colors">
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                            <Building2 size={16} className="text-primary" />
                          </div>
                          <div>
                            <p className="font-medium text-foreground">{p.project_name}</p>
                            {p.location && <p className="text-xs text-muted-foreground">{p.location}</p>}
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-4 text-foreground">{p.user_name || "—"}</td>
                      <td className="px-5 py-4 text-right font-medium text-foreground">{fmt(p.total_amount)}</td>
                      <td className="px-5 py-4 text-right font-medium text-emerald-600">{fmt(p.paid_amount)}</td>
                      <td className="px-5 py-4 text-right font-medium text-amber-600">{fmt(due)}</td>
                      <td className="px-5 py-4 text-right text-foreground">{fmt(p.monthly_installment)}</td>
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-2 justify-center">
                          <Progress value={progress} className="h-2 w-16" />
                          <span className="text-xs font-medium text-muted-foreground w-8">{progress}%</span>
                        </div>
                      </td>
                      <td className="px-5 py-4 text-center">
                        <span className={`inline-block text-xs font-bold px-2.5 py-1 rounded-full border capitalize ${statusColors[p.status] || "bg-muted text-muted-foreground"}`}>
                          {p.status.replace("_", " ")}
                        </span>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default AdminInvestment;
