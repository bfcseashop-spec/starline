import React, { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import {
  TrendingUp, DollarSign, Users, Plus, Trash2, Edit2, Search,
  ArrowUpRight, ArrowDownRight, Eye, Download, LayoutGrid, List, Calendar, FileText,
  CheckCircle, AlertTriangle, PieChart,
} from "lucide-react";
import { motion } from "framer-motion";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import type { Tables } from "@/integrations/supabase/types";

type Investment = Tables<"investments">;
type Investor = Tables<"investors">;
type InvestmentCategory = Tables<"investment_categories">;
type Contribution = Tables<"contributions">;
type InvestmentShare = Tables<"investment_shares">;

const fmt = (n: number) =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: "BDT", maximumFractionDigits: 2 }).format(n);

const AdminInvestment = () => {
  const [investments, setInvestments] = useState<Investment[]>([]);
  const [investors, setInvestors] = useState<Investor[]>([]);
  const [categories, setCategories] = useState<InvestmentCategory[]>([]);
  const [contributions, setContributions] = useState<Contribution[]>([]);
  const [shares, setShares] = useState<InvestmentShare[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  // Dialog states
  const [investorDialog, setInvestorDialog] = useState(false);
  const [investorEditing, setInvestorEditing] = useState<Investor | null>(null);
  const [investorForm, setInvestorForm] = useState({ name: "", email: "", phone: "", avatar_color: "#3b82f6" });

  const [categoryDialog, setCategoryDialog] = useState(false);
  const [categoryEditing, setCategoryEditing] = useState<InvestmentCategory | null>(null);
  const [categoryForm, setCategoryForm] = useState({ name: "", color: "#6b7280" });

  const [investmentDialog, setInvestmentDialog] = useState(false);
  const [investmentEditing, setInvestmentEditing] = useState<Investment | null>(null);
  const [investmentForm, setInvestmentForm] = useState({ name: "", description: "", total_capital: "", status: "active" });

  const [capitalDialog, setCapitalDialog] = useState(false);
  const [capitalEditing, setCapitalEditing] = useState<InvestmentShare | null>(null);
  const [capitalForm, setCapitalForm] = useState({ investment_id: "", investor_id: "", share_percent: "", capital_amount: "" });

  const [contribDialog, setContribDialog] = useState(false);
  const [contribForm, setContribForm] = useState({ investment_id: "", investor_id: "", category_id: "", amount: "", contribution_date: new Date().toISOString().split("T")[0], note: "" });

  // Filters
  const [monthFilter, setMonthFilter] = useState("all");
  const [investorFilter, setInvestorFilter] = useState("all");
  const [viewMode, setViewMode] = useState<"table" | "grid">("table");

  const investorMap = new Map(investors.map((i) => [i.id, i]));
  const investmentMap = new Map(investments.map((i) => [i.id, i]));
  const categoryMap = new Map(categories.map((c) => [c.id, c]));

  const fetchAll = useCallback(async () => {
    setLoading(true);
    const [invRes, invtRes, catRes, contRes, shareRes] = await Promise.all([
      supabase.from("investments").select("*").order("created_at", { ascending: false }),
      supabase.from("investors").select("*").order("name"),
      supabase.from("investment_categories").select("*").order("name"),
      supabase.from("contributions").select("*").order("contribution_date", { ascending: false }),
      supabase.from("investment_shares").select("*"),
    ]);
    setInvestments(invRes.data || []);
    setInvestors(invtRes.data || []);
    setCategories(catRes.data || []);
    setContributions(contRes.data || []);
    setShares(shareRes.data || []);
    setLoading(false);
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  // Summary stats
  const totalCapital = shares.reduce((s, sh) => s + Number(sh.capital_amount), 0);
  const totalContributed = contributions.reduce((s, c) => s + Number(c.amount), 0);
  const remaining = Math.max(totalCapital - totalContributed, 0);

  // ── Investor CRUD ──
  const openNewInvestor = () => { setInvestorEditing(null); setInvestorForm({ name: "", email: "", phone: "", avatar_color: "#3b82f6" }); setInvestorDialog(true); };
  const saveInvestor = async () => {
    if (!investorForm.name.trim()) { toast.error("Name is required"); return; }
    const payload = { name: investorForm.name, email: investorForm.email || null, phone: investorForm.phone || null, avatar_color: investorForm.avatar_color };
    if (investorEditing) {
      const { error } = await supabase.from("investors").update(payload).eq("id", investorEditing.id);
      if (error) { toast.error(error.message); return; }
      toast.success("Investor updated");
    } else {
      const { error } = await supabase.from("investors").insert(payload);
      if (error) { toast.error(error.message); return; }
      toast.success("Investor added");
    }
    setInvestorDialog(false); fetchAll();
  };

  // ── Category CRUD ──
  const openNewCategory = () => { setCategoryEditing(null); setCategoryForm({ name: "", color: "#6b7280" }); setCategoryDialog(true); };
  const saveCategory = async () => {
    if (!categoryForm.name.trim()) { toast.error("Name is required"); return; }
    if (categoryEditing) {
      const { error } = await supabase.from("investment_categories").update({ name: categoryForm.name, color: categoryForm.color }).eq("id", categoryEditing.id);
      if (error) { toast.error(error.message); return; }
      toast.success("Category updated");
    } else {
      const { error } = await supabase.from("investment_categories").insert({ name: categoryForm.name, color: categoryForm.color });
      if (error) { toast.error(error.message); return; }
      toast.success("Category created");
    }
    setCategoryDialog(false); fetchAll();
  };

  // ── Investment CRUD ──
  const openNewInvestment = () => { setInvestmentEditing(null); setInvestmentForm({ name: "", description: "", total_capital: "", status: "active" }); setInvestmentDialog(true); };
  const saveInvestment = async () => {
    if (!investmentForm.name.trim()) { toast.error("Name is required"); return; }
    const payload = { name: investmentForm.name, description: investmentForm.description || null, total_capital: Number(investmentForm.total_capital) || 0, status: investmentForm.status };
    if (investmentEditing) {
      const { error } = await supabase.from("investments").update(payload).eq("id", investmentEditing.id);
      if (error) { toast.error(error.message); return; }
      toast.success("Investment updated");
    } else {
      const { error } = await supabase.from("investments").insert(payload);
      if (error) { toast.error(error.message); return; }
      toast.success("Investment created");
    }
    setInvestmentDialog(false); fetchAll();
  };

  // ── Capital/Share CRUD ──
  const openNewCapital = () => { setCapitalEditing(null); setCapitalForm({ investment_id: "", investor_id: "", share_percent: "", capital_amount: "" }); setCapitalDialog(true); };
  const openEditCapital = (s: InvestmentShare) => {
    setCapitalEditing(s);
    setCapitalForm({ investment_id: s.investment_id, investor_id: s.investor_id, share_percent: String(s.share_percent), capital_amount: String(s.capital_amount) });
    setCapitalDialog(true);
  };
  const saveCapital = async () => {
    if (!capitalForm.investment_id || !capitalForm.investor_id) { toast.error("Investment and Investor are required"); return; }
    const payload = { investment_id: capitalForm.investment_id, investor_id: capitalForm.investor_id, share_percent: Number(capitalForm.share_percent) || 0, capital_amount: Number(capitalForm.capital_amount) || 0 };
    if (capitalEditing) {
      const { error } = await supabase.from("investment_shares").update(payload).eq("id", capitalEditing.id);
      if (error) { toast.error(error.message); return; }
      toast.success("Capital updated");
    } else {
      const { error } = await supabase.from("investment_shares").insert(payload);
      if (error) { toast.error(error.message); return; }
      toast.success("Capital added");
    }
    setCapitalDialog(false); fetchAll();
  };
  const removeCapital = async (id: string) => {
    if (!confirm("Delete this share?")) return;
    const { error } = await supabase.from("investment_shares").delete().eq("id", id);
    if (error) toast.error(error.message); else { toast.success("Deleted"); fetchAll(); }
  };

  // ── Contribution CRUD ──
  const openNewContrib = () => { setContribForm({ investment_id: "", investor_id: "", category_id: "", amount: "", contribution_date: new Date().toISOString().split("T")[0], note: "" }); setContribDialog(true); };
  const saveContrib = async () => {
    if (!contribForm.investment_id || !contribForm.investor_id) { toast.error("Investment and Investor are required"); return; }
    const { error } = await supabase.from("contributions").insert({
      investment_id: contribForm.investment_id, investor_id: contribForm.investor_id,
      category_id: contribForm.category_id || null, amount: Number(contribForm.amount) || 0,
      contribution_date: contribForm.contribution_date, note: contribForm.note || null,
    });
    if (error) toast.error(error.message); else { toast.success("Contribution recorded"); setContribDialog(false); fetchAll(); }
  };
  const removeContrib = async (id: string) => {
    if (!confirm("Delete this contribution?")) return;
    const { error } = await supabase.from("contributions").delete().eq("id", id);
    if (error) toast.error(error.message); else { toast.success("Deleted"); fetchAll(); }
  };

  // Filtered contributions
  const filteredContribs = contributions.filter((c) => {
    const investor = investorMap.get(c.investor_id);
    const investment = investmentMap.get(c.investment_id);
    const q = search.toLowerCase();
    const matchSearch = (investor?.name || "").toLowerCase().includes(q) || (investment?.name || "").toLowerCase().includes(q) || (c.note || "").toLowerCase().includes(q);
    const matchMonth = monthFilter === "all" || c.contribution_date.startsWith(monthFilter);
    const matchInvestor = investorFilter === "all" || c.investor_id === investorFilter;
    return matchSearch && matchMonth && matchInvestor;
  });
  const months = [...new Set(contributions.map((c) => c.contribution_date.slice(0, 7)))].sort().reverse();

  return (
    <div className="space-y-6">
      {/* ═══ HEADER ═══ */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-foreground">Investment Management</h2>
          <p className="text-sm text-muted-foreground">Track investments, investor shares, contributions, and remaining dues</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button variant="outline" size="sm" className="gap-1.5" onClick={openNewInvestor}>
            <Users size={14} /> Manage Investors
          </Button>
          <Button variant="outline" size="sm" className="gap-1.5" onClick={openNewCategory}>
            <Plus size={14} /> Category
          </Button>
          <Button size="sm" className="gap-1.5" onClick={openNewInvestment}>
            <Plus size={14} /> Add Investment
          </Button>
          <Button variant="outline" size="sm" className="gap-1.5" onClick={openNewContrib}>
            <FileText size={14} /> Record Contribution
          </Button>
        </div>
      </div>

      {/* ═══ SUMMARY CARDS ═══ */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="bg-card rounded-2xl border border-border p-5 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <div className="p-2.5 rounded-xl bg-primary/10"><TrendingUp size={18} className="text-primary" /></div>
            <button className="p-1 rounded hover:bg-muted text-muted-foreground"><Edit2 size={13} /></button>
          </div>
          <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">Total Capital</p>
          <p className="font-heading text-xl font-bold text-foreground">{fmt(totalCapital)}</p>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }} className="bg-card rounded-2xl border border-border p-5 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <div className="p-2.5 rounded-xl bg-emerald-500/10"><DollarSign size={18} className="text-emerald-600" /></div>
            <span className="text-xs text-muted-foreground font-medium">{contributions.length} records</span>
          </div>
          <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">Contributions</p>
          <p className="font-heading text-xl font-bold text-foreground">{fmt(totalContributed)}</p>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="bg-card rounded-2xl border border-border p-5 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <div className="p-2.5 rounded-xl bg-emerald-500/10"><CheckCircle size={18} className="text-emerald-600" /></div>
            {totalCapital > 0 && <span className="text-emerald-600 text-xs font-bold flex items-center gap-0.5"><ArrowUpRight size={14} />{Math.round((totalContributed / totalCapital) * 100)}%</span>}
          </div>
          <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">Total Paid</p>
          <p className="font-heading text-xl font-bold text-emerald-600">{fmt(totalContributed)}</p>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }} className="bg-card rounded-2xl border border-border p-5 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <div className="p-2.5 rounded-xl bg-amber-500/10"><AlertTriangle size={18} className="text-amber-600" /></div>
            {totalCapital > 0 && <span className="text-amber-600 text-xs font-bold flex items-center gap-0.5"><ArrowDownRight size={14} />{Math.round((remaining / totalCapital) * 100)}%</span>}
          </div>
          <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">Remaining</p>
          <p className="font-heading text-xl font-bold text-amber-600">{fmt(remaining)}</p>
        </motion.div>
      </div>

      {/* ═══ CAPITAL & SHARE ═══ */}
      <div className="bg-card rounded-2xl border border-border shadow-sm p-5">
        <div className="flex items-center justify-between mb-5">
          <div>
            <h3 className="text-base font-bold text-foreground uppercase tracking-wide">Capital & Share</h3>
            <p className="text-xs text-muted-foreground">Investor shares per investment — create, edit, or remove below</p>
          </div>
          <Button size="sm" className="gap-1.5" onClick={openNewCapital}><Plus size={14} /> Add Capital</Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {shares.length === 0 ? (
            <p className="col-span-full text-center py-10 text-muted-foreground">No shares assigned yet. Click "Add Capital" to get started.</p>
          ) : shares.map((s) => {
            const investor = investorMap.get(s.investor_id);
            const investment = investmentMap.get(s.investment_id);
            const initials = investor?.name?.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2) || "?";
            const capitalAmount = Number(s.capital_amount);
            const paid = contributions
              .filter((c) => c.investor_id === s.investor_id && c.investment_id === s.investment_id)
              .reduce((sum, c) => sum + Number(c.amount), 0);
            const dueInvestment = Math.max(capitalAmount - paid, 0);
            const progress = capitalAmount > 0 ? Math.min(Math.round((paid / capitalAmount) * 100), 100) : 0;

            return (
              <motion.div key={s.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="bg-card rounded-xl border border-border p-5 hover:shadow-lg transition-shadow">
                {/* Top: Avatar, name, share %, investment, status, actions */}
                <div className="flex items-start gap-3 mb-4">
                  <Avatar className="h-10 w-10 shrink-0">
                    <AvatarFallback style={{ backgroundColor: investor?.avatar_color || "#3b82f6" }} className="text-white text-sm font-bold">{initials}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-foreground text-base">{investor?.name || "Unknown"}</p>
                    <div className="flex items-center gap-2 mt-1 flex-wrap">
                      <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-primary/15 text-primary">{s.share_percent}% share</span>
                      <span className="text-xs text-muted-foreground truncate">{investment?.name || "Unknown"}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <span className={`text-[11px] font-bold px-2.5 py-1 rounded-md border ${dueInvestment > 0 ? "border-amber-400/50 text-amber-600 bg-amber-50" : "border-emerald-400/50 text-emerald-600 bg-emerald-50"}`}>
                      {dueInvestment > 0 ? "Due" : "Paid"}
                    </span>
                    <button onClick={() => openEditCapital(s)} className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"><Edit2 size={15} /></button>
                    <button onClick={() => removeCapital(s.id)} className="p-1.5 rounded-lg hover:bg-destructive/10 text-destructive/70 hover:text-destructive transition-colors"><Trash2 size={15} /></button>
                  </div>
                </div>

                {/* Progress bar */}
                <div className="mb-4">
                  <div className="flex items-center justify-between text-xs mb-1.5">
                    <span className="text-muted-foreground font-medium">Payment Progress</span>
                    <span className="font-bold text-foreground">{progress}%</span>
                  </div>
                  <div className="w-full h-2.5 bg-muted rounded-full overflow-hidden">
                    <div className="h-full rounded-full transition-all duration-500" style={{ width: `${progress}%`, background: progress >= 90 ? "hsl(var(--chart-2))" : "hsl(var(--primary))" }} />
                  </div>
                </div>

                {/* Financial breakdown */}
                <div className="grid grid-cols-2 gap-x-6 gap-y-2 pt-3 border-t border-border">
                  <div>
                    <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">Capital Amount</p>
                    <p className="text-sm font-bold text-foreground">{fmt(capitalAmount)}</p>
                  </div>
                  <div>
                    <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">Paid</p>
                    <p className="text-sm font-bold text-emerald-600">{fmt(paid)}</p>
                  </div>
                  <div>
                    <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">Due Investment</p>
                    <p className="text-sm font-bold text-amber-600">{fmt(dueInvestment)}</p>
                  </div>
                  <div>
                    <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">Payable Amount</p>
                    <p className="text-sm font-bold text-amber-600">{fmt(dueInvestment)}</p>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* ═══ CONTRIBUTIONS TABLE ═══ */}
      <div className="bg-card rounded-2xl border border-border shadow-sm p-5">
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 mb-4">
          <div className="flex items-center gap-2">
            <FileText size={18} className="text-foreground" />
            <div>
              <h4 className="font-bold text-foreground">Contributions</h4>
              <p className="text-xs text-muted-foreground">Payment history for all investments</p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center gap-1.5 text-xs">
              <Calendar size={14} className="text-muted-foreground" />
              <span className="text-muted-foreground font-medium">Filter by Month</span>
              <Select value={monthFilter} onValueChange={setMonthFilter}>
                <SelectTrigger className="h-8 w-[120px] text-xs"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All months</SelectItem>
                  {months.map((m) => <SelectItem key={m} value={m}>{m}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="relative">
              <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search by investor, invest..." className="pl-8 h-8 text-xs w-[170px]" />
            </div>
            <Select value={investorFilter} onValueChange={setInvestorFilter}>
              <SelectTrigger className="h-8 w-[140px] text-xs"><SelectValue placeholder="All Investors" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Investors</SelectItem>
                {investors.map((i) => <SelectItem key={i.id} value={i.id}>{i.name}</SelectItem>)}
              </SelectContent>
            </Select>
            <div className="flex border border-border rounded-md overflow-hidden">
              <button onClick={() => setViewMode("table")} className={`p-1.5 ${viewMode === "table" ? "bg-primary/10 text-primary" : "text-muted-foreground hover:text-foreground"}`}><List size={14} /></button>
              <button onClick={() => setViewMode("grid")} className={`p-1.5 ${viewMode === "grid" ? "bg-primary/10 text-primary" : "text-muted-foreground hover:text-foreground"}`}><LayoutGrid size={14} /></button>
            </div>
            <Button variant="outline" size="sm" className="h-8 gap-1.5 text-xs"><Download size={14} /> Export</Button>
            <Button size="sm" className="h-8 gap-1.5 text-xs" onClick={openNewContrib}><Plus size={14} /> Add</Button>
          </div>
        </div>

        {viewMode === "table" ? (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/30">
                  <th className="text-left px-4 py-3 font-semibold text-foreground">Date</th>
                  <th className="text-left px-4 py-3 font-semibold text-foreground">Investment</th>
                  <th className="text-left px-4 py-3 font-semibold text-foreground">Investor</th>
                  <th className="text-left px-4 py-3 font-semibold text-foreground">Category</th>
                  <th className="text-right px-4 py-3 font-semibold text-foreground">Amount</th>
                  <th className="text-left px-4 py-3 font-semibold text-foreground">Slip</th>
                  <th className="text-left px-4 py-3 font-semibold text-foreground">Note</th>
                  <th className="text-center px-4 py-3 font-semibold text-foreground">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredContribs.length === 0 ? (
                  <tr><td colSpan={8} className="text-center py-12 text-muted-foreground">{contributions.length === 0 ? "No contributions yet." : "No results."}</td></tr>
                ) : filteredContribs.map((c) => {
                  const investor = investorMap.get(c.investor_id);
                  const investment = investmentMap.get(c.investment_id);
                  const category = c.category_id ? categoryMap.get(c.category_id) : null;
                  return (
                    <tr key={c.id} className="border-b border-border/50 hover:bg-muted/30 transition-colors">
                      <td className="px-4 py-3 text-foreground whitespace-nowrap">{c.contribution_date}</td>
                      <td className="px-4 py-3 text-foreground">{investment?.name || "Unknown"}</td>
                      <td className="px-4 py-3 text-foreground">{investor?.name || "Unknown"}</td>
                      <td className="px-4 py-3">
                        {category ? (
                          <span className="inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full" style={{ backgroundColor: `${category.color || "#6b7280"}20`, color: category.color || "#6b7280" }}>
                            {category.name}
                          </span>
                        ) : <span className="text-muted-foreground">—</span>}
                      </td>
                      <td className="px-4 py-3 text-right font-bold text-foreground">{fmt(Number(c.amount))}</td>
                      <td className="px-4 py-3">
                        {c.slip_url ? (
                          <a href={c.slip_url} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline text-xs flex items-center gap-1"><FileText size={12} /> 1</a>
                        ) : <span className="text-muted-foreground text-xs">—</span>}
                      </td>
                      <td className="px-4 py-3 text-muted-foreground max-w-[180px] truncate">{c.note || "—"}</td>
                      <td className="px-4 py-3 text-center">
                        <div className="flex items-center justify-center gap-1">
                          <button className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"><Eye size={14} /></button>
                          <button className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"><Edit2 size={14} /></button>
                          <button onClick={() => removeContrib(c.id)} className="p-1.5 rounded-lg hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors"><Trash2 size={14} /></button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {filteredContribs.length === 0 ? (
              <p className="col-span-full text-center py-12 text-muted-foreground">No contributions found.</p>
            ) : filteredContribs.map((c) => {
              const investor = investorMap.get(c.investor_id);
              const investment = investmentMap.get(c.investment_id);
              const category = c.category_id ? categoryMap.get(c.category_id) : null;
              return (
                <div key={c.id} className="bg-muted/30 rounded-xl border border-border p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs text-muted-foreground">{c.contribution_date}</span>
                    <span className="font-bold text-foreground">{fmt(Number(c.amount))}</span>
                  </div>
                  <p className="text-sm font-medium text-foreground">{investor?.name || "Unknown"}</p>
                  <p className="text-xs text-muted-foreground">{investment?.name || "Unknown"}</p>
                  {category && (
                    <span className="inline-block mt-2 text-[11px] font-medium px-2 py-0.5 rounded-full" style={{ backgroundColor: `${category.color || "#6b7280"}20`, color: category.color || "#6b7280" }}>
                      {category.name}
                    </span>
                  )}
                  {c.note && <p className="text-xs text-muted-foreground mt-2 truncate">{c.note}</p>}
                  <div className="flex justify-end mt-3 gap-1">
                    <button onClick={() => removeContrib(c.id)} className="p-1.5 rounded-lg hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors"><Trash2 size={13} /></button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ═══════ ALL DIALOGS ═══════ */}

      {/* Investor Dialog */}
      <Dialog open={investorDialog} onOpenChange={setInvestorDialog}>
        <DialogContent>
          <DialogHeader><DialogTitle>{investorEditing ? "Edit Investor" : "Add Investor"}</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div><label className="text-sm font-medium text-foreground">Name *</label><Input value={investorForm.name} onChange={(e) => setInvestorForm({ ...investorForm, name: e.target.value })} /></div>
            <div><label className="text-sm font-medium text-foreground">Email</label><Input type="email" value={investorForm.email} onChange={(e) => setInvestorForm({ ...investorForm, email: e.target.value })} /></div>
            <div><label className="text-sm font-medium text-foreground">Phone</label><Input value={investorForm.phone} onChange={(e) => setInvestorForm({ ...investorForm, phone: e.target.value })} /></div>
            <div>
              <label className="text-sm font-medium text-foreground">Avatar Color</label>
              <div className="flex gap-2 mt-1">
                {["#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6", "#ec4899"].map((c) => (
                  <button key={c} onClick={() => setInvestorForm({ ...investorForm, avatar_color: c })} className={`w-8 h-8 rounded-full border-2 transition-all ${investorForm.avatar_color === c ? "border-foreground scale-110" : "border-transparent"}`} style={{ backgroundColor: c }} />
                ))}
              </div>
            </div>
            <Button onClick={saveInvestor} className="w-full">{investorEditing ? "Update" : "Add Investor"}</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Category Dialog */}
      <Dialog open={categoryDialog} onOpenChange={setCategoryDialog}>
        <DialogContent>
          <DialogHeader><DialogTitle>{categoryEditing ? "Edit Category" : "New Category"}</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div><label className="text-sm font-medium text-foreground">Name *</label><Input value={categoryForm.name} onChange={(e) => setCategoryForm({ ...categoryForm, name: e.target.value })} /></div>
            <div>
              <label className="text-sm font-medium text-foreground">Color</label>
              <div className="flex gap-2 mt-1">
                {["#6b7280", "#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6", "#ec4899", "#14b8a6"].map((c) => (
                  <button key={c} onClick={() => setCategoryForm({ ...categoryForm, color: c })} className={`w-8 h-8 rounded-full border-2 transition-all ${categoryForm.color === c ? "border-foreground scale-110" : "border-transparent"}`} style={{ backgroundColor: c }} />
                ))}
              </div>
            </div>
            <Button onClick={saveCategory} className="w-full">{categoryEditing ? "Update" : "Create Category"}</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Investment Dialog */}
      <Dialog open={investmentDialog} onOpenChange={setInvestmentDialog}>
        <DialogContent>
          <DialogHeader><DialogTitle>{investmentEditing ? "Edit Investment" : "New Investment"}</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div><label className="text-sm font-medium text-foreground">Name *</label><Input value={investmentForm.name} onChange={(e) => setInvestmentForm({ ...investmentForm, name: e.target.value })} /></div>
            <div><label className="text-sm font-medium text-foreground">Description</label><Textarea value={investmentForm.description} onChange={(e) => setInvestmentForm({ ...investmentForm, description: e.target.value })} rows={2} /></div>
            <div><label className="text-sm font-medium text-foreground">Total Capital (BDT)</label><Input type="number" value={investmentForm.total_capital} onChange={(e) => setInvestmentForm({ ...investmentForm, total_capital: e.target.value })} /></div>
            <div>
              <label className="text-sm font-medium text-foreground">Status</label>
              <Select value={investmentForm.status} onValueChange={(v) => setInvestmentForm({ ...investmentForm, status: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="paused">Paused</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button onClick={saveInvestment} className="w-full">{investmentEditing ? "Update" : "Create"}</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Capital/Share Dialog */}
      <Dialog open={capitalDialog} onOpenChange={setCapitalDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-base">
              <Plus size={16} /> {capitalEditing ? "Edit Capital" : "Add Capital"}
            </DialogTitle>
          </DialogHeader>
          {(() => {
            const selectedInvestment = capitalForm.investment_id ? investmentMap.get(capitalForm.investment_id) : null;
            const investmentTotal = selectedInvestment ? Number(selectedInvestment.total_capital) : 0;
            const pct = Number(capitalForm.share_percent) || 0;
            // Sum of all existing share percentages for this investment (excluding current editing)
            const existingPctSum = shares
              .filter((s) => s.investment_id === capitalForm.investment_id && (!capitalEditing || s.id !== capitalEditing.id))
              .reduce((sum, s) => sum + Number(s.share_percent), 0);
            const totalPctWithCurrent = existingPctSum + pct;
            // Normalized: if total shares exceed 100%, normalize proportionally
            const normalizedPct = totalPctWithCurrent > 0 ? (pct / totalPctWithCurrent) * 100 : 0;
            const normalizedAmount = investmentTotal * (normalizedPct / 100);
            const rawAmount = investmentTotal * (pct / 100);
            const needsNormalization = totalPctWithCurrent > 100;

            return (
              <div className="space-y-5 pt-2">
                <div>
                  <label className="text-sm font-semibold text-foreground">Investment *</label>
                  <Select value={capitalForm.investment_id} onValueChange={(v) => {
                    const inv = investmentMap.get(v);
                    const invTotal = inv ? Number(inv.total_capital) : 0;
                    const p = Number(capitalForm.share_percent) || 0;
                    setCapitalForm({ ...capitalForm, investment_id: v, capital_amount: String(invTotal * (p / 100)) });
                  }}>
                    <SelectTrigger className="mt-1.5"><SelectValue placeholder="Select investment" /></SelectTrigger>
                    <SelectContent>
                      {investments.map((i) => (
                        <SelectItem key={i.id} value={i.id}>{i.name} ({fmt(Number(i.total_capital))})</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-sm font-semibold text-foreground">Investor Name *</label>
                  <Select value={capitalForm.investor_id} onValueChange={(v) => setCapitalForm({ ...capitalForm, investor_id: v })}>
                    <SelectTrigger className="mt-1.5"><SelectValue placeholder="Type name..." /></SelectTrigger>
                    <SelectContent>
                      {investors.map((i) => (
                        <SelectItem key={i.id} value={i.id}>
                          <div className="flex items-center gap-2">
                            <span className="w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-bold text-white shrink-0" style={{ backgroundColor: i.avatar_color || "#3b82f6" }}>{i.name.charAt(0).toUpperCase()}</span>
                            {i.name}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-sm font-semibold text-foreground">Capital Amount ($) *</label>
                  <Input type="number" className="mt-1.5" value={capitalForm.capital_amount} onChange={(e) => setCapitalForm({ ...capitalForm, capital_amount: e.target.value })} placeholder="0.00" />
                </div>
                <div>
                  <label className="text-sm font-semibold text-foreground">Share Percentage (%) *</label>
                  <Input type="number" className="mt-1.5" value={capitalForm.share_percent} onChange={(e) => {
                    const newPct = Number(e.target.value) || 0;
                    const autoAmount = investmentTotal * (newPct / 100);
                    setCapitalForm({ ...capitalForm, share_percent: e.target.value, capital_amount: String(autoAmount) });
                  }} placeholder="Enter share percentage" />
                  {pct > 0 && investmentTotal > 0 && (
                    <p className="text-xs text-muted-foreground mt-1.5">
                      {needsNormalization
                        ? `After normalization: ${normalizedPct.toFixed(2)}% = ${fmt(normalizedAmount)}`
                        : `${pct}% of ${fmt(investmentTotal)} = ${fmt(rawAmount)}`}
                    </p>
                  )}
                </div>
                <Button onClick={saveCapital} className="w-full">{capitalEditing ? "Update Capital" : "Add Capital"}</Button>
              </div>
            );
          })()}
        </DialogContent>
      </Dialog>

      {/* Contribution Dialog */}
      <Dialog open={contribDialog} onOpenChange={setContribDialog}>
        <DialogContent>
          <DialogHeader><DialogTitle>Record Contribution</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium text-foreground">Investment *</label>
              <Select value={contribForm.investment_id} onValueChange={(v) => setContribForm({ ...contribForm, investment_id: v })}>
                <SelectTrigger><SelectValue placeholder="Select investment" /></SelectTrigger>
                <SelectContent>{investments.map((i) => <SelectItem key={i.id} value={i.id}>{i.name}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium text-foreground">Investor *</label>
              <Select value={contribForm.investor_id} onValueChange={(v) => setContribForm({ ...contribForm, investor_id: v })}>
                <SelectTrigger><SelectValue placeholder="Select investor" /></SelectTrigger>
                <SelectContent>{investors.map((i) => <SelectItem key={i.id} value={i.id}>{i.name}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium text-foreground">Category</label>
              <Select value={contribForm.category_id} onValueChange={(v) => setContribForm({ ...contribForm, category_id: v })}>
                <SelectTrigger><SelectValue placeholder="Select category (optional)" /></SelectTrigger>
                <SelectContent>{categories.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div><label className="text-sm font-medium text-foreground">Amount (BDT) *</label><Input type="number" value={contribForm.amount} onChange={(e) => setContribForm({ ...contribForm, amount: e.target.value })} /></div>
            <div><label className="text-sm font-medium text-foreground">Date</label><Input type="date" value={contribForm.contribution_date} onChange={(e) => setContribForm({ ...contribForm, contribution_date: e.target.value })} /></div>
            <div><label className="text-sm font-medium text-foreground">Note</label><Textarea value={contribForm.note} onChange={(e) => setContribForm({ ...contribForm, note: e.target.value })} rows={2} /></div>
            <Button onClick={saveContrib} className="w-full">Record Contribution</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminInvestment;
