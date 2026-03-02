import { useState, useEffect } from "react";
import { HardHat, CreditCard, FileText, User, Clock, ChevronRight, Wallet, BadgeDollarSign, TrendingDown, CalendarClock, Banknote } from "lucide-react";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import CustomerSidebar from "@/components/customer/CustomerSidebar";
import CustomerProfile from "@/components/customer/CustomerProfile";
import CustomerProjects from "@/components/customer/CustomerProjects";
import CustomerPayments from "@/components/customer/CustomerPayments";
import CustomerDocuments from "@/components/customer/CustomerDocuments";
import CustomerPaymentMethods from "@/components/customer/CustomerPaymentMethods";

type Tab = "overview" | "profile" | "projects" | "payments" | "documents" | "pay";

const CustomerDashboard = () => {
  const [activeTab, setActiveTab] = useState<Tab>("overview");

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-background">
        <CustomerSidebar activeTab={activeTab} onTabChange={setActiveTab} />

        <div className="flex-1 flex flex-col min-w-0">
          <header className="h-14 flex items-center border-b border-border px-4 bg-card">
            <SidebarTrigger className="mr-4" />
            <h2 className="font-heading text-lg font-semibold text-foreground truncate">
              {activeTab === "overview" && "Overview"}
              {activeTab === "projects" && "My Building"}
              {activeTab === "payments" && "Payments"}
              {activeTab === "documents" && "Documents"}
              {activeTab === "pay" && "Make Payment"}
              {activeTab === "profile" && "Profile"}
            </h2>
          </header>

          <main className="flex-1 p-4 sm:p-6 overflow-auto">
            {activeTab === "overview" && <OverviewTab onNavigate={setActiveTab} />}
            {activeTab === "profile" && <CustomerProfile />}
            {activeTab === "projects" && <CustomerProjects />}
            {activeTab === "payments" && <CustomerPayments />}
            {activeTab === "documents" && <CustomerDocuments />}
            {activeTab === "pay" && <CustomerPaymentMethods />}
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
};

const OverviewTab = ({ onNavigate }: { onNavigate: (tab: Tab) => void }) => {
  const { user } = useAuth();
  const [financials, setFinancials] = useState({
    totalAmount: 0,
    paidAmount: 0,
    remainingBalance: 0,
    monthlyInstallment: 0,
  });
  const [loadingFinancials, setLoadingFinancials] = useState(true);

  useEffect(() => {
    if (!user) return;
    const fetchFinancials = async () => {
      const { data } = await supabase
        .from("customer_projects")
        .select("total_amount, paid_amount, monthly_installment")
        .eq("user_id", user.id);

      if (data && data.length > 0) {
        const totals = data.reduce(
          (acc, p) => ({
            totalAmount: acc.totalAmount + Number(p.total_amount),
            paidAmount: acc.paidAmount + Number(p.paid_amount),
            monthlyInstallment: acc.monthlyInstallment + Number(p.monthly_installment),
          }),
          { totalAmount: 0, paidAmount: 0, monthlyInstallment: 0 }
        );
        setFinancials({
          ...totals,
          remainingBalance: totals.totalAmount - totals.paidAmount,
        });
      }
      setLoadingFinancials(false);
    };
    fetchFinancials();
  }, [user]);

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat("en-BD", { style: "currency", currency: "BDT", maximumFractionDigits: 0 }).format(amount);

  const statCards = [
    { label: "Total Amount", value: formatCurrency(financials.totalAmount), icon: Wallet, color: "bg-primary/10 text-primary" },
    { label: "Paid Amount", value: formatCurrency(financials.paidAmount), icon: BadgeDollarSign, color: "bg-green-500/10 text-green-600" },
    { label: "Remaining Balance", value: formatCurrency(financials.remainingBalance), icon: TrendingDown, color: "bg-destructive/10 text-destructive" },
    { label: "Monthly Installment", value: formatCurrency(financials.monthlyInstallment), icon: CalendarClock, color: "bg-accent/20 text-accent-foreground" },
  ];

  const navCards = [
    { icon: HardHat, label: "My Building", desc: "View building progress & work updates", tab: "projects" as Tab },
    { icon: CreditCard, label: "Payments", desc: "Total, paid, due amounts & history", tab: "payments" as Tab },
    { icon: FileText, label: "Documents", desc: "Contracts, receipts & agreements", tab: "documents" as Tab },
    { icon: Banknote, label: "Make Payment", desc: "Bank accounts & payment options", tab: "pay" as Tab },
    { icon: User, label: "Profile", desc: "Edit your personal information", tab: "profile" as Tab },
    { icon: Clock, label: "Work Updates", desc: "Latest construction progress", tab: "projects" as Tab },
  ];

  return (
    <div>
      <h1 className="font-heading text-3xl font-bold text-foreground mb-2">Welcome Back!</h1>
      <p className="text-muted-foreground mb-6">Track your building progress, payments, and documents.</p>

      {/* Financial Summary */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {statCards.map((stat) => (
          <div key={stat.label} className="bg-card rounded-xl border border-border p-5">
            <div className="flex items-center gap-3 mb-3">
              <div className={`p-2 rounded-lg ${stat.color}`}>
                <stat.icon size={20} />
              </div>
            </div>
            <p className="text-muted-foreground text-xs font-medium uppercase tracking-wide">{stat.label}</p>
            <p className="font-heading text-xl font-bold text-foreground mt-1">
              {loadingFinancials ? "..." : stat.value}
            </p>
          </div>
        ))}
      </div>

      {/* Quick Navigation */}
      <h2 className="font-heading text-lg font-semibold text-foreground mb-4">Quick Access</h2>
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {navCards.map((card) => (
          <button
            key={card.label + card.tab}
            onClick={() => onNavigate(card.tab)}
            className="bg-card rounded-xl border border-border p-6 hover:border-gold/40 transition-colors text-left group"
          >
            <card.icon size={28} className="text-gold mb-4" />
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-heading text-lg font-semibold text-card-foreground mb-1">{card.label}</h3>
                <p className="text-muted-foreground text-sm">{card.desc}</p>
              </div>
              <ChevronRight size={18} className="text-muted-foreground group-hover:text-gold transition-colors" />
            </div>
          </button>
        ))}
      </div>
    </div>
  );
};

export default CustomerDashboard;
