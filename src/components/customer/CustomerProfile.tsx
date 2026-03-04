import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/components/ui/use-toast";
import { Save, Loader2, User, Phone, Mail, MapPin, Building2, Ruler } from "lucide-react";

interface ProjectSummary {
  project_name: string;
  total_amount: number;
  location: string | null;
  status: string;
}

const CustomerProfile = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ full_name: "", phone: "", address: "" });
  const [projects, setProjects] = useState<ProjectSummary[]>([]);

  useEffect(() => {
    if (!user) return;
    Promise.all([
      supabase.from("profiles").select("full_name, phone, address").eq("user_id", user.id).maybeSingle(),
      supabase.from("customer_projects").select("project_name, total_amount, location, status").eq("user_id", user.id),
    ]).then(([profileRes, projectsRes]) => {
      if (profileRes.data) setForm({ full_name: profileRes.data.full_name || "", phone: profileRes.data.phone || "", address: profileRes.data.address || "" });
      setProjects((projectsRes.data as ProjectSummary[]) || []);
      setLoading(false);
    });
  }, [user]);

  const handleSave = async () => {
    if (!user) return;
    if (!form.full_name.trim()) { toast.error("Name is required"); return; }
    if (form.full_name.length > 100) { toast.error("Name too long (max 100 chars)"); return; }
    if (form.phone && form.phone.length > 20) { toast.error("Phone too long"); return; }
    if (form.address && form.address.length > 500) { toast.error("Address too long"); return; }

    setSaving(true);
    const { error } = await supabase
      .from("profiles")
      .update({ full_name: form.full_name.trim(), phone: form.phone.trim(), address: form.address.trim() })
      .eq("user_id", user.id);
    setSaving(false);
    if (error) toast.error("Failed to save profile");
    else toast.success("Profile updated!");
  };

  const inputClass = "w-full bg-muted text-foreground rounded-lg px-4 py-3 text-sm outline-none border border-border focus:ring-2 focus:ring-ring transition-shadow";
  const totalPurchase = projects.reduce((sum, p) => sum + Number(p.total_amount), 0);
  const formatCurrency = (n: number) => new Intl.NumberFormat("en-BD", { style: "currency", currency: "BDT", maximumFractionDigits: 0 }).format(n);

  if (loading) return <div className="flex justify-center py-20"><Loader2 className="animate-spin text-gold" size={32} /></div>;

  return (
    <div className="max-w-3xl">
      <h2 className="font-heading text-2xl font-bold text-foreground mb-6">My Profile</h2>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Editable Profile */}
        <div className="bg-card rounded-xl border border-border p-6 space-y-4">
          <h3 className="font-heading text-lg font-semibold text-foreground flex items-center gap-2">
            <User size={18} className="text-gold" /> Personal Information
          </h3>
          <div>
            <label className="text-sm font-medium text-foreground mb-1.5 block flex items-center gap-1.5">
              <Mail size={14} className="text-muted-foreground" /> Email
            </label>
            <input value={user?.email || ""} disabled className={inputClass + " opacity-60 cursor-not-allowed"} />
          </div>
          <div>
            <label className="text-sm font-medium text-foreground mb-1.5 block flex items-center gap-1.5">
              <User size={14} className="text-muted-foreground" /> Full Name
            </label>
            <input value={form.full_name} onChange={(e) => setForm((f) => ({ ...f, full_name: e.target.value }))} className={inputClass} placeholder="Enter your full name" maxLength={100} />
          </div>
          <div>
            <label className="text-sm font-medium text-foreground mb-1.5 block flex items-center gap-1.5">
              <Phone size={14} className="text-muted-foreground" /> Phone Number
            </label>
            <input value={form.phone} onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))} className={inputClass} placeholder="e.g. +880 1XXX-XXXXXX" maxLength={20} />
          </div>
          <div>
            <label className="text-sm font-medium text-foreground mb-1.5 block flex items-center gap-1.5">
              <MapPin size={14} className="text-muted-foreground" /> Address
            </label>
            <textarea value={form.address} onChange={(e) => setForm((f) => ({ ...f, address: e.target.value }))} rows={3} className={inputClass + " resize-none"} placeholder="Your full address" maxLength={500} />
          </div>
          <button onClick={handleSave} disabled={saving} className="bg-gold-gradient text-accent-foreground px-6 py-3 rounded-lg font-semibold text-sm hover:opacity-90 transition-opacity flex items-center gap-2 disabled:opacity-50">
            {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
            Save Changes
          </button>
        </div>

        {/* Read-only Project & Financial Info */}
        <div className="space-y-6">
          {/* Purchase Summary */}
          <div className="bg-card rounded-xl border border-border p-6">
            <h3 className="font-heading text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
              <Building2 size={18} className="text-gold" /> Purchase Summary
            </h3>
            <div className="space-y-3">
              <div className="flex justify-between items-center py-2 border-b border-border">
                <span className="text-sm text-muted-foreground">Total Projects</span>
                <span className="font-semibold text-foreground">{projects.length}</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-border">
                <span className="text-sm text-muted-foreground">Total Purchase Amount</span>
                <span className="font-bold text-foreground text-lg">{formatCurrency(totalPurchase)}</span>
              </div>
            </div>
          </div>

          {/* Project Details */}
          {projects.map((project, idx) => (
            <div key={idx} className="bg-card rounded-xl border border-border p-6">
              <h3 className="font-heading text-base font-semibold text-foreground mb-3 flex items-center gap-2">
                <Ruler size={16} className="text-gold" /> {project.project_name}
              </h3>
              <div className="space-y-2">
                <div className="flex justify-between items-center py-1.5">
                  <span className="text-sm text-muted-foreground">Purchase Amount</span>
                  <span className="font-semibold text-foreground">{formatCurrency(Number(project.total_amount))}</span>
                </div>
                {project.location && (
                  <div className="flex justify-between items-center py-1.5">
                    <span className="text-sm text-muted-foreground">Location</span>
                    <span className="text-sm text-foreground">{project.location}</span>
                  </div>
                )}
                <div className="flex justify-between items-center py-1.5">
                  <span className="text-sm text-muted-foreground">Status</span>
                  <span className={`text-sm font-medium capitalize ${project.status === 'completed' ? 'text-green-500' : project.status === 'in_progress' ? 'text-gold' : 'text-muted-foreground'}`}>
                    {project.status.replace('_', ' ')}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default CustomerProfile;
