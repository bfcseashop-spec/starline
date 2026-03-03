import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Loader2, ChevronLeft, CreditCard, Building2, Smartphone, Globe, Copy, Check } from "lucide-react";
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
  const { user } = useAuth();
  const [methods, setMethods] = useState<PaymentMethod[]>([]);
  const [loading, setLoading] = useState(true);
  const [copiedField, setCopiedField] = useState<string | null>(null);

  const [balance, setBalance] = useState(0);
  const [amountOption, setAmountOption] = useState<"balance" | "other">("balance");
  const [customAmount, setCustomAmount] = useState("");
  const [selectedMethod, setSelectedMethod] = useState("");
  const [paymentDate, setPaymentDate] = useState(() => new Date().toISOString().split("T")[0]);
  const [step, setStep] = useState<"form" | "details">("form");

  useEffect(() => {
    const fetchData = async () => {
      const [methodsRes, projectsRes] = await Promise.all([
        supabase.from("payment_methods").select("*").eq("is_active", true).order("sort_order"),
        user
          ? supabase.from("customer_projects").select("total_amount, paid_amount").eq("user_id", user.id)
          : Promise.resolve({ data: [] }),
      ]);

      setMethods((methodsRes.data as PaymentMethod[]) || []);

      if (projectsRes.data && projectsRes.data.length > 0) {
        let remaining = 0;
        for (const p of projectsRes.data) {
          remaining += Number(p.total_amount) - Number(p.paid_amount);
        }
        setBalance(remaining);
      }
      setLoading(false);
    };
    fetchData();
  }, [user]);

  const copyToClipboard = (text: string, fieldId: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(fieldId);
    toast.success("Copied to clipboard!");
    setTimeout(() => setCopiedField(null), 2000);
  };

  const fmt = (n: number) =>
    new Intl.NumberFormat("en-BD", { style: "currency", currency: "BDT", maximumFractionDigits: 2 }).format(n);

  const selectedMethodObj = methods.find((m) => m.id === selectedMethod);
  const payAmount = amountOption === "balance" ? balance : Number(customAmount) || 0;

  if (loading) return <div className="flex justify-center py-20"><Loader2 className="animate-spin text-gold" size={32} /></div>;

  // Step 2: Show selected method details for payment
  if (step === "details" && selectedMethodObj) {
    const Icon = typeIcons[selectedMethodObj.method_type] || CreditCard;
    return (
      <div className="max-w-lg mx-auto">
        <button onClick={() => setStep("form")} className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-6 transition-colors">
          <ChevronLeft size={16} /> Back
        </button>

        <h2 className="font-heading text-2xl font-bold text-foreground mb-2">Complete Your Payment</h2>
        <p className="text-muted-foreground text-sm mb-6">
          Pay <span className="font-bold text-foreground">{fmt(payAmount)}</span> using the details below.
        </p>

        <div className="bg-card rounded-xl border border-border p-6 mb-4">
          <div className="flex items-center gap-3 mb-5">
            <div className="w-10 h-10 bg-dash-green/10 rounded-lg flex items-center justify-center">
              <Icon size={20} className="text-dash-green" />
            </div>
            <div>
              <h3 className="font-heading text-lg font-semibold text-card-foreground">{selectedMethodObj.title}</h3>
              <p className="text-xs text-muted-foreground capitalize">{selectedMethodObj.method_type.replace("_", " ")}</p>
            </div>
          </div>

          <div className="space-y-3">
            {Object.entries(selectedMethodObj.details).map(([key, value]) => {
              const fieldId = `${selectedMethodObj.id}-${key}`;
              const label = key.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
              return (
                <div key={key} className="flex items-center justify-between bg-muted rounded-lg px-4 py-3">
                  <div className="min-w-0">
                    <p className="text-xs text-muted-foreground">{label}</p>
                    <p className="text-sm font-medium text-foreground truncate">{value}</p>
                  </div>
                  <button
                    onClick={() => copyToClipboard(value, fieldId)}
                    className="text-muted-foreground hover:text-dash-green transition-colors shrink-0 ml-2"
                    title="Copy"
                  >
                    {copiedField === fieldId ? <Check size={16} className="text-green-500" /> : <Copy size={16} />}
                  </button>
                </div>
              );
            })}
          </div>
        </div>

        <div className="bg-dash-green/5 border border-dash-green/20 rounded-xl p-5">
          <h4 className="font-heading text-base font-semibold text-foreground mb-2">Payment Instructions</h4>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li>• Include your <span className="text-dash-green font-medium">Project Reference Number</span> when making payments</li>
            <li>• After payment, keep the receipt for your records</li>
            <li>• Payments are verified within 24-48 hours</li>
          </ul>
        </div>
      </div>
    );
  }

  // Step 1: Form like the reference
  return (
    <div className="max-w-lg mx-auto">
      <h2 className="font-heading text-2xl font-bold text-foreground mb-6">Make payment</h2>

      {/* Select an amount */}
      <div className="mb-8">
        <h3 className="font-heading text-base font-bold text-foreground mb-3">Select an amount</h3>
        <div className="space-y-2">
          <label
            onClick={() => setAmountOption("balance")}
            className={`flex items-center justify-between p-4 rounded-xl border cursor-pointer transition-colors ${
              amountOption === "balance" ? "border-dash-green bg-dash-green/5" : "border-border bg-card"
            }`}
          >
            <div className="flex items-center gap-3">
              <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                amountOption === "balance" ? "border-dash-green" : "border-muted-foreground/40"
              }`}>
                {amountOption === "balance" && <div className="w-2.5 h-2.5 rounded-full bg-dash-green" />}
              </div>
              <span className="text-sm text-foreground">
                Current balance <span className="text-muted-foreground">(as of {new Date().toLocaleDateString()})</span>
              </span>
            </div>
            <span className="font-bold text-foreground">{fmt(balance)}</span>
          </label>

          <label
            onClick={() => setAmountOption("other")}
            className={`flex items-center justify-between p-4 rounded-xl border cursor-pointer transition-colors ${
              amountOption === "other" ? "border-dash-green bg-dash-green/5" : "border-border bg-card"
            }`}
          >
            <div className="flex items-center gap-3">
              <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                amountOption === "other" ? "border-dash-green" : "border-muted-foreground/40"
              }`}>
                {amountOption === "other" && <div className="w-2.5 h-2.5 rounded-full bg-dash-green" />}
              </div>
              <span className="text-sm text-foreground">Other amount</span>
            </div>
            {amountOption === "other" ? (
              <input
                type="number"
                value={customAmount}
                onChange={(e) => setCustomAmount(e.target.value)}
                placeholder="0.00"
                className="w-28 text-right bg-transparent border-b border-border text-foreground font-bold text-sm outline-none focus:border-dash-green"
                autoFocus
                onClick={(e) => e.stopPropagation()}
              />
            ) : (
              <span className="text-muted-foreground font-bold">{fmt(0)}</span>
            )}
          </label>
        </div>
      </div>

      {/* Select a payment method */}
      <div className="mb-8">
        <h3 className="font-heading text-base font-bold text-foreground mb-3">Select a payment method</h3>
        <select
          value={selectedMethod}
          onChange={(e) => setSelectedMethod(e.target.value)}
          className="w-full p-4 rounded-xl border border-border bg-card text-foreground text-sm appearance-none cursor-pointer focus:outline-none focus:border-dash-green transition-colors"
        >
          <option value="">Choose method...</option>
          {methods.map((m) => (
            <option key={m.id} value={m.id}>{m.title}</option>
          ))}
        </select>
        {methods.length === 0 && (
          <p className="text-xs text-muted-foreground mt-2">No payment methods available yet.</p>
        )}
      </div>

      {/* Select a date */}
      <div className="mb-8">
        <h3 className="font-heading text-base font-bold text-foreground mb-3">Select a date</h3>
        <p className="text-xs text-muted-foreground mb-2">Select a payment date</p>
        <input
          type="date"
          value={paymentDate}
          onChange={(e) => setPaymentDate(e.target.value)}
          className="w-full p-4 rounded-xl border border-border bg-card text-foreground text-sm focus:outline-none focus:border-dash-green transition-colors"
        />
      </div>

      {/* Buttons */}
      <div className="flex gap-3">
        <button
          onClick={() => {
            if (!selectedMethod) { toast.error("Please select a payment method"); return; }
            if (amountOption === "other" && !customAmount) { toast.error("Please enter an amount"); return; }
            setStep("details");
          }}
          className="bg-dash-green hover:bg-dash-green/90 text-white font-semibold px-8 py-3 rounded-full text-sm transition-colors"
        >
          Next
        </button>
        <button
          onClick={() => {
            setAmountOption("balance");
            setCustomAmount("");
            setSelectedMethod("");
          }}
          className="bg-card border border-border hover:bg-muted text-foreground font-medium px-8 py-3 rounded-full text-sm transition-colors"
        >
          Cancel
        </button>
      </div>
    </div>
  );
};

export default CustomerPaymentMethods;
