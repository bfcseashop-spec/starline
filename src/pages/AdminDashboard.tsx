import { useAuth } from "@/hooks/useAuth";
import { Bell, Search } from "lucide-react";
import AdminSidebar from "@/components/admin/AdminSidebar";
import StatCard from "@/components/admin/StatCard";
import DonutWidget from "@/components/admin/DonutWidget";
import BarWidget from "@/components/admin/BarWidget";
import LineWidget from "@/components/admin/LineWidget";
import ListWidget from "@/components/admin/ListWidget";

const AdminDashboard = () => {
  const { user } = useAuth();

  return (
    <div className="flex min-h-screen bg-background">
      <AdminSidebar />

      <div className="flex-1 flex flex-col min-w-0">
        {/* Top header */}
        <header className="bg-card border-b border-border px-6 h-16 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <h1 className="font-heading text-xl font-bold text-foreground">Portfolio</h1>
            <span className="bg-destructive text-destructive-foreground text-[10px] font-semibold px-2 py-0.5 rounded uppercase">Admin</span>
          </div>
          <div className="flex items-center gap-4">
            <div className="hidden md:flex items-center gap-2 bg-muted rounded-lg px-3 py-2">
              <Search size={14} className="text-muted-foreground" />
              <input placeholder="Search portfolio..." className="bg-transparent text-sm outline-none w-40 text-foreground placeholder:text-muted-foreground" />
            </div>
            <button className="relative text-muted-foreground hover:text-foreground transition-colors">
              <Bell size={18} />
              <span className="absolute -top-1 -right-1 w-4 h-4 bg-destructive text-destructive-foreground text-[9px] rounded-full flex items-center justify-center font-bold">3</span>
            </button>
            <span className="text-sm text-muted-foreground hidden sm:block">{user?.email}</span>
          </div>
        </header>

        {/* Dashboard content */}
        <main className="flex-1 p-6 overflow-y-auto">
          {/* Stat cards */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4 mb-6">
            <StatCard value={124} label="properties" color="hsl(220, 60%, 55%)" />
            <StatCard value={18} label="new inquiries" color="hsl(30, 90%, 60%)" />
            <StatCard value="$2.4M" label="revenue" color="hsl(145, 60%, 45%)" />
            <StatCard value={7} label="pending payments" color="hsl(0, 70%, 60%)" />
            <StatCard value={32} label="customers" color="hsl(270, 60%, 60%)" />
            <StatCard value={46} label="documents" color="hsl(190, 60%, 50%)" />
          </div>

          {/* Row 1: Active Jobs, Keys, Invoice, Inbox, Tasks */}
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-5 gap-4 mb-4">
            <DonutWidget
              title="Active Listings"
              total={22}
              data={[
                { name: "for sale", value: 8, color: "hsl(30, 90%, 60%)" },
                { name: "rented", value: 2, color: "hsl(42, 80%, 65%)" },
                { name: "approved", value: 6, color: "hsl(145, 60%, 45%)" },
                { name: "pending", value: 6, color: "hsl(220, 60%, 55%)" },
              ]}
            />
            <ListWidget
              title="Keys"
              items={[
                { label: "Checked out", value: 12 },
                { label: "Overdue", value: 4, color: "hsl(0, 70%, 60%)" },
                { label: "Due today", value: 1 },
              ]}
            />
            <ListWidget
              title="Payment Arrears"
              items={[
                { label: "14+ days overdue", value: "1%", color: "hsl(0, 70%, 60%)" },
                { label: "Due today", value: "4%" },
                { label: "Total outstanding", value: "$3.1k", color: "hsl(0, 70%, 60%)" },
              ]}
            />
            <ListWidget
              title="Inbox"
              items={[
                { label: "Unread", value: 72 },
                { label: "Open", value: 18, color: "hsl(145, 60%, 45%)" },
                { label: "Pending", value: 54, color: "hsl(42, 80%, 65%)" },
              ]}
            />
            <ListWidget
              title="Inspection Tasks"
              items={[
                { label: "Agent overdue", value: 30, color: "hsl(0, 70%, 60%)" },
                { label: "Due today", value: 121 },
                { label: "Not returned", value: 9, color: "hsl(0, 70%, 60%)" },
                { label: "Returned", value: 4, color: "hsl(145, 60%, 45%)" },
              ]}
            />
          </div>

          {/* Row 2: Line charts + bar chart */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <LineWidget
              title="Tenants in Arrears"
              subtitle="arrears rate"
              subtitleValue="5%"
              lineColor="hsl(0, 70%, 65%)"
              data={[
                { name: "1", value: 3.2 }, { name: "5", value: 3.8 }, { name: "9", value: 3.5 },
                { name: "13", value: 4.2 }, { name: "17", value: 3.9 }, { name: "21", value: 4.5 },
                { name: "25", value: 4.0 }, { name: "29", value: 3.7 }, { name: "31", value: 3.4 },
              ]}
            />
            <LineWidget
              title="All Vacancies"
              subtitle="current vacancy"
              subtitleValue="2%"
              lineColor="hsl(220, 15%, 60%)"
              data={[
                { name: "May", value: 2.5 }, { name: "Jun", value: 2.8 }, { name: "Jul", value: 3.0 },
                { name: "Aug", value: 2.7 },
              ]}
            />
            <BarWidget
              title="Property Reviews"
              barColor="hsl(220, 60%, 55%)"
              data={[
                { name: "Overdue", value: 8 },
                { name: "7 days", value: 2 },
                { name: "8-14 days", value: 6 },
              ]}
            />
          </div>

          {/* Row 3: Donuts */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <DonutWidget
              title="Renewals"
              total={32}
              data={[
                { name: "to do", value: 14, color: "hsl(30, 90%, 60%)" },
                { name: "with owner", value: 8, color: "hsl(25, 70%, 50%)" },
                { name: "with tenant", value: 6, color: "hsl(42, 80%, 65%)" },
                { name: "signed", value: 4, color: "hsl(42, 50%, 80%)" },
              ]}
            />
            <DonutWidget
              title="Inspection Planning"
              total={188}
              data={[
                { name: "overdue", value: 92, color: "hsl(90, 40%, 40%)" },
                { name: "due within 30 days", value: 96, color: "hsl(145, 60%, 45%)" },
              ]}
            />
            <DonutWidget
              title="Compliance"
              total={190}
              data={[
                { name: "overdue", value: 23, color: "hsl(160, 40%, 40%)" },
                { name: "due today", value: 72, color: "hsl(220, 60%, 55%)" },
                { name: "expired", value: 95, color: "hsl(220, 15%, 75%)" },
              ]}
            />
          </div>

          {/* Row 4: Tasks, Reconciliation, Expiring */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <DonutWidget
              title="Tasks"
              total={155}
              data={[
                { name: "overdue", value: 148, color: "hsl(220, 60%, 55%)" },
                { name: "due today", value: 7, color: "hsl(190, 60%, 55%)" },
              ]}
            />
            <div className="bg-card rounded-xl border border-border p-5 flex flex-col items-center justify-center text-center">
              <h3 className="text-sm font-semibold text-card-foreground mb-4">Reconciliation</h3>
              <p className="font-heading text-xl font-bold text-gold mb-1">Reconciled</p>
              <p className="text-muted-foreground text-xs mb-5">all up to date</p>
              <button className="bg-gold-gradient text-accent-foreground px-5 py-2 rounded-lg text-sm font-semibold hover:opacity-90 transition-opacity w-full">
                Process 0 Items
              </button>
            </div>
            <BarWidget
              title="Expiring Contracts"
              barColor="hsl(0, 60%, 55%)"
              data={[
                { name: "0-30d", value: 15 },
                { name: "31-60d", value: 14 },
                { name: "61-90d", value: 13 },
              ]}
            />
          </div>
        </main>
      </div>
    </div>
  );
};

export default AdminDashboard;
