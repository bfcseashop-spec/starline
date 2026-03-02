import { Link, useLocation } from "react-router-dom";
import {
  LayoutDashboard, Home, Users, FileText, BarChart3, Settings, MessageSquare,
  CreditCard, FolderOpen, Images, ClipboardList, LogOut, ChevronLeft, ChevronRight, Sparkles,
} from "lucide-react";
import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";

type AdminPage = "dashboard" | "customers" | "projects" | "payments" | "images" | "documents" | "settings";

const navItems = [
  { id: "dashboard" as AdminPage, icon: LayoutDashboard, label: "Dashboard", gradient: "bg-dash-blue" },
  { id: "customers" as AdminPage, icon: Users, label: "Customers", gradient: "bg-dash-green" },
  { id: "projects" as AdminPage, icon: Home, label: "Projects", gradient: "bg-dash-orange" },
  { id: "payments" as AdminPage, icon: CreditCard, label: "Payments", gradient: "bg-dash-teal" },
  { id: "images" as AdminPage, icon: Images, label: "Project Images", gradient: "bg-dash-purple" },
  { id: "documents" as AdminPage, icon: FolderOpen, label: "Documents", gradient: "bg-dash-pink" },
  { id: "settings" as AdminPage, icon: Settings, label: "Settings", gradient: "bg-dash-teal" },
];

interface AdminSidebarProps {
  activePage: AdminPage;
  onPageChange: (page: AdminPage) => void;
}

const AdminSidebar = ({ activePage, onPageChange }: AdminSidebarProps) => {
  const [collapsed, setCollapsed] = useState(false);
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
          const active = activePage === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onPageChange(item.id)}
              title={collapsed ? item.label : undefined}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 w-full text-left ${
                active
                  ? "bg-sidebar-accent text-sidebar-accent-foreground shadow-lg shadow-black/20"
                  : "text-sidebar-foreground/50 hover:text-sidebar-foreground hover:bg-sidebar-accent/40"
              }`}
            >
              <div className={`p-1.5 rounded-lg shrink-0 ${active ? item.gradient : ""}`}>
                <item.icon size={16} className={active ? "text-white" : ""} />
              </div>
              {!collapsed && <span className="truncate">{item.label}</span>}
            </button>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="px-2 pb-4 shrink-0 space-y-2">
        {!collapsed && (
          <div className="bg-white/5 rounded-xl p-3">
            <p className="text-[11px] text-sidebar-foreground/40 truncate">Admin</p>
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
export type { AdminPage };
