import { Link, useLocation } from "react-router-dom";
import {
  LayoutDashboard, Home, Users, FileText, BarChart3, Settings, MessageSquare,
  CreditCard, FolderOpen, KeyRound, ClipboardList, LogOut, ChevronLeft, ChevronRight,
} from "lucide-react";
import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";

const navItems = [
  { icon: LayoutDashboard, label: "Dashboard", path: "/admin" },
  { icon: Home, label: "Properties", path: "/admin/properties" },
  { icon: Users, label: "Customers", path: "/admin/customers" },
  { icon: MessageSquare, label: "Inquiries", path: "/admin/inquiries" },
  { icon: CreditCard, label: "Payments", path: "/admin/payments" },
  { icon: FolderOpen, label: "Documents", path: "/admin/documents" },
  { icon: KeyRound, label: "Keys", path: "/admin/keys" },
  { icon: ClipboardList, label: "Tasks", path: "/admin/tasks" },
  { icon: FileText, label: "Reports", path: "/admin/reports" },
  { icon: BarChart3, label: "Analytics", path: "/admin/analytics" },
  { icon: Settings, label: "Settings", path: "/admin/settings" },
];

const AdminSidebar = () => {
  const [collapsed, setCollapsed] = useState(false);
  const location = useLocation();
  const { signOut } = useAuth();

  return (
    <aside
      className={`bg-primary border-r border-navy-light flex flex-col h-screen sticky top-0 transition-all duration-300 ${
        collapsed ? "w-16" : "w-56"
      }`}
    >
      {/* Brand */}
      <div className="px-4 h-16 flex items-center justify-between border-b border-navy-light shrink-0">
        {!collapsed && (
          <Link to="/" className="font-heading text-lg font-bold text-primary-foreground truncate">
            Starline<span className="text-gold"> Ltd.</span>
          </Link>
        )}
        <button onClick={() => setCollapsed(!collapsed)} className="text-primary-foreground/60 hover:text-gold transition-colors ml-auto">
          {collapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
        </button>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto py-3 px-2 space-y-0.5">
        {navItems.map((item) => {
          const active = location.pathname === item.path;
          return (
            <Link
              key={item.path}
              to={item.path}
              title={collapsed ? item.label : undefined}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                active
                  ? "bg-sidebar-accent text-gold"
                  : "text-primary-foreground/60 hover:text-primary-foreground hover:bg-sidebar-accent/50"
              }`}
            >
              <item.icon size={18} className="shrink-0" />
              {!collapsed && <span className="truncate">{item.label}</span>}
            </Link>
          );
        })}
      </nav>

      {/* Sign out */}
      <div className="px-2 pb-4 shrink-0">
        <button
          onClick={signOut}
          className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-primary-foreground/60 hover:text-destructive hover:bg-sidebar-accent/50 transition-colors w-full"
        >
          <LogOut size={18} className="shrink-0" />
          {!collapsed && <span>Sign Out</span>}
        </button>
      </div>
    </aside>
  );
};

export default AdminSidebar;
