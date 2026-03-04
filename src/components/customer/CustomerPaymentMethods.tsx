import { useEffect, useState, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Loader2, ChevronLeft, CreditCard, Building2, Smartphone, Globe, Copy, Check, Upload, X, CheckCircle2, Image } from "lucide-react";
import { toast } from "@/components/ui/use-toast";
import { withMutationToast } from "@/lib/supabase-helpers";

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

const CustomerPaymentMethods = ({ onPaymentComplete }: { onPaymentComplete?: () => void }) => {
  const { user } = useAuth();
  const [methods, setMethods] = useState<PaymentMethod[]>([]);
  const [loading, setLoading] = useState(true);
  const [copiedField, setCopiedField] = useState<string | null>(null);

  const [balance, setBalance] = useState(0);
  const [amountOption, setAmountOption] = useState<"balance" | "other">("balance");
  const [customAmount, setCustomAmount] = useState("");
  const [selectedMethod, setSelectedMethod] = useState("");
  const [paymentDate, setPaymentDate] = useState(() => new Date().toISOString().split("T")[0]);
  const [referenceNo, setReferenceNo] = useState("");
  const [paymentType, setPaymentType] = useState("installment");
  const [step, setStep] = useState<"form" | "details" | "slip" | "done">("form");

  // Slip upload
  const [slipFile, setSlipFile] = useState<File | null>(null);
  const [slipPreview, setSlipPreview] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

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

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) { toast.error("File must be under 5MB"); return; }
    setSlipFile(file);
    setSlipPreview(URL.createObjectURL(file));
  };

  const handleSubmitPayment = async () => {
    if (!user) return;
    setUploading(true);
    try {
      let slipUrl: string | null = null;

      if (slipFile) {
        const ext = slipFile.name.split(".").pop();
        const path = `${user.id}/${Date.now()}.${ext}`;
        const { error: uploadErr } = await supabase.storage.from("payment-images").upload(path, slipFile);
        if (uploadErr) throw uploadErr;
        const { data: urlData } = supabase.storage.from("payment-images").getPublicUrl(path);
        slipUrl = urlData.publicUrl;
      }

      const ok = await withMutationToast(
        () =>
          supabase.from("payments").insert({
            user_id: user.id,
            amount: payAmount,
            payment_method: selectedMethodObj?.method_type || "other",
            payment_date: paymentDate,
            reference_no: referenceNo || null,
            image_url: slipUrl,
            status: "pending",
            payment_type: paymentType,
            notes: `Via ${selectedMethodObj?.title || "Unknown"}`,
          }),
        { successMessage: "Payment submitted successfully!" },
      );

      if (!ok) return;
      setStep("done");
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to submit payment";
      toast.error(message);
    } finally {
      setUploading(false);
    }
  };

  const resetForm = () => {
    setStep("form");
    setAmountOption("balance");
    setCustomAmount("");
    setSelectedMethod("");
    setReferenceNo("");
    setPaymentType("installment");
    setSlipFile(null);
    setSlipPreview(null);
    setPaymentDate(new Date().toISOString().split("T")[0]);
  };

  if (loading) return <div className="flex justify-center py-20"><Loader2 className="animate-spin text-gold" size={32} /></div>;

  // Step 4: Done
  if (step === "done") {
    return (
      <div className="max-w-lg mx-auto text-center py-12">
        <div className="w-16 h-16 bg-dash-green/10 rounded-full flex items-center justify-center mx-auto mb-4">
          <CheckCircle2 size={32} className="text-dash-green" />
        </div>
        <h2 className="font-heading text-2xl font-bold text-foreground mb-2">Payment Submitted!</h2>
        <p className="text-muted-foreground text-sm mb-6">
          Your payment of <span className="font-bold text-foreground">{fmt(payAmount)}</span> has been submitted and is pending verification. You'll be notified once it's confirmed.
        </p>
        <div className="flex gap-3 justify-center">
          <button onClick={() => onPaymentComplete?.()} className="bg-dash-green hover:bg-dash-green/90 text-white font-semibold px-8 py-3 rounded-full text-sm transition-colors">
            View Payments
          </button>
          <button onClick={resetForm} className="bg-card border border-border hover:bg-muted text-foreground font-medium px-8 py-3 rounded-full text-sm transition-colors">
            Make Another Payment
          </button>
        </div>
      </div>
    );
  }

  // Step 3: Upload payment slip
  if (step === "slip") {
    return (
      <div className="max-w-lg mx-auto">
        <button onClick={() => setStep("details")} className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-6 transition-colors">
          <ChevronLeft size={16} /> Back
        </button>

        <h2 className="font-heading text-2xl font-bold text-foreground mb-2">Upload Payment Slip</h2>
        <p className="text-muted-foreground text-sm mb-6">
          Upload a screenshot or photo of your payment receipt for verification.
        </p>

        {/* Reference / TXN ID */}
        <div className="mb-6">
          <h3 className="font-heading text-base font-bold text-foreground mb-2">Reference / TXN ID</h3>
          <input
            type="text"
            value={referenceNo}
            onChange={(e) => setReferenceNo(e.target.value)}
            placeholder="Enter transaction reference number"
            className="w-full p-4 rounded-xl border border-border bg-card text-foreground text-sm focus:outline-none focus:border-dash-green transition-colors"
          />
        </div>

        {/* Upload area */}
        <div className="mb-6">
          <h3 className="font-heading text-base font-bold text-foreground mb-2">Payment Slip</h3>
          <input ref={fileInputRef} type="file" accept="image/*" onChange={handleFileSelect} className="hidden" />

          {slipPreview ? (
            <div className="relative rounded-xl border border-border overflow-hidden">
              <img src={slipPreview} alt="Payment slip" className="w-full max-h-64 object-contain bg-muted" />
              <button
                onClick={() => { setSlipFile(null); setSlipPreview(null); }}
                className="absolute top-2 right-2 bg-background/80 backdrop-blur-sm p-1.5 rounded-full text-muted-foreground hover:text-destructive transition-colors"
              >
                <X size={16} />
              </button>
            </div>
          ) : (
            <button
              onClick={() => fileInputRef.current?.click()}
              className="w-full border-2 border-dashed border-border hover:border-dash-green/50 rounded-xl p-8 flex flex-col items-center gap-3 transition-colors group"
            >
              <div className="w-12 h-12 bg-muted rounded-full flex items-center justify-center group-hover:bg-dash-green/10 transition-colors">
                <Image size={24} className="text-muted-foreground group-hover:text-dash-green transition-colors" />
              </div>
              <div className="text-center">
                <p className="text-sm font-medium text-foreground">Click to upload payment slip</p>
                <p className="text-xs text-muted-foreground mt-1">PNG, JPG up to 5MB</p>
              </div>
            </button>
          )}
        </div>

        {/* Summary */}
        <div className="bg-muted/50 rounded-xl p-4 mb-6 space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Amount</span>
            <span className="font-bold text-foreground">{fmt(payAmount)}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Method</span>
            <span className="font-medium text-foreground">{selectedMethodObj?.title}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Date</span>
            <span className="font-medium text-foreground">{new Date(paymentDate).toLocaleDateString()}</span>
          </div>
          {referenceNo && (
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Reference</span>
              <span className="font-medium text-foreground">{referenceNo}</span>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex gap-3">
          <button
            onClick={handleSubmitPayment}
            disabled={uploading}
            className="bg-dash-green hover:bg-dash-green/90 text-white font-semibold px-8 py-3 rounded-full text-sm transition-colors disabled:opacity-50 flex items-center gap-2"
          >
            {uploading ? <><Loader2 size={16} className="animate-spin" /> Submitting...</> : "Submit Payment"}
          </button>
          <button
            onClick={() => handleSubmitPayment()}
            disabled={uploading || !!slipFile}
            className="bg-card border border-border hover:bg-muted text-foreground font-medium px-8 py-3 rounded-full text-sm transition-colors disabled:opacity-50"
            style={{ display: slipFile ? "none" : undefined }}
          >
            Skip
          </button>
        </div>
      </div>
    );
  }

  // Step 2: Show selected method details
  if (step === "details" && selectedMethodObj) {
    const Icon = typeIcons[selectedMethodObj.method_type] || CreditCard;
    return (
      <div className="max-w-lg mx-auto">
        <button onClick={() => setStep("form")} className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-6 transition-colors">
          <ChevronLeft size={16} /> Back
        </button>

        <h2 className="font-heading text-2xl font-bold text-foreground mb-2">Complete Your Payment</h2>
        <p className="text-muted-foreground text-sm mb-6">
          Pay <span className="font-bold text-foreground">{fmt(payAmount)}</span> using the details below, then proceed to upload your payment slip.
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

        <div className="bg-dash-green/5 border border-dash-green/20 rounded-xl p-5 mb-6">
          <h4 className="font-heading text-base font-semibold text-foreground mb-2">Payment Instructions</h4>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li>• Include your <span className="text-dash-green font-medium">Project Reference Number</span> when making payments</li>
            <li>• After payment, keep the receipt for your records</li>
            <li>• Payments are verified within 24-48 hours</li>
          </ul>
        </div>

        <button
          onClick={() => setStep("slip")}
          className="bg-dash-green hover:bg-dash-green/90 text-white font-semibold px-8 py-3 rounded-full text-sm transition-colors flex items-center gap-2"
        >
          <Upload size={16} /> I've Paid — Upload Slip
        </button>
      </div>
    );
  }

  // Step 1: Form
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

      {/* Select payment type */}
      <div className="mb-8">
        <h3 className="font-heading text-base font-bold text-foreground mb-3">Payment type</h3>
        <div className="grid grid-cols-2 gap-2">
          {[
            { value: "down_payment", label: "Down Payment" },
            { value: "installment", label: "Installment" },
            { value: "advance", label: "Advance" },
            { value: "other", label: "Other" },
          ].map((t) => (
            <button
              key={t.value}
              type="button"
              onClick={() => setPaymentType(t.value)}
              className={`p-3 rounded-xl border text-sm font-medium transition-colors ${
                paymentType === t.value
                  ? "border-dash-green bg-dash-green/5 text-foreground"
                  : "border-border bg-card text-muted-foreground hover:border-muted-foreground/40"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
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
          onClick={resetForm}
          className="bg-card border border-border hover:bg-muted text-foreground font-medium px-8 py-3 rounded-full text-sm transition-colors"
        >
          Cancel
        </button>
      </div>
    </div>
  );
};

export default CustomerPaymentMethods;
