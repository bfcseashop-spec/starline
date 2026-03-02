import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Shield, Users, Loader2, Plus, Trash2, Search } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface UserRole {
  id: string;
  user_id: string;
  role: "admin" | "customer";
  created_at: string;
  full_name?: string;
  email?: string;
}

const roleBadge: Record<string, { bg: string; text: string }> = {
  admin: { bg: "bg-dash-pink/15", text: "text-dash-pink" },
  customer: { bg: "bg-dash-blue/15", text: "text-dash-blue" },
};

const AdminRoles = () => {
  const [roles, setRoles] = useState<UserRole[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [showAdd, setShowAdd] = useState(false);
  const [newEmail, setNewEmail] = useState("");
  const [newRole, setNewRole] = useState<"admin" | "customer">("customer");
  const [saving, setSaving] = useState(false);

  const fetchRoles = async () => {
    const [rolesRes, profilesRes] = await Promise.all([
      supabase.from("user_roles").select("*").order("created_at", { ascending: false }),
      supabase.from("profiles").select("user_id, full_name"),
    ]);

    const nameMap: Record<string, string> = {};
    (profilesRes.data || []).forEach((p) => { nameMap[p.user_id] = p.full_name || ""; });

    setRoles(
      (rolesRes.data || []).map((r) => ({
        ...r,
        full_name: nameMap[r.user_id] || "Unknown",
      })) as UserRole[]
    );
    setLoading(false);
  };

  useEffect(() => { fetchRoles(); }, []);

  const handleChangeRole = async (userId: string, currentRole: string) => {
    const newR = currentRole === "admin" ? "customer" : "admin";
    if (!confirm(`Change this user's role to ${newR}?`)) return;
    const { error } = await supabase.from("user_roles").update({ role: newR }).eq("user_id", userId);
    if (error) { toast.error(error.message); return; }
    toast.success(`Role changed to ${newR}`);
    fetchRoles();
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Remove this role assignment?")) return;
    const { error } = await supabase.from("user_roles").delete().eq("id", id);
    if (error) { toast.error(error.message); return; }
    toast.success("Role removed");
    fetchRoles();
  };

  const filtered = roles.filter((r) => {
    const q = search.toLowerCase();
    return !q || (r.full_name || "").toLowerCase().includes(q) || r.role.includes(q);
  });

  const adminCount = roles.filter((r) => r.role === "admin").length;
  const customerCount = roles.filter((r) => r.role === "customer").length;

  if (loading) return <div className="flex justify-center py-20"><Loader2 className="animate-spin text-gold" size={32} /></div>;

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <h2 className="font-heading text-2xl font-bold text-foreground flex items-center gap-3">
          <Shield size={24} className="text-dash-pink" /> Roles & Permissions
        </h2>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        {[
          { label: "Total Users", value: roles.length, color: "bg-dash-blue" },
          { label: "Admins", value: adminCount, color: "bg-dash-pink" },
          { label: "Customers", value: customerCount, color: "bg-dash-green" },
        ].map((s, i) => (
          <motion.div key={i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
            className={`${s.color} rounded-2xl p-4 text-white shadow-lg`}>
            <p className="text-white/70 text-xs font-medium mb-1">{s.label}</p>
            <p className="font-heading text-2xl font-bold">{s.value}</p>
          </motion.div>
        ))}
      </div>

      {/* Search */}
      <div className="relative mb-6">
        <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" />
        <input value={search} onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by name or role..." className="w-full bg-card text-foreground rounded-xl pl-11 pr-4 py-3 text-sm outline-none border border-border focus:ring-2 focus:ring-ring" />
      </div>

      {/* Role List */}
      <div className="space-y-3">
        {filtered.map((r, idx) => (
          <motion.div key={r.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.02 }}
            className="bg-card rounded-2xl border border-border p-5 shadow-sm flex items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-11 h-11 rounded-xl bg-muted flex items-center justify-center">
                <Users size={18} className="text-muted-foreground" />
              </div>
              <div>
                <p className="font-semibold text-foreground">{r.full_name}</p>
                <p className="text-xs text-muted-foreground">{r.user_id.slice(0, 8)}...</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <button onClick={() => handleChangeRole(r.user_id, r.role)}
                className={`text-[11px] uppercase font-bold px-3 py-1 rounded-full cursor-pointer hover:opacity-80 transition-opacity ${roleBadge[r.role]?.bg} ${roleBadge[r.role]?.text}`}>
                {r.role}
              </button>
              <button onClick={() => handleDelete(r.id)} className="p-2 rounded-lg bg-destructive/10 text-destructive hover:bg-destructive/20 transition-colors">
                <Trash2 size={14} />
              </button>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
};

export default AdminRoles;
