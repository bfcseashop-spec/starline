import { Link } from "react-router-dom";
import { Home, HardHat, CreditCard, FileText, User, LogOut, Banknote, Sparkles } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarFooter,
  SidebarHeader,
  useSidebar,
} from "@/components/ui/sidebar";

type Tab = "overview" | "projects" | "payments" | "documents" | "pay" | "profile";

const menuItems = [
  { id: "overview" as Tab, label: "Overview", icon: Home, gradient: "bg-dash-blue" },
  { id: "projects" as Tab, label: "My Building", icon: HardHat, gradient: "bg-dash-orange" },
  { id: "payments" as Tab, label: "Payments", icon: CreditCard, gradient: "bg-dash-green" },
  { id: "documents" as Tab, label: "Documents", icon: FileText, gradient: "bg-dash-purple" },
  { id: "pay" as Tab, label: "Make Payment", icon: Banknote, gradient: "bg-dash-teal" },
  { id: "profile" as Tab, label: "Profile", icon: User, gradient: "bg-dash-pink" },
];

interface CustomerSidebarProps {
  activeTab: Tab;
  onTabChange: (tab: Tab) => void;
}

const CustomerSidebar = ({ activeTab, onTabChange }: CustomerSidebarProps) => {
  const { user, signOut } = useAuth();
  const { state } = useSidebar();
  const collapsed = state === "collapsed";

  return (
    <Sidebar collapsible="icon" className="border-r-0">
      <SidebarHeader className="p-4 pb-6">
        <Link to="/" className="flex items-center gap-2">
          <div className="w-9 h-9 rounded-xl bg-gold-gradient flex items-center justify-center shrink-0">
            <Sparkles size={18} className="text-accent-foreground" />
          </div>
          {!collapsed && (
            <div>
              <span className="font-heading text-base font-bold text-sidebar-foreground leading-tight block">
                Starline Builder's
              </span>
              <span className="text-[11px] text-sidebar-foreground/50 leading-tight">Customer Portal</span>
            </div>
          )}
        </Link>
      </SidebarHeader>

      <SidebarContent className="px-2">
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu className="space-y-1">
              {menuItems.map((item) => {
                const isActive = activeTab === item.id;
                return (
                  <SidebarMenuItem key={item.id}>
                    <SidebarMenuButton
                      onClick={() => onTabChange(item.id)}
                      isActive={isActive}
                      tooltip={item.label}
                      className={`rounded-xl h-11 transition-all duration-200 ${
                        isActive
                          ? "bg-sidebar-accent text-sidebar-accent-foreground shadow-lg shadow-black/20"
                          : "text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent/50"
                      }`}
                    >
                      <div className={`p-1.5 rounded-lg ${isActive ? item.gradient : ""}`}>
                        <item.icon className={`h-4 w-4 ${isActive ? "text-white" : ""}`} />
                      </div>
                      <span className={`font-medium ${isActive ? "text-sidebar-foreground" : ""}`}>{item.label}</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="p-3">
        {!collapsed && (
          <div className="bg-sidebar-accent/40 rounded-xl p-3 mb-2">
            <p className="text-[11px] text-sidebar-foreground/50 truncate">Signed in as</p>
            <p className="text-xs text-sidebar-foreground/80 truncate font-medium">{user?.email}</p>
          </div>
        )}
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton onClick={signOut} tooltip="Sign Out" className="rounded-xl text-sidebar-foreground/60 hover:text-red-400 hover:bg-red-500/10">
              <LogOut className="h-4 w-4" />
              <span>Sign Out</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
};

export default CustomerSidebar;
