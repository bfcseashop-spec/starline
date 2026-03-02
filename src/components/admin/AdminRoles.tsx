import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Shield, Users, Loader2, Eye, Pencil, Trash2, UserPlus, UserCheck, KeyRound, Settings } from "lucide-react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";

interface UserRole {
  id: string;
  user_id: string;
  role: "admin" | "customer";
  created_at: string;
  full_name?: string;
  email?: string;
}

const AVATAR_COLORS = [
  "bg-blue-600", "bg-emerald-600", "bg-orange-500", "bg-violet-600",
  "bg-pink-600", "bg-cyan-600", "bg-amber-600", "bg-rose-600",
  "bg-indigo-600", "bg-teal-600",
];

const roleBadge: Record<string, { bg: string; text: string }> = {
  admin: { bg: "bg-orange-100 dark:bg-orange-500/15", text: "text-orange-700 dark:text-orange-400" },
  customer: { bg: "bg-blue-100 dark:bg-blue-500/15", text: "text-blue-700 dark:text-blue-400" },
};

const getInitials = (name: string) => {
  const parts = name.trim().split(" ");
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
  return name.slice(0, 2).toUpperCase();
};

const getAvatarColor = (str: string) => {
  let hash = 0;
  for (let i = 0; i < str.length; i++) hash = str.charCodeAt(i) + ((hash << 5) - hash);
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
};

const AdminRoles = () => {
  const [roles, setRoles] = useState<UserRole[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchRoles = async () => {
    const [rolesRes, profilesRes] = await Promise.all([
      supabase.from("user_roles").select("*").order("created_at", { ascending: false }),
      supabase.from("profiles").select("user_id, full_name, phone"),
    ]);

    const nameMap: Record<string, string> = {};
    (profilesRes.data || []).forEach((p) => { nameMap[p.user_id] = p.full_name || ""; });

    setRoles(
      (rolesRes.data || []).map((r) => ({
        ...r,
        full_name: nameMap[r.user_id] || "Unknown",
        email: r.user_id.slice(0, 8) + "...",
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

  const adminCount = roles.filter((r) => r.role === "admin").length;
  const customerCount = roles.filter((r) => r.role === "customer").length;

  if (loading) return <div className="flex justify-center py-20"><Loader2 className="animate-spin text-primary" size={32} /></div>;

  return (
    <div>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h2 className="font-heading text-2xl font-bold text-foreground">User Management</h2>
          <p className="text-sm text-muted-foreground">Manage users and assign roles</p>
        </div>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
        {[
          { label: "TOTAL USERS", value: roles.length, icon: Users, color: "text-blue-600", bgColor: "bg-blue-100 dark:bg-blue-500/15" },
          { label: "ACTIVE USERS", value: roles.length, icon: UserCheck, color: "text-emerald-600", bgColor: "bg-emerald-100 dark:bg-emerald-500/15" },
          { label: "ADMINS", value: adminCount, icon: Shield, color: "text-orange-600", bgColor: "bg-orange-100 dark:bg-orange-500/15" },
          { label: "CUSTOMERS", value: customerCount, icon: KeyRound, color: "text-violet-600", bgColor: "bg-violet-100 dark:bg-violet-500/15" },
        ].map((s, i) => (
          <motion.div key={i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
            className="bg-card rounded-2xl border border-border p-5 shadow-sm">
            <div className="flex items-center gap-3 mb-2">
              <div className={`w-9 h-9 rounded-lg ${s.bgColor} flex items-center justify-center`}>
                <s.icon size={16} className={s.color} />
              </div>
              <span className="text-[10px] font-bold tracking-wider text-muted-foreground uppercase">{s.label}</span>
            </div>
            <p className="font-heading text-2xl font-bold text-foreground">{s.value}</p>
          </motion.div>
        ))}
      </div>

      {/* User Management Section */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-1">
          <div className="w-8 h-8 rounded-lg bg-blue-100 dark:bg-blue-500/15 flex items-center justify-center">
            <Users size={16} className="text-blue-600" />
          </div>
          <div>
            <h3 className="font-heading text-base font-bold text-foreground">User Management</h3>
            <p className="text-xs text-muted-foreground">Manage system users and access</p>
          </div>
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-card rounded-2xl border border-border shadow-sm mb-8 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/50">
                <th className="text-left px-5 py-3 font-semibold text-muted-foreground text-xs">Email</th>
                <th className="text-left px-5 py-3 font-semibold text-muted-foreground text-xs">Full Name</th>
                <th className="text-left px-5 py-3 font-semibold text-muted-foreground text-xs">Role</th>
                <th className="text-right px-5 py-3 font-semibold text-muted-foreground text-xs">Actions</th>
              </tr>
            </thead>
            <tbody>
              {roles.map((r) => {
                const initials = getInitials(r.full_name || "U");
                const avatarColor = getAvatarColor(r.user_id);
                return (
                  <tr key={r.id} className="border-b border-border last:border-0 hover:bg-muted/30 transition-colors">
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-3">
                        <div className={`w-8 h-8 rounded-full ${avatarColor} flex items-center justify-center text-white text-[10px] font-bold shrink-0`}>
                          {initials}
                        </div>
                        <span className="text-foreground text-sm">{r.user_id.slice(0, 12)}...@user</span>
                      </div>
                    </td>
                    <td className="px-5 py-3.5 text-foreground font-medium">{r.full_name}</td>
                    <td className="px-5 py-3.5">
                      <span className={`inline-block text-[11px] font-semibold px-2.5 py-1 rounded-md capitalize ${roleBadge[r.role]?.bg} ${roleBadge[r.role]?.text}`}>
                        {r.role}
                      </span>
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="flex items-center justify-end gap-1.5">
                        <button title="View" className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors">
                          <Eye size={14} />
                        </button>
                        <button title="Change Role" onClick={() => handleChangeRole(r.user_id, r.role)}
                          className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors">
                          <Pencil size={14} />
                        </button>
                        <button title="Remove" onClick={() => handleDelete(r.id)}
                          className="p-1.5 rounded-lg text-destructive/70 hover:text-destructive hover:bg-destructive/10 transition-colors">
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
              {roles.length === 0 && (
                <tr><td colSpan={4} className="text-center py-12 text-muted-foreground">No users found.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Roles Management Section */}
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-1">
          <div className="w-8 h-8 rounded-lg bg-orange-100 dark:bg-orange-500/15 flex items-center justify-center">
            <Shield size={16} className="text-orange-600" />
          </div>
          <div>
            <h3 className="font-heading text-base font-bold text-foreground">Roles Overview</h3>
            <p className="text-xs text-muted-foreground">System roles and user distribution</p>
          </div>
        </div>
      </div>

      <div className="bg-card rounded-2xl border border-border shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/50">
                <th className="text-left px-5 py-3 font-semibold text-muted-foreground text-xs">Role Name</th>
                <th className="text-left px-5 py-3 font-semibold text-muted-foreground text-xs">Description</th>
                <th className="text-left px-5 py-3 font-semibold text-muted-foreground text-xs">Users</th>
                <th className="text-right px-5 py-3 font-semibold text-muted-foreground text-xs">Actions</th>
              </tr>
            </thead>
            <tbody>
              {[
                { name: "Admin", desc: "Full system access", count: adminCount, color: "text-orange-700 dark:text-orange-400" },
                { name: "Customer", desc: "Customer portal access", count: customerCount, color: "text-blue-700 dark:text-blue-400" },
              ].map((role) => (
                <tr key={role.name} className="border-b border-border last:border-0 hover:bg-muted/30 transition-colors">
                  <td className="px-5 py-3.5">
                    <span className={`font-semibold ${role.color}`}>{role.name}</span>
                  </td>
                  <td className="px-5 py-3.5 text-muted-foreground">{role.desc}</td>
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-2">
                      <Settings size={13} className="text-muted-foreground" />
                      <span className="text-foreground font-medium">{role.count} user{role.count !== 1 ? "s" : ""}</span>
                    </div>
                  </td>
                  <td className="px-5 py-3.5">
                    <div className="flex items-center justify-end gap-1.5">
                      <button className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors">
                        <Pencil size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default AdminRoles;
