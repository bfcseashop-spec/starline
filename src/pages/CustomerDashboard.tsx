import { useState, useEffect } from "react";
import { HardHat, CreditCard, FileText, User, Clock, ChevronRight, Wallet, BadgeDollarSign, TrendingDown, CalendarClock, Banknote, ArrowUpRight, Megaphone, Wrench, Sun, Moon } from "lucide-react";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { backend } from "@/lib/backendClient";
import { useAuth } from "@/hooks/useAuth";
import { motion } from "framer-motion";
import { useTheme } from "next-themes";
import CustomerSidebar from "@/components/customer/CustomerSidebar";
import CustomerProfile from "@/components/customer/CustomerProfile";
import CustomerProjects from "@/components/customer/CustomerProjects";
import CustomerPayments from "@/components/customer/CustomerPayments";
import CustomerDocuments from "@/components/customer/CustomerDocuments";
import CustomerPaymentMethods from "@/components/customer/CustomerPaymentMethods";

type Tab = "home" | "overview" | "profile" | "projects" | "payments" | "documents" | "pay";

const pageTitle: Record<Tab, string> = {
  home: "Home",
  overview: "Overview",
  projects: "My Building",
  payments: "Payments",
  documents: "Documents",
  pay: "Make Payment",
  profile: "Profile",
};

const CustomerDashboard = () => {
  const [activeTab, setActiveTab] = useState<Tab>("home");
  const { user } = useAuth();
  const { theme, setTheme } = useTheme();
  const isDark = theme === "dark";

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-background">
        <CustomerSidebar activeTab={activeTab} onTabChange={setActiveTab} />

        <div className="flex-1 flex flex-col min-w-0">
          <header className="h-16 flex items-center justify-between border-b border-border px-6 bg-card/80 backdrop-blur-sm">
            <div className="flex items-center gap-4">
              <SidebarTrigger />
              <div>
                <h2 className="font-heading text-xl font-bold text-foreground">{pageTitle[activeTab]}</h2>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => setTheme(isDark ? "light" : "dark")}
                className="p-2 rounded-xl text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-colors"
                title="Toggle theme"
              >
                {isDark ? <Sun size={18} /> : <Moon size={18} />}
              </button>
              <div className="hidden sm:flex items-center gap-2 bg-muted rounded-full px-4 py-2">
                <div className="w-2 h-2 rounded-full bg-dash-green animate-pulse" />
                <span className="text-xs text-muted-foreground font-medium">{user?.email}</span>
              </div>
            </div>
          </header>

          <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-auto">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2 }}
            >
              {activeTab === "home" && <HomeTab onNavigate={setActiveTab} />}
              {activeTab === "overview" && <OverviewTab onNavigate={setActiveTab} />}
              {activeTab === "profile" && <CustomerProfile />}
              {activeTab === "projects" && <CustomerProjects />}
              {activeTab === "payments" && <CustomerPayments />}
              {activeTab === "documents" && <CustomerDocuments />}
              {activeTab === "pay" && <CustomerPaymentMethods onPaymentComplete={() => setActiveTab("payments")} />}
            </motion.div>
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
  const [fetchError, setFetchError] = useState<string | null>(null);

  const fetchFinancials = async () => {
    if (!user) return;
    setFetchError(null);
    setLoadingFinancials(true);
    const { data, error } = await backend
      .from("customer_projects")
      .select("total_amount, paid_amount, monthly_installment")
      .eq("user_id", user.id);

    if (error) {
      setFetchError(error.message);
      setLoadingFinancials(false);
      return;
    }
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

  useEffect(() => {
    fetchFinancials();
  }, [user]);

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat("en-BD", { style: "currency", currency: "BDT", maximumFractionDigits: 0 }).format(amount);

  const progressPercent = financials.totalAmount > 0 ? Math.round((financials.paidAmount / financials.totalAmount) * 100) : 0;

  const statCards = [
    { label: "Total Amount", value: formatCurrency(financials.totalAmount), icon: Wallet, gradient: "bg-dash-blue", iconBg: "bg-white/20" },
    { label: "Paid Amount", value: formatCurrency(financials.paidAmount), icon: BadgeDollarSign, gradient: "bg-dash-green", iconBg: "bg-white/20" },
    { label: "Remaining Balance", value: formatCurrency(financials.remainingBalance), icon: TrendingDown, gradient: "bg-dash-orange", iconBg: "bg-white/20" },
    { label: "Monthly EMI", value: formatCurrency(financials.monthlyInstallment), icon: CalendarClock, gradient: "bg-dash-purple", iconBg: "bg-white/20" },
  ];

  const navCards = [
    { icon: HardHat, label: "My Building", desc: "View building progress & work updates", tab: "projects" as Tab, gradient: "bg-dash-orange", color: "text-dash-orange" },
    { icon: CreditCard, label: "Payments", desc: "Total, paid, due amounts & history", tab: "payments" as Tab, gradient: "bg-dash-green", color: "text-dash-green" },
    { icon: FileText, label: "Documents", desc: "Contracts, receipts & agreements", tab: "documents" as Tab, gradient: "bg-dash-purple", color: "text-dash-purple" },
    { icon: Banknote, label: "Make Payment", desc: "Bank accounts & payment options", tab: "pay" as Tab, gradient: "bg-dash-teal", color: "text-dash-teal" },
    { icon: User, label: "Profile", desc: "Edit your personal information", tab: "profile" as Tab, gradient: "bg-dash-pink", color: "text-dash-pink" },
    { icon: Clock, label: "Work Updates", desc: "Latest construction progress", tab: "projects" as Tab, gradient: "bg-dash-blue", color: "text-dash-blue" },
  ];

  return (
    <div>
      {/* Welcome Banner */}
      <div className="rounded-2xl bg-gold-gradient p-6 sm:p-8 mb-8 relative overflow-hidden">
        <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg width=\'60\' height=\'60\' viewBox=\'0 0 60 60\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cpath d=\'M54.627 0l.83.828-1.415 1.415L51.8 0h2.827zM5.373 0l-.83.828L5.96 2.243 8.2 0H5.374zM48.97 0l3.657 3.657-1.414 1.414L46.143 0h2.828zM11.03 0L7.372 3.657 8.787 5.07 13.857 0H11.03zm32.284 0L49.8 6.485 48.384 7.9l-7.9-7.9h2.83zM16.686 0L10.2 6.485 11.616 7.9l7.9-7.9h-2.83zm20.97 0l9.315 9.314-1.414 1.414L34.828 0h2.83zM22.344 0L13.03 9.314l1.414 1.414L25.172 0h-2.83zM32 0l12.142 12.142-1.414 1.414L30 .828 17.272 13.556l-1.414-1.414L28 0h4z\' fill=\'%23000\' fill-opacity=\'.08\' fill-rule=\'evenodd\'/%3E%3C/svg%3E")' }} />
        <div className="relative">
          <h1 className="font-heading text-2xl sm:text-3xl font-bold text-accent-foreground mb-1">Welcome Back! 👋</h1>
          <p className="text-accent-foreground/70 text-sm sm:text-base">Track your building progress, payments, and documents.</p>

          {/* Progress indicator */}
          {!loadingFinancials && financials.totalAmount > 0 && (
            <div className="mt-5 max-w-md">
              <div className="flex justify-between text-xs text-accent-foreground/70 mb-1.5">
                <span>Payment Progress</span>
                <span className="font-bold text-accent-foreground">{progressPercent}%</span>
              </div>
              <div className="w-full bg-accent-foreground/20 rounded-full h-3">
                <div className="bg-accent-foreground h-3 rounded-full transition-all shadow-sm" style={{ width: `${progressPercent}%` }} />
              </div>
            </div>
          )}
        </div>
      </div>

      {fetchError && (
        <div className="mb-6 rounded-xl border border-destructive/50 bg-destructive/10 p-4 flex items-center justify-between gap-4">
          <p className="text-sm text-destructive">{fetchError}</p>
          <button
            onClick={() => fetchFinancials()}
            className="shrink-0 text-sm font-medium text-foreground hover:underline"
          >
            Retry
          </button>
        </div>
      )}

      {/* Financial Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {statCards.map((stat, idx) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.08, duration: 0.3 }}
            className={`${stat.gradient} rounded-2xl p-5 text-white shadow-lg relative overflow-hidden`}
          >
            <div className="absolute -right-3 -top-3 w-20 h-20 rounded-full bg-white/10" />
            <div className="absolute -right-1 -bottom-5 w-14 h-14 rounded-full bg-white/5" />
            <div className="relative">
              <div className={`${stat.iconBg} w-10 h-10 rounded-xl flex items-center justify-center mb-3`}>
                <stat.icon size={20} />
              </div>
              <p className="text-white/70 text-xs font-medium uppercase tracking-wider">{stat.label}</p>
              <p className="font-heading text-xl font-bold mt-1">
                {loadingFinancials ? "..." : stat.value}
              </p>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Quick Navigation */}
      <h2 className="font-heading text-xl font-bold text-foreground mb-4">Quick Access</h2>
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {navCards.map((card, idx) => (
          <motion.button
            key={card.label + card.tab}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 + idx * 0.06, duration: 0.25 }}
            onClick={() => onNavigate(card.tab)}
            className="bg-card rounded-2xl border border-border p-5 hover:shadow-lg hover:border-transparent hover:scale-[1.02] transition-all duration-200 text-left group"
          >
            <div className="flex items-start justify-between mb-3">
              <div className={`${card.gradient} p-2.5 rounded-xl text-white`}>
                <card.icon size={22} />
              </div>
              <ArrowUpRight size={16} className="text-muted-foreground/40 group-hover:text-foreground transition-colors" />
            </div>
            <h3 className="font-heading text-base font-semibold text-card-foreground mb-0.5">{card.label}</h3>
            <p className="text-muted-foreground text-sm">{card.desc}</p>
          </motion.button>
        ))}
      </div>
    </div>
  );
};

const HomeTab = ({ onNavigate }: { onNavigate: (tab: Tab) => void }) => {
  const { user } = useAuth();
  const [balance, setBalance] = useState({ total: 0, paid: 0, remaining: 0 });
  const [recentPayments, setRecentPayments] = useState<{ id: string; amount: number; payment_date: string; status?: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchHome = async () => {
    if (!user) return;
    setError(null);
    setLoading(true);
    const { data: projects, error: projErr } = await backend
      .from("customer_projects")
      .select("total_amount, paid_amount")
      .eq("user_id", user.id);

    if (projErr) {
      setError(projErr.message);
      setLoading(false);
      return;
    }
    if (projects && projects.length > 0) {
      const totals = projects.reduce(
        (acc, p) => ({ total: acc.total + Number(p.total_amount), paid: acc.paid + Number(p.paid_amount) }),
        { total: 0, paid: 0 }
      );
      setBalance({ ...totals, remaining: totals.total - totals.paid });
    }

    const { data: payments } = await backend
      .from("payments")
      .select("*")
      .eq("user_id", user.id)
      .order("payment_date", { ascending: false })
      .limit(5);

    setRecentPayments(payments || []);
    setLoading(false);
  };

  useEffect(() => {
    fetchHome();
  }, [user]);

  const fmt = (n: number) =>
    new Intl.NumberFormat("en-BD", { style: "currency", currency: "BDT", maximumFractionDigits: 0 }).format(n);

  return (
    <div className="space-y-6">
      {error && (
        <div className="rounded-xl border border-destructive/50 bg-destructive/10 p-4 flex items-center justify-between gap-4">
          <p className="text-sm text-destructive">{error}</p>
          <button onClick={() => fetchHome()} className="shrink-0 text-sm font-medium text-foreground hover:underline">
            Retry
          </button>
        </div>
      )}

      {/* Balance Banner */}
      <div className="bg-card border border-border rounded-2xl p-6 sm:p-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-start gap-4">
          <div className="w-1.5 h-16 rounded-full bg-dash-green shrink-0" />
          <div>
            <p className="text-muted-foreground text-sm font-medium">Your current balance is</p>
            <p className="font-heading text-3xl sm:text-4xl font-bold text-foreground mt-1">
              {loading ? "..." : fmt(balance.remaining)}
            </p>
          </div>
        </div>
        <div className="flex flex-col gap-2 w-full sm:w-auto">
          <button
            onClick={() => onNavigate("pay")}
            className="bg-dash-green hover:bg-dash-green/90 text-white font-semibold px-6 py-3 rounded-full text-sm transition-colors"
          >
            Make payment
          </button>
          <button
            onClick={() => onNavigate("payments")}
            className="bg-card border border-border hover:bg-muted text-foreground font-medium px-6 py-3 rounded-full text-sm transition-colors"
          >
            View all payments
          </button>
        </div>
      </div>

      {/* Two column grid */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* Quick Actions */}
        <div className="bg-card border border-border rounded-2xl p-6">
          <h3 className="font-heading text-lg font-bold text-foreground mb-4">Quick Actions</h3>
          <div className="space-y-3">
            {[
              { icon: HardHat, label: "My Building", desc: "View construction progress", tab: "projects" as Tab, color: "bg-dash-orange" },
              { icon: FileText, label: "Documents", desc: "Access your documents", tab: "documents" as Tab, color: "bg-dash-purple" },
              { icon: User, label: "Profile", desc: "Update your information", tab: "profile" as Tab, color: "bg-dash-pink" },
            ].map((item) => (
              <button
                key={item.label}
                onClick={() => onNavigate(item.tab)}
                className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-muted/60 transition-colors text-left group"
              >
                <div className={`${item.color} p-2 rounded-lg text-white`}>
                  <item.icon size={18} />
                </div>
                <div className="flex-1">
                  <p className="font-semibold text-sm text-foreground">{item.label}</p>
                  <p className="text-xs text-muted-foreground">{item.desc}</p>
                </div>
                <ChevronRight size={16} className="text-muted-foreground/40 group-hover:text-foreground transition-colors" />
              </button>
            ))}
          </div>
        </div>

        {/* Recent Payments */}
        <div className="bg-card border border-border rounded-2xl p-6">
          <h3 className="font-heading text-lg font-bold text-foreground mb-4">Recent Payments</h3>
          {recentPayments.length === 0 ? (
            <div className="text-center py-8">
              <div className="bg-muted w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3">
                <CreditCard size={20} className="text-muted-foreground" />
              </div>
              <p className="text-muted-foreground text-sm">No payments yet</p>
            </div>
          ) : (
            <div className="space-y-3">
              {recentPayments.map((p) => (
                <div key={p.id} className="flex items-center justify-between p-3 rounded-xl bg-muted/40">
                  <div className="flex items-center gap-3">
                    <div className={`w-2 h-2 rounded-full ${p.status === "completed" ? "bg-dash-green" : "bg-dash-orange"}`} />
                    <div>
                      <p className="text-sm font-medium text-foreground">{fmt(p.amount)}</p>
                      <p className="text-xs text-muted-foreground">{new Date(p.payment_date).toLocaleDateString()}</p>
                    </div>
                  </div>
                  <span className={`text-xs font-medium px-2 py-1 rounded-full ${
                    p.status === "completed" ? "bg-green-500/10 text-green-600" : "bg-orange-500/10 text-orange-600"
                  }`}>
                    {p.status}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CustomerDashboard;
