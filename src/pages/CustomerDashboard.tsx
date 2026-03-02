import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { Link } from "react-router-dom";
import { LogOut, Home, User, FileText, CreditCard, HardHat, Clock, ChevronRight } from "lucide-react";
import CustomerProfile from "@/components/customer/CustomerProfile";
import CustomerProjects from "@/components/customer/CustomerProjects";
import CustomerPayments from "@/components/customer/CustomerPayments";
import CustomerDocuments from "@/components/customer/CustomerDocuments";
import CustomerPaymentMethods from "@/components/customer/CustomerPaymentMethods";

type Tab = "overview" | "profile" | "projects" | "payments" | "documents" | "pay";

const tabs = [
  { id: "overview" as Tab, label: "Overview", icon: Home },
  { id: "projects" as Tab, label: "My Building", icon: HardHat },
  { id: "payments" as Tab, label: "Payments", icon: CreditCard },
  { id: "documents" as Tab, label: "Documents", icon: FileText },
  { id: "pay" as Tab, label: "Make Payment", icon: CreditCard },
  { id: "profile" as Tab, label: "Profile", icon: User },
];

const CustomerDashboard = () => {
  const { user, signOut } = useAuth();
  const [activeTab, setActiveTab] = useState<Tab>("overview");

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-card border-b border-border px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link to="/" className="font-heading text-xl font-bold text-foreground">
            Starline Builder's<span className="text-gold"> Ltd.</span>
          </Link>
          <span className="text-muted-foreground text-sm hidden sm:block">/ Customer Portal</span>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-sm text-muted-foreground hidden sm:block">{user?.email}</span>
          <button onClick={signOut} className="flex items-center gap-2 text-sm text-muted-foreground hover:text-destructive transition-colors">
            <LogOut size={16} /> Sign Out
          </button>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
        {/* Tab navigation */}
        <div className="flex gap-1 overflow-x-auto pb-4 mb-6 border-b border-border">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
                activeTab === tab.id
                  ? "bg-gold-gradient text-accent-foreground"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted"
              }`}
            >
              <tab.icon size={16} />
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab content */}
        {activeTab === "overview" && <OverviewTab onNavigate={setActiveTab} />}
        {activeTab === "profile" && <CustomerProfile />}
        {activeTab === "projects" && <CustomerProjects />}
        {activeTab === "payments" && <CustomerPayments />}
        {activeTab === "documents" && <CustomerDocuments />}
        {activeTab === "pay" && <CustomerPaymentMethods />}
      </div>
    </div>
  );
};

const OverviewTab = ({ onNavigate }: { onNavigate: (tab: Tab) => void }) => {
  const cards = [
    { icon: HardHat, label: "My Building", desc: "View building progress & work updates", tab: "projects" as Tab, color: "text-gold" },
    { icon: CreditCard, label: "Payments", desc: "Total, paid, due amounts & history", tab: "payments" as Tab, color: "text-gold" },
    { icon: FileText, label: "Documents", desc: "Contracts, receipts & agreements", tab: "documents" as Tab, color: "text-gold" },
    { icon: CreditCard, label: "Make Payment", desc: "Bank accounts & payment options", tab: "pay" as Tab, color: "text-gold" },
    { icon: User, label: "Profile", desc: "Edit your personal information", tab: "profile" as Tab, color: "text-gold" },
    { icon: Clock, label: "Work Updates", desc: "Latest construction progress", tab: "projects" as Tab, color: "text-gold" },
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
            <card.icon size={28} className={card.color + " mb-4"} />
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
