import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import {
  Users, Phone, MapPin, Loader2, Search, LayoutGrid, LayoutList,
  Eye, Pencil, Trash2, X, Save, Plus, DollarSign, ChevronDown, HardHat,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface ViewProject {
  id: string;
  project_name: string;
  total_amount: number;
  paid_amount: number;
  monthly_installment: number;
  status: string;
}

interface Customer {
  user_id: string;
  full_name: string | null;
  phone: string | null;
  address: string | null;
  avatar_url: string | null;
  project_count: number;
  total_amount: number;
  paid_amount: number;
}

type ViewMode = "list" | "grid";
type FilterStatus = "all" | "with_due" | "fully_paid" | "no_projects";

const filterLabels: Record<FilterStatus, string> = {
  all: "All Customers",
  with_due: "Has Due Amount",
  fully_paid: "Fully Paid",
  no_projects: "No Projects",
};

const avatarColors = [
  "bg-dash-blue", "bg-dash-green", "bg-dash-orange", "bg-dash-purple", "bg-dash-pink", "bg-dash-teal",
];

const AdminCustomers = () => {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<ViewMode>("list");
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<FilterStatus>("all");
  const [showFilterMenu, setShowFilterMenu] = useState(false);

  // Modals
  const [viewCustomer, setViewCustomer] = useState<Customer | null>(null);
  const [editCustomer, setEditCustomer] = useState<Customer | null>(null);
  const [editForm, setEditForm] = useState({ full_name: "", phone: "", address: "" });
  const [saving, setSaving] = useState(false);

  // Add amount modal
  const [amountCustomer, setAmountCustomer] = useState<Customer | null>(null);
  const [amountForm, setAmountForm] = useState({ project_id: "", amount: "" });
  const [customerProjects, setCustomerProjects] = useState<{ id: string; project_name: string }[]>([]);

  const fetchCustomers = async () => {
    const [profilesRes, rolesRes, projectsRes] = await Promise.all([
      supabase.from("profiles").select("user_id, full_name, phone, address, avatar_url"),
      supabase.from("user_roles").select("user_id, role").eq("role", "customer"),
      supabase.from("customer_projects").select("user_id, total_amount, paid_amount"),
    ]);

    const customerIds = new Set((rolesRes.data || []).map((r) => r.user_id));
    const projectMap: Record<string, { count: number; total: number; paid: number }> = {};
    (projectsRes.data || []).forEach((p) => {
      if (!projectMap[p.user_id]) projectMap[p.user_id] = { count: 0, total: 0, paid: 0 };
      projectMap[p.user_id].count++;
      projectMap[p.user_id].total += Number(p.total_amount);
      projectMap[p.user_id].paid += Number(p.paid_amount);
    });

    const list: Customer[] = (profilesRes.data || [])
      .filter((p) => customerIds.has(p.user_id))
      .map((p) => ({
        ...p,
        project_count: projectMap[p.user_id]?.count || 0,
        total_amount: projectMap[p.user_id]?.total || 0,
        paid_amount: projectMap[p.user_id]?.paid || 0,
      }));

    setCustomers(list);
    setLoading(false);
  };

  useEffect(() => { fetchCustomers(); }, []);

  const formatCurrency = (n: number) => `৳${n.toLocaleString()}`;

  const filtered = customers.filter((c) => {
    const q = search.toLowerCase();
    const matchesSearch = !q || (c.full_name || "").toLowerCase().includes(q) || (c.phone || "").includes(q) || (c.address || "").toLowerCase().includes(q);
    if (!matchesSearch) return false;
    const due = (c.total_amount || 0) - (c.paid_amount || 0);
    if (filter === "with_due") return due > 0;
    if (filter === "fully_paid") return c.project_count > 0 && due <= 0;
    if (filter === "no_projects") return c.project_count === 0;
    return true;
  });

  // Edit handlers
  const openEdit = (c: Customer) => {
    setEditForm({ full_name: c.full_name || "", phone: c.phone || "", address: c.address || "" });
    setEditCustomer(c);
  };

  const handleEditSave = async () => {
    if (!editCustomer) return;
    setSaving(true);
    const { error } = await supabase.from("profiles").update({
      full_name: editForm.full_name.trim() || null,
      phone: editForm.phone.trim() || null,
      address: editForm.address.trim() || null,
    }).eq("user_id", editCustomer.user_id);
    setSaving(false);
    if (error) { toast.error(error.message); return; }
    toast.success("Customer updated!");
    setEditCustomer(null);
    fetchCustomers();
  };

  // Delete handler
  const handleDelete = async (c: Customer) => {
    if (!confirm(`Remove customer "${c.full_name || "Unnamed"}" profile? This won't delete their account.`)) return;
    const { error } = await supabase.from("profiles").delete().eq("user_id", c.user_id);
    if (error) { toast.error(error.message); return; }
    toast.success("Profile removed");
    fetchCustomers();
  };

  // Add amount
  const openAddAmount = async (c: Customer) => {
    setAmountCustomer(c);
    setAmountForm({ project_id: "", amount: "" });
    const { data } = await supabase.from("customer_projects").select("id, project_name").eq("user_id", c.user_id);
    setCustomerProjects(data || []);
  };

  const handleAddAmount = async () => {
    if (!amountCustomer || !amountForm.project_id || !amountForm.amount) { toast.error("Select project and enter amount"); return; }
    setSaving(true);
    const { error } = await supabase.from("payments").insert({
      user_id: amountCustomer.user_id,
      project_id: amountForm.project_id,
      amount: Number(amountForm.amount),
      payment_method: "cash",
      status: "completed",
    });
    if (error) { setSaving(false); toast.error(error.message); return; }
    // Update paid_amount on project
    const proj = customerProjects.find((p) => p.id === amountForm.project_id);
    if (proj) {
      const { data: current } = await supabase.from("customer_projects").select("paid_amount").eq("id", amountForm.project_id).single();
      if (current) {
        await supabase.from("customer_projects").update({ paid_amount: Number(current.paid_amount) + Number(amountForm.amount) }).eq("id", amountForm.project_id);
      }
    }
    setSaving(false);
    toast.success("Payment recorded!");
    setAmountCustomer(null);
    fetchCustomers();
  };

  const getAvatarColor = (idx: number) => avatarColors[idx % avatarColors.length];
  const inputClass = "w-full bg-muted text-foreground rounded-xl px-4 py-3 text-sm outline-none border border-border focus:ring-2 focus:ring-ring transition-shadow";

  if (loading) return <div className="flex justify-center py-20"><Loader2 className="animate-spin text-gold" size={32} /></div>;

  return (
    <div>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-3">
          <h2 className="font-heading text-2xl font-bold text-foreground">Customers</h2>
          <span className="bg-dash-purple text-white text-xs font-bold px-3 py-1.5 rounded-full">{filtered.length}</span>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => setView("list")} className={`p-2 rounded-lg transition-colors ${view === "list" ? "bg-dash-blue text-white" : "bg-muted text-muted-foreground hover:text-foreground"}`}>
            <LayoutList size={18} />
          </button>
          <button onClick={() => setView("grid")} className={`p-2 rounded-lg transition-colors ${view === "grid" ? "bg-dash-blue text-white" : "bg-muted text-muted-foreground hover:text-foreground"}`}>
            <LayoutGrid size={18} />
          </button>
        </div>
      </div>

      {/* Search & Filter Bar */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="flex-1 relative">
          <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name, phone, or address..."
            className="w-full bg-card text-foreground rounded-xl pl-11 pr-4 py-3 text-sm outline-none border border-border focus:ring-2 focus:ring-ring transition-shadow"
          />
        </div>
        <div className="relative">
          <button
            onClick={() => setShowFilterMenu(!showFilterMenu)}
            className="bg-card border border-border rounded-xl px-4 py-3 text-sm font-medium text-foreground flex items-center gap-2 hover:bg-muted transition-colors min-w-[160px]"
          >
            <span className={`w-2 h-2 rounded-full ${filter === "all" ? "bg-dash-blue" : filter === "with_due" ? "bg-destructive" : filter === "fully_paid" ? "bg-dash-green" : "bg-dash-orange"}`} />
            {filterLabels[filter]}
            <ChevronDown size={14} className="ml-auto" />
          </button>
          {showFilterMenu && (
            <div className="absolute right-0 top-full mt-1 bg-card border border-border rounded-xl shadow-xl z-30 overflow-hidden min-w-[180px]">
              {(Object.keys(filterLabels) as FilterStatus[]).map((f) => (
                <button
                  key={f}
                  onClick={() => { setFilter(f); setShowFilterMenu(false); }}
                  className={`w-full text-left px-4 py-2.5 text-sm hover:bg-muted transition-colors ${filter === f ? "bg-muted font-semibold text-foreground" : "text-muted-foreground"}`}
                >
                  {filterLabels[f]}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        {[
          { label: "Total Customers", value: customers.length, color: "bg-dash-blue", icon: <Users size={16} /> },
          { label: "Total Amount", value: formatCurrency(customers.reduce((s, c) => s + c.total_amount, 0)), color: "bg-dash-orange", icon: <DollarSign size={16} /> },
          { label: "Total Paid", value: formatCurrency(customers.reduce((s, c) => s + c.paid_amount, 0)), color: "bg-dash-green", icon: <DollarSign size={16} /> },
          { label: "Total Due", value: formatCurrency(customers.reduce((s, c) => s + (c.total_amount - c.paid_amount), 0)), color: "bg-dash-pink", icon: <DollarSign size={16} /> },
        ].map((stat, i) => (
          <motion.div key={i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
            className={`${stat.color} rounded-2xl p-4 text-white shadow-lg`}>
            <div className="flex items-center gap-2 text-white/70 text-xs font-medium mb-1">{stat.icon} {stat.label}</div>
            <p className="font-heading text-xl font-bold">{stat.value}</p>
          </motion.div>
        ))}
      </div>

      {/* LIST VIEW */}
      {view === "list" && (
        <div className="space-y-3">
          {filtered.map((c, idx) => {
            const due = (c.total_amount || 0) - (c.paid_amount || 0);
            const paidPercent = c.total_amount > 0 ? Math.round((c.paid_amount / c.total_amount) * 100) : 0;
            return (
              <motion.div
                key={c.user_id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.03 }}
                className="bg-card rounded-2xl border border-border p-5 shadow-sm hover:shadow-md transition-shadow"
              >
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                  <div className="flex items-center gap-4 flex-1 min-w-0">
                    <div className={`w-12 h-12 rounded-xl ${getAvatarColor(idx)} flex items-center justify-center text-white font-bold text-lg shrink-0`}>
                      {(c.full_name || "?")[0].toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <h3 className="font-semibold text-foreground text-base truncate">{c.full_name || "Unnamed"}</h3>
                      <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground mt-1">
                        {c.phone && <span className="flex items-center gap-1"><Phone size={12} /> {c.phone}</span>}
                        {c.address && <span className="flex items-center gap-1 truncate max-w-[200px]"><MapPin size={12} /> {c.address}</span>}
                        <span className="bg-muted px-2 py-0.5 rounded-full font-medium">{c.project_count} project{c.project_count !== 1 ? "s" : ""}</span>
                      </div>
                    </div>
                  </div>

                  {/* Financial info */}
                  <div className="flex items-center gap-3 text-sm">
                    <div className="text-center px-3">
                      <p className="text-muted-foreground text-[10px] uppercase tracking-wider">Total</p>
                      <p className="font-bold text-foreground">{formatCurrency(c.total_amount)}</p>
                    </div>
                    <div className="text-center px-3 border-l border-border">
                      <p className="text-muted-foreground text-[10px] uppercase tracking-wider">Paid</p>
                      <p className="font-bold text-dash-green">{formatCurrency(c.paid_amount)}</p>
                    </div>
                    <div className="text-center px-3 border-l border-border">
                      <p className="text-muted-foreground text-[10px] uppercase tracking-wider">Due</p>
                      <p className={`font-bold ${due > 0 ? "text-destructive" : "text-dash-green"}`}>{formatCurrency(due)}</p>
                    </div>
                    {c.total_amount > 0 && (
                      <div className="w-16 border-l border-border pl-3">
                        <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
                          <div className="h-full bg-dash-green rounded-full transition-all" style={{ width: `${paidPercent}%` }} />
                        </div>
                        <p className="text-[10px] text-muted-foreground text-center mt-0.5">{paidPercent}%</p>
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-1.5 shrink-0">
                    <button onClick={() => setViewCustomer(c)} title="View" className="p-2 rounded-lg bg-dash-blue/10 text-dash-blue hover:bg-dash-blue/20 transition-colors"><Eye size={15} /></button>
                    <button onClick={() => openEdit(c)} title="Edit" className="p-2 rounded-lg bg-dash-orange/10 text-dash-orange hover:bg-dash-orange/20 transition-colors"><Pencil size={15} /></button>
                    <button onClick={() => openAddAmount(c)} title="Add Payment" className="p-2 rounded-lg bg-dash-green/10 text-dash-green hover:bg-dash-green/20 transition-colors"><Plus size={15} /></button>
                    <button onClick={() => handleDelete(c)} title="Delete" className="p-2 rounded-lg bg-destructive/10 text-destructive hover:bg-destructive/20 transition-colors"><Trash2 size={15} /></button>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* GRID VIEW */}
      {view === "grid" && (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
          {filtered.map((c, idx) => {
            const due = (c.total_amount || 0) - (c.paid_amount || 0);
            const paidPercent = c.total_amount > 0 ? Math.round((c.paid_amount / c.total_amount) * 100) : 0;
            return (
              <motion.div
                key={c.user_id}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: idx * 0.04 }}
                className="bg-card rounded-2xl border border-border shadow-sm hover:shadow-lg transition-all overflow-hidden"
              >
                {/* Colored header strip */}
                <div className={`${getAvatarColor(idx)} h-2`} />
                <div className="p-5">
                  <div className="flex items-center gap-3 mb-4">
                    <div className={`w-14 h-14 rounded-xl ${getAvatarColor(idx)} flex items-center justify-center text-white font-bold text-xl shrink-0 shadow-lg`}>
                      {(c.full_name || "?")[0].toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <h3 className="font-semibold text-foreground text-base truncate">{c.full_name || "Unnamed"}</h3>
                      <p className="text-xs text-muted-foreground truncate">{c.phone || "No phone"}</p>
                      {c.address && <p className="text-xs text-muted-foreground truncate mt-0.5"><MapPin size={10} className="inline mr-1" />{c.address}</p>}
                    </div>
                  </div>

                  {/* Stats grid */}
                  <div className="grid grid-cols-3 gap-2 mb-4">
                    <div className="bg-muted/50 rounded-xl p-2.5 text-center">
                      <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Total</p>
                      <p className="font-bold text-foreground text-sm">{formatCurrency(c.total_amount)}</p>
                    </div>
                    <div className="bg-muted/50 rounded-xl p-2.5 text-center">
                      <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Paid</p>
                      <p className="font-bold text-dash-green text-sm">{formatCurrency(c.paid_amount)}</p>
                    </div>
                    <div className="bg-muted/50 rounded-xl p-2.5 text-center">
                      <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Due</p>
                      <p className={`font-bold text-sm ${due > 0 ? "text-destructive" : "text-dash-green"}`}>{formatCurrency(due)}</p>
                    </div>
                  </div>

                  {/* Progress */}
                  {c.total_amount > 0 && (
                    <div className="mb-4">
                      <div className="flex justify-between text-[10px] text-muted-foreground mb-1">
                        <span>Payment Progress</span>
                        <span className="font-semibold">{paidPercent}%</span>
                      </div>
                      <div className="w-full h-2.5 bg-muted rounded-full overflow-hidden">
                        <div className="h-full bg-gradient-to-r from-dash-green to-dash-teal rounded-full transition-all" style={{ width: `${paidPercent}%` }} />
                      </div>
                    </div>
                  )}

                  <div className="flex items-center gap-2 text-xs">
                    <span className="bg-dash-blue/10 text-dash-blue px-2.5 py-1 rounded-full font-medium">{c.project_count} project{c.project_count !== 1 ? "s" : ""}</span>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 mt-4 pt-4 border-t border-border">
                    <button onClick={() => setViewCustomer(c)} className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl bg-dash-blue/10 text-dash-blue text-xs font-medium hover:bg-dash-blue/20 transition-colors"><Eye size={13} /> View</button>
                    <button onClick={() => openEdit(c)} className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl bg-dash-orange/10 text-dash-orange text-xs font-medium hover:bg-dash-orange/20 transition-colors"><Pencil size={13} /> Edit</button>
                    <button onClick={() => openAddAmount(c)} className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl bg-dash-green/10 text-dash-green text-xs font-medium hover:bg-dash-green/20 transition-colors"><Plus size={13} /> Pay</button>
                    <button onClick={() => handleDelete(c)} className="p-2 rounded-xl bg-destructive/10 text-destructive hover:bg-destructive/20 transition-colors"><Trash2 size={13} /></button>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      {filtered.length === 0 && (
        <div className="text-center py-20 text-muted-foreground">
          <Users size={48} className="mx-auto mb-4 opacity-40" />
          <p>{search || filter !== "all" ? "No customers match your search/filter." : "No customers found."}</p>
        </div>
      )}

      {/* VIEW MODAL */}
      <ViewCustomerModal customer={viewCustomer} onClose={() => setViewCustomer(null)} formatCurrency={formatCurrency} />

      {/* EDIT MODAL */}
      <AnimatePresence>
        {editCustomer && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setEditCustomer(null)}>
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
              className="bg-card rounded-2xl border border-border p-6 w-full max-w-md shadow-2xl" onClick={(e) => e.stopPropagation()}>
              <div className="flex justify-between items-center mb-5">
                <h3 className="font-heading text-lg font-bold text-foreground">Edit Customer</h3>
                <button onClick={() => setEditCustomer(null)} className="text-muted-foreground hover:text-foreground"><X size={20} /></button>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-foreground mb-1.5 block">Full Name</label>
                  <input value={editForm.full_name} onChange={(e) => setEditForm((f) => ({ ...f, full_name: e.target.value }))} className={inputClass} />
                </div>
                <div>
                  <label className="text-sm font-medium text-foreground mb-1.5 block">Phone</label>
                  <input value={editForm.phone} onChange={(e) => setEditForm((f) => ({ ...f, phone: e.target.value }))} className={inputClass} />
                </div>
                <div>
                  <label className="text-sm font-medium text-foreground mb-1.5 block">Address</label>
                  <input value={editForm.address} onChange={(e) => setEditForm((f) => ({ ...f, address: e.target.value }))} className={inputClass} />
                </div>
                <button onClick={handleEditSave} disabled={saving} className="w-full bg-gold-gradient text-accent-foreground py-3 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 disabled:opacity-50 hover:opacity-90 transition-opacity shadow-md">
                  {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />} Save Changes
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ADD AMOUNT MODAL */}
      <AnimatePresence>
        {amountCustomer && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setAmountCustomer(null)}>
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
              className="bg-card rounded-2xl border border-border p-6 w-full max-w-md shadow-2xl" onClick={(e) => e.stopPropagation()}>
              <div className="flex justify-between items-center mb-5">
                <h3 className="font-heading text-lg font-bold text-foreground">Record Payment</h3>
                <button onClick={() => setAmountCustomer(null)} className="text-muted-foreground hover:text-foreground"><X size={20} /></button>
              </div>
              <p className="text-sm text-muted-foreground mb-4">For: <span className="font-semibold text-foreground">{amountCustomer.full_name || "Unnamed"}</span></p>
              {customerProjects.length === 0 ? (
                <p className="text-sm text-muted-foreground py-6 text-center">This customer has no projects yet.</p>
              ) : (
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium text-foreground mb-1.5 block">Project</label>
                    <select value={amountForm.project_id} onChange={(e) => setAmountForm((f) => ({ ...f, project_id: e.target.value }))} className={inputClass}>
                      <option value="">Select project...</option>
                      {customerProjects.map((p) => <option key={p.id} value={p.id}>{p.project_name}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-foreground mb-1.5 block">Amount (৳)</label>
                    <input type="number" value={amountForm.amount} onChange={(e) => setAmountForm((f) => ({ ...f, amount: e.target.value }))} className={inputClass} placeholder="0" />
                  </div>
                  <button onClick={handleAddAmount} disabled={saving} className="w-full bg-gold-gradient text-accent-foreground py-3 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 disabled:opacity-50 hover:opacity-90 transition-opacity shadow-md">
                    {saving ? <Loader2 size={16} className="animate-spin" /> : <DollarSign size={16} />} Record Payment
                  </button>
                </div>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

// View Customer Modal with per-project breakdown
const ViewCustomerModal = ({ customer, onClose, formatCurrency }: { customer: Customer | null; onClose: () => void; formatCurrency: (n: number) => string }) => {
  const [projects, setProjects] = useState<ViewProject[]>([]);
  const [payments, setPayments] = useState<{ id: string; amount: number; payment_date: string; payment_method: string; status: string; reference_no: string | null; notes: string | null; project_name?: string }[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!customer) return;
    setLoading(true);
    Promise.all([
      supabase.from("customer_projects").select("id, project_name, total_amount, paid_amount, monthly_installment, status").eq("user_id", customer.user_id).order("project_name"),
      supabase.from("payments").select("id, amount, payment_date, payment_method, status, reference_no, notes, project_id").eq("user_id", customer.user_id).order("payment_date", { ascending: false }),
    ]).then(([projRes, payRes]) => {
      const projs = (projRes.data || []) as ViewProject[];
      const projMap: Record<string, string> = {};
      projs.forEach((p) => { projMap[p.id] = p.project_name; });
      setProjects(projs);
      setPayments((payRes.data || []).map((pay: any) => ({ ...pay, project_name: projMap[pay.project_id] || "—" })));
      setLoading(false);
    });
  }, [customer]);

  if (!customer) return null;

  const due = customer.total_amount - customer.paid_amount;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={onClose}>
        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
          className="bg-card rounded-2xl border border-border p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto shadow-2xl" onClick={(e) => e.stopPropagation()}>
          <div className="flex justify-between items-center mb-5">
            <h3 className="font-heading text-lg font-bold text-foreground">Customer Details</h3>
            <button onClick={onClose} className="text-muted-foreground hover:text-foreground"><X size={20} /></button>
          </div>

          {/* Customer Info */}
          <div className="flex items-center gap-4 mb-5">
            <div className="w-14 h-14 rounded-2xl bg-dash-blue flex items-center justify-center text-white font-bold text-2xl shadow-lg">
              {(customer.full_name || "?")[0].toUpperCase()}
            </div>
            <div>
              <h4 className="font-semibold text-foreground text-lg">{customer.full_name || "Unnamed"}</h4>
              {customer.phone && <p className="text-sm text-muted-foreground flex items-center gap-1"><Phone size={13} /> {customer.phone}</p>}
              {customer.address && <p className="text-sm text-muted-foreground flex items-center gap-1 mt-0.5"><MapPin size={13} /> {customer.address}</p>}
            </div>
          </div>

          {/* Summary cards */}
          <div className="grid grid-cols-2 gap-3 mb-5">
            <div className="bg-dash-blue rounded-xl p-3 text-white">
              <p className="text-[10px] uppercase tracking-wider text-white/70">Projects</p>
              <p className="font-heading text-lg font-bold">{customer.project_count}</p>
            </div>
            <div className="bg-dash-orange rounded-xl p-3 text-white">
              <p className="text-[10px] uppercase tracking-wider text-white/70">Total Amount</p>
              <p className="font-heading text-lg font-bold">{formatCurrency(customer.total_amount)}</p>
            </div>
            <div className="bg-dash-green rounded-xl p-3 text-white">
              <p className="text-[10px] uppercase tracking-wider text-white/70">Paid Amount</p>
              <p className="font-heading text-lg font-bold">{formatCurrency(customer.paid_amount)}</p>
            </div>
            <div className="bg-gradient-to-r from-dash-pink to-dash-orange rounded-xl p-3 text-white">
              <p className="text-[10px] uppercase tracking-wider text-white/70">Due Amount</p>
              <p className="font-heading text-lg font-bold">{formatCurrency(due)}</p>
            </div>
          </div>

          {/* Per-project breakdown */}
          <div>
            <h4 className="font-semibold text-foreground text-sm mb-3 flex items-center gap-2"><HardHat size={15} /> Project Breakdown</h4>
            {loading ? (
              <div className="flex justify-center py-6"><Loader2 className="animate-spin text-muted-foreground" size={20} /></div>
            ) : projects.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">No projects assigned.</p>
            ) : (
              <div className="space-y-3">
                {projects.map((p) => {
                  const pDue = p.total_amount - p.paid_amount;
                  const paidPct = p.total_amount > 0 ? Math.round((p.paid_amount / p.total_amount) * 100) : 0;
                  return (
                    <div key={p.id} className="bg-muted/50 rounded-xl p-4 border border-border">
                      <div className="flex items-center justify-between mb-2">
                        <h5 className="font-semibold text-foreground text-sm">{p.project_name}</h5>
                        <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-full ${
                          p.status === "completed" ? "bg-dash-green/15 text-dash-green"
                          : p.status === "in_progress" ? "bg-dash-blue/15 text-dash-blue"
                          : "bg-muted text-muted-foreground"
                        }`}>{p.status.replace("_", " ")}</span>
                      </div>
                      <div className="grid grid-cols-4 gap-2 text-xs mb-2">
                        <div>
                          <p className="text-muted-foreground">Total</p>
                          <p className="font-bold text-foreground">{formatCurrency(p.total_amount)}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Paid</p>
                          <p className="font-bold text-dash-green">{formatCurrency(p.paid_amount)}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">EMI</p>
                          <p className="font-bold text-dash-blue">{formatCurrency(p.monthly_installment)}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Due</p>
                          <p className={`font-bold ${pDue > 0 ? "text-destructive" : "text-dash-green"}`}>{formatCurrency(pDue)}</p>
                        </div>
                      </div>
                      <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
                        <div className="h-full bg-gradient-to-r from-dash-green to-dash-teal rounded-full transition-all" style={{ width: `${paidPct}%` }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Payment History */}
          <div className="mt-5">
            <h4 className="font-semibold text-foreground text-sm mb-3 flex items-center gap-2"><DollarSign size={15} /> Payment History</h4>
            {loading ? (
              <div className="flex justify-center py-4"><Loader2 className="animate-spin text-muted-foreground" size={20} /></div>
            ) : payments.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">No payments recorded.</p>
            ) : (
              <div className="space-y-2">
                {payments.map((pay) => (
                  <div key={pay.id} className="flex items-center gap-3 bg-muted/50 rounded-xl p-3 border border-border">
                    <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${pay.status === "completed" ? "bg-dash-green/15 text-dash-green" : "bg-dash-orange/15 text-dash-orange"}`}>
                      <DollarSign size={16} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <p className="font-semibold text-foreground text-sm">{formatCurrency(pay.amount)}</p>
                        <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-full ${pay.status === "completed" ? "bg-dash-green/15 text-dash-green" : "bg-dash-orange/15 text-dash-orange"}`}>{pay.status}</span>
                      </div>
                      <div className="flex flex-wrap items-center gap-2 text-[11px] text-muted-foreground mt-0.5">
                        <span>{pay.payment_date}</span>
                        <span className="bg-muted px-1.5 py-0.5 rounded text-[10px]">{pay.payment_method.replace("_", " ")}</span>
                        <span className="truncate max-w-[120px]">📁 {pay.project_name}</span>
                        {pay.reference_no && <span>Ref: {pay.reference_no}</span>}
                      </div>
                      {pay.notes && <p className="text-[11px] text-muted-foreground mt-1 truncate">{pay.notes}</p>}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default AdminCustomers;
