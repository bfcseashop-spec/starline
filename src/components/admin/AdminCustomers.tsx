import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Users, Mail, Phone, MapPin, Loader2, ChevronRight, HardHat } from "lucide-react";
import { motion } from "framer-motion";

interface Customer {
  user_id: string;
  full_name: string | null;
  phone: string | null;
  address: string | null;
  email?: string;
  project_count?: number;
  total_amount?: number;
  paid_amount?: number;
}

const AdminCustomers = () => {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      // Get all customer profiles
      const { data: profiles } = await supabase.from("profiles").select("user_id, full_name, phone, address");
      // Get all customer roles
      const { data: roles } = await supabase.from("user_roles").select("user_id, role").eq("role", "customer");
      // Get project summaries
      const { data: projects } = await supabase.from("customer_projects").select("user_id, total_amount, paid_amount");

      const customerUserIds = new Set((roles || []).map((r) => r.user_id));
      const projectMap: Record<string, { count: number; total: number; paid: number }> = {};
      (projects || []).forEach((p) => {
        if (!projectMap[p.user_id]) projectMap[p.user_id] = { count: 0, total: 0, paid: 0 };
        projectMap[p.user_id].count++;
        projectMap[p.user_id].total += Number(p.total_amount);
        projectMap[p.user_id].paid += Number(p.paid_amount);
      });

      const list: Customer[] = (profiles || [])
        .filter((p) => customerUserIds.has(p.user_id))
        .map((p) => ({
          ...p,
          project_count: projectMap[p.user_id]?.count || 0,
          total_amount: projectMap[p.user_id]?.total || 0,
          paid_amount: projectMap[p.user_id]?.paid || 0,
        }));

      setCustomers(list);
      setLoading(false);
    };
    fetch();
  }, []);

  const formatCurrency = (n: number) => `৳${n.toLocaleString()}`;

  if (loading) return <div className="flex justify-center py-20"><Loader2 className="animate-spin text-gold" size={32} /></div>;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="font-heading text-2xl font-bold text-foreground">Customers</h2>
        <span className="bg-dash-purple text-white text-xs font-bold px-3 py-1.5 rounded-full">{customers.length} total</span>
      </div>

      <div className="space-y-3">
        {customers.map((c, idx) => (
          <motion.div
            key={c.user_id}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.04 }}
            className="bg-card rounded-2xl border border-border p-5 shadow-sm"
          >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-dash-blue flex items-center justify-center text-white font-bold text-lg">
                  {(c.full_name || "?")[0].toUpperCase()}
                </div>
                <div>
                  <h3 className="font-semibold text-foreground text-base">{c.full_name || "Unnamed"}</h3>
                  <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground mt-1">
                    {c.phone && <span className="flex items-center gap-1"><Phone size={12} /> {c.phone}</span>}
                    {c.address && <span className="flex items-center gap-1"><MapPin size={12} /> {c.address}</span>}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-4 text-sm">
                <div className="text-center px-3">
                  <p className="text-muted-foreground text-xs">Projects</p>
                  <p className="font-bold text-foreground">{c.project_count}</p>
                </div>
                <div className="text-center px-3 border-l border-border">
                  <p className="text-muted-foreground text-xs">Total</p>
                  <p className="font-bold text-foreground">{formatCurrency(c.total_amount || 0)}</p>
                </div>
                <div className="text-center px-3 border-l border-border">
                  <p className="text-muted-foreground text-xs">Paid</p>
                  <p className="font-bold text-dash-green">{formatCurrency(c.paid_amount || 0)}</p>
                </div>
                <div className="text-center px-3 border-l border-border">
                  <p className="text-muted-foreground text-xs">Due</p>
                  <p className="font-bold text-destructive">{formatCurrency((c.total_amount || 0) - (c.paid_amount || 0))}</p>
                </div>
              </div>
            </div>
          </motion.div>
        ))}
        {customers.length === 0 && (
          <div className="text-center py-20 text-muted-foreground">
            <Users size={48} className="mx-auto mb-4 opacity-40" />
            <p>No customers found.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminCustomers;
