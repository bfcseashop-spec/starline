import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, Building2, Smartphone, Globe, CreditCard, Copy, Check } from "lucide-react";
import { toast } from "sonner";

interface PaymentMethod {
  id: string;
  method_type: string;
  title: string;
  details: Record<string, string>;
  is_active: boolean;
}

const typeIcons: Record<string, typeof Building2> = {
  bank_account: Building2,
  mobile_banking: Smartphone,
  online: Globe,
  other: CreditCard,
};

const CustomerPaymentMethods = () => {
  const [methods, setMethods] = useState<PaymentMethod[]>([]);
  const [loading, setLoading] = useState(true);
  const [copiedField, setCopiedField] = useState<string | null>(null);

  useEffect(() => {
    supabase
      .from("payment_methods")
      .select("*")
      .eq("is_active", true)
      .order("sort_order")
      .then(({ data }) => {
        setMethods((data as PaymentMethod[]) || []);
        setLoading(false);
      });
  }, []);

  const copyToClipboard = (text: string, fieldId: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(fieldId);
    toast.success("Copied to clipboard!");
    setTimeout(() => setCopiedField(null), 2000);
  };

  if (loading) return <div className="flex justify-center py-20"><Loader2 className="animate-spin text-gold" size={32} /></div>;

  return (
    <div>
      <h2 className="font-heading text-2xl font-bold text-foreground mb-2">Make a Payment</h2>
      <p className="text-muted-foreground text-sm mb-6">Choose a payment method below. Use your project reference number when making payments.</p>

      {methods.length === 0 ? (
        <div className="text-center py-16">
          <CreditCard size={48} className="text-muted-foreground mx-auto mb-4" />
          <h3 className="font-heading text-lg font-semibold text-foreground mb-2">No Payment Methods</h3>
          <p className="text-muted-foreground text-sm">Payment methods will be added by the admin soon.</p>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 gap-4">
          {methods.map((method) => {
            const Icon = typeIcons[method.method_type] || CreditCard;
            return (
              <div key={method.id} className="bg-card rounded-xl border border-border p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 bg-gold/10 rounded-lg flex items-center justify-center">
                    <Icon size={20} className="text-gold" />
                  </div>
                  <div>
                    <h3 className="font-heading text-lg font-semibold text-card-foreground">{method.title}</h3>
                    <p className="text-xs text-muted-foreground capitalize">{method.method_type.replace("_", " ")}</p>
                  </div>
                </div>

                <div className="space-y-3">
                  {Object.entries(method.details).map(([key, value]) => {
                    const fieldId = `${method.id}-${key}`;
                    const label = key.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
                    return (
                      <div key={key} className="flex items-center justify-between bg-muted rounded-lg px-4 py-3">
                        <div className="min-w-0">
                          <p className="text-xs text-muted-foreground">{label}</p>
                          <p className="text-sm font-medium text-foreground truncate">{value}</p>
                        </div>
                        <button
                          onClick={() => copyToClipboard(value, fieldId)}
                          className="text-muted-foreground hover:text-gold transition-colors shrink-0 ml-2"
                          title="Copy"
                        >
                          {copiedField === fieldId ? <Check size={16} className="text-green-500" /> : <Copy size={16} />}
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}

      <div className="mt-8 bg-gold/5 border border-gold/20 rounded-xl p-5">
        <h4 className="font-heading text-lg font-semibold text-foreground mb-2">Payment Instructions</h4>
        <ul className="space-y-2 text-sm text-muted-foreground">
          <li>• Always include your <span className="text-gold font-medium">Project Reference Number</span> when making payments</li>
          <li>• After payment, please keep the receipt for your records</li>
          <li>• Payments are typically verified within 24-48 hours</li>
          <li>• For any payment issues, contact us at <span className="text-gold">info@starlinebuilders.com</span></li>
        </ul>
      </div>
    </div>
  );
};

export default CustomerPaymentMethods;
