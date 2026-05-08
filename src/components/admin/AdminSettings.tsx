import React, { useState, useEffect, useRef } from "react";
import { backend } from "@/lib/backendClient";
import { toast } from "@/components/ui/use-toast";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Building2, Upload, Save, Palette, FileText, Landmark, DollarSign, Settings2,
  Globe, Image as ImageIcon, Type, LayoutDashboard, Sparkles, X, Hash, Printer, Info,
  Clock, Shield, Award, Users, HeartHandshake, BarChart3, Trash2, Plus, GripVertical,
  Pencil, ArrowUp, ArrowDown
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

/* ---- Reusable Section Card ---- */
const SectionCard = React.forwardRef<HTMLDivElement, { icon: any; title: string; children: React.ReactNode; iconColor?: string }>(({ icon: Icon, title, children, iconColor = "text-primary" }, ref) => (
  <div ref={ref} className="bg-card rounded-2xl border border-border shadow-sm p-6 space-y-5">
    <div className="flex items-center gap-3">
      <div className={`w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center ${iconColor}`}>
        <Icon size={16} />
      </div>
      <h3 className="font-heading text-base font-bold text-foreground">{title}</h3>
    </div>
    {children}
  </div>
));
SectionCard.displayName = "SectionCard";

const AdminSettings = () => {
  const [settings, setSettings] = useState<SettingsMap>({});
  const [saving, setSaving] = useState(false);
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const logoRef = useRef<HTMLInputElement>(null);
  const bannerRef = useRef<HTMLInputElement>(null);
  const faviconRef = useRef<HTMLInputElement>(null);

  useEffect(() => { fetchSettings(); }, []);

  const fetchSettings = async () => {
    const { data } = await backend.from("site_settings").select("*");
    if (data) {
      const map: SettingsMap = {};
      data.forEach((r: any) => { map[r.setting_key] = r.setting_value; });
      setSettings(map);
      if (map.company_info?.logo_url) setLogoUrl(map.company_info.logo_url);
    }
  };

  const saveSetting = async (key: string, value: Record<string, any>) => {
    setSaving(true);
    const { error } = await backend.from("site_settings").upsert(
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
    const { error } = await backend.storage.from("company-assets").upload(filePath, file);
    setUploading(false);
    if (error) { toast.error("Upload failed"); return null; }
    const { data: pub } = backend.storage.from("company-assets").getPublicUrl(filePath);
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

  const removeLogo = () => {
    setLogoUrl(null);
    const current = settings.company_info || {};
    saveSetting("company_info", { ...current, logo_url: null });
  };

  /* ---- Company Info Tab ---- */
  const CompanyInfoTab = () => {
    const info = settings.company_info || {};
    const [form, setForm] = useState({
      name: info.name || "", email: info.email || "", phone: info.phone || "",
      address: info.address || "", website: info.website || "", tax_id: info.tax_id || "",
      tagline: info.tagline || "", version: info.version || "1.0.0",
    });
    useEffect(() => {
      setForm({
        name: info.name || "",
        email: info.email || "",
        phone: info.phone || "",
        address: info.address || "",
        website: info.website || "",
        tax_id: info.tax_id || "",
        tagline: info.tagline || "",
        version: info.version || "1.0.0",
      });
    }, [info.address, info.email, info.name, info.phone, info.tagline, info.tax_id, info.version, info.website]);

    return (
      <div className="space-y-6 max-w-2xl">
        {/* Application Info */}
        <SectionCard icon={Info} title="Application Info" iconColor="text-blue-600">
          <div>
            <Label className="text-xs font-semibold text-foreground mb-2 block">Logo / Image</Label>
            <div className="flex items-start gap-4">
              <div className="w-20 h-20 rounded-xl border-2 border-dashed border-border bg-muted flex items-center justify-center overflow-hidden shrink-0">
                {logoUrl ? (
                  <img src={logoUrl} alt="Logo" className="w-full h-full object-contain" />
                ) : (
                  <Building2 className="text-muted-foreground" size={28} />
                )}
              </div>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="sm" onClick={() => logoRef.current?.click()} className="gap-1.5 text-xs">
                    <Upload size={12} /> Change Logo
                  </Button>
                  {logoUrl && (
                    <Button variant="outline" size="sm" onClick={removeLogo} className="gap-1.5 text-xs text-destructive hover:text-destructive">
                      <X size={12} /> Remove
                    </Button>
                  )}
                </div>
                <p className="text-xs text-muted-foreground">PNG, JPG or SVG. Max 2MB. Used on invoices and receipts.</p>
                {uploading && <p className="text-xs text-primary animate-pulse">Uploading...</p>}
              </div>
              <input ref={logoRef} type="file" accept="image/*" className="hidden" onChange={handleLogoUpload} />
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <Label className="text-xs font-semibold text-foreground">Application Name</Label>
              <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="mt-1.5 bg-muted/50" />
            </div>
            <div>
              <Label className="text-xs font-semibold text-foreground">Version</Label>
              <Input value={form.version} onChange={(e) => setForm({ ...form, version: e.target.value })} className="mt-1.5 bg-muted/50" />
            </div>
          </div>
          <div>
            <Label className="text-xs font-semibold text-foreground">Tagline</Label>
            <Input value={form.tagline} onChange={(e) => setForm({ ...form, tagline: e.target.value })} className="mt-1.5 bg-muted/50" placeholder="e.g. Property Management System" />
          </div>
        </SectionCard>

        {/* Company Information */}
        <SectionCard icon={Building2} title="Company Information" iconColor="text-emerald-600">
          <div>
            <Label className="text-xs font-semibold text-foreground">Company Name</Label>
            <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="mt-1.5 bg-muted/50" />
          </div>
          <div>
            <Label className="text-xs font-semibold text-foreground">Address</Label>
            <Textarea value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} className="mt-1.5 bg-muted/50" rows={2} />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <Label className="text-xs font-semibold text-foreground">Phone</Label>
              <Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} className="mt-1.5 bg-muted/50" />
            </div>
            <div>
              <Label className="text-xs font-semibold text-foreground">Email</Label>
              <Input value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className="mt-1.5 bg-muted/50" />
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <Label className="text-xs font-semibold text-foreground">Website</Label>
              <Input value={form.website} onChange={(e) => setForm({ ...form, website: e.target.value })} className="mt-1.5 bg-muted/50" />
            </div>
            <div>
              <Label className="text-xs font-semibold text-foreground">Tax / VAT ID</Label>
              <Input value={form.tax_id} onChange={(e) => setForm({ ...form, tax_id: e.target.value })} className="mt-1.5 bg-muted/50" />
            </div>
          </div>
        </SectionCard>

        <Button onClick={() => saveSetting("company_info", { ...form, logo_url: logoUrl })} disabled={saving} className="bg-primary text-primary-foreground hover:bg-primary/90 gap-2">
          <Save size={14} /> Save Changes
        </Button>
      </div>
    );
  };

  /* ---- Invoice Settings Tab ---- */
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
        {/* ID Prefixes */}
        <SectionCard icon={Hash} title="ID Prefixes" iconColor="text-violet-600">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <Label className="text-xs font-semibold text-foreground">Invoice Prefix</Label>
              <Input value={form.prefix} onChange={(e) => setForm({ ...form, prefix: e.target.value })} className="mt-1.5 bg-muted/50" />
            </div>
            <div>
              <Label className="text-xs font-semibold text-foreground">Next Invoice #</Label>
              <Input value={form.next_number} onChange={(e) => setForm({ ...form, next_number: e.target.value })} className="mt-1.5 bg-muted/50" />
            </div>
            <div>
              <Label className="text-xs font-semibold text-foreground">Payment Due (days)</Label>
              <Input type="number" value={form.due_days} onChange={(e) => setForm({ ...form, due_days: e.target.value })} className="mt-1.5 bg-muted/50" />
            </div>
          </div>
        </SectionCard>

        {/* Print Settings */}
        <SectionCard icon={Printer} title="Print Settings" iconColor="text-orange-600">
          <div className="flex flex-wrap gap-6">
            <div className="flex items-center gap-2">
              <Switch checked={form.show_logo} onCheckedChange={(v) => setForm({ ...form, show_logo: v })} />
              <Label className="text-sm">Show Logo on Invoice</Label>
            </div>
            <div className="flex items-center gap-2">
              <Switch checked={form.show_bank_details} onCheckedChange={(v) => setForm({ ...form, show_bank_details: v })} />
              <Label className="text-sm">Show Bank Details</Label>
            </div>
          </div>
        </SectionCard>

        {/* Terms & Notes */}
        <SectionCard icon={FileText} title="Terms & Notes" iconColor="text-sky-600">
          <div>
            <Label className="text-xs font-semibold text-foreground">Footer Note</Label>
            <Textarea value={form.footer_note} onChange={(e) => setForm({ ...form, footer_note: e.target.value })} className="mt-1.5 bg-muted/50" placeholder="Thank you for your business!" />
          </div>
          <div>
            <Label className="text-xs font-semibold text-foreground">Terms & Conditions</Label>
            <Textarea value={form.terms} onChange={(e) => setForm({ ...form, terms: e.target.value })} className="mt-1.5 bg-muted/50" rows={4} />
          </div>
        </SectionCard>

        <Button onClick={() => saveSetting("invoice", form)} disabled={saving} className="bg-primary text-primary-foreground hover:bg-primary/90 gap-2">
          <Save size={14} /> Save Changes
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
        <SectionCard icon={DollarSign} title="Default Currency" iconColor="text-emerald-600">
          <div>
            <Label className="text-xs font-semibold text-foreground">Default Currency</Label>
            <Select value={defaultCur} onValueChange={setDefaultCur}>
              <SelectTrigger className="mt-1.5 w-full bg-muted/50"><SelectValue /></SelectTrigger>
              <SelectContent>
                {CURRENCIES.map((c) => (
                  <SelectItem key={c.code} value={c.code}>{c.symbol} {c.name} ({c.code})</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </SectionCard>

        <SectionCard icon={Globe} title="Accepted Currencies" iconColor="text-blue-600">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {CURRENCIES.map((c) => (
              <div key={c.code} className={`flex items-center justify-between rounded-xl border p-4 transition-colors cursor-pointer ${enabled.includes(c.code) ? "border-primary bg-primary/5" : "border-border"}`} onClick={() => toggle(c.code)}>
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
        </SectionCard>

        <Button onClick={() => saveSetting("currency", { default: defaultCur, enabled })} disabled={saving} className="bg-primary text-primary-foreground hover:bg-primary/90 gap-2">
          <Save size={14} /> Save Changes
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
        <SectionCard icon={Landmark} title="Bank & Wallet Accounts" iconColor="text-amber-600">
          <div className="space-y-3">
            {BANKS.map((b) => {
              const acc = accounts[b.id] || { enabled: false, account_name: "", account_number: "", branch: "", extra: "" };
              return (
                <div key={b.id} className={`rounded-xl border p-4 transition-colors ${acc.enabled ? "border-primary bg-primary/5" : "border-border"}`}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="text-xl">{b.icon}</span>
                      <h4 className="font-medium text-sm text-foreground">{b.name}</h4>
                    </div>
                    <Switch checked={acc.enabled} onCheckedChange={(v) => update(b.id, "enabled", v)} />
                  </div>
                  {acc.enabled && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-4">
                      <div>
                        <Label className="text-xs font-semibold text-foreground">Account Name</Label>
                        <Input value={acc.account_name} onChange={(e) => update(b.id, "account_name", e.target.value)} className="mt-1.5 bg-muted/50" />
                      </div>
                      <div>
                        <Label className="text-xs font-semibold text-foreground">Account / Wallet Number</Label>
                        <Input value={acc.account_number} onChange={(e) => update(b.id, "account_number", e.target.value)} className="mt-1.5 bg-muted/50" />
                      </div>
                      <div>
                        <Label className="text-xs font-semibold text-foreground">Branch / Routing</Label>
                        <Input value={acc.branch} onChange={(e) => update(b.id, "branch", e.target.value)} className="mt-1.5 bg-muted/50" />
                      </div>
                      <div>
                        <Label className="text-xs font-semibold text-foreground">Extra Info (Swift, IBAN, etc.)</Label>
                        <Input value={acc.extra} onChange={(e) => update(b.id, "extra", e.target.value)} className="mt-1.5 bg-muted/50" />
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </SectionCard>

        <Button onClick={() => saveSetting("bank", { accounts })} disabled={saving} className="bg-primary text-primary-foreground hover:bg-primary/90 gap-2">
          <Save size={14} /> Save Changes
        </Button>
      </div>
    );
  };

  /* ---- System / Landing Page Settings ---- */
  const SystemTab = () => {
    const sys = settings.system || {};
    const [form, setForm] = useState({
      primary_color: sys.primary_color || "#c9a55a", accent_color: sys.accent_color || "#1a1a2e",
      theme: sys.theme || "dark", header_style: sys.header_style || "default",
      show_stats: sys.show_stats !== false, show_featured: sys.show_featured !== false,
      show_contact: sys.show_contact !== false, banner_image_url: sys.banner_image_url || "",
      show_why_us: sys.show_why_us !== false, show_search: sys.show_search !== false,
      footer_text: sys.footer_text || "", footer_copyright: sys.footer_copyright || "",
      meta_title: sys.meta_title || "", meta_description: sys.meta_description || "",
      maintenance_mode: sys.maintenance_mode || false, maintenance_message: sys.maintenance_message || "We'll be back soon!",
      google_analytics_id: sys.google_analytics_id || "",
      favicon_url: sys.favicon_url || "",
    });
    const [bannerUploading, setBannerUploading] = useState(false);
    const [faviconUploading, setFaviconUploading] = useState(false);

    const handleBannerUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;
      setBannerUploading(true);
      const url = await uploadFile(file, "banners");
      setBannerUploading(false);
      if (url) setForm({ ...form, banner_image_url: url });
    };

    const handleFaviconUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;
      setFaviconUploading(true);
      const url = await uploadFile(file, "favicons");
      setFaviconUploading(false);
      if (url) setForm((prev) => ({ ...prev, favicon_url: url }));
    };

    return (
      <div className="space-y-6 max-w-2xl">
        {/* Landing Page */}
        <SectionCard icon={LayoutDashboard} title="Landing Page" iconColor="text-indigo-600">
          <div>
            <Label className="text-xs font-semibold text-foreground">Banner Image</Label>
            <div className="mt-1.5 relative rounded-xl border-2 border-dashed border-border bg-muted/50 h-36 flex items-center justify-center overflow-hidden cursor-pointer group" onClick={() => bannerRef.current?.click()}>
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
            {bannerUploading && <p className="text-xs text-primary animate-pulse mt-1">Uploading...</p>}
          </div>
        </SectionCard>

        {/* Colors & Theme */}
        <SectionCard icon={Palette} title="Colors & Theme" iconColor="text-pink-600">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <Label className="text-xs font-semibold text-foreground">Primary Color</Label>
              <div className="flex items-center gap-2 mt-1.5">
                <input type="color" value={form.primary_color} onChange={(e) => setForm({ ...form, primary_color: e.target.value })} className="w-10 h-10 rounded-lg border border-border cursor-pointer" />
                <Input value={form.primary_color} onChange={(e) => setForm({ ...form, primary_color: e.target.value })} className="flex-1 bg-muted/50" />
              </div>
            </div>
            <div>
              <Label className="text-xs font-semibold text-foreground">Accent Color</Label>
              <div className="flex items-center gap-2 mt-1.5">
                <input type="color" value={form.accent_color} onChange={(e) => setForm({ ...form, accent_color: e.target.value })} className="w-10 h-10 rounded-lg border border-border cursor-pointer" />
                <Input value={form.accent_color} onChange={(e) => setForm({ ...form, accent_color: e.target.value })} className="flex-1 bg-muted/50" />
              </div>
            </div>
            <div>
              <Label className="text-xs font-semibold text-foreground">Theme</Label>
              <Select value={form.theme} onValueChange={(v) => setForm({ ...form, theme: v })}>
                <SelectTrigger className="mt-1.5 bg-muted/50"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="dark">Dark</SelectItem>
                  <SelectItem value="light">Light</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </SectionCard>

        {/* Features & Sections */}
        <SectionCard icon={Sparkles} title="Page Sections Visibility" iconColor="text-amber-600">
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            {([
              ["show_stats", "Stats Section"],
              ["show_featured", "Featured Properties"],
              ["show_contact", "Contact Form"],
              ["show_why_us", "Why Choose Us"],
              ["show_search", "Property Search"],
            ] as const).map(([key, label]) => (
              <div key={key} className="flex items-center gap-2">
                <Switch checked={(form as any)[key]} onCheckedChange={(v) => setForm({ ...form, [key]: v })} />
                <Label className="text-sm">{label}</Label>
              </div>
            ))}
          </div>
          <div>
            <Label className="text-xs font-semibold text-foreground">Header Style</Label>
            <Select value={form.header_style} onValueChange={(v) => setForm({ ...form, header_style: v })}>
              <SelectTrigger className="mt-1.5 w-60 bg-muted/50"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="default">Default</SelectItem>
                <SelectItem value="centered">Centered</SelectItem>
                <SelectItem value="minimal">Minimal</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </SectionCard>

        {/* SEO & Meta */}
        <SectionCard icon={Globe} title="SEO & Meta Tags" iconColor="text-teal-600">
          <div>
            <Label className="text-xs font-semibold text-foreground">Page Title (Meta)</Label>
            <Input value={form.meta_title} onChange={(e) => setForm({ ...form, meta_title: e.target.value })} className="mt-1.5 bg-muted/50" placeholder="Starline Builder's Ltd. — Premium Real Estate" />
            <p className="text-xs text-muted-foreground mt-1">Appears in browser tab & search results (max 60 chars)</p>
          </div>
          <div>
            <Label className="text-xs font-semibold text-foreground">Meta Description</Label>
            <Textarea value={form.meta_description} onChange={(e) => setForm({ ...form, meta_description: e.target.value })} className="mt-1.5 bg-muted/50" rows={2} placeholder="Premium construction and real estate services in Bangladesh..." />
            <p className="text-xs text-muted-foreground mt-1">Search engine description (max 160 chars)</p>
          </div>
          <div>
            <Label className="text-xs font-semibold text-foreground">Google Analytics ID</Label>
            <Input value={form.google_analytics_id} onChange={(e) => setForm({ ...form, google_analytics_id: e.target.value })} className="mt-1.5 bg-muted/50" placeholder="G-XXXXXXXXXX" />
          </div>
          <div>
            <Label className="text-xs font-semibold text-foreground">Favicon</Label>
            <div className="flex items-center gap-2 mt-1.5">
              {form.favicon_url && (
                <img
                  src={form.favicon_url}
                  alt="Favicon preview"
                  className="w-8 h-8 rounded border border-border bg-white object-contain"
                />
              )}
              <Button type="button" variant="outline" size="sm" onClick={() => faviconRef.current?.click()} className="gap-1.5 text-xs">
                <Upload size={12} /> Upload Favicon
              </Button>
              {form.favicon_url && (
                <Button type="button" variant="ghost" size="sm" onClick={() => setForm({ ...form, favicon_url: "" })} className="text-destructive text-xs">
                  <X size={12} /> Remove
                </Button>
              )}
              <input
                ref={faviconRef}
                type="file"
                accept="image/*,.ico"
                className="hidden"
                onChange={handleFaviconUpload}
              />
            </div>
            <Input
              value={form.favicon_url}
              onChange={(e) => setForm({ ...form, favicon_url: e.target.value })}
              className="mt-2 bg-muted/50"
              placeholder="https://.../favicon.ico"
            />
            {faviconUploading && <p className="text-xs text-primary animate-pulse mt-1">Uploading favicon...</p>}
          </div>
        </SectionCard>

        {/* Footer Settings */}
        <SectionCard icon={Type} title="Footer Settings" iconColor="text-purple-600">
          <div>
            <Label className="text-xs font-semibold text-foreground">Footer Text</Label>
            <Textarea value={form.footer_text} onChange={(e) => setForm({ ...form, footer_text: e.target.value })} className="mt-1.5 bg-muted/50" rows={2} placeholder="Your trusted partner in premium real estate..." />
          </div>
          <div>
            <Label className="text-xs font-semibold text-foreground">Copyright Text</Label>
            <Input value={form.footer_copyright} onChange={(e) => setForm({ ...form, footer_copyright: e.target.value })} className="mt-1.5 bg-muted/50" placeholder="© 2025 Starline Builder's Ltd. All rights reserved." />
          </div>
        </SectionCard>

        {/* Maintenance Mode */}
        <SectionCard icon={Settings2} title="Maintenance Mode" iconColor="text-red-600">
          <div className="flex items-center gap-3">
            <Switch checked={form.maintenance_mode} onCheckedChange={(v) => setForm({ ...form, maintenance_mode: v })} />
            <div>
              <Label className="text-sm font-medium">Enable Maintenance Mode</Label>
              <p className="text-xs text-muted-foreground">When enabled, visitors see a maintenance page instead of the site</p>
            </div>
          </div>
          {form.maintenance_mode && (
            <div>
              <Label className="text-xs font-semibold text-foreground">Maintenance Message</Label>
              <Textarea value={form.maintenance_message} onChange={(e) => setForm({ ...form, maintenance_message: e.target.value })} className="mt-1.5 bg-muted/50" rows={2} />
            </div>
          )}
        </SectionCard>

        <Button onClick={() => saveSetting("system", form)} disabled={saving} className="bg-primary text-primary-foreground hover:bg-primary/90 gap-2">
          <Save size={14} /> Save Changes
        </Button>
      </div>
    );
  };

  /* ---- Reorder helper ---- */
  const moveItem = <T,>(arr: T[], from: number, to: number): T[] => {
    if (to < 0 || to >= arr.length) return arr;
    const next = [...arr];
    const [item] = next.splice(from, 1);
    next.splice(to, 0, item);
    return next;
  };

  /* ---- Coming Soon Tab ---- */
  const ComingSoonTab = () => {
    const items: { title: string; location: string; type: string; units: string; eta: string; image_url: string; video_url: string }[] = settings.coming_soon?.items || [];
    const [list, setList] = useState(items);
    const [editing, setEditing] = useState<number | null>(null);
    const blank = { title: "", location: "", type: "", units: "", eta: "", image_url: "", video_url: "" };
    const [form, setForm] = useState(blank);
    const imageInputRef = useRef<HTMLInputElement>(null);

    const startEdit = (i: number) => { setEditing(i); setForm(list[i]); };
    const startAdd = () => { setEditing(-1); setForm(blank); };
    const cancel = () => { setEditing(null); setForm(blank); };
    const save = () => {
      const next = [...list];
      if (editing === -1) next.push(form); else if (editing !== null) next[editing] = form;
      setList(next); setEditing(null); setForm(blank);
    };
    const remove = (i: number) => { setList(list.filter((_, idx) => idx !== i)); };
    const persist = () => saveSetting("coming_soon", { items: list });

    return (
      <div className="space-y-6 max-w-2xl">
        <SectionCard icon={Clock} title="Coming Soon Projects" iconColor="text-orange-600">
          {list.length === 0 && <p className="text-sm text-muted-foreground">No projects added yet.</p>}
          {list.map((item, i) => (
            <div key={i} className="flex items-center justify-between rounded-xl border border-border p-4">
              <div className="flex items-center gap-3">
                <div className="flex flex-col gap-0.5">
                  <Button variant="ghost" size="icon" className="h-5 w-5" disabled={i === 0} onClick={() => setList(moveItem(list, i, i - 1))}><ArrowUp size={12} /></Button>
                  <Button variant="ghost" size="icon" className="h-5 w-5" disabled={i === list.length - 1} onClick={() => setList(moveItem(list, i, i + 1))}><ArrowDown size={12} /></Button>
                </div>
                <div className="flex items-center gap-2">
                  {(item as any).image_url && <img src={(item as any).image_url} alt="" className="w-8 h-8 rounded object-cover" />}
                  <div>
                    <p className="font-medium text-sm text-foreground">{item.title}</p>
                    <p className="text-xs text-muted-foreground">{item.location} · {item.type} · {item.units} · {item.eta}</p>
                  </div>
                </div>
              </div>
              <div className="flex gap-2">
                <Button variant="ghost" size="icon" onClick={() => startEdit(i)}><Pencil size={14} /></Button>
                <Button variant="ghost" size="icon" onClick={() => remove(i)} className="text-destructive"><Trash2 size={14} /></Button>
              </div>
            </div>
          ))}
          {editing !== null && (
            <div className="space-y-3 rounded-xl border border-primary/30 bg-primary/5 p-4">
              <div className="grid grid-cols-2 gap-3">
                <div><Label className="text-xs font-semibold">Project Name</Label><Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} className="mt-1 bg-muted/50" /></div>
                <div><Label className="text-xs font-semibold">Location</Label><Input value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} className="mt-1 bg-muted/50" /></div>
                <div><Label className="text-xs font-semibold">Type</Label><Input value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })} className="mt-1 bg-muted/50" placeholder="e.g. Residential Tower" /></div>
                <div><Label className="text-xs font-semibold">Units</Label><Input value={form.units} onChange={(e) => setForm({ ...form, units: e.target.value })} className="mt-1 bg-muted/50" placeholder="e.g. 120 Units" /></div>
                <div><Label className="text-xs font-semibold">ETA</Label><Input value={form.eta} onChange={(e) => setForm({ ...form, eta: e.target.value })} className="mt-1 bg-muted/50" placeholder="e.g. Q3 2026" /></div>
                <div>
                  <Label className="text-xs font-semibold">Image</Label>
                  <div className="flex items-center gap-2 mt-1">
                    {form.image_url && <img src={form.image_url} alt="" className="w-12 h-12 rounded object-cover border border-border" />}
                    <Button type="button" variant="outline" size="sm" onClick={() => imageInputRef.current?.click()} className="gap-1.5 text-xs"><Upload size={12} /> Upload Image</Button>
                    {form.image_url && <Button type="button" variant="ghost" size="sm" onClick={() => setForm({ ...form, image_url: "" })} className="text-destructive text-xs"><X size={12} /></Button>}
                    <input ref={imageInputRef} type="file" accept="image/*" className="hidden" onChange={async (e) => {
                      const file = e.target.files?.[0];
                      if (!file) return;
                      const url = await uploadFile(file, "coming-soon");
                      if (url) setForm({ ...form, image_url: url });
                    }} />
                  </div>
                </div>
              </div>
              <div>
                <Label className="text-xs font-semibold">Video URL (YouTube, Vimeo, or direct link)</Label>
                <Input value={form.video_url} onChange={(e) => setForm({ ...form, video_url: e.target.value })} className="mt-1 bg-muted/50" placeholder="https://youtube.com/watch?v=..." />
              </div>
              <div className="flex gap-2">
                <Button size="sm" onClick={save} className="gap-1"><Save size={12} /> {editing === -1 ? "Add" : "Update"}</Button>
                <Button size="sm" variant="outline" onClick={cancel}>Cancel</Button>
              </div>
            </div>
          )}
          {editing === null && (
            <Button variant="outline" size="sm" onClick={startAdd} className="gap-1.5"><Plus size={14} /> Add Project</Button>
          )}
        </SectionCard>
        <Button onClick={persist} disabled={saving} className="bg-primary text-primary-foreground hover:bg-primary/90 gap-2"><Save size={14} /> Save Changes</Button>
      </div>
    );
  };

  /* ---- Why Us Tab ---- */
  const WhyUsTab = () => {
    const items: { title: string; desc: string; iconName: string }[] = settings.why_us_reasons?.items || [];
    const [list, setList] = useState(items);
    const [editing, setEditing] = useState<number | null>(null);
    const blank = { title: "", desc: "", iconName: "Shield" };
    const [form, setForm] = useState(blank);

    const ICON_OPTIONS = ["Shield", "Award", "Users", "Clock", "Sparkles", "HeartHandshake"];

    const startEdit = (i: number) => { setEditing(i); setForm(list[i]); };
    const startAdd = () => { setEditing(-1); setForm(blank); };
    const cancel = () => { setEditing(null); setForm(blank); };
    const save = () => {
      const next = [...list];
      if (editing === -1) next.push(form); else if (editing !== null) next[editing] = form;
      setList(next); setEditing(null); setForm(blank);
    };
    const remove = (i: number) => { setList(list.filter((_, idx) => idx !== i)); };
    const persist = () => saveSetting("why_us_reasons", { items: list });

    return (
      <div className="space-y-6 max-w-2xl">
        <SectionCard icon={Shield} title="Why Choose Us — Reasons" iconColor="text-blue-600">
          {list.length === 0 && <p className="text-sm text-muted-foreground">No reasons added yet. Default content will be shown.</p>}
          {list.map((item, i) => (
            <div key={i} className="flex items-center justify-between rounded-xl border border-border p-4">
              <div className="flex items-center gap-3">
                <div className="flex flex-col gap-0.5">
                  <Button variant="ghost" size="icon" className="h-5 w-5" disabled={i === 0} onClick={() => setList(moveItem(list, i, i - 1))}><ArrowUp size={12} /></Button>
                  <Button variant="ghost" size="icon" className="h-5 w-5" disabled={i === list.length - 1} onClick={() => setList(moveItem(list, i, i + 1))}><ArrowDown size={12} /></Button>
                </div>
                <div>
                  <p className="font-medium text-sm text-foreground">{item.title}</p>
                  <p className="text-xs text-muted-foreground">{item.desc}</p>
                </div>
              </div>
              <div className="flex gap-2">
                <Button variant="ghost" size="icon" onClick={() => startEdit(i)}><Pencil size={14} /></Button>
                <Button variant="ghost" size="icon" onClick={() => remove(i)} className="text-destructive"><Trash2 size={14} /></Button>
              </div>
            </div>
          ))}
          {editing !== null && (
            <div className="space-y-3 rounded-xl border border-primary/30 bg-primary/5 p-4">
              <div><Label className="text-xs font-semibold">Title</Label><Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} className="mt-1 bg-muted/50" /></div>
              <div><Label className="text-xs font-semibold">Description</Label><Textarea value={form.desc} onChange={(e) => setForm({ ...form, desc: e.target.value })} className="mt-1 bg-muted/50" rows={2} /></div>
              <div>
                <Label className="text-xs font-semibold">Icon</Label>
                <Select value={form.iconName} onValueChange={(v) => setForm({ ...form, iconName: v })}>
                  <SelectTrigger className="mt-1 w-48 bg-muted/50"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {ICON_OPTIONS.map((ic) => <SelectItem key={ic} value={ic}>{ic}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex gap-2">
                <Button size="sm" onClick={save} className="gap-1"><Save size={12} /> {editing === -1 ? "Add" : "Update"}</Button>
                <Button size="sm" variant="outline" onClick={cancel}>Cancel</Button>
              </div>
            </div>
          )}
          {editing === null && (
            <Button variant="outline" size="sm" onClick={startAdd} className="gap-1.5"><Plus size={14} /> Add Reason</Button>
          )}
        </SectionCard>
        <Button onClick={persist} disabled={saving} className="bg-primary text-primary-foreground hover:bg-primary/90 gap-2"><Save size={14} /> Save Changes</Button>
      </div>
    );
  };

  /* ---- Stats Tab ---- */
  const StatsTab = () => {
    const items: { value: string; label: string }[] = settings.stats_items?.items || [];
    const [list, setList] = useState(items);
    const [editing, setEditing] = useState<number | null>(null);
    const blank = { value: "", label: "" };
    const [form, setForm] = useState(blank);

    const startEdit = (i: number) => { setEditing(i); setForm(list[i]); };
    const startAdd = () => { setEditing(-1); setForm(blank); };
    const cancel = () => { setEditing(null); setForm(blank); };
    const save = () => {
      const next = [...list];
      if (editing === -1) next.push(form); else if (editing !== null) next[editing] = form;
      setList(next); setEditing(null); setForm(blank);
    };
    const remove = (i: number) => { setList(list.filter((_, idx) => idx !== i)); };
    const persist = () => saveSetting("stats_items", { items: list });

    return (
      <div className="space-y-6 max-w-2xl">
        <SectionCard icon={BarChart3} title="Stats / Counters" iconColor="text-emerald-600">
          {list.length === 0 && <p className="text-sm text-muted-foreground">No stats added yet. Default content will be shown.</p>}
          {list.map((item, i) => (
            <div key={i} className="flex items-center justify-between rounded-xl border border-border p-4">
              <div className="flex items-center gap-3">
                <div className="flex flex-col gap-0.5">
                  <Button variant="ghost" size="icon" className="h-5 w-5" disabled={i === 0} onClick={() => setList(moveItem(list, i, i - 1))}><ArrowUp size={12} /></Button>
                  <Button variant="ghost" size="icon" className="h-5 w-5" disabled={i === list.length - 1} onClick={() => setList(moveItem(list, i, i + 1))}><ArrowDown size={12} /></Button>
                </div>
                <div>
                  <p className="font-medium text-sm text-foreground">{item.value}</p>
                  <p className="text-xs text-muted-foreground">{item.label}</p>
                </div>
              </div>
              <div className="flex gap-2">
                <Button variant="ghost" size="icon" onClick={() => startEdit(i)}><Pencil size={14} /></Button>
                <Button variant="ghost" size="icon" onClick={() => remove(i)} className="text-destructive"><Trash2 size={14} /></Button>
              </div>
            </div>
          ))}
          {editing !== null && (
            <div className="space-y-3 rounded-xl border border-primary/30 bg-primary/5 p-4">
              <div className="grid grid-cols-2 gap-3">
                <div><Label className="text-xs font-semibold">Value</Label><Input value={form.value} onChange={(e) => setForm({ ...form, value: e.target.value })} className="mt-1 bg-muted/50" placeholder="e.g. 2,500+" /></div>
                <div><Label className="text-xs font-semibold">Label</Label><Input value={form.label} onChange={(e) => setForm({ ...form, label: e.target.value })} className="mt-1 bg-muted/50" placeholder="e.g. Properties Sold" /></div>
              </div>
              <div className="flex gap-2">
                <Button size="sm" onClick={save} className="gap-1"><Save size={12} /> {editing === -1 ? "Add" : "Update"}</Button>
                <Button size="sm" variant="outline" onClick={cancel}>Cancel</Button>
              </div>
            </div>
          )}
          {editing === null && (
            <Button variant="outline" size="sm" onClick={startAdd} className="gap-1.5"><Plus size={14} /> Add Stat</Button>
          )}
        </SectionCard>
        <Button onClick={persist} disabled={saving} className="bg-primary text-primary-foreground hover:bg-primary/90 gap-2"><Save size={14} /> Save Changes</Button>
      </div>
    );
  };

  /* ---- Footer Content Tab ---- */
  const FooterTab = () => {
    const ft = settings.footer_content || {};
    const [form, setForm] = useState({
      description: ft.description || "",
      copyright: ft.copyright || "",
      quick_links: ft.quick_links || "Properties,About Us,Services,Contact,Careers",
    });
    const persist = () => saveSetting("footer_content", form);

    return (
      <div className="space-y-6 max-w-2xl">
        <SectionCard icon={Type} title="Footer Content" iconColor="text-purple-600">
          <div>
            <Label className="text-xs font-semibold text-foreground">Footer Description</Label>
            <Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className="mt-1.5 bg-muted/50" rows={3} placeholder="Premium construction and real estate services..." />
          </div>
          <div>
            <Label className="text-xs font-semibold text-foreground">Copyright Text</Label>
            <Input value={form.copyright} onChange={(e) => setForm({ ...form, copyright: e.target.value })} className="mt-1.5 bg-muted/50" placeholder="© 2026 Starline Builder's Ltd. All rights reserved." />
          </div>
          <div>
            <Label className="text-xs font-semibold text-foreground">Quick Links (comma-separated)</Label>
            <Input value={form.quick_links} onChange={(e) => setForm({ ...form, quick_links: e.target.value })} className="mt-1.5 bg-muted/50" placeholder="Properties,About Us,Services,Contact" />
            <p className="text-xs text-muted-foreground mt-1">Separate link labels with commas</p>
          </div>
        </SectionCard>
        <Button onClick={persist} disabled={saving} className="bg-primary text-primary-foreground hover:bg-primary/90 gap-2"><Save size={14} /> Save Changes</Button>
      </div>
    );
  };

  return (
    <Tabs defaultValue="company" className="w-full">
      <TabsList className="bg-transparent border-b border-border rounded-none p-0 h-auto gap-0 w-full justify-start flex-wrap">
        <TabsTrigger value="company" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none gap-1.5 text-sm px-4 pb-3 pt-2 text-muted-foreground data-[state=active]:text-foreground">
          <Building2 size={15} /> Company
        </TabsTrigger>
        <TabsTrigger value="invoice" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none gap-1.5 text-sm px-4 pb-3 pt-2 text-muted-foreground data-[state=active]:text-foreground">
          <FileText size={15} /> Invoice
        </TabsTrigger>
        <TabsTrigger value="currency" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none gap-1.5 text-sm px-4 pb-3 pt-2 text-muted-foreground data-[state=active]:text-foreground">
          <DollarSign size={15} /> Currency
        </TabsTrigger>
        <TabsTrigger value="bank" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none gap-1.5 text-sm px-4 pb-3 pt-2 text-muted-foreground data-[state=active]:text-foreground">
          <Landmark size={15} /> Bank
        </TabsTrigger>
        <TabsTrigger value="system" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none gap-1.5 text-sm px-4 pb-3 pt-2 text-muted-foreground data-[state=active]:text-foreground">
          <Settings2 size={15} /> System
        </TabsTrigger>
        <TabsTrigger value="coming_soon" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none gap-1.5 text-sm px-4 pb-3 pt-2 text-muted-foreground data-[state=active]:text-foreground">
          <Clock size={15} /> Coming Soon
        </TabsTrigger>
        <TabsTrigger value="why_us" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none gap-1.5 text-sm px-4 pb-3 pt-2 text-muted-foreground data-[state=active]:text-foreground">
          <Shield size={15} /> Why Us
        </TabsTrigger>
        <TabsTrigger value="stats" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none gap-1.5 text-sm px-4 pb-3 pt-2 text-muted-foreground data-[state=active]:text-foreground">
          <BarChart3 size={15} /> Stats
        </TabsTrigger>
        <TabsTrigger value="footer" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none gap-1.5 text-sm px-4 pb-3 pt-2 text-muted-foreground data-[state=active]:text-foreground">
          <Type size={15} /> Footer
        </TabsTrigger>
      </TabsList>

      <TabsContent value="company" className="mt-6"><div><CompanyInfoTab /></div></TabsContent>
      <TabsContent value="invoice" className="mt-6"><div><InvoiceTab /></div></TabsContent>
      <TabsContent value="currency" className="mt-6"><div><CurrencyTab /></div></TabsContent>
      <TabsContent value="bank" className="mt-6"><div><BankTab /></div></TabsContent>
      <TabsContent value="system" className="mt-6"><div><SystemTab /></div></TabsContent>
      <TabsContent value="coming_soon" className="mt-6"><div><ComingSoonTab /></div></TabsContent>
      <TabsContent value="why_us" className="mt-6"><div><WhyUsTab /></div></TabsContent>
      <TabsContent value="stats" className="mt-6"><div><StatsTab /></div></TabsContent>
      <TabsContent value="footer" className="mt-6"><div><FooterTab /></div></TabsContent>
    </Tabs>
  );
};

export default AdminSettings;
