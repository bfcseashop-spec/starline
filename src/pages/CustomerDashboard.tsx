import { useState } from "react";
import { HardHat, CreditCard, FileText, User, Clock, ChevronRight } from "lucide-react";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
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
  const cards = [
    { icon: HardHat, label: "My Building", desc: "View building progress & work updates", tab: "projects" as Tab },
    { icon: CreditCard, label: "Payments", desc: "Total, paid, due amounts & history", tab: "payments" as Tab },
    { icon: FileText, label: "Documents", desc: "Contracts, receipts & agreements", tab: "documents" as Tab },
    { icon: CreditCard, label: "Make Payment", desc: "Bank accounts & payment options", tab: "pay" as Tab },
    { icon: User, label: "Profile", desc: "Edit your personal information", tab: "profile" as Tab },
    { icon: Clock, label: "Work Updates", desc: "Latest construction progress", tab: "projects" as Tab },
  ];

  return (
    <div>
      <h1 className="font-heading text-3xl font-bold text-foreground mb-2">Welcome Back!</h1>
      <p className="text-muted-foreground mb-8">Track your building progress, payments, and documents.</p>
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {cards.map((card) => (
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
