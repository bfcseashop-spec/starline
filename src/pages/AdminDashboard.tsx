import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { Bell, Search, Home, Users, DollarSign, AlertTriangle, FileText, BarChart3 } from "lucide-react";
import { motion } from "framer-motion";
import AdminSidebar from "@/components/admin/AdminSidebar";
import type { AdminPage } from "@/components/admin/AdminSidebar";
import StatCard from "@/components/admin/StatCard";
import DonutWidget from "@/components/admin/DonutWidget";
import BarWidget from "@/components/admin/BarWidget";
import LineWidget from "@/components/admin/LineWidget";
import ListWidget from "@/components/admin/ListWidget";
import AdminCustomers from "@/components/admin/AdminCustomers";
import AdminProjects from "@/components/admin/AdminProjects";
import AdminPayments from "@/components/admin/AdminPayments";
import AdminImages from "@/components/admin/AdminImages";
import AdminWorkUpdates from "@/components/admin/AdminWorkUpdates";
import AdminDocuments from "@/components/admin/AdminDocuments";

const pageTitle: Record<AdminPage, string> = {
  dashboard: "Dashboard",
  customers: "Customers",
  projects: "Projects",
  payments: "Payments",
  images: "Project Images",
  work_updates: "Work Updates",
  documents: "Documents",
  settings: "Settings",
};

const AdminDashboard = () => {
  const { user } = useAuth();
  const [activePage, setActivePage] = useState<AdminPage>("dashboard");

  return (
    <div className="flex min-h-screen bg-background">
      <AdminSidebar activePage={activePage} onPageChange={setActivePage} />

      <div className="flex-1 flex flex-col min-w-0">
        {/* Top header */}
        <header className="bg-card/80 backdrop-blur-sm border-b border-border px-6 h-16 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <h1 className="font-heading text-xl font-bold text-foreground">{pageTitle[activePage]}</h1>
            <span className="bg-dash-blue text-white text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider">Admin</span>
          </div>
          <div className="flex items-center gap-4">
            <div className="hidden md:flex items-center gap-2 bg-muted rounded-full px-4 py-2">
              <Search size={14} className="text-muted-foreground" />
              <input placeholder="Search..." className="bg-transparent text-sm outline-none w-36 text-foreground placeholder:text-muted-foreground" />
            </div>
            <button className="relative text-muted-foreground hover:text-foreground transition-colors p-2 rounded-full hover:bg-muted">
              <Bell size={18} />
              <span className="absolute top-1 right-1 w-4 h-4 bg-dash-pink text-white text-[9px] rounded-full flex items-center justify-center font-bold">3</span>
            </button>
            <div className="hidden sm:flex items-center gap-2 bg-muted rounded-full px-4 py-2">
              <div className="w-2 h-2 rounded-full bg-dash-green animate-pulse" />
              <span className="text-xs text-muted-foreground font-medium">{user?.email}</span>
            </div>
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 p-6 lg:p-8 overflow-y-auto">
          <motion.div key={activePage} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2 }}>
            {activePage === "dashboard" && <DashboardContent />}
            {activePage === "customers" && <AdminCustomers />}
            {activePage === "projects" && <AdminProjects />}
            {activePage === "payments" && <AdminPayments />}
            {activePage === "images" && <AdminImages />}
            {activePage === "work_updates" && <AdminWorkUpdates />}
            {activePage === "documents" && <AdminDocuments />}
            {activePage === "settings" && <ComingSoon label="Settings" />}
          </motion.div>
        </main>
      </div>
    </div>
  );
};

const ComingSoon = ({ label }: { label: string }) => (
  <div className="text-center py-20 text-muted-foreground">
    <p className="font-heading text-xl font-bold text-foreground mb-2">{label}</p>
    <p>This section is coming soon.</p>
  </div>
);

const DashboardContent = () => (
  <>
    {/* Stat cards */}
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4 mb-6">
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0 }}>
        <StatCard value={124} label="properties" color="" gradient="bg-dash-blue" icon={<Home size={18} className="text-white/80" />} />
      </motion.div>
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}>
        <StatCard value={18} label="new inquiries" color="" gradient="bg-dash-orange" icon={<BarChart3 size={18} className="text-white/80" />} />
      </motion.div>
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
        <StatCard value="$2.4M" label="revenue" color="" gradient="bg-dash-green" icon={<DollarSign size={18} className="text-white/80" />} />
      </motion.div>
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
        <StatCard value={7} label="pending payments" color="" gradient="bg-dash-pink" icon={<AlertTriangle size={18} className="text-white/80" />} />
      </motion.div>
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
        <StatCard value={32} label="customers" color="" gradient="bg-dash-purple" icon={<Users size={18} className="text-white/80" />} />
      </motion.div>
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}>
        <StatCard value={46} label="documents" color="" gradient="bg-dash-teal" icon={<FileText size={18} className="text-white/80" />} />
      </motion.div>
    </div>

    {/* Row 1 */}
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-5 gap-4 mb-4">
      <DonutWidget title="Active Listings" total={22} data={[
        { name: "for sale", value: 8, color: "hsl(25, 95%, 60%)" },
        { name: "rented", value: 2, color: "hsl(42, 80%, 65%)" },
        { name: "approved", value: 6, color: "hsl(152, 69%, 50%)" },
        { name: "pending", value: 6, color: "hsl(217, 91%, 60%)" },
      ]} />
      <ListWidget title="Keys" items={[
        { label: "Checked out", value: 12 },
        { label: "Overdue", value: 4, color: "hsl(340, 82%, 62%)" },
        { label: "Due today", value: 1 },
      ]} />
      <ListWidget title="Payment Arrears" items={[
        { label: "14+ days overdue", value: "1%", color: "hsl(340, 82%, 62%)" },
        { label: "Due today", value: "4%" },
        { label: "Total outstanding", value: "$3.1k", color: "hsl(25, 95%, 60%)" },
      ]} />
      <ListWidget title="Inbox" items={[
        { label: "Unread", value: 72 },
        { label: "Open", value: 18, color: "hsl(152, 69%, 50%)" },
        { label: "Pending", value: 54, color: "hsl(42, 80%, 65%)" },
      ]} />
      <ListWidget title="Inspection Tasks" items={[
        { label: "Agent overdue", value: 30, color: "hsl(340, 82%, 62%)" },
        { label: "Due today", value: 121 },
        { label: "Not returned", value: 9, color: "hsl(25, 95%, 60%)" },
        { label: "Returned", value: 4, color: "hsl(152, 69%, 50%)" },
      ]} />
    </div>

    {/* Row 2 */}
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
      <LineWidget title="Tenants in Arrears" subtitle="arrears rate" subtitleValue="5%" lineColor="hsl(340, 82%, 62%)" data={[
        { name: "1", value: 3.2 }, { name: "5", value: 3.8 }, { name: "9", value: 3.5 },
        { name: "13", value: 4.2 }, { name: "17", value: 3.9 }, { name: "21", value: 4.5 },
        { name: "25", value: 4.0 }, { name: "29", value: 3.7 }, { name: "31", value: 3.4 },
      ]} />
      <LineWidget title="All Vacancies" subtitle="current vacancy" subtitleValue="2%" lineColor="hsl(217, 91%, 60%)" data={[
        { name: "May", value: 2.5 }, { name: "Jun", value: 2.8 }, { name: "Jul", value: 3.0 }, { name: "Aug", value: 2.7 },
      ]} />
      <BarWidget title="Property Reviews" barColor="hsl(262, 83%, 65%)" data={[
        { name: "Overdue", value: 8 }, { name: "7 days", value: 2 }, { name: "8-14 days", value: 6 },
      ]} />
    </div>

    {/* Row 3 */}
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
      <DonutWidget title="Renewals" total={32} data={[
        { name: "to do", value: 14, color: "hsl(25, 95%, 60%)" },
        { name: "with owner", value: 8, color: "hsl(262, 83%, 65%)" },
        { name: "with tenant", value: 6, color: "hsl(217, 91%, 60%)" },
        { name: "signed", value: 4, color: "hsl(152, 69%, 50%)" },
      ]} />
      <DonutWidget title="Inspection Planning" total={188} data={[
        { name: "overdue", value: 92, color: "hsl(25, 95%, 60%)" },
        { name: "due within 30 days", value: 96, color: "hsl(152, 69%, 50%)" },
      ]} />
      <DonutWidget title="Compliance" total={190} data={[
        { name: "overdue", value: 23, color: "hsl(340, 82%, 62%)" },
        { name: "due today", value: 72, color: "hsl(217, 91%, 60%)" },
        { name: "expired", value: 95, color: "hsl(174, 72%, 46%)" },
      ]} />
    </div>

    {/* Row 4 */}
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      <DonutWidget title="Tasks" total={155} data={[
        { name: "overdue", value: 148, color: "hsl(262, 83%, 65%)" },
        { name: "due today", value: 7, color: "hsl(174, 72%, 46%)" },
      ]} />
      <div className="bg-card rounded-2xl border border-border p-5 flex flex-col items-center justify-center text-center shadow-sm">
        <h3 className="text-sm font-semibold text-card-foreground mb-4">Reconciliation</h3>
        <p className="font-heading text-xl font-bold text-gold mb-1">Reconciled</p>
        <p className="text-muted-foreground text-xs mb-5">all up to date</p>
        <button className="bg-gold-gradient text-accent-foreground px-5 py-2.5 rounded-xl text-sm font-semibold hover:opacity-90 transition-opacity w-full shadow-md">
          Process 0 Items
        </button>
      </div>
      <BarWidget title="Expiring Contracts" barColor="hsl(340, 82%, 62%)" data={[
        { name: "0-30d", value: 15 }, { name: "31-60d", value: 14 }, { name: "61-90d", value: 13 },
      ]} />
    </div>
  </>
);

export default AdminDashboard;
