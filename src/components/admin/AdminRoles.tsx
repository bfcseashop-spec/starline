import React, { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Shield, Users, Loader2, Eye, Pencil, Trash2, UserPlus, UserCheck, KeyRound, X, Plus, ChevronDown, ChevronUp, Check } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

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

const MODULES = ["Dashboard", "Projects", "Customers", "Payments", "Documents", "Invoices", "Expenses", "Reports", "Settings", "Roles", "Social Media", "Work Updates"];
const PERMS = ["view", "add", "edit", "delete"] as const;

const defaultPerms = (role: string): Record<string, Record<string, boolean>> => {
  const all = Object.fromEntries(MODULES.map(m => [m, Object.fromEntries(PERMS.map(p => [p, true]))]));
  if (role === "Admin") return all;
  const limited = Object.fromEntries(MODULES.map(m => [m, Object.fromEntries(PERMS.map(p => [p, false]))]));
  ["Dashboard", "Projects", "Payments", "Documents", "Work Updates"].forEach(m => { limited[m] = { view: true, add: false, edit: false, delete: false }; });
  return limited;
};

const AdminRoles = () => {
  const [roles, setRoles] = useState<UserRole[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateUser, setShowCreateUser] = useState(false);
  const [creating, setCreating] = useState(false);
  const [userForm, setUserForm] = useState({
    email: "", password: "", full_name: "", phone: "", role: "customer" as "admin" | "customer",
  });
  const [newRoleName, setNewRoleName] = useState("");
  const [newRoleDesc, setNewRoleDesc] = useState("");
  const [customRoles, setCustomRoles] = useState<{ name: string; desc: string }[]>([]);
  const [expandedRole, setExpandedRole] = useState<string | null>(null);
  const [rolePerms, setRolePerms] = useState<Record<string, Record<string, Record<string, boolean>>>>({});

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

  const handleCreateUser = async () => {
    if (!userForm.email || !userForm.password || !userForm.full_name) {
      toast.error("Email, password and full name are required");
      return;
    }
    setCreating(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const res = await supabase.functions.invoke("create-customer", {
        body: {
          email: userForm.email,
          password: userForm.password,
          full_name: userForm.full_name,
          phone: userForm.phone,
        },
      });

      if (res.error || res.data?.error) {
        toast.error(res.data?.error || res.error?.message || "Failed to create user");
        setCreating(false);
        return;
      }

      // If role should be admin, update the role
      if (userForm.role === "admin" && res.data?.user_id) {
        await supabase.from("user_roles").update({ role: "admin" }).eq("user_id", res.data.user_id);
      }

      toast.success("User created successfully");
      setShowCreateUser(false);
      setUserForm({ email: "", password: "", full_name: "", phone: "", role: "customer" });
      fetchRoles();
    } catch (err) {
      toast.error("Failed to create user");
    }
    setCreating(false);
  };

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

  const handleCreateRole = () => {
    if (!newRoleName.trim()) { toast.error("Role name is required"); return; }
    if (customRoles.some((r) => r.name.toLowerCase() === newRoleName.trim().toLowerCase()) ||
        ["admin", "customer"].includes(newRoleName.trim().toLowerCase())) {
      toast.error("Role already exists"); return;
    }
    setCustomRoles((prev) => [...prev, { name: newRoleName.trim(), desc: newRoleDesc.trim() }]);
    toast.success(`Role "${newRoleName.trim()}" created`);
    setNewRoleName(""); setNewRoleDesc("");
  };

  const handleDeleteRole = (name: string) => {
    if (!confirm(`Delete role "${name}"?`)) return;
    setCustomRoles((prev) => prev.filter((r) => r.name !== name));
    toast.success("Role deleted");
  };

  const getPermsForRole = (roleName: string) => {
    if (rolePerms[roleName]) return rolePerms[roleName];
    return defaultPerms(roleName);
  };

  const countPerms = (roleName: string) => {
    const p = getPermsForRole(roleName);
    let total = 0;
    Object.values(p).forEach(mod => Object.values(mod).forEach(v => { if (v) total++; }));
    return total;
  };

  const togglePerm = (roleName: string, mod: string, perm: string) => {
    const current = getPermsForRole(roleName);
    const updated = { ...current, [mod]: { ...current[mod], [perm]: !current[mod][perm] } };
    setRolePerms(prev => ({ ...prev, [roleName]: updated }));
  };

  const toggleAllModule = (roleName: string, mod: string) => {
    const current = getPermsForRole(roleName);
    const allChecked = PERMS.every(p => current[mod][p]);
    const updated = { ...current, [mod]: Object.fromEntries(PERMS.map(p => [p, !allChecked])) };
    setRolePerms(prev => ({ ...prev, [roleName]: updated }));
  };

  const allRolesDisplay = [
    { name: "Admin", desc: "Full system access", count: adminCount, color: "text-orange-700 dark:text-orange-400" },
    { name: "Customer", desc: "Customer portal access", count: customerCount, color: "text-blue-700 dark:text-blue-400" },
    ...customRoles.map((r) => ({ name: r.name, desc: r.desc, count: 0, color: "text-violet-700 dark:text-violet-400" })),
  ];

  if (loading) return <div className="flex justify-center py-20"><Loader2 className="animate-spin text-primary" size={32} /></div>;

  return (
    <div>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h2 className="font-heading text-2xl font-bold text-foreground">User Management</h2>
          <p className="text-sm text-muted-foreground">Manage users and assign roles</p>
        </div>
        <Button onClick={() => setShowCreateUser(true)} className="bg-primary text-primary-foreground hover:bg-primary/90 gap-2">
          <Plus size={16} /> Create User
        </Button>
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
      <div className="mb-4">
        <div className="flex items-center gap-3">
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
      <div className="mb-4">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-violet-100 dark:bg-violet-500/15 flex items-center justify-center">
            <Shield size={16} className="text-violet-600" />
          </div>
          <div>
            <h3 className="font-heading text-base font-bold text-foreground">Roles Management</h3>
            <p className="text-xs text-muted-foreground">Create and manage user roles</p>
          </div>
        </div>
      </div>

      {/* Create New Role Form */}
      <div className="bg-card rounded-2xl border border-border shadow-sm p-6 mb-6">
        <h4 className="font-heading text-sm font-bold text-foreground mb-4">Create New Role</h4>
        <div className="space-y-4">
          <div>
            <Label className="text-xs font-semibold text-foreground">Role Name *</Label>
            <Input placeholder="Enter role name" className="mt-1.5 bg-muted/50"
              value={newRoleName} onChange={(e) => setNewRoleName(e.target.value)} />
          </div>
          <div>
            <Label className="text-xs font-semibold text-foreground">Description</Label>
            <Textarea placeholder="Enter role description" className="mt-1.5 bg-muted/50" rows={3}
              value={newRoleDesc} onChange={(e) => setNewRoleDesc(e.target.value)} />
          </div>
          <div className="flex items-center justify-end gap-3">
            <Button variant="outline" size="sm" onClick={() => { setNewRoleName(""); setNewRoleDesc(""); }}>Cancel</Button>
            <Button size="sm" className="bg-primary text-primary-foreground hover:bg-primary/90 gap-2" onClick={handleCreateRole}>
              Create Role
            </Button>
          </div>
        </div>
      </div>

      {/* Roles Table */}
      <div className="bg-card rounded-2xl border border-border shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b-2 border-primary/30 bg-muted/50">
                <th className="text-left px-5 py-3 font-bold text-primary text-xs underline underline-offset-2">Role Name</th>
                <th className="text-left px-5 py-3 font-bold text-primary text-xs underline underline-offset-2">Description</th>
                <th className="text-left px-5 py-3 font-bold text-primary text-xs underline underline-offset-2">Permissions</th>
                <th className="text-right px-5 py-3 font-bold text-primary text-xs underline underline-offset-2">Actions</th>
              </tr>
            </thead>
            <tbody>
              {allRolesDisplay.map((role) => {
                const permCount = countPerms(role.name);
                const totalPossible = MODULES.length * PERMS.length;
                const isExpanded = expandedRole === role.name;
                return (
                  <React.Fragment key={role.name}>
                    <tr className="border-b border-border last:border-0 hover:bg-muted/30 transition-colors">
                      <td className="px-5 py-4">
                        <span className={`font-semibold ${role.color}`}>{role.name}</span>
                      </td>
                      <td className="px-5 py-4 text-muted-foreground">{role.desc || "—"}</td>
                      <td className="px-5 py-4">
                        <button onClick={() => setExpandedRole(isExpanded ? null : role.name)}
                          className="flex items-center gap-2 hover:opacity-80 transition-opacity cursor-pointer">
                          <div className="w-6 h-6 rounded-full bg-muted flex items-center justify-center">
                            <Shield size={12} className="text-muted-foreground" />
                          </div>
                          <span className="text-foreground font-medium text-sm">{permCount}/{totalPossible}</span>
                          {isExpanded ? <ChevronUp size={14} className="text-muted-foreground" /> : <ChevronDown size={14} className="text-muted-foreground" />}
                        </button>
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex items-center justify-end gap-1.5">
                          <button className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors">
                            <Pencil size={14} />
                          </button>
                          <button onClick={() => handleDeleteRole(role.name)}
                            className="p-1.5 rounded-lg text-destructive/70 hover:text-destructive hover:bg-destructive/10 transition-colors">
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                    <AnimatePresence>
                      {isExpanded && (
                        <tr>
                          <td colSpan={4} className="p-0">
                            <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.2 }}
                              className="overflow-hidden">
                              <div className="px-5 py-4 bg-muted/20 border-b border-border">
                                <table className="w-full text-xs">
                                  <thead>
                                    <tr className="border-b border-border">
                                      <th className="text-left py-2 px-3 font-semibold text-muted-foreground">Module</th>
                                      {PERMS.map(p => (
                                        <th key={p} className="text-center py-2 px-3 font-semibold text-muted-foreground capitalize w-20">{p}</th>
                                      ))}
                                      <th className="text-center py-2 px-3 font-semibold text-muted-foreground w-20">All</th>
                                    </tr>
                                  </thead>
                                  <tbody>
                                    {MODULES.map(mod => {
                                      const perms = getPermsForRole(role.name);
                                      const modPerms = perms[mod] || {};
                                      const allChecked = PERMS.every(p => modPerms[p]);
                                      return (
                                        <tr key={mod} className="border-b border-border/50 last:border-0 hover:bg-muted/30">
                                          <td className="py-2 px-3 font-medium text-foreground">{mod}</td>
                                          {PERMS.map(p => (
                                            <td key={p} className="text-center py-2 px-3">
                                              <button onClick={() => togglePerm(role.name, mod, p)}
                                                className={`w-5 h-5 rounded border inline-flex items-center justify-center transition-colors ${modPerms[p] ? "bg-primary border-primary text-primary-foreground" : "border-border bg-background hover:border-muted-foreground"}`}>
                                                {modPerms[p] && <Check size={12} />}
                                              </button>
                                            </td>
                                          ))}
                                          <td className="text-center py-2 px-3">
                                            <button onClick={() => toggleAllModule(role.name, mod)}
                                              className={`w-5 h-5 rounded border inline-flex items-center justify-center transition-colors ${allChecked ? "bg-primary border-primary text-primary-foreground" : "border-border bg-background hover:border-muted-foreground"}`}>
                                              {allChecked && <Check size={12} />}
                                            </button>
                                          </td>
                                        </tr>
                                      );
                                    })}
                                  </tbody>
                                </table>
                              </div>
                            </motion.div>
                          </td>
                        </tr>
                      )}
                    </AnimatePresence>
                  </React.Fragment>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create User Modal */}
      <AnimatePresence>
        {showCreateUser && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4" onClick={() => setShowCreateUser(false)}>
            <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-card rounded-2xl border border-border shadow-2xl w-full max-w-lg" onClick={(e) => e.stopPropagation()}>
              <div className="flex items-center justify-between p-6 border-b border-border">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center">
                    <UserPlus size={18} className="text-primary" />
                  </div>
                  <div>
                    <h3 className="font-heading text-lg font-bold text-foreground">Create New User</h3>
                    <p className="text-xs text-muted-foreground">Add a new user to the system</p>
                  </div>
                </div>
                <button onClick={() => setShowCreateUser(false)} className="p-2 rounded-lg hover:bg-muted transition-colors text-muted-foreground">
                  <X size={18} />
                </button>
              </div>

              <div className="p-6 space-y-4">
                <div>
                  <Label className="text-xs font-semibold text-foreground">Full Name *</Label>
                  <Input value={userForm.full_name} onChange={(e) => setUserForm({ ...userForm, full_name: e.target.value })}
                    className="mt-1.5 bg-muted/50" placeholder="Enter full name" />
                </div>
                <div>
                  <Label className="text-xs font-semibold text-foreground">Email *</Label>
                  <Input type="email" value={userForm.email} onChange={(e) => setUserForm({ ...userForm, email: e.target.value })}
                    className="mt-1.5 bg-muted/50" placeholder="user@example.com" />
                </div>
                <div>
                  <Label className="text-xs font-semibold text-foreground">Password *</Label>
                  <Input type="password" value={userForm.password} onChange={(e) => setUserForm({ ...userForm, password: e.target.value })}
                    className="mt-1.5 bg-muted/50" placeholder="Min 6 characters" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-xs font-semibold text-foreground">Phone</Label>
                    <Input value={userForm.phone} onChange={(e) => setUserForm({ ...userForm, phone: e.target.value })}
                      className="mt-1.5 bg-muted/50" placeholder="+880..." />
                  </div>
                  <div>
                    <Label className="text-xs font-semibold text-foreground">Role</Label>
                    <Select value={userForm.role} onValueChange={(v: "admin" | "customer") => setUserForm({ ...userForm, role: v })}>
                      <SelectTrigger className="mt-1.5 bg-muted/50"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="customer">Customer</SelectItem>
                        <SelectItem value="admin">Admin</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 p-6 border-t border-border">
                <Button variant="outline" onClick={() => setShowCreateUser(false)}>Cancel</Button>
                <Button onClick={handleCreateUser} disabled={creating} className="bg-primary text-primary-foreground hover:bg-primary/90 gap-2">
                  {creating ? <Loader2 size={14} className="animate-spin" /> : <Plus size={14} />}
                  Create User
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default AdminRoles;
