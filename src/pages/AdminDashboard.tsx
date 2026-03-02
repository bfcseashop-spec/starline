import { useAuth } from "@/hooks/useAuth";
import { LogOut, Home, Users, FileText, BarChart3, Settings } from "lucide-react";
import { Link } from "react-router-dom";

const AdminDashboard = () => {
  const { user, signOut } = useAuth();

  const cards = [
    { icon: Home, label: "Manage Properties", desc: "Add, edit, and delete listings", color: "text-gold" },
    { icon: Users, label: "Manage Customers", desc: "View customer list & inquiries", color: "text-gold" },
    { icon: FileText, label: "Manage Content", desc: "Edit website content & pages", color: "text-gold" },
    { icon: BarChart3, label: "Analytics", desc: "Site traffic & conversion stats", color: "text-gold" },
    { icon: Settings, label: "Settings", desc: "System configuration", color: "text-gold" },
  ];

  return (
    <div className="min-h-screen bg-background">
      <header className="bg-card border-b border-border px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link to="/" className="font-heading text-xl font-bold text-foreground">
            Starline Builder's<span className="text-gold"> Ltd.</span>
          </Link>
          <span className="bg-destructive text-destructive-foreground text-xs font-semibold px-2 py-0.5 rounded">ADMIN</span>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-sm text-muted-foreground hidden sm:block">{user?.email}</span>
          <button onClick={signOut} className="flex items-center gap-2 text-sm text-muted-foreground hover:text-destructive transition-colors">
            <LogOut size={16} /> Sign Out
          </button>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6 py-10">
        <h1 className="font-heading text-3xl font-bold text-foreground mb-2">Admin Dashboard</h1>
        <p className="text-muted-foreground mb-8">Manage properties, customers, content, and analytics.</p>

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

export default AdminDashboard;
