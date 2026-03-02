import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Save, Loader2 } from "lucide-react";

const CustomerProfile = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ full_name: "", phone: "", address: "" });

  useEffect(() => {
    if (!user) return;
    supabase
      .from("profiles")
      .select("full_name, phone, address")
      .eq("user_id", user.id)
      .maybeSingle()
      .then(({ data }) => {
        if (data) setForm({ full_name: data.full_name || "", phone: data.phone || "", address: data.address || "" });
        setLoading(false);
      });
  }, [user]);

  const handleSave = async () => {
    if (!user) return;
    setSaving(true);
    const { error } = await supabase
      .from("profiles")
      .update({ full_name: form.full_name, phone: form.phone, address: form.address })
      .eq("user_id", user.id);
    setSaving(false);
    if (error) toast.error("Failed to save profile");
    else toast.success("Profile updated!");
  };

  const inputClass = "w-full bg-muted text-foreground rounded-lg px-4 py-3 text-sm outline-none border border-border focus:ring-2 focus:ring-ring transition-shadow";

  if (loading) return <div className="flex justify-center py-20"><Loader2 className="animate-spin text-gold" size={32} /></div>;

  return (
    <div className="max-w-xl">
      <h2 className="font-heading text-2xl font-bold text-foreground mb-6">Edit Profile</h2>
      <div className="bg-card rounded-xl border border-border p-6 space-y-4">
        <div>
          <label className="text-sm font-medium text-foreground mb-1.5 block">Email</label>
          <input value={user?.email || ""} disabled className={inputClass + " opacity-60 cursor-not-allowed"} />
        </div>
        <div>
          <label className="text-sm font-medium text-foreground mb-1.5 block">Full Name</label>
          <input value={form.full_name} onChange={(e) => setForm((f) => ({ ...f, full_name: e.target.value }))} className={inputClass} />
        </div>
        <div>
          <label className="text-sm font-medium text-foreground mb-1.5 block">Phone</label>
          <input value={form.phone} onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))} className={inputClass} />
        </div>
        <div>
          <label className="text-sm font-medium text-foreground mb-1.5 block">Address</label>
          <textarea value={form.address} onChange={(e) => setForm((f) => ({ ...f, address: e.target.value }))} rows={3} className={inputClass + " resize-none"} />
        </div>
        <button onClick={handleSave} disabled={saving} className="bg-gold-gradient text-accent-foreground px-6 py-3 rounded-lg font-semibold text-sm hover:opacity-90 transition-opacity flex items-center gap-2 disabled:opacity-50">
          {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
          Save Changes
        </button>
      </div>
    </div>
  );
};

export default CustomerProfile;
