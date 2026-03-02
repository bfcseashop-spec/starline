import { useState, useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Building2, Upload, Save, Palette, FileText, Landmark, DollarSign, Settings2,
  Globe, Image as ImageIcon, Type, LayoutDashboard, Sparkles, X
} from "lucide-react";

type SettingsMap = Record<string, Record<string, any>>;

const CURRENCIES = [
  { code: "BDT", name: "Bangladeshi Taka", symbol: "৳" },
  { code: "USD", name: "US Dollar", symbol: "$" },
  { code: "AED", name: "UAE Dirham", symbol: "د.إ" },
  { code: "USDT", name: "Tether (USDT)", symbol: "₮" },
];

const BANKS = [
  { id: "bkash", name: "bKash", icon: "📱" },
  { id: "nagad", name: "Nagad", icon: "📱" },
  { id: "rocket", name: "Rocket (DBBL)", icon: "📱" },
  { id: "upay", name: "Upay", icon: "📱" },
  { id: "ibbl", name: "Islami Bank Bangladesh (IBBL)", icon: "🏦" },
  { id: "city", name: "City Bank", icon: "🏦" },
  { id: "brac", name: "BRAC Bank", icon: "🏦" },
  { id: "dbbl", name: "Dutch-Bangla Bank (DBBL)", icon: "🏦" },
  { id: "stripe", name: "Stripe", icon: "💳" },
  { id: "binance", name: "Binance Pay", icon: "🪙" },
  { id: "paypal", name: "PayPal", icon: "💰" },
];

const AdminSettings = () => {
  const [settings, setSettings] = useState<SettingsMap>({});
  const [saving, setSaving] = useState(false);
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const logoRef = useRef<HTMLInputElement>(null);
  const bannerRef = useRef<HTMLInputElement>(null);

  useEffect(() => { fetchSettings(); }, []);

  const fetchSettings = async () => {
    const { data } = await supabase.from("site_settings").select("*");
    if (data) {
      const map: SettingsMap = {};
      data.forEach((r: any) => { map[r.setting_key] = r.setting_value; });
      setSettings(map);
      if (map.company_info?.logo_url) setLogoUrl(map.company_info.logo_url);
    }
  };

  const saveSetting = async (key: string, value: Record<string, any>) => {
    setSaving(true);
    const { error } = await supabase.from("site_settings").upsert(
      { setting_key: key, setting_value: value },
      { onConflict: "setting_key" }
    );
    setSaving(false);
    if (error) { toast.error("Failed to save"); return; }
    toast.success("Settings saved");
    setSettings((prev) => ({ ...prev, [key]: value }));
  };

  const uploadFile = async (file: File, path: string) => {
    setUploading(true);
    const ext = file.name.split(".").pop();
    const filePath = `${path}/${Date.now()}.${ext}`;
    const { error } = await supabase.storage.from("company-assets").upload(filePath, file);
    setUploading(false);
    if (error) { toast.error("Upload failed"); return null; }
    const { data: pub } = supabase.storage.from("company-assets").getPublicUrl(filePath);
    return pub.publicUrl;
  };

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const url = await uploadFile(file, "logos");
    if (url) {
      setLogoUrl(url);
      const current = settings.company_info || {};
      saveSetting("company_info", { ...current, logo_url: url });
    }
  };

  /* ---- Company Info ---- */
  const CompanyInfoTab = () => {
    const info = settings.company_info || {};
    const [form, setForm] = useState({
      name: info.name || "", email: info.email || "", phone: info.phone || "",
      address: info.address || "", website: info.website || "", tax_id: info.tax_id || "",
    });
    return (
      <div className="space-y-6 max-w-2xl">
        <div className="flex items-start gap-6">
          <div className="relative group">
            <div className="w-28 h-28 rounded-2xl border-2 border-dashed border-border bg-muted flex items-center justify-center overflow-hidden">
              {logoUrl ? (
                <img src={logoUrl} alt="Logo" className="w-full h-full object-contain" />
              ) : (
                <Building2 className="text-muted-foreground" size={32} />
              )}
            </div>
            <button
              onClick={() => logoRef.current?.click()}
              className="absolute inset-0 bg-black/40 rounded-2xl opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity"
            >
              <Upload size={20} className="text-white" />
            </button>
            <input ref={logoRef} type="file" accept="image/*" className="hidden" onChange={handleLogoUpload} />
          </div>
          <div className="flex-1 space-y-1">
            <h3 className="font-heading text-lg font-bold text-foreground">Company Logo</h3>
            <p className="text-xs text-muted-foreground">Upload your company logo (PNG, JPG, SVG). Recommended 512×512.</p>
            {uploading && <p className="text-xs text-gold animate-pulse">Uploading...</p>}
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {([["name", "Company Name"], ["email", "Email"], ["phone", "Phone"], ["website", "Website"], ["tax_id", "Tax / VAT ID"], ["address", "Address"]] as const).map(([key, label]) => (
            <div key={key} className={key === "address" ? "sm:col-span-2" : ""}>
              <Label className="text-xs text-muted-foreground">{label}</Label>
              {key === "address" ? (
                <Textarea value={form[key]} onChange={(e) => setForm({ ...form, [key]: e.target.value })} className="mt-1" />
              ) : (
                <Input value={form[key]} onChange={(e) => setForm({ ...form, [key]: e.target.value })} className="mt-1" />
              )}
            </div>
          ))}
        </div>
        <Button onClick={() => saveSetting("company_info", { ...form, logo_url: logoUrl })} disabled={saving} className="bg-gold-gradient text-accent-foreground hover:opacity-90">
          <Save size={14} className="mr-2" /> Save Company Info
        </Button>
      </div>
    );
  };

  /* ---- Invoice Settings ---- */
  const InvoiceTab = () => {
    const inv = settings.invoice || {};
    const [form, setForm] = useState({
      prefix: inv.prefix || "INV-", next_number: inv.next_number || "1001",
      due_days: inv.due_days || "30", footer_note: inv.footer_note || "",
      terms: inv.terms || "", show_logo: inv.show_logo !== false,
      show_bank_details: inv.show_bank_details !== false,
    });
    return (
      <div className="space-y-6 max-w-2xl">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <Label className="text-xs text-muted-foreground">Invoice Prefix</Label>
            <Input value={form.prefix} onChange={(e) => setForm({ ...form, prefix: e.target.value })} className="mt-1" />
          </div>
          <div>
            <Label className="text-xs text-muted-foreground">Next Invoice #</Label>
            <Input value={form.next_number} onChange={(e) => setForm({ ...form, next_number: e.target.value })} className="mt-1" />
          </div>
          <div>
            <Label className="text-xs text-muted-foreground">Payment Due (days)</Label>
            <Input type="number" value={form.due_days} onChange={(e) => setForm({ ...form, due_days: e.target.value })} className="mt-1" />
          </div>
        </div>
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2">
            <Switch checked={form.show_logo} onCheckedChange={(v) => setForm({ ...form, show_logo: v })} />
            <Label className="text-sm">Show Logo on Invoice</Label>
          </div>
          <div className="flex items-center gap-2">
            <Switch checked={form.show_bank_details} onCheckedChange={(v) => setForm({ ...form, show_bank_details: v })} />
            <Label className="text-sm">Show Bank Details</Label>
          </div>
        </div>
        <div>
          <Label className="text-xs text-muted-foreground">Footer Note</Label>
          <Textarea value={form.footer_note} onChange={(e) => setForm({ ...form, footer_note: e.target.value })} className="mt-1" placeholder="Thank you for your business!" />
        </div>
        <div>
          <Label className="text-xs text-muted-foreground">Terms & Conditions</Label>
          <Textarea value={form.terms} onChange={(e) => setForm({ ...form, terms: e.target.value })} className="mt-1" rows={4} />
        </div>
        <Button onClick={() => saveSetting("invoice", form)} disabled={saving} className="bg-gold-gradient text-accent-foreground hover:opacity-90">
          <Save size={14} className="mr-2" /> Save Invoice Settings
        </Button>
      </div>
    );
  };

  /* ---- Currency Settings ---- */
  const CurrencyTab = () => {
    const cur = settings.currency || {};
    const [defaultCur, setDefaultCur] = useState(cur.default || "BDT");
    const [enabled, setEnabled] = useState<string[]>(cur.enabled || ["BDT"]);

    const toggle = (code: string) => {
      setEnabled((prev) => prev.includes(code) ? prev.filter((c) => c !== code) : [...prev, code]);
    };

    return (
      <div className="space-y-6 max-w-2xl">
        <div>
          <Label className="text-xs text-muted-foreground">Default Currency</Label>
          <Select value={defaultCur} onValueChange={setDefaultCur}>
            <SelectTrigger className="mt-1 w-60"><SelectValue /></SelectTrigger>
            <SelectContent>
              {CURRENCIES.map((c) => (
                <SelectItem key={c.code} value={c.code}>{c.symbol} {c.name} ({c.code})</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label className="text-xs text-muted-foreground mb-3 block">Accepted Currencies</Label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {CURRENCIES.map((c) => (
              <div key={c.code} className={`flex items-center justify-between rounded-xl border p-4 transition-colors cursor-pointer ${enabled.includes(c.code) ? "border-gold bg-gold/5" : "border-border"}`} onClick={() => toggle(c.code)}>
                <div className="flex items-center gap-3">
                  <span className="text-xl">{c.symbol}</span>
                  <div>
                    <p className="text-sm font-medium text-foreground">{c.name}</p>
                    <p className="text-xs text-muted-foreground">{c.code}</p>
                  </div>
                </div>
                <Switch checked={enabled.includes(c.code)} onCheckedChange={() => toggle(c.code)} />
              </div>
            ))}
          </div>
        </div>
        <Button onClick={() => saveSetting("currency", { default: defaultCur, enabled })} disabled={saving} className="bg-gold-gradient text-accent-foreground hover:opacity-90">
          <Save size={14} className="mr-2" /> Save Currency Settings
        </Button>
      </div>
    );
  };

  /* ---- Bank Settings ---- */
  const BankTab = () => {
    const bank = settings.bank || {};
    const [accounts, setAccounts] = useState<Record<string, { enabled: boolean; account_name: string; account_number: string; branch: string; extra: string }>>(
      bank.accounts || BANKS.reduce((acc, b) => ({ ...acc, [b.id]: { enabled: false, account_name: "", account_number: "", branch: "", extra: "" } }), {})
    );

    const update = (id: string, field: string, value: any) => {
      setAccounts((prev) => ({ ...prev, [id]: { ...prev[id], [field]: value } }));
    };

    return (
      <div className="space-y-4 max-w-3xl">
        {BANKS.map((b) => {
          const acc = accounts[b.id] || { enabled: false, account_name: "", account_number: "", branch: "", extra: "" };
          return (
            <div key={b.id} className={`rounded-xl border p-4 transition-colors ${acc.enabled ? "border-gold bg-gold/5" : "border-border"}`}>
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                  <span className="text-xl">{b.icon}</span>
                  <h4 className="font-medium text-sm text-foreground">{b.name}</h4>
                </div>
                <Switch checked={acc.enabled} onCheckedChange={(v) => update(b.id, "enabled", v)} />
              </div>
              {acc.enabled && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-3">
                  <div>
                    <Label className="text-xs text-muted-foreground">Account Name</Label>
                    <Input value={acc.account_name} onChange={(e) => update(b.id, "account_name", e.target.value)} className="mt-1" />
                  </div>
                  <div>
                    <Label className="text-xs text-muted-foreground">Account / Wallet Number</Label>
                    <Input value={acc.account_number} onChange={(e) => update(b.id, "account_number", e.target.value)} className="mt-1" />
                  </div>
                  <div>
                    <Label className="text-xs text-muted-foreground">Branch / Routing</Label>
                    <Input value={acc.branch} onChange={(e) => update(b.id, "branch", e.target.value)} className="mt-1" />
                  </div>
                  <div>
                    <Label className="text-xs text-muted-foreground">Extra Info (Swift, IBAN, etc.)</Label>
                    <Input value={acc.extra} onChange={(e) => update(b.id, "extra", e.target.value)} className="mt-1" />
                  </div>
                </div>
              )}
            </div>
          );
        })}
        <Button onClick={() => saveSetting("bank", { accounts })} disabled={saving} className="bg-gold-gradient text-accent-foreground hover:opacity-90">
          <Save size={14} className="mr-2" /> Save Bank Settings
        </Button>
      </div>
    );
  };

  /* ---- System / Landing Page Settings ---- */
  const SystemTab = () => {
    const sys = settings.system || {};
    const [form, setForm] = useState({
      banner_title: sys.banner_title || "", banner_subtitle: sys.banner_subtitle || "",
      primary_color: sys.primary_color || "#c9a55a", accent_color: sys.accent_color || "#1a1a2e",
      theme: sys.theme || "dark", header_style: sys.header_style || "default",
      show_stats: sys.show_stats !== false, show_featured: sys.show_featured !== false,
      show_contact: sys.show_contact !== false, banner_image_url: sys.banner_image_url || "",
    });
    const [bannerUploading, setBannerUploading] = useState(false);

    const handleBannerUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;
      setBannerUploading(true);
      const url = await uploadFile(file, "banners");
      setBannerUploading(false);
      if (url) setForm({ ...form, banner_image_url: url });
    };

    return (
      <div className="space-y-6 max-w-2xl">
        <h3 className="font-heading text-base font-bold text-foreground flex items-center gap-2"><LayoutDashboard size={16} /> Landing Page</h3>

        {/* Banner */}
        <div>
          <Label className="text-xs text-muted-foreground">Banner Image</Label>
          <div className="mt-1 relative rounded-xl border-2 border-dashed border-border bg-muted h-36 flex items-center justify-center overflow-hidden cursor-pointer group" onClick={() => bannerRef.current?.click()}>
            {form.banner_image_url ? (
              <>
                <img src={form.banner_image_url} className="w-full h-full object-cover" alt="Banner" />
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                  <Upload size={24} className="text-white" />
                </div>
              </>
            ) : (
              <div className="text-center text-muted-foreground">
                <ImageIcon size={28} className="mx-auto mb-1" />
                <p className="text-xs">Click to upload banner</p>
              </div>
            )}
          </div>
          <input ref={bannerRef} type="file" accept="image/*" className="hidden" onChange={handleBannerUpload} />
          {bannerUploading && <p className="text-xs text-gold animate-pulse mt-1">Uploading...</p>}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="sm:col-span-2">
            <Label className="text-xs text-muted-foreground">Banner Title</Label>
            <Input value={form.banner_title} onChange={(e) => setForm({ ...form, banner_title: e.target.value })} className="mt-1" placeholder="Welcome to Starline..." />
          </div>
          <div className="sm:col-span-2">
            <Label className="text-xs text-muted-foreground">Banner Subtitle</Label>
            <Input value={form.banner_subtitle} onChange={(e) => setForm({ ...form, banner_subtitle: e.target.value })} className="mt-1" />
          </div>
        </div>

        <h3 className="font-heading text-base font-bold text-foreground flex items-center gap-2 pt-2"><Palette size={16} /> Colors & Theme</h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <Label className="text-xs text-muted-foreground">Primary Color</Label>
            <div className="flex items-center gap-2 mt-1">
              <input type="color" value={form.primary_color} onChange={(e) => setForm({ ...form, primary_color: e.target.value })} className="w-10 h-10 rounded-lg border border-border cursor-pointer" />
              <Input value={form.primary_color} onChange={(e) => setForm({ ...form, primary_color: e.target.value })} className="flex-1" />
            </div>
          </div>
          <div>
            <Label className="text-xs text-muted-foreground">Accent Color</Label>
            <div className="flex items-center gap-2 mt-1">
              <input type="color" value={form.accent_color} onChange={(e) => setForm({ ...form, accent_color: e.target.value })} className="w-10 h-10 rounded-lg border border-border cursor-pointer" />
              <Input value={form.accent_color} onChange={(e) => setForm({ ...form, accent_color: e.target.value })} className="flex-1" />
            </div>
          </div>
          <div>
            <Label className="text-xs text-muted-foreground">Theme</Label>
            <Select value={form.theme} onValueChange={(v) => setForm({ ...form, theme: v })}>
              <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="dark">Dark</SelectItem>
                <SelectItem value="light">Light</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <h3 className="font-heading text-base font-bold text-foreground flex items-center gap-2 pt-2"><Sparkles size={16} /> Features & Sections</h3>
        <div className="flex flex-wrap gap-6">
          {([["show_stats", "Stats Section"], ["show_featured", "Featured Properties"], ["show_contact", "Contact Form"]] as const).map(([key, label]) => (
            <div key={key} className="flex items-center gap-2">
              <Switch checked={form[key]} onCheckedChange={(v) => setForm({ ...form, [key]: v })} />
              <Label className="text-sm">{label}</Label>
            </div>
          ))}
        </div>

        <div>
          <Label className="text-xs text-muted-foreground">Header Style</Label>
          <Select value={form.header_style} onValueChange={(v) => setForm({ ...form, header_style: v })}>
            <SelectTrigger className="mt-1 w-60"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="default">Default</SelectItem>
              <SelectItem value="centered">Centered</SelectItem>
              <SelectItem value="minimal">Minimal</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <Button onClick={() => saveSetting("system", form)} disabled={saving} className="bg-gold-gradient text-accent-foreground hover:opacity-90">
          <Save size={14} className="mr-2" /> Save System Settings
        </Button>
      </div>
    );
  };

  return (
    <Tabs defaultValue="company" className="w-full">
      <TabsList className="bg-muted/50 border border-border rounded-xl p-1 h-auto flex-wrap gap-1">
        <TabsTrigger value="company" className="rounded-lg data-[state=active]:bg-gold-gradient data-[state=active]:text-accent-foreground gap-1.5 text-xs">
          <Building2 size={14} /> Company Info
        </TabsTrigger>
        <TabsTrigger value="invoice" className="rounded-lg data-[state=active]:bg-gold-gradient data-[state=active]:text-accent-foreground gap-1.5 text-xs">
          <FileText size={14} /> Invoice
        </TabsTrigger>
        <TabsTrigger value="currency" className="rounded-lg data-[state=active]:bg-gold-gradient data-[state=active]:text-accent-foreground gap-1.5 text-xs">
          <DollarSign size={14} /> Currency
        </TabsTrigger>
        <TabsTrigger value="bank" className="rounded-lg data-[state=active]:bg-gold-gradient data-[state=active]:text-accent-foreground gap-1.5 text-xs">
          <Landmark size={14} /> Bank
        </TabsTrigger>
        <TabsTrigger value="system" className="rounded-lg data-[state=active]:bg-gold-gradient data-[state=active]:text-accent-foreground gap-1.5 text-xs">
          <Settings2 size={14} /> System
        </TabsTrigger>
      </TabsList>

      <TabsContent value="company" className="mt-6"><CompanyInfoTab /></TabsContent>
      <TabsContent value="invoice" className="mt-6"><InvoiceTab /></TabsContent>
      <TabsContent value="currency" className="mt-6"><CurrencyTab /></TabsContent>
      <TabsContent value="bank" className="mt-6"><BankTab /></TabsContent>
      <TabsContent value="system" className="mt-6"><SystemTab /></TabsContent>
    </Tabs>
  );
};

export default AdminSettings;
