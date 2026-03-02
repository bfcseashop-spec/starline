import { Link, useLocation } from "react-router-dom";
import {
  LayoutDashboard, Home, Users, FileText, BarChart3, Settings, MessageSquare,
  CreditCard, FolderOpen, KeyRound, ClipboardList, LogOut, ChevronLeft, ChevronRight, Sparkles,
} from "lucide-react";
import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";

const navItems = [
  { icon: LayoutDashboard, label: "Dashboard", path: "/admin", gradient: "bg-dash-blue" },
  { icon: Home, label: "Properties", path: "/admin/properties", gradient: "bg-dash-orange" },
  { icon: Users, label: "Customers", path: "/admin/customers", gradient: "bg-dash-green" },
  { icon: MessageSquare, label: "Inquiries", path: "/admin/inquiries", gradient: "bg-dash-purple" },
  { icon: CreditCard, label: "Payments", path: "/admin/payments", gradient: "bg-dash-teal" },
  { icon: FolderOpen, label: "Documents", path: "/admin/documents", gradient: "bg-dash-pink" },
  { icon: KeyRound, label: "Keys", path: "/admin/keys", gradient: "bg-dash-blue" },
  { icon: ClipboardList, label: "Tasks", path: "/admin/tasks", gradient: "bg-dash-orange" },
  { icon: FileText, label: "Reports", path: "/admin/reports", gradient: "bg-dash-green" },
  { icon: BarChart3, label: "Analytics", path: "/admin/analytics", gradient: "bg-dash-purple" },
  { icon: Settings, label: "Settings", path: "/admin/settings", gradient: "bg-dash-teal" },
];

const AdminSidebar = () => {
  const [collapsed, setCollapsed] = useState(false);
  const location = useLocation();
  const { signOut, user } = useAuth();

  return (
    <aside
      className={`bg-sidebar-gradient border-r-0 flex flex-col h-screen sticky top-0 transition-all duration-300 ${
        collapsed ? "w-[68px]" : "w-60"
      }`}
    >
      {/* Brand */}
      <div className="px-4 h-16 flex items-center gap-3 border-b border-white/5 shrink-0">
        <div className="w-9 h-9 rounded-xl bg-gold-gradient flex items-center justify-center shrink-0">
          <Sparkles size={18} className="text-accent-foreground" />
        </div>
        {!collapsed && (
          <Link to="/" className="font-heading text-base font-bold text-sidebar-foreground truncate">
            Starline<span className="text-gold"> Ltd.</span>
          </Link>
        )}
        <button onClick={() => setCollapsed(!collapsed)} className="text-sidebar-foreground/40 hover:text-gold transition-colors ml-auto">
          {collapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
        </button>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto py-4 px-2 space-y-1">
        {navItems.map((item) => {
          const active = location.pathname === item.path;
          return (
            <Link
              key={item.path}
              to={item.path}
              title={collapsed ? item.label : undefined}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ${
                active
                  ? "bg-sidebar-accent text-sidebar-accent-foreground shadow-lg shadow-black/20"
                  : "text-sidebar-foreground/50 hover:text-sidebar-foreground hover:bg-sidebar-accent/40"
              }`}
            >
              <div className={`p-1.5 rounded-lg shrink-0 ${active ? item.gradient : ""}`}>
                <item.icon size={16} className={active ? "text-white" : ""} />
              </div>
              {!collapsed && <span className="truncate">{item.label}</span>}
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="px-2 pb-4 shrink-0 space-y-2">
        {!collapsed && (
          <div className="bg-white/5 rounded-xl p-3">
            <p className="text-[11px] text-sidebar-foreground/40 truncate">Signed in as</p>
            <p className="text-xs text-sidebar-foreground/70 truncate font-medium">{user?.email}</p>
          </div>
        )}
        <button
          onClick={signOut}
          className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-sidebar-foreground/50 hover:text-red-400 hover:bg-red-500/10 transition-all w-full"
        >
          <LogOut size={16} className="shrink-0" />
          {!collapsed && <span>Sign Out</span>}
        </button>
      </div>
    </aside>
  );
};

export default AdminSidebar;
