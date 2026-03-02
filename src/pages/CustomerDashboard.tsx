import { useAuth } from "@/hooks/useAuth";
import { LogOut, Home, FileText, CreditCard, User, MessageSquare } from "lucide-react";
import { Link } from "react-router-dom";

const CustomerDashboard = () => {
  const { user, signOut } = useAuth();

  const cards = [
    { icon: Home, label: "My Properties", desc: "View saved properties & inquiries", color: "text-gold" },
    { icon: User, label: "My Profile", desc: "Manage your personal information", color: "text-gold" },
    { icon: FileText, label: "Documents", desc: "Upload & download contracts", color: "text-gold" },
    { icon: CreditCard, label: "Payments", desc: "Track payment schedules", color: "text-gold" },
    { icon: MessageSquare, label: "Inquiries", desc: "View your property inquiries", color: "text-gold" },
  ];

  return (
    <div className="min-h-screen bg-background">
      <header className="bg-card border-b border-border px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link to="/" className="font-heading text-xl font-bold text-foreground">
            Starline Builder's<span className="text-gold"> Ltd.</span>
          </Link>
          <span className="text-muted-foreground text-sm hidden sm:block">/ Customer Dashboard</span>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-sm text-muted-foreground hidden sm:block">{user?.email}</span>
          <button onClick={signOut} className="flex items-center gap-2 text-sm text-muted-foreground hover:text-destructive transition-colors">
            <LogOut size={16} /> Sign Out
          </button>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6 py-10">
        <h1 className="font-heading text-3xl font-bold text-foreground mb-2">Welcome Back!</h1>
        <p className="text-muted-foreground mb-8">Manage your properties, documents, and payments.</p>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {cards.map((card) => (
            <div key={card.label} className="bg-card rounded-xl border border-border p-6 hover:border-gold/40 transition-colors cursor-pointer">
              <card.icon size={28} className={card.color + " mb-4"} />
              <h3 className="font-heading text-lg font-semibold text-card-foreground mb-1">{card.label}</h3>
              <p className="text-muted-foreground text-sm">{card.desc}</p>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
};

export default CustomerDashboard;
