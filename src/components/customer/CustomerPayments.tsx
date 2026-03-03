import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { CreditCard, Loader2, CheckCircle, Clock, XCircle, ArrowUpDown, Image, X } from "lucide-react";

interface Payment {
  id: string;
  amount: number;
  payment_method: string;
  payment_type: string;
  payment_date: string;
  reference_no: string | null;
  status: string;
  notes: string | null;
  image_url: string | null;
}

const methodLabels: Record<string, string> = {
  bank_transfer: "Bank Transfer",
  bank_account: "Bank Transfer",
  mobile_banking: "Mobile Banking",
  cash: "Cash",
  cheque: "Cheque",
  online: "Online",
  other: "Other",
};

const typeLabels: Record<string, string> = {
  down_payment: "Down Payment",
  installment: "Installment",
  advance: "Advance",
  due: "Due",
  final: "Final",
  other: "Other",
};

const statusConfig: Record<string, { icon: typeof CheckCircle; color: string; bg: string }> = {
  completed: { icon: CheckCircle, color: "text-green-600", bg: "bg-green-500/10" },
  pending: { icon: Clock, color: "text-amber-600", bg: "bg-amber-500/10" },
  failed: { icon: XCircle, color: "text-red-600", bg: "bg-red-500/10" },
  refunded: { icon: ArrowUpDown, color: "text-muted-foreground", bg: "bg-muted" },
};

const CustomerPayments = () => {
  const { user } = useAuth();
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewSlip, setViewSlip] = useState<string | null>(null);

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
  const pendingCount = payments.filter((p) => p.status === "pending").length;

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
          <p className="text-amber-500 font-heading text-2xl font-bold">{pendingCount}</p>
        </div>
      </div>

      {payments.length === 0 ? (
        <div className="text-center py-16">
          <CreditCard size={48} className="text-muted-foreground mx-auto mb-4" />
          <h3 className="font-heading text-lg font-semibold text-foreground mb-2">No Payments Yet</h3>
          <p className="text-muted-foreground text-sm">Your payment records will appear here.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {payments.map((p) => {
            const st = statusConfig[p.status] || statusConfig.pending;
            const StIcon = st.icon;
            return (
              <div key={p.id} className="bg-card rounded-xl border border-border p-4 sm:p-5">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-2">
                      <span className="font-heading text-lg font-bold text-foreground">৳{Number(p.amount).toLocaleString()}</span>
                      <span className={`inline-flex items-center gap-1 text-xs font-medium px-2.5 py-1 rounded-full ${st.bg} ${st.color}`}>
                        <StIcon size={12} />
                        {p.status.charAt(0).toUpperCase() + p.status.slice(1)}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-x-4 gap-y-2 text-sm">
                      <div>
                        <p className="text-xs text-muted-foreground">Date</p>
                        <p className="text-foreground font-medium">{new Date(p.payment_date).toLocaleDateString()}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Type</p>
                        <p className="text-foreground font-medium">{typeLabels[p.payment_type] || p.payment_type}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Method</p>
                        <p className="text-foreground font-medium">{methodLabels[p.payment_method] || p.payment_method}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Reference</p>
                        <p className="text-foreground font-medium">{p.reference_no || "—"}</p>
                      </div>
                    </div>

                    {p.notes && (
                      <p className="text-xs text-muted-foreground mt-2">{p.notes}</p>
                    )}
                  </div>

                  {/* Slip thumbnail */}
                  {p.image_url && (
                    <button
                      onClick={() => setViewSlip(p.image_url)}
                      className="shrink-0 w-14 h-14 sm:w-16 sm:h-16 rounded-lg border border-border overflow-hidden hover:ring-2 hover:ring-dash-green/50 transition-all group relative"
                    >
                      <img src={p.image_url} alt="Payment slip" className="w-full h-full object-cover" />
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <Image size={16} className="text-white" />
                      </div>
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Slip lightbox */}
      {viewSlip && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4" onClick={() => setViewSlip(null)}>
          <div className="relative max-w-2xl w-full" onClick={(e) => e.stopPropagation()}>
            <button
              onClick={() => setViewSlip(null)}
              className="absolute -top-3 -right-3 bg-card border border-border p-2 rounded-full text-muted-foreground hover:text-foreground transition-colors z-10"
            >
              <X size={18} />
            </button>
            <img src={viewSlip} alt="Payment slip" className="w-full rounded-xl max-h-[80vh] object-contain bg-card" />
          </div>
        </div>
      )}
    </div>
  );
};

export default CustomerPayments;
