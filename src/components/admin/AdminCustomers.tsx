import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { toast } from "@/components/ui/use-toast";
import {
  Users, Phone, MapPin, Loader2, Search, LayoutGrid, LayoutList,
  Eye, Pencil, Trash2, X, Save, Plus, DollarSign, ChevronDown, HardHat, Printer, Download, UserPlus,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { ConfirmDialog } from "@/components/common/ConfirmDialog";

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
  const [editForm, setEditForm] = useState({ full_name: "", phone: "", address: "", project_id: "", project_name: "", total_amount: "", down_payment: "", paid_amount: "", installment_amount: "" });
  const [editProjects, setEditProjects] = useState<{ id: string; project_name: string; total_amount: number; paid_amount: number; monthly_installment: number }[]>([]);
  const [showNewProject, setShowNewProject] = useState(false);
  const [saving, setSaving] = useState(false);

  // Add customer modal
  const [showAddCustomer, setShowAddCustomer] = useState(false);
  const [addForm, setAddForm] = useState({ email: "", password: "", full_name: "", phone: "", address: "", project_name: "", total_amount: "", down_payment: "", paid_amount: "", installment_amount: "" });

  // Add amount modal
  const [amountCustomer, setAmountCustomer] = useState<Customer | null>(null);
  const [amountForm, setAmountForm] = useState({ project_id: "", amount: "" });
  const [customerProjects, setCustomerProjects] = useState<{ id: string; project_name: string }[]>([]);
  const [deleteTarget, setDeleteTarget] = useState<Customer | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

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
  const openEdit = async (c: Customer) => {
    setEditForm({ full_name: c.full_name || "", phone: c.phone || "", address: c.address || "", project_id: "", project_name: "", total_amount: "", down_payment: "", paid_amount: "", installment_amount: "" });
    setEditCustomer(c);
    setShowNewProject(false);
    const { data } = await supabase.from("customer_projects").select("id, project_name, total_amount, paid_amount, monthly_installment").eq("user_id", c.user_id);
    const projects = data || [];
    setEditProjects(projects);
    if (projects.length > 0) {
      const p = projects[0];
      setEditForm((f) => ({
        ...f,
        project_id: p.id,
        project_name: p.project_name,
        total_amount: String(p.total_amount),
        paid_amount: String(p.paid_amount),
        installment_amount: String(p.monthly_installment),
        down_payment: "",
      }));
    }
  };

  const handleEditProjectChange = (projectId: string) => {
    const p = editProjects.find((pr) => pr.id === projectId);
    if (p) {
      setEditForm((f) => ({
        ...f,
        project_id: p.id,
        project_name: p.project_name,
        total_amount: String(p.total_amount),
        paid_amount: String(p.paid_amount),
        installment_amount: String(p.monthly_installment),
        down_payment: "",
      }));
    }
  };

  const handleEditSave = async () => {
    if (!editCustomer) return;
    setSaving(true);
    // Update profile
    const { error } = await supabase.from("profiles").update({
      full_name: editForm.full_name.trim() || null,
      phone: editForm.phone.trim() || null,
      address: editForm.address.trim() || null,
    }).eq("user_id", editCustomer.user_id);
    if (error) { setSaving(false); toast.error(error.message); return; }

    // Update project if selected
    if (editForm.project_id) {
      const { error: projError } = await supabase.from("customer_projects").update({
        project_name: editForm.project_name.trim(),
        total_amount: Number(editForm.total_amount) || 0,
        paid_amount: Number(editForm.paid_amount) || 0,
        monthly_installment: Number(editForm.installment_amount) || 0,
      }).eq("id", editForm.project_id);
      if (projError) { setSaving(false); toast.error(projError.message); return; }
    } else if (showNewProject && editForm.project_name.trim()) {
      // Create new project for this customer
      const totalAmt = Number(editForm.total_amount) || 0;
      const downPay = Number(editForm.down_payment) || 0;
      const paidAmt = Number(editForm.paid_amount) || 0;
      const totalPaid = downPay + paidAmt;
      const installmentAmt = Number(editForm.installment_amount) || 0;

      const { error: projError } = await supabase.from("customer_projects").insert({
        user_id: editCustomer.user_id,
        project_name: editForm.project_name.trim(),
        total_amount: totalAmt,
        paid_amount: totalPaid,
        monthly_installment: installmentAmt,
        status: "in_progress",
      });
      if (projError) { setSaving(false); toast.error(projError.message); return; }

      // Record payments
      if (downPay > 0) {
        await supabase.from("payments").insert({ user_id: editCustomer.user_id, amount: downPay, payment_method: "cash", status: "completed", notes: "Down payment" });
      }
      if (paidAmt > 0) {
        await supabase.from("payments").insert({ user_id: editCustomer.user_id, amount: paidAmt, payment_method: "cash", status: "completed", notes: "Initial payment" });
      }
    }

    setSaving(false);
    toast.success("Customer updated!");
    setEditCustomer(null);
    fetchCustomers();
  };

  // Delete handler
  const handleDelete = (c: Customer) => {
    setDeleteTarget(c);
  };

  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;
    setDeleteLoading(true);
    const { error } = await supabase.from("profiles").delete().eq("user_id", deleteTarget.user_id);
    setDeleteLoading(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Profile removed");
    setDeleteTarget(null);
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

  const handleAddCustomer = async () => {
    if (!addForm.email || !addForm.password) { toast.error("Email and password are required"); return; }
    if (addForm.password.length < 6) { toast.error("Password must be at least 6 characters"); return; }
    setSaving(true);
    const { data, error } = await supabase.functions.invoke("create-customer", {
      body: {
        email: addForm.email, password: addForm.password, full_name: addForm.full_name,
        phone: addForm.phone, address: addForm.address,
        project_name: addForm.project_name || null,
        total_amount: addForm.total_amount ? Number(addForm.total_amount) : null,
        down_payment: addForm.down_payment ? Number(addForm.down_payment) : null,
        paid_amount: addForm.paid_amount ? Number(addForm.paid_amount) : null,
        installment_amount: addForm.installment_amount ? Number(addForm.installment_amount) : null,
      },
    });
    setSaving(false);
    if (error || data?.error) { toast.error(data?.error || error?.message || "Failed to create customer"); return; }
    toast.success("Customer created!");
    setShowAddCustomer(false);
    setAddForm({ email: "", password: "", full_name: "", phone: "", address: "", project_name: "", total_amount: "", down_payment: "", paid_amount: "", installment_amount: "" });
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
          <button onClick={() => { setAddForm({ email: "", password: "", full_name: "", phone: "", address: "", project_name: "", total_amount: "", down_payment: "", paid_amount: "", installment_amount: "" }); setShowAddCustomer(true); }}
            className="bg-dash-green text-white px-4 py-2 rounded-xl text-sm font-semibold flex items-center gap-2 hover:opacity-90 transition-opacity shadow-md">
            <UserPlus size={16} /> Add Customer
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

      {/* ADD CUSTOMER MODAL */}
      <AnimatePresence>
        {showAddCustomer && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setShowAddCustomer(false)}>
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
              className="bg-card rounded-2xl border border-border p-6 w-full max-w-md shadow-2xl" onClick={(e) => e.stopPropagation()}>
              <div className="flex justify-between items-center mb-5">
                <h3 className="font-heading text-lg font-bold text-foreground">Add Customer</h3>
                <button onClick={() => setShowAddCustomer(false)} className="text-muted-foreground hover:text-foreground"><X size={20} /></button>
              </div>
              <div className="space-y-4 max-h-[70vh] overflow-y-auto pr-1">
                <div>
                  <label className="text-sm font-medium text-foreground mb-1.5 block">Email *</label>
                  <input type="email" value={addForm.email} onChange={(e) => setAddForm((f) => ({ ...f, email: e.target.value }))} className={inputClass} placeholder="customer@example.com" maxLength={255} />
                </div>
                <div>
                  <label className="text-sm font-medium text-foreground mb-1.5 block">Password *</label>
                  <input type="password" value={addForm.password} onChange={(e) => setAddForm((f) => ({ ...f, password: e.target.value }))} className={inputClass} placeholder="Min 6 characters" maxLength={72} />
                </div>
                <div>
                  <label className="text-sm font-medium text-foreground mb-1.5 block">Customer Name</label>
                  <input value={addForm.full_name} onChange={(e) => setAddForm((f) => ({ ...f, full_name: e.target.value }))} className={inputClass} placeholder="Customer name" maxLength={100} />
                </div>
                <div>
                  <label className="text-sm font-medium text-foreground mb-1.5 block">Phone</label>
                  <input value={addForm.phone} onChange={(e) => setAddForm((f) => ({ ...f, phone: e.target.value }))} className={inputClass} placeholder="+880 1234 567890" maxLength={20} />
                </div>
                <div>
                  <label className="text-sm font-medium text-foreground mb-1.5 block">Address</label>
                  <input value={addForm.address} onChange={(e) => setAddForm((f) => ({ ...f, address: e.target.value }))} className={inputClass} placeholder="Customer address" maxLength={200} />
                </div>

                {/* Project Details Section */}
                <div className="border-t border-border pt-4 mt-2">
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Project Details (Optional)</p>
                  <div className="space-y-4">
                    <div>
                      <label className="text-sm font-medium text-foreground mb-1.5 block">Project Name</label>
                      <input value={addForm.project_name} onChange={(e) => setAddForm((f) => ({ ...f, project_name: e.target.value }))} className={inputClass} placeholder="e.g. Skyline Tower Apt #5B" maxLength={150} />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-sm font-medium text-foreground mb-1.5 block">Total Amount</label>
                        <input type="number" value={addForm.total_amount} onChange={(e) => setAddForm((f) => ({ ...f, total_amount: e.target.value }))} className={inputClass} placeholder="0" min="0" />
                      </div>
                      <div>
                        <label className="text-sm font-medium text-foreground mb-1.5 block">Down Payment</label>
                        <input type="number" value={addForm.down_payment} onChange={(e) => setAddForm((f) => ({ ...f, down_payment: e.target.value }))} className={inputClass} placeholder="0" min="0" />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-sm font-medium text-foreground mb-1.5 block">Paid Amount</label>
                        <input type="number" value={addForm.paid_amount} onChange={(e) => setAddForm((f) => ({ ...f, paid_amount: e.target.value }))} className={inputClass} placeholder="0" min="0" />
                      </div>
                      <div>
                        <label className="text-sm font-medium text-foreground mb-1.5 block">Installment Amount</label>
                        <input type="number" value={addForm.installment_amount} onChange={(e) => setAddForm((f) => ({ ...f, installment_amount: e.target.value }))} className={inputClass} placeholder="0" min="0" />
                      </div>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-foreground mb-1.5 block">Due Amount</label>
                      <input readOnly value={addForm.total_amount ? Math.max(0, Number(addForm.total_amount) - (Number(addForm.down_payment) || 0) - (Number(addForm.paid_amount) || 0)) : ""} className={`${inputClass} bg-muted/50 cursor-not-allowed`} placeholder="Auto-calculated" />
                    </div>
                  </div>
                </div>

                <button onClick={handleAddCustomer} disabled={saving} className="w-full bg-gold-gradient text-accent-foreground py-3 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 disabled:opacity-50 hover:opacity-90 transition-opacity shadow-md">
                  {saving ? <Loader2 size={16} className="animate-spin" /> : <UserPlus size={16} />} Create Customer
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

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
              <div className="space-y-4 max-h-[70vh] overflow-y-auto pr-1">
                <div>
                  <label className="text-sm font-medium text-foreground mb-1.5 block">Customer Name</label>
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

                {/* Project Details Section */}
                {editProjects.length > 0 ? (
                  <div className="border-t border-border pt-4 mt-2">
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Project Details</p>
                    <div className="space-y-4">
                      {editProjects.length > 1 && (
                        <div>
                          <label className="text-sm font-medium text-foreground mb-1.5 block">Select Project</label>
                          <select value={editForm.project_id} onChange={(e) => handleEditProjectChange(e.target.value)} className={inputClass}>
                            {editProjects.map((p) => (
                              <option key={p.id} value={p.id}>{p.project_name}</option>
                            ))}
                          </select>
                        </div>
                      )}
                      <div>
                        <label className="text-sm font-medium text-foreground mb-1.5 block">Project Name</label>
                        <input value={editForm.project_name} onChange={(e) => setEditForm((f) => ({ ...f, project_name: e.target.value }))} className={inputClass} />
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="text-sm font-medium text-foreground mb-1.5 block">Total Amount</label>
                          <input type="number" value={editForm.total_amount} onChange={(e) => setEditForm((f) => ({ ...f, total_amount: e.target.value }))} className={inputClass} min="0" />
                        </div>
                        <div>
                          <label className="text-sm font-medium text-foreground mb-1.5 block">Down Payment</label>
                          <input type="number" value={editForm.down_payment} onChange={(e) => setEditForm((f) => ({ ...f, down_payment: e.target.value }))} className={inputClass} placeholder="0" min="0" />
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="text-sm font-medium text-foreground mb-1.5 block">Paid Amount</label>
                          <input type="number" value={editForm.paid_amount} onChange={(e) => setEditForm((f) => ({ ...f, paid_amount: e.target.value }))} className={inputClass} min="0" />
                        </div>
                        <div>
                          <label className="text-sm font-medium text-foreground mb-1.5 block">Installment Amount</label>
                          <input type="number" value={editForm.installment_amount} onChange={(e) => setEditForm((f) => ({ ...f, installment_amount: e.target.value }))} className={inputClass} min="0" />
                        </div>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-foreground mb-1.5 block">Due Amount</label>
                        <input readOnly value={editForm.total_amount ? Math.max(0, Number(editForm.total_amount) - Number(editForm.paid_amount || 0)) : ""} className={`${inputClass} bg-muted/50 cursor-not-allowed`} placeholder="Auto-calculated" />
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="border-t border-border pt-4 mt-2">
                    {!showNewProject ? (
                      <button onClick={() => setShowNewProject(true)} className="w-full border-2 border-dashed border-border rounded-xl py-4 text-sm font-medium text-muted-foreground hover:text-foreground hover:border-primary/40 transition-colors flex items-center justify-center gap-2">
                        <Plus size={16} /> Add Project
                      </button>
                    ) : (
                      <>
                        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">New Project</p>
                        <div className="space-y-4">
                          <div>
                            <label className="text-sm font-medium text-foreground mb-1.5 block">Project Name *</label>
                            <input value={editForm.project_name} onChange={(e) => setEditForm((f) => ({ ...f, project_name: e.target.value }))} className={inputClass} placeholder="e.g. Skyline Tower Apt #5B" />
                          </div>
                          <div className="grid grid-cols-2 gap-3">
                            <div>
                              <label className="text-sm font-medium text-foreground mb-1.5 block">Total Amount</label>
                              <input type="number" value={editForm.total_amount} onChange={(e) => setEditForm((f) => ({ ...f, total_amount: e.target.value }))} className={inputClass} placeholder="0" min="0" />
                            </div>
                            <div>
                              <label className="text-sm font-medium text-foreground mb-1.5 block">Down Payment</label>
                              <input type="number" value={editForm.down_payment} onChange={(e) => setEditForm((f) => ({ ...f, down_payment: e.target.value }))} className={inputClass} placeholder="0" min="0" />
                            </div>
                          </div>
                          <div className="grid grid-cols-2 gap-3">
                            <div>
                              <label className="text-sm font-medium text-foreground mb-1.5 block">Paid Amount</label>
                              <input type="number" value={editForm.paid_amount} onChange={(e) => setEditForm((f) => ({ ...f, paid_amount: e.target.value }))} className={inputClass} placeholder="0" min="0" />
                            </div>
                            <div>
                              <label className="text-sm font-medium text-foreground mb-1.5 block">Installment Amount</label>
                              <input type="number" value={editForm.installment_amount} onChange={(e) => setEditForm((f) => ({ ...f, installment_amount: e.target.value }))} className={inputClass} placeholder="0" min="0" />
                            </div>
                          </div>
                          <div>
                            <label className="text-sm font-medium text-foreground mb-1.5 block">Due Amount</label>
                            <input readOnly value={editForm.total_amount ? Math.max(0, Number(editForm.total_amount) - (Number(editForm.down_payment) || 0) - (Number(editForm.paid_amount) || 0)) : ""} className={`${inputClass} bg-muted/50 cursor-not-allowed`} placeholder="Auto-calculated" />
                          </div>
                          <button onClick={() => { setShowNewProject(false); setEditForm((f) => ({ ...f, project_name: "", total_amount: "", down_payment: "", paid_amount: "", installment_amount: "" })); }} className="text-xs text-muted-foreground hover:text-destructive transition-colors">
                            Cancel adding project
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                )}

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

      <ConfirmDialog
        open={!!deleteTarget}
        onOpenChange={(open) => {
          if (!open && !deleteLoading) {
            setDeleteTarget(null);
          }
        }}
        title={
          deleteTarget
            ? `Remove customer "${deleteTarget.full_name || "Unnamed"}" profile?`
            : "Remove customer profile?"
        }
        description="This only removes the profile record and does not delete the Supabase account."
        confirmLabel="Remove"
        cancelLabel="Cancel"
        confirmVariant="destructive"
        loading={deleteLoading}
        onConfirm={handleConfirmDelete}
      />
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

  const due = customer ? customer.total_amount - customer.paid_amount : 0;
  const fmt = (n: number) => `${n.toLocaleString()} BDT`;

  const buildPdf = useCallback(() => {
    const doc = new jsPDF();
    const pageW = doc.internal.pageSize.getWidth();

    // Header band
    doc.setFillColor(30, 41, 59); // navy
    doc.rect(0, 0, pageW, 38, "F");
    doc.setFillColor(217, 169, 68); // gold accent line
    doc.rect(0, 38, pageW, 3, "F");

    doc.setTextColor(255, 255, 255);
    doc.setFontSize(20);
    doc.setFont("helvetica", "bold");
    doc.text("STARLINE BUILDER'S LTD", 14, 18);
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.text("Customer Statement", 14, 26);
    doc.text(`Date: ${new Date().toLocaleDateString()}`, 14, 33);

    let y = 50;

    // Customer info section
    doc.setTextColor(30, 41, 59);
    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.text("Customer Information", 14, y);
    y += 2;
    doc.setDrawColor(217, 169, 68);
    doc.setLineWidth(0.8);
    doc.line(14, y, 80, y);
    y += 7;

    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(55, 65, 81);
    const info = [
      ["Name", customer.full_name || "Unnamed"],
      ...(customer.phone ? [["Phone", customer.phone]] : []),
      ...(customer.address ? [["Address", customer.address]] : []),
    ];
    info.forEach(([label, value]) => {
      doc.setFont("helvetica", "bold");
      doc.text(`${label}:`, 14, y);
      doc.setFont("helvetica", "normal");
      doc.text(value as string, 45, y);
      y += 6;
    });

    y += 4;

    // Financial summary boxes
    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(30, 41, 59);
    doc.text("Financial Summary", 14, y);
    y += 2;
    doc.setDrawColor(217, 169, 68);
    doc.line(14, y, 80, y);
    y += 6;

    const boxW = (pageW - 28 - 12) / 4;
    const boxColors: [number, number, number][] = [
      [59, 130, 246],  // blue
      [249, 115, 22],  // orange
      [34, 197, 94],   // green
      [244, 63, 94],   // pink
    ];
    const summaryData = [
      { label: "Projects", value: String(customer.project_count) },
      { label: "Total Amount", value: fmt(customer.total_amount) },
      { label: "Paid Amount", value: fmt(customer.paid_amount) },
      { label: "Due Amount", value: fmt(due) },
    ];
    summaryData.forEach((s, i) => {
      const bx = 14 + i * (boxW + 4);
      doc.setFillColor(...boxColors[i]);
      doc.roundedRect(bx, y, boxW, 22, 3, 3, "F");
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(7);
      doc.setFont("helvetica", "normal");
      doc.text(s.label.toUpperCase(), bx + 4, y + 7);
      doc.setFontSize(12);
      doc.setFont("helvetica", "bold");
      doc.text(s.value, bx + 4, y + 16);
    });
    y += 32;

    // Project breakdown table
    if (projects.length > 0) {
      doc.setTextColor(30, 41, 59);
      doc.setFontSize(12);
      doc.setFont("helvetica", "bold");
      doc.text("Project Breakdown", 14, y);
      y += 2;
      doc.setDrawColor(217, 169, 68);
      doc.line(14, y, 80, y);
      y += 4;

      autoTable(doc, {
        startY: y,
        head: [["Project Name", "Status", "Total", "Paid", "EMI", "Due"]],
        body: projects.map((p) => [
          p.project_name,
          p.status.replace("_", " "),
          fmt(p.total_amount),
          fmt(p.paid_amount),
          fmt(p.monthly_installment),
          fmt(p.total_amount - p.paid_amount),
        ]),
        theme: "grid",
        headStyles: { fillColor: [30, 41, 59], textColor: [255, 255, 255], fontSize: 8, fontStyle: "bold" },
        bodyStyles: { fontSize: 8, textColor: [55, 65, 81] },
        alternateRowStyles: { fillColor: [248, 250, 252] },
        margin: { left: 14, right: 14 },
        styles: { cellPadding: 3 },
      });

      y = (doc as any).lastAutoTable.finalY + 10;
    }

    // Payment history table
    if (payments.length > 0) {
      // Check if we need a new page
      if (y > 240) { doc.addPage(); y = 20; }

      doc.setTextColor(30, 41, 59);
      doc.setFontSize(12);
      doc.setFont("helvetica", "bold");
      doc.text("Payment History", 14, y);
      y += 2;
      doc.setDrawColor(217, 169, 68);
      doc.line(14, y, 80, y);
      y += 4;

      autoTable(doc, {
        startY: y,
        head: [["Date", "Amount", "Method", "Status", "Project", "Reference"]],
        body: payments.map((pay) => [
          pay.payment_date,
          fmt(pay.amount),
          pay.payment_method.replace("_", " "),
          pay.status,
          pay.project_name || "—",
          pay.reference_no || "—",
        ]),
        theme: "grid",
        headStyles: { fillColor: [30, 41, 59], textColor: [255, 255, 255], fontSize: 8, fontStyle: "bold" },
        bodyStyles: { fontSize: 8, textColor: [55, 65, 81] },
        alternateRowStyles: { fillColor: [248, 250, 252] },
        margin: { left: 14, right: 14 },
        styles: { cellPadding: 3 },
        didParseCell: (data: any) => {
          if (data.section === "body" && data.column.index === 3) {
            data.cell.styles.textColor = data.cell.raw === "completed" ? [34, 197, 94] : [249, 115, 22];
            data.cell.styles.fontStyle = "bold";
          }
        },
      });

      y = (doc as any).lastAutoTable.finalY + 10;
    }

    // Footer
    if (y > 270) { doc.addPage(); y = 20; }
    doc.setDrawColor(217, 169, 68);
    doc.setLineWidth(0.5);
    doc.line(14, y, pageW - 14, y);
    y += 6;
    doc.setFontSize(8);
    doc.setTextColor(156, 163, 175);
    doc.setFont("helvetica", "normal");
    doc.text("Generated by Starline Builder's Ltd", 14, y);
    doc.text(`Page 1 of ${doc.getNumberOfPages()}`, pageW - 14, y, { align: "right" });

    return doc;
  }, [customer, projects, payments, due]);

  const handlePrint = () => {
    const doc = buildPdf();
    doc.autoPrint();
    window.open(doc.output("bloburl"), "_blank");
  };

  const handleExport = () => {
    const doc = buildPdf();
    doc.save(`statement-${(customer.full_name || "customer").replace(/\s+/g, "-").toLowerCase()}-${new Date().toISOString().split("T")[0]}.pdf`);
  };

  if (!customer) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={onClose}>
        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
          className="bg-card rounded-2xl border border-border p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto shadow-2xl" onClick={(e) => e.stopPropagation()}>
          <div className="flex items-center justify-between mb-5">
            <h3 className="font-heading text-lg font-bold text-foreground">Customer Details</h3>
            <div className="flex items-center gap-1.5">
              <button onClick={handlePrint} title="Print Statement" className="p-2 rounded-lg bg-dash-blue/10 text-dash-blue hover:bg-dash-blue/20 transition-colors"><Printer size={16} /></button>
              <button onClick={handleExport} title="Export Statement" className="p-2 rounded-lg bg-dash-green/10 text-dash-green hover:bg-dash-green/20 transition-colors"><Download size={16} /></button>
              <button onClick={onClose} className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"><X size={16} /></button>
            </div>
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
