import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { CreditCard, Loader2, CheckCircle, Clock, XCircle, ArrowUpDown } from "lucide-react";

interface Payment {
  id: string;
  amount: number;
  payment_method: string;
  payment_date: string;
  reference_no: string | null;
  status: string;
  notes: string | null;
}

const methodLabels: Record<string, string> = {
  bank_transfer: "Bank Transfer",
  cash: "Cash",
  cheque: "Cheque",
  online: "Online",
  other: "Other",
};

const statusIcons: Record<string, { icon: typeof CheckCircle; color: string }> = {
  completed: { icon: CheckCircle, color: "text-green-500" },
  pending: { icon: Clock, color: "text-gold" },
  failed: { icon: XCircle, color: "text-destructive" },
  refunded: { icon: ArrowUpDown, color: "text-muted-foreground" },
};

const CustomerPayments = () => {
  const { user } = useAuth();
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    supabase
      .from("payments")
      .select("*")
      .eq("user_id", user.id)
      .order("payment_date", { ascending: false })
      .then(({ data }) => {
        setPayments((data as Payment[]) || []);
        setLoading(false);
      });
  }, [user]);

  if (loading) return <div className="flex justify-center py-20"><Loader2 className="animate-spin text-gold" size={32} /></div>;

  const totalPaid = payments.filter((p) => p.status === "completed").reduce((sum, p) => sum + Number(p.amount), 0);

  return (
    <div>
      <h2 className="font-heading text-2xl font-bold text-foreground mb-6">Payment History</h2>

      {/* Summary */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-6">
        <div className="bg-card rounded-xl border border-border p-5 text-center">
          <p className="text-xs text-muted-foreground mb-1">Total Paid</p>
          <p className="text-green-500 font-heading text-2xl font-bold">৳{totalPaid.toLocaleString()}</p>
        </div>
        <div className="bg-card rounded-xl border border-border p-5 text-center">
          <p className="text-xs text-muted-foreground mb-1">Transactions</p>
          <p className="text-foreground font-heading text-2xl font-bold">{payments.length}</p>
        </div>
        <div className="bg-card rounded-xl border border-border p-5 text-center">
          <p className="text-xs text-muted-foreground mb-1">Pending</p>
          <p className="text-gold font-heading text-2xl font-bold">{payments.filter((p) => p.status === "pending").length}</p>
        </div>
      </div>

      {payments.length === 0 ? (
        <div className="text-center py-16">
          <CreditCard size={48} className="text-muted-foreground mx-auto mb-4" />
          <h3 className="font-heading text-lg font-semibold text-foreground mb-2">No Payments Yet</h3>
          <p className="text-muted-foreground text-sm">Your payment records will appear here.</p>
        </div>
      ) : (
        <div className="bg-card rounded-xl border border-border overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted">
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">Date</th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">Amount</th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground hidden sm:table-cell">Method</th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground hidden md:table-cell">Reference</th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">Status</th>
                </tr>
              </thead>
              <tbody>
                {payments.map((p) => {
                  const st = statusIcons[p.status] || statusIcons.pending;
                  return (
                    <tr key={p.id} className="border-b border-border last:border-0 hover:bg-muted/50 transition-colors">
                      <td className="px-4 py-3 text-foreground">{new Date(p.payment_date).toLocaleDateString()}</td>
                      <td className="px-4 py-3 text-foreground font-semibold">৳{Number(p.amount).toLocaleString()}</td>
                      <td className="px-4 py-3 text-muted-foreground hidden sm:table-cell">{methodLabels[p.payment_method] || p.payment_method}</td>
                      <td className="px-4 py-3 text-muted-foreground hidden md:table-cell">{p.reference_no || "—"}</td>
                      <td className="px-4 py-3">
                        <span className={`flex items-center gap-1.5 ${st.color} text-xs font-medium`}>
                          <st.icon size={14} /> {p.status}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default CustomerPayments;
