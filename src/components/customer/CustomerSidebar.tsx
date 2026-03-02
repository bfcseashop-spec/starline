import { Link } from "react-router-dom";
import { Home, HardHat, CreditCard, FileText, User, LogOut, Banknote } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarFooter,
  SidebarHeader,
  useSidebar,
} from "@/components/ui/sidebar";

type Tab = "overview" | "projects" | "payments" | "documents" | "pay" | "profile";

const menuItems = [
  { id: "overview" as Tab, label: "Overview", icon: Home },
  { id: "projects" as Tab, label: "My Building", icon: HardHat },
  { id: "payments" as Tab, label: "Payments", icon: CreditCard },
  { id: "documents" as Tab, label: "Documents", icon: FileText },
  { id: "pay" as Tab, label: "Make Payment", icon: Banknote },
  { id: "profile" as Tab, label: "Profile", icon: User },
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
    <Sidebar collapsible="icon" className="border-r border-border">
      <SidebarHeader className="p-4">
        <Link to="/" className="font-heading text-lg font-bold text-foreground truncate">
          {collapsed ? (
            <span className="text-gold text-xl">S</span>
          ) : (
            <>Starline Builder's<span className="text-gold"> Ltd.</span></>
          )}
        </Link>
        {!collapsed && (
          <span className="text-muted-foreground text-xs mt-1 block truncate">Customer Portal</span>
        )}
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Menu</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {menuItems.map((item) => (
                <SidebarMenuItem key={item.id}>
                  <SidebarMenuButton
                    onClick={() => onTabChange(item.id)}
                    isActive={activeTab === item.id}
                    tooltip={item.label}
                  >
                    <item.icon className="h-4 w-4" />
                    <span>{item.label}</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="p-4">
        {!collapsed && (
          <p className="text-xs text-muted-foreground truncate mb-2">{user?.email}</p>
        )}
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton onClick={signOut} tooltip="Sign Out" className="text-muted-foreground hover:text-destructive">
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
