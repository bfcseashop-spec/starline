import React, { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import {
  TrendingUp, DollarSign, Users, FolderOpen, Plus, Trash2, Edit2, Search,
  ArrowUpRight, X, Upload, Eye, ChevronDown, PieChart, Download, LayoutGrid, List, Calendar, FileText,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import type { Tables } from "@/integrations/supabase/types";

type Investment = Tables<"investments">;
type Investor = Tables<"investors">;
type InvestmentCategory = Tables<"investment_categories">;
type Contribution = Tables<"contributions">;
type InvestmentShare = Tables<"investment_shares">;

type Tab = "investments" | "investors" | "shares" | "categories" | "transactions";

const fmt = (n: number) =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: "BDT", maximumFractionDigits: 0 }).format(n);

const AdminInvestment = () => {
  const [tab, setTab] = useState<Tab>("investments");
  const [investments, setInvestments] = useState<Investment[]>([]);
  const [investors, setInvestors] = useState<Investor[]>([]);
  const [categories, setCategories] = useState<InvestmentCategory[]>([]);
  const [contributions, setContributions] = useState<Contribution[]>([]);
  const [shares, setShares] = useState<InvestmentShare[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

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
  const totalCapital = investments.reduce((s, i) => s + Number(i.total_capital), 0);
  const totalContributed = contributions.reduce((s, c) => s + Number(c.amount), 0);
  const activeCount = investments.filter((i) => i.status === "active").length;

  const tabs: { id: Tab; label: string; icon: React.ElementType; count: number }[] = [
    { id: "investments", label: "Investments", icon: TrendingUp, count: investments.length },
    { id: "investors", label: "Investors", icon: Users, count: investors.length },
    { id: "shares", label: "Capital & Share", icon: PieChart, count: shares.length },
    { id: "categories", label: "Categories", icon: FolderOpen, count: categories.length },
    { id: "transactions", label: "Transactions", icon: DollarSign, count: contributions.length },
  ];

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <SummaryCard icon={TrendingUp} gradient="bg-dash-blue" label="Total Capital" value={fmt(totalCapital)} />
        <SummaryCard icon={DollarSign} gradient="bg-dash-green" label="Total Contributed" value={fmt(totalContributed)} trend={totalCapital > 0 ? `${Math.round((totalContributed / totalCapital) * 100)}%` : "0%"} />
        <SummaryCard icon={Users} gradient="bg-dash-purple" label="Investors" value={String(investors.length)} />
        <SummaryCard icon={TrendingUp} gradient="bg-dash-orange" label="Active Investments" value={String(activeCount)} />
      </div>

      {/* Tabs */}
      <div className="bg-card rounded-2xl border border-border shadow-sm">
        <div className="flex border-b border-border overflow-x-auto">
          {tabs.map((t) => (
            <button
              key={t.id}
              onClick={() => { setTab(t.id); setSearch(""); }}
              className={`flex items-center gap-2 px-5 py-3.5 text-sm font-semibold whitespace-nowrap border-b-2 transition-colors ${
                tab === t.id
                  ? "border-primary text-primary"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              }`}
            >
              <t.icon size={16} />
              {t.label}
              <span className="bg-muted text-muted-foreground text-[10px] font-bold px-1.5 py-0.5 rounded-full">{t.count}</span>
            </button>
          ))}
        </div>

        <div className="p-5">
          {tab === "investments" && (
            <InvestmentsTab investments={investments} shares={shares} investors={investors} contributions={contributions} search={search} setSearch={setSearch} onRefresh={fetchAll} />
          )}
          {tab === "investors" && (
            <InvestorsTab investors={investors} shares={shares} investments={investments} search={search} setSearch={setSearch} onRefresh={fetchAll} />
          )}
          {tab === "shares" && (
            <SharesTab shares={shares} investors={investors} investments={investments} contributions={contributions} categories={categories} search={search} setSearch={setSearch} onRefresh={fetchAll} />
          )}
          {tab === "categories" && (
            <CategoriesTab categories={categories} contributions={contributions} search={search} setSearch={setSearch} onRefresh={fetchAll} />
          )}
          {tab === "transactions" && (
            <TransactionsTab contributions={contributions} investors={investors} investments={investments} categories={categories} search={search} setSearch={setSearch} onRefresh={fetchAll} />
          )}
        </div>
      </div>
    </div>
  );
};

/* ── Summary Card ── */
const SummaryCard = ({ icon: Icon, gradient, label, value, trend }: { icon: React.ElementType; gradient: string; label: string; value: string; trend?: string }) => (
  <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="bg-card rounded-2xl border border-border p-5 shadow-sm">
    <div className="flex items-center justify-between mb-3">
      <div className={`p-2 rounded-xl ${gradient}`}><Icon size={18} className="text-white" /></div>
      {trend && <span className="text-emerald-500 text-xs font-bold flex items-center gap-0.5"><ArrowUpRight size={14} />{trend}</span>}
    </div>
    <p className="font-heading text-xl font-bold text-foreground">{value}</p>
    <p className="text-xs text-muted-foreground mt-1">{label}</p>
  </motion.div>
);

/* ═══════════════════════════════════════════════════════════════
   INVESTMENTS TAB
   ═══════════════════════════════════════════════════════════════ */
const InvestmentsTab = ({ investments, shares, investors, contributions, search, setSearch, onRefresh }: {
  investments: Investment[]; shares: InvestmentShare[]; investors: Investor[]; contributions: Contribution[];
  search: string; setSearch: (s: string) => void; onRefresh: () => void;
}) => {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Investment | null>(null);
  const [form, setForm] = useState({ name: "", description: "", total_capital: "", status: "active" });

  const openNew = () => { setEditing(null); setForm({ name: "", description: "", total_capital: "", status: "active" }); setDialogOpen(true); };
  const openEdit = (inv: Investment) => { setEditing(inv); setForm({ name: inv.name, description: inv.description || "", total_capital: String(inv.total_capital), status: inv.status }); setDialogOpen(true); };

  const save = async () => {
    if (!form.name.trim()) { toast.error("Name is required"); return; }
    const payload = { name: form.name, description: form.description || null, total_capital: Number(form.total_capital) || 0, status: form.status };
    if (editing) {
      const { error } = await supabase.from("investments").update(payload).eq("id", editing.id);
      if (error) { toast.error(error.message); return; }
      toast.success("Investment updated");
    } else {
      const { error } = await supabase.from("investments").insert(payload);
      if (error) { toast.error(error.message); return; }
      toast.success("Investment created");
    }
    setDialogOpen(false);
    onRefresh();
  };

  const remove = async (id: string) => {
    if (!confirm("Delete this investment?")) return;
    const { error } = await supabase.from("investments").delete().eq("id", id);
    if (error) toast.error(error.message);
    else { toast.success("Deleted"); onRefresh(); }
  };

  const filtered = investments.filter((i) => i.name.toLowerCase().includes(search.toLowerCase()));

  return (
    <>
      <div className="flex flex-col sm:flex-row gap-3 mb-4">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search investments..." className="pl-9" />
        </div>
        <Button onClick={openNew} className="gap-2"><Plus size={16} /> Add Investment</Button>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-muted/30">
              <th className="text-left px-4 py-3 font-semibold text-foreground">Name</th>
              <th className="text-left px-4 py-3 font-semibold text-foreground">Description</th>
              <th className="text-right px-4 py-3 font-semibold text-foreground">Total Capital</th>
              <th className="text-right px-4 py-3 font-semibold text-foreground">Contributed</th>
              <th className="text-center px-4 py-3 font-semibold text-foreground">Progress</th>
              <th className="text-center px-4 py-3 font-semibold text-foreground">Investors</th>
              <th className="text-center px-4 py-3 font-semibold text-foreground">Status</th>
              <th className="text-center px-4 py-3 font-semibold text-foreground">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr><td colSpan={8} className="text-center py-12 text-muted-foreground">{investments.length === 0 ? "No investments yet. Click 'Add Investment' to get started." : "No results."}</td></tr>
            ) : filtered.map((inv) => {
              const invContribs = contributions.filter((c) => c.investment_id === inv.id);
              const contributed = invContribs.reduce((s, c) => s + Number(c.amount), 0);
              const progress = Number(inv.total_capital) > 0 ? Math.round((contributed / Number(inv.total_capital)) * 100) : 0;
              const investorCount = new Set(shares.filter((s) => s.investment_id === inv.id).map((s) => s.investor_id)).size;
              return (
                <tr key={inv.id} className="border-b border-border/50 hover:bg-muted/30 transition-colors">
                  <td className="px-4 py-3 font-medium text-foreground">{inv.name}</td>
                  <td className="px-4 py-3 text-muted-foreground max-w-[200px] truncate">{inv.description || "—"}</td>
                  <td className="px-4 py-3 text-right font-medium text-foreground">{fmt(Number(inv.total_capital))}</td>
                  <td className="px-4 py-3 text-right font-medium text-emerald-600">{fmt(contributed)}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2 justify-center">
                      <Progress value={progress} className="h-2 w-16" />
                      <span className="text-xs font-medium text-muted-foreground w-8">{progress}%</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-center">{investorCount}</td>
                  <td className="px-4 py-3 text-center">
                    <span className={`inline-block text-xs font-bold px-2.5 py-1 rounded-full capitalize ${inv.status === "active" ? "bg-emerald-500/10 text-emerald-600" : inv.status === "completed" ? "bg-blue-500/10 text-blue-600" : "bg-muted text-muted-foreground"}`}>
                      {inv.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <div className="flex items-center justify-center gap-1">
                      <button onClick={() => openEdit(inv)} className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"><Edit2 size={14} /></button>
                      <button onClick={() => remove(inv.id)} className="p-1.5 rounded-lg hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors"><Trash2 size={14} /></button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>{editing ? "Edit Investment" : "New Investment"}</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div><label className="text-sm font-medium text-foreground">Name *</label><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></div>
            <div><label className="text-sm font-medium text-foreground">Description</label><Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={2} /></div>
            <div><label className="text-sm font-medium text-foreground">Total Capital (BDT)</label><Input type="number" value={form.total_capital} onChange={(e) => setForm({ ...form, total_capital: e.target.value })} /></div>
            <div>
              <label className="text-sm font-medium text-foreground">Status</label>
              <Select value={form.status} onValueChange={(v) => setForm({ ...form, status: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="paused">Paused</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button onClick={save} className="w-full">{editing ? "Update" : "Create"}</Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

/* ═══════════════════════════════════════════════════════════════
   INVESTORS TAB
   ═══════════════════════════════════════════════════════════════ */
const InvestorsTab = ({ investors, shares, investments, search, setSearch, onRefresh }: {
  investors: Investor[]; shares: InvestmentShare[]; investments: Investment[];
  search: string; setSearch: (s: string) => void; onRefresh: () => void;
}) => {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Investor | null>(null);
  const [form, setForm] = useState({ name: "", email: "", phone: "", avatar_color: "#3b82f6" });
  // Share management
  const [shareDialog, setShareDialog] = useState(false);
  const [selectedInvestor, setSelectedInvestor] = useState<Investor | null>(null);
  const [shareForm, setShareForm] = useState({ investment_id: "", share_percent: "", capital_amount: "" });

  const openNew = () => { setEditing(null); setForm({ name: "", email: "", phone: "", avatar_color: "#3b82f6" }); setDialogOpen(true); };
  const openEdit = (inv: Investor) => { setEditing(inv); setForm({ name: inv.name, email: inv.email || "", phone: inv.phone || "", avatar_color: inv.avatar_color || "#3b82f6" }); setDialogOpen(true); };

  const save = async () => {
    if (!form.name.trim()) { toast.error("Name is required"); return; }
    const payload = { name: form.name, email: form.email || null, phone: form.phone || null, avatar_color: form.avatar_color };
    if (editing) {
      const { error } = await supabase.from("investors").update(payload).eq("id", editing.id);
      if (error) { toast.error(error.message); return; }
      toast.success("Investor updated");
    } else {
      const { error } = await supabase.from("investors").insert(payload);
      if (error) { toast.error(error.message); return; }
      toast.success("Investor added");
    }
    setDialogOpen(false);
    onRefresh();
  };

  const remove = async (id: string) => {
    if (!confirm("Delete this investor?")) return;
    const { error } = await supabase.from("investors").delete().eq("id", id);
    if (error) toast.error(error.message);
    else { toast.success("Deleted"); onRefresh(); }
  };

  const openShareDialog = (inv: Investor) => {
    setSelectedInvestor(inv);
    setShareForm({ investment_id: "", share_percent: "", capital_amount: "" });
    setShareDialog(true);
  };

  const saveShare = async () => {
    if (!shareForm.investment_id || !selectedInvestor) { toast.error("Select an investment"); return; }
    const { error } = await supabase.from("investment_shares").insert({
      investor_id: selectedInvestor.id,
      investment_id: shareForm.investment_id,
      share_percent: Number(shareForm.share_percent) || 0,
      capital_amount: Number(shareForm.capital_amount) || 0,
    });
    if (error) toast.error(error.message);
    else { toast.success("Share added"); setShareDialog(false); onRefresh(); }
  };

  const filtered = investors.filter((i) => i.name.toLowerCase().includes(search.toLowerCase()) || (i.email || "").toLowerCase().includes(search.toLowerCase()));

  return (
    <>
      <div className="flex flex-col sm:flex-row gap-3 mb-4">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search investors..." className="pl-9" />
        </div>
        <Button onClick={openNew} className="gap-2"><Plus size={16} /> Add Investor</Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {filtered.length === 0 ? (
          <p className="col-span-full text-center py-12 text-muted-foreground">{investors.length === 0 ? "No investors yet." : "No results."}</p>
        ) : filtered.map((inv) => {
          const investorShares = shares.filter((s) => s.investor_id === inv.id);
          const totalCapital = investorShares.reduce((s, sh) => s + Number(sh.capital_amount), 0);
          const initials = inv.name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);
          return (
            <div key={inv.id} className="bg-muted/30 rounded-xl border border-border p-4 hover:shadow-md transition-shadow">
              <div className="flex items-start gap-3">
                <Avatar className="h-10 w-10 shrink-0">
                  <AvatarFallback style={{ backgroundColor: inv.avatar_color || "#3b82f6" }} className="text-white text-sm font-bold">{initials}</AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-foreground truncate">{inv.name}</p>
                  {inv.email && <p className="text-xs text-muted-foreground truncate">{inv.email}</p>}
                  {inv.phone && <p className="text-xs text-muted-foreground">{inv.phone}</p>}
                </div>
                <div className="flex gap-1 shrink-0">
                  <button onClick={() => openShareDialog(inv)} className="p-1.5 rounded-lg hover:bg-primary/10 text-muted-foreground hover:text-primary transition-colors" title="Add share"><Plus size={14} /></button>
                  <button onClick={() => openEdit(inv)} className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"><Edit2 size={14} /></button>
                  <button onClick={() => remove(inv.id)} className="p-1.5 rounded-lg hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors"><Trash2 size={14} /></button>
                </div>
              </div>
              <div className="mt-3 pt-3 border-t border-border flex items-center justify-between">
                <span className="text-xs text-muted-foreground">{investorShares.length} investment(s)</span>
                <span className="text-sm font-bold text-foreground">{fmt(totalCapital)}</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Investor Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>{editing ? "Edit Investor" : "New Investor"}</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div><label className="text-sm font-medium text-foreground">Name *</label><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></div>
            <div><label className="text-sm font-medium text-foreground">Email</label><Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /></div>
            <div><label className="text-sm font-medium text-foreground">Phone</label><Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} /></div>
            <div>
              <label className="text-sm font-medium text-foreground">Avatar Color</label>
              <div className="flex gap-2 mt-1">
                {["#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6", "#ec4899"].map((c) => (
                  <button key={c} onClick={() => setForm({ ...form, avatar_color: c })} className={`w-8 h-8 rounded-full border-2 transition-all ${form.avatar_color === c ? "border-foreground scale-110" : "border-transparent"}`} style={{ backgroundColor: c }} />
                ))}
              </div>
            </div>
            <Button onClick={save} className="w-full">{editing ? "Update" : "Add Investor"}</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Share Dialog */}
      <Dialog open={shareDialog} onOpenChange={setShareDialog}>
        <DialogContent>
          <DialogHeader><DialogTitle>Add Share for {selectedInvestor?.name}</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium text-foreground">Investment *</label>
              <Select value={shareForm.investment_id} onValueChange={(v) => setShareForm({ ...shareForm, investment_id: v })}>
                <SelectTrigger><SelectValue placeholder="Select investment" /></SelectTrigger>
                <SelectContent>
                  {investments.map((i) => <SelectItem key={i.id} value={i.id}>{i.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div><label className="text-sm font-medium text-foreground">Share %</label><Input type="number" value={shareForm.share_percent} onChange={(e) => setShareForm({ ...shareForm, share_percent: e.target.value })} /></div>
            <div><label className="text-sm font-medium text-foreground">Capital Amount (BDT)</label><Input type="number" value={shareForm.capital_amount} onChange={(e) => setShareForm({ ...shareForm, capital_amount: e.target.value })} /></div>
            <Button onClick={saveShare} className="w-full">Add Share</Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

/* ═══════════════════════════════════════════════════════════════
   CAPITAL & SHARE TAB
   ═══════════════════════════════════════════════════════════════ */
const SharesTab = ({ shares, investors, investments, contributions, categories, search, setSearch, onRefresh }: {
  shares: InvestmentShare[]; investors: Investor[]; investments: Investment[]; contributions: Contribution[]; categories: InvestmentCategory[];
  search: string; setSearch: (s: string) => void; onRefresh: () => void;
}) => {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<InvestmentShare | null>(null);
  const [form, setForm] = useState({ investment_id: "", investor_id: "", share_percent: "", capital_amount: "" });
  // Contribution dialog
  const [contribDialog, setContribDialog] = useState(false);
  const [contribForm, setContribForm] = useState({ investment_id: "", investor_id: "", category_id: "", amount: "", contribution_date: new Date().toISOString().split("T")[0], note: "" });
  // Filters
  const [monthFilter, setMonthFilter] = useState("all");
  const [investorFilter, setInvestorFilter] = useState("all");
  const [viewMode, setViewMode] = useState<"table" | "grid">("table");

  const investorMap = new Map(investors.map((i) => [i.id, i]));
  const investmentMap = new Map(investments.map((i) => [i.id, i]));
  const categoryMap = new Map(categories.map((c) => [c.id, c]));

  const openNew = () => { setEditing(null); setForm({ investment_id: "", investor_id: "", share_percent: "", capital_amount: "" }); setDialogOpen(true); };
  const openEdit = (s: InvestmentShare) => {
    setEditing(s);
    setForm({ investment_id: s.investment_id, investor_id: s.investor_id, share_percent: String(s.share_percent), capital_amount: String(s.capital_amount) });
    setDialogOpen(true);
  };

  const save = async () => {
    if (!form.investment_id || !form.investor_id) { toast.error("Investment and Investor are required"); return; }
    const payload = {
      investment_id: form.investment_id,
      investor_id: form.investor_id,
      share_percent: Number(form.share_percent) || 0,
      capital_amount: Number(form.capital_amount) || 0,
    };
    if (editing) {
      const { error } = await supabase.from("investment_shares").update(payload).eq("id", editing.id);
      if (error) { toast.error(error.message); return; }
      toast.success("Share updated");
    } else {
      const { error } = await supabase.from("investment_shares").insert(payload);
      if (error) { toast.error(error.message); return; }
      toast.success("Share added");
    }
    setDialogOpen(false);
    onRefresh();
  };

  const remove = async (id: string) => {
    if (!confirm("Delete this share?")) return;
    const { error } = await supabase.from("investment_shares").delete().eq("id", id);
    if (error) toast.error(error.message);
    else { toast.success("Deleted"); onRefresh(); }
  };

  // Contribution CRUD
  const openNewContrib = () => {
    setContribForm({ investment_id: "", investor_id: "", category_id: "", amount: "", contribution_date: new Date().toISOString().split("T")[0], note: "" });
    setContribDialog(true);
  };
  const saveContrib = async () => {
    if (!contribForm.investment_id || !contribForm.investor_id) { toast.error("Investment and Investor are required"); return; }
    const { error } = await supabase.from("contributions").insert({
      investment_id: contribForm.investment_id,
      investor_id: contribForm.investor_id,
      category_id: contribForm.category_id || null,
      amount: Number(contribForm.amount) || 0,
      contribution_date: contribForm.contribution_date,
      note: contribForm.note || null,
    });
    if (error) toast.error(error.message);
    else { toast.success("Transaction recorded"); setContribDialog(false); onRefresh(); }
  };
  const removeContrib = async (id: string) => {
    if (!confirm("Delete this transaction?")) return;
    const { error } = await supabase.from("contributions").delete().eq("id", id);
    if (error) toast.error(error.message);
    else { toast.success("Deleted"); onRefresh(); }
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

  // Get unique months from contributions
  const months = [...new Set(contributions.map((c) => c.contribution_date.slice(0, 7)))].sort().reverse();

  return (
    <>
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <div>
          <h3 className="text-lg font-bold text-foreground uppercase tracking-wide">Capital & Share</h3>
          <p className="text-sm text-muted-foreground">Investor shares per investment — create, edit, or remove below</p>
        </div>
        <Button onClick={openNew} className="gap-2"><Plus size={16} /> Add Capital</Button>
      </div>

      {/* Investor Share Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-8">
        {shares.length === 0 ? (
          <p className="col-span-full text-center py-12 text-muted-foreground">No shares assigned yet. Click "Add Capital" to get started.</p>
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
              {/* Top row: Avatar, name, share badge, investment, status, actions */}
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
                  <button onClick={() => openEdit(s)} className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"><Edit2 size={15} /></button>
                  <button onClick={() => remove(s.id)} className="p-1.5 rounded-lg hover:bg-destructive/10 text-destructive/70 hover:text-destructive transition-colors"><Trash2 size={15} /></button>
                </div>
              </div>

              {/* Progress bar */}
              <div className="mb-4">
                <div className="flex items-center justify-between text-xs mb-1.5">
                  <span className="text-muted-foreground font-medium">Payment Progress</span>
                  <span className="font-bold text-foreground">{progress}%</span>
                </div>
                <div className="w-full h-2.5 bg-muted rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{
                      width: `${progress}%`,
                      background: progress >= 90 ? "hsl(var(--chart-2))" : "hsl(var(--primary))",
                    }}
                  />
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

      {/* ── Contributions Section ── */}
      <div className="border-t border-border pt-6">
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 mb-4">
          <div className="flex items-center gap-2">
            <FileText size={18} className="text-foreground" />
            <div>
              <h4 className="font-bold text-foreground">Contributions</h4>
              <p className="text-xs text-muted-foreground">Payment history for all investments</p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {/* Month filter */}
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
            {/* Search */}
            <div className="relative">
              <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search by investor, invest..." className="pl-8 h-8 text-xs w-[170px]" />
            </div>
            {/* Investor filter */}
            <Select value={investorFilter} onValueChange={setInvestorFilter}>
              <SelectTrigger className="h-8 w-[140px] text-xs"><SelectValue placeholder="All Investors" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Investors</SelectItem>
                {investors.map((i) => <SelectItem key={i.id} value={i.id}>{i.name}</SelectItem>)}
              </SelectContent>
            </Select>
            {/* View toggles */}
            <div className="flex border border-border rounded-md overflow-hidden">
              <button onClick={() => setViewMode("table")} className={`p-1.5 ${viewMode === "table" ? "bg-primary/10 text-primary" : "text-muted-foreground hover:text-foreground"}`}><List size={14} /></button>
              <button onClick={() => setViewMode("grid")} className={`p-1.5 ${viewMode === "grid" ? "bg-primary/10 text-primary" : "text-muted-foreground hover:text-foreground"}`}><LayoutGrid size={14} /></button>
            </div>
            {/* Export */}
            <Button variant="outline" size="sm" className="h-8 gap-1.5 text-xs"><Download size={14} /> Export</Button>
            {/* Add */}
            <Button size="sm" className="h-8 gap-1.5 text-xs" onClick={openNewContrib}><Plus size={14} /> Add</Button>
          </div>
        </div>

        {/* Contributions Table */}
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

      {/* Share Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-base">
              <Plus size={16} /> {editing ? "Edit Capital" : "Add Capital"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-5 pt-2">
            <div>
              <label className="text-sm font-semibold text-foreground">Investment *</label>
              <Select value={form.investment_id} onValueChange={(v) => setForm({ ...form, investment_id: v })}>
                <SelectTrigger className="mt-1.5">
                  <SelectValue placeholder="Select investment" />
                </SelectTrigger>
                <SelectContent>
                  {investments.map((i) => (
                    <SelectItem key={i.id} value={i.id}>
                      {i.name} ({fmt(Number(i.total_capital))})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-semibold text-foreground">Investor Name *</label>
              <Select value={form.investor_id} onValueChange={(v) => setForm({ ...form, investor_id: v })}>
                <SelectTrigger className="mt-1.5">
                  <SelectValue placeholder="Type name..." />
                </SelectTrigger>
                <SelectContent>
                  {investors.map((i) => (
                    <SelectItem key={i.id} value={i.id}>
                      <div className="flex items-center gap-2">
                        <span className="w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-bold text-white shrink-0" style={{ backgroundColor: i.avatar_color || "#3b82f6" }}>
                          {i.name.charAt(0).toUpperCase()}
                        </span>
                        {i.name}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {form.investor_id && (
                <Input
                  className="mt-2"
                  value={investorMap.get(form.investor_id)?.name || ""}
                  placeholder="Enter investor name"
                  readOnly
                />
              )}
            </div>
            <div>
              <label className="text-sm font-semibold text-foreground">Capital Amount (BDT) *</label>
              <Input
                type="number"
                className="mt-1.5"
                value={form.capital_amount}
                onChange={(e) => setForm({ ...form, capital_amount: e.target.value })}
                placeholder="Enter capital amount"
              />
            </div>
            <div>
              <label className="text-sm font-semibold text-foreground">Share Percentage (%) *</label>
              <Input
                type="number"
                className="mt-1.5"
                value={form.share_percent}
                onChange={(e) => setForm({ ...form, share_percent: e.target.value })}
                placeholder="Enter share percentage"
              />
            </div>
            <Button onClick={save} className="w-full">{editing ? "Update Capital" : "Add Capital"}</Button>
          </div>
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
    </>
  );
};

/* ═══════════════════════════════════════════════════════════════
   CATEGORIES TAB
   ═══════════════════════════════════════════════════════════════ */
const CategoriesTab = ({ categories, contributions, search, setSearch, onRefresh }: {
  categories: InvestmentCategory[]; contributions: Contribution[];
  search: string; setSearch: (s: string) => void; onRefresh: () => void;
}) => {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<InvestmentCategory | null>(null);
  const [form, setForm] = useState({ name: "", color: "#6b7280" });

  const openNew = () => { setEditing(null); setForm({ name: "", color: "#6b7280" }); setDialogOpen(true); };
  const openEdit = (cat: InvestmentCategory) => { setEditing(cat); setForm({ name: cat.name, color: cat.color || "#6b7280" }); setDialogOpen(true); };

  const save = async () => {
    if (!form.name.trim()) { toast.error("Name is required"); return; }
    if (editing) {
      const { error } = await supabase.from("investment_categories").update({ name: form.name, color: form.color }).eq("id", editing.id);
      if (error) { toast.error(error.message); return; }
      toast.success("Category updated");
    } else {
      const { error } = await supabase.from("investment_categories").insert({ name: form.name, color: form.color });
      if (error) { toast.error(error.message); return; }
      toast.success("Category created");
    }
    setDialogOpen(false);
    onRefresh();
  };

  const remove = async (id: string) => {
    if (!confirm("Delete this category?")) return;
    const { error } = await supabase.from("investment_categories").delete().eq("id", id);
    if (error) toast.error(error.message);
    else { toast.success("Deleted"); onRefresh(); }
  };

  const filtered = categories.filter((c) => c.name.toLowerCase().includes(search.toLowerCase()));

  return (
    <>
      <div className="flex flex-col sm:flex-row gap-3 mb-4">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search categories..." className="pl-9" />
        </div>
        <Button onClick={openNew} className="gap-2"><Plus size={16} /> Add Category</Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.length === 0 ? (
          <p className="col-span-full text-center py-12 text-muted-foreground">{categories.length === 0 ? "No categories yet." : "No results."}</p>
        ) : filtered.map((cat) => {
          const catContribs = contributions.filter((c) => c.category_id === cat.id);
          const total = catContribs.reduce((s, c) => s + Number(c.amount), 0);
          return (
            <div key={cat.id} className="bg-muted/30 rounded-xl border border-border p-4 hover:shadow-md transition-shadow">
              <div className="flex items-center gap-3">
                <div className="w-4 h-4 rounded-full shrink-0" style={{ backgroundColor: cat.color || "#6b7280" }} />
                <span className="font-semibold text-foreground flex-1">{cat.name}</span>
                <button onClick={() => openEdit(cat)} className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"><Edit2 size={14} /></button>
                <button onClick={() => remove(cat.id)} className="p-1.5 rounded-lg hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors"><Trash2 size={14} /></button>
              </div>
              <div className="mt-3 pt-3 border-t border-border flex justify-between text-xs">
                <span className="text-muted-foreground">{catContribs.length} transaction(s)</span>
                <span className="font-bold text-foreground">{fmt(total)}</span>
              </div>
            </div>
          );
        })}
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>{editing ? "Edit Category" : "New Category"}</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div><label className="text-sm font-medium text-foreground">Name *</label><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></div>
            <div>
              <label className="text-sm font-medium text-foreground">Color</label>
              <div className="flex gap-2 mt-1">
                {["#6b7280", "#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6", "#ec4899", "#14b8a6"].map((c) => (
                  <button key={c} onClick={() => setForm({ ...form, color: c })} className={`w-8 h-8 rounded-full border-2 transition-all ${form.color === c ? "border-foreground scale-110" : "border-transparent"}`} style={{ backgroundColor: c }} />
                ))}
              </div>
            </div>
            <Button onClick={save} className="w-full">{editing ? "Update" : "Create Category"}</Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

/* ═══════════════════════════════════════════════════════════════
   TRANSACTIONS TAB
   ═══════════════════════════════════════════════════════════════ */
const TransactionsTab = ({ contributions, investors, investments, categories, search, setSearch, onRefresh }: {
  contributions: Contribution[]; investors: Investor[]; investments: Investment[]; categories: InvestmentCategory[];
  search: string; setSearch: (s: string) => void; onRefresh: () => void;
}) => {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState({ investment_id: "", investor_id: "", category_id: "", amount: "", contribution_date: new Date().toISOString().split("T")[0], note: "" });

  const investorMap = new Map(investors.map((i) => [i.id, i]));
  const investmentMap = new Map(investments.map((i) => [i.id, i]));
  const categoryMap = new Map(categories.map((c) => [c.id, c]));

  const openNew = () => { setForm({ investment_id: "", investor_id: "", category_id: "", amount: "", contribution_date: new Date().toISOString().split("T")[0], note: "" }); setDialogOpen(true); };

  const save = async () => {
    if (!form.investment_id || !form.investor_id) { toast.error("Investment and Investor are required"); return; }
    const { error } = await supabase.from("contributions").insert({
      investment_id: form.investment_id,
      investor_id: form.investor_id,
      category_id: form.category_id || null,
      amount: Number(form.amount) || 0,
      contribution_date: form.contribution_date,
      note: form.note || null,
    });
    if (error) toast.error(error.message);
    else { toast.success("Transaction recorded"); setDialogOpen(false); onRefresh(); }
  };

  const remove = async (id: string) => {
    if (!confirm("Delete this transaction?")) return;
    const { error } = await supabase.from("contributions").delete().eq("id", id);
    if (error) toast.error(error.message);
    else { toast.success("Deleted"); onRefresh(); }
  };

  const filtered = contributions.filter((c) => {
    const investor = investorMap.get(c.investor_id);
    const investment = investmentMap.get(c.investment_id);
    const q = search.toLowerCase();
    return (investor?.name || "").toLowerCase().includes(q) || (investment?.name || "").toLowerCase().includes(q) || (c.note || "").toLowerCase().includes(q);
  });

  return (
    <>
      <div className="flex flex-col sm:flex-row gap-3 mb-4">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search transactions..." className="pl-9" />
        </div>
        <Button onClick={openNew} className="gap-2"><Plus size={16} /> Record Transaction</Button>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-muted/30">
              <th className="text-left px-4 py-3 font-semibold text-foreground">Date</th>
              <th className="text-left px-4 py-3 font-semibold text-foreground">Investor</th>
              <th className="text-left px-4 py-3 font-semibold text-foreground">Investment</th>
              <th className="text-left px-4 py-3 font-semibold text-foreground">Category</th>
              <th className="text-right px-4 py-3 font-semibold text-foreground">Amount</th>
              <th className="text-left px-4 py-3 font-semibold text-foreground">Note</th>
              <th className="text-center px-4 py-3 font-semibold text-foreground">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr><td colSpan={7} className="text-center py-12 text-muted-foreground">{contributions.length === 0 ? "No transactions yet." : "No results."}</td></tr>
            ) : filtered.map((c) => {
              const investor = investorMap.get(c.investor_id);
              const investment = investmentMap.get(c.investment_id);
              const category = c.category_id ? categoryMap.get(c.category_id) : null;
              return (
                <tr key={c.id} className="border-b border-border/50 hover:bg-muted/30 transition-colors">
                  <td className="px-4 py-3 text-foreground whitespace-nowrap">{new Date(c.contribution_date).toLocaleDateString()}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <Avatar className="h-6 w-6">
                        <AvatarFallback style={{ backgroundColor: investor?.avatar_color || "#3b82f6" }} className="text-white text-[10px] font-bold">
                          {investor?.name?.slice(0, 2).toUpperCase() || "?"}
                        </AvatarFallback>
                      </Avatar>
                      <span className="text-foreground">{investor?.name || "Unknown"}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-foreground">{investment?.name || "Unknown"}</td>
                  <td className="px-4 py-3">
                    {category ? (
                      <span className="inline-flex items-center gap-1.5 text-xs">
                        <span className="w-2 h-2 rounded-full" style={{ backgroundColor: category.color || "#6b7280" }} />
                        {category.name}
                      </span>
                    ) : <span className="text-muted-foreground">—</span>}
                  </td>
                  <td className="px-4 py-3 text-right font-bold text-emerald-600">{fmt(Number(c.amount))}</td>
                  <td className="px-4 py-3 text-muted-foreground max-w-[150px] truncate">{c.note || "—"}</td>
                  <td className="px-4 py-3 text-center">
                    <button onClick={() => remove(c.id)} className="p-1.5 rounded-lg hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors"><Trash2 size={14} /></button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Record Transaction</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium text-foreground">Investment *</label>
              <Select value={form.investment_id} onValueChange={(v) => setForm({ ...form, investment_id: v })}>
                <SelectTrigger><SelectValue placeholder="Select investment" /></SelectTrigger>
                <SelectContent>{investments.map((i) => <SelectItem key={i.id} value={i.id}>{i.name}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium text-foreground">Investor *</label>
              <Select value={form.investor_id} onValueChange={(v) => setForm({ ...form, investor_id: v })}>
                <SelectTrigger><SelectValue placeholder="Select investor" /></SelectTrigger>
                <SelectContent>{investors.map((i) => <SelectItem key={i.id} value={i.id}>{i.name}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium text-foreground">Category</label>
              <Select value={form.category_id} onValueChange={(v) => setForm({ ...form, category_id: v })}>
                <SelectTrigger><SelectValue placeholder="Select category (optional)" /></SelectTrigger>
                <SelectContent>{categories.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div><label className="text-sm font-medium text-foreground">Amount (BDT) *</label><Input type="number" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} /></div>
            <div><label className="text-sm font-medium text-foreground">Date</label><Input type="date" value={form.contribution_date} onChange={(e) => setForm({ ...form, contribution_date: e.target.value })} /></div>
            <div><label className="text-sm font-medium text-foreground">Note</label><Textarea value={form.note} onChange={(e) => setForm({ ...form, note: e.target.value })} rows={2} /></div>
            <Button onClick={save} className="w-full">Record Transaction</Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default AdminInvestment;
