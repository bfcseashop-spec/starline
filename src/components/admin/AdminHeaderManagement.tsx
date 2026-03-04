import { useState, useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/components/ui/use-toast";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Save, Upload, X, Loader2, Plus, Trash2, GripVertical, Eye, EyeOff,
  Navigation, Palette, Image as ImageIcon, Type, Menu, Pencil,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface NavItem {
  id: string;
  label: string;
  href: string;
  visible: boolean;
}

interface HeaderSettings {
  nav_items: NavItem[];
  bg_color_scrolled: string;
  bg_color_initial: string;
  bg_opacity: number;
  logo_size: string;
  show_social_bar: boolean;
  social_bar_bg: string;
  social_bar_text: string;
  header_style: string;
  sticky: boolean;
  nav_font_color: string;
  slogan: string;
  slogan_color: string;
}

const defaults: HeaderSettings = {
  nav_items: [
    { id: "1", label: "Home", href: "#", visible: true },
    { id: "2", label: "Properties", href: "#properties", visible: true },
    { id: "3", label: "About", href: "#about", visible: true },
    { id: "4", label: "Contact", href: "#contact", visible: true },
  ],
  bg_color_scrolled: "#1a1a2e",
  bg_color_initial: "transparent",
  bg_opacity: 80,
  logo_size: "default",
  show_social_bar: true,
  social_bar_bg: "#1a1a2e",
  social_bar_text: "Welcome to Starline Builder's Ltd.",
  header_style: "default",
  sticky: true,
  nav_font_color: "#ffffff",
  slogan: "",
  slogan_color: "#c9a55a",
};

const SectionCard = ({ icon: Icon, title, children, iconColor = "text-primary" }: { icon: any; title: string; children: React.ReactNode; iconColor?: string }) => (
  <div className="bg-card rounded-2xl border border-border shadow-sm p-6 space-y-5">
    <div className="flex items-center gap-3">
      <div className={`w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center ${iconColor}`}>
        <Icon size={16} />
      </div>
      <h3 className="font-heading text-base font-bold text-foreground">{title}</h3>
    </div>
    {children}
  </div>
);

const AdminHeaderManagement = () => {
  const [form, setForm] = useState<HeaderSettings>({ ...defaults });
  const [saving, setSaving] = useState(false);
  const [showPreview, setShowPreview] = useState(true);
  const [editingNav, setEditingNav] = useState<string | null>(null);
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const logoRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const fetch = async () => {
      const { data } = await supabase.from("site_settings").select("setting_key, setting_value")
        .in("setting_key", ["header_config", "company_info"]);
      if (data) {
        data.forEach((r: any) => {
          if (r.setting_key === "header_config" && r.setting_value) {
            setForm(prev => ({ ...prev, ...r.setting_value }));
          }
          if (r.setting_key === "company_info" && r.setting_value?.logo_url) {
            setLogoUrl(r.setting_value.logo_url);
          }
        });
      }
    };
    fetch();
  }, []);

  const handleSave = async () => {
    setSaving(true);
    // Save header config
    const { error } = await supabase.from("site_settings").upsert(
      { setting_key: "header_config", setting_value: form as any },
      { onConflict: "setting_key" }
    );
    // Also sync header_style to system settings
    const { data: sysData } = await supabase.from("site_settings").select("setting_value").eq("setting_key", "system").single();
    if (sysData) {
      const sys = { ...(sysData.setting_value as Record<string, any> || {}), header_style: form.header_style };
      await supabase.from("site_settings").upsert(
        { setting_key: "system", setting_value: sys as any },
        { onConflict: "setting_key" }
      );
    }
    setSaving(false);
    if (error) { toast.error("Failed to save"); return; }
    toast.success("Header settings saved!");
  };

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    const ext = file.name.split(".").pop();
    const filePath = `logos/${Date.now()}.${ext}`;
    const { error } = await supabase.storage.from("company-assets").upload(filePath, file);
    setUploading(false);
    if (error) { toast.error("Upload failed"); return; }
    const { data: pub } = supabase.storage.from("company-assets").getPublicUrl(filePath);
    setLogoUrl(pub.publicUrl);
    // Update company_info
    const { data: ci } = await supabase.from("site_settings").select("setting_value").eq("setting_key", "company_info").single();
    const updated = { ...(ci?.setting_value as Record<string, any> || {}), logo_url: pub.publicUrl };
    await supabase.from("site_settings").upsert(
      { setting_key: "company_info", setting_value: updated as any },
      { onConflict: "setting_key" }
    );
    toast.success("Logo uploaded!");
  };

  const addNavItem = () => {
    const newItem: NavItem = { id: Date.now().toString(), label: "New Link", href: "#", visible: true };
    setForm(prev => ({ ...prev, nav_items: [...prev.nav_items, newItem] }));
    setEditingNav(newItem.id);
  };

  const removeNavItem = (id: string) => {
    setForm(prev => ({ ...prev, nav_items: prev.nav_items.filter(n => n.id !== id) }));
  };

  const updateNavItem = (id: string, field: keyof NavItem, value: any) => {
    setForm(prev => ({
      ...prev,
      nav_items: prev.nav_items.map(n => n.id === id ? { ...n, [field]: value } : n),
    }));
  };

  const logoSizeClass: Record<string, string> = {
    small: "w-7 h-7",
    default: "w-9 h-9",
    large: "w-12 h-12",
    xlarge: "w-16 h-16",
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="font-heading text-2xl font-bold text-foreground">Header Management</h2>
          <p className="text-sm text-muted-foreground">Customize navigation, colors, and logo</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => setShowPreview(!showPreview)} className="gap-1.5 text-xs">
            {showPreview ? <EyeOff size={12} /> : <Eye size={12} />}
            {showPreview ? "Hide" : "Show"} Preview
          </Button>
          <Button onClick={handleSave} disabled={saving} className="bg-primary text-primary-foreground hover:bg-primary/90 gap-2">
            {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
            Save Changes
          </Button>
        </div>
      </div>

      {/* Live Preview */}
      {showPreview && (
        <div className="mb-6 rounded-2xl overflow-hidden border border-border shadow-lg">
          {/* Social bar preview */}
          {form.show_social_bar && (
            <div className="h-8 flex items-center px-6 text-xs" style={{ backgroundColor: form.social_bar_bg }}>
              <span className="text-white/40">{form.social_bar_text}</span>
            </div>
          )}
          {/* Nav preview */}
          <div className="h-14 flex items-center justify-between px-6" style={{ backgroundColor: form.bg_color_scrolled }}>
            <div className="flex items-center gap-3">
              {logoUrl && (
                <img src={logoUrl} alt="Logo" className={`${logoSizeClass[form.logo_size] || "w-9 h-9"} rounded-xl object-contain`} />
              )}
              <div className="flex flex-col">
                <span className="font-heading text-base font-bold text-white">
                  Starline<span className="text-gold"> Ltd.</span>
                </span>
                {form.slogan && (
                  <span className="text-[10px] uppercase tracking-widest" style={{ color: form.slogan_color || "#c9a55a" }}>{form.slogan}</span>
                )}
              </div>
            </div>
            <div className="flex items-center gap-1">
              {form.nav_items.filter(n => n.visible).map(n => (
                <span key={n.id} className="text-xs font-medium px-3 py-1.5 rounded-lg hover:bg-white/10 transition-colors cursor-default" style={{ color: form.nav_font_color || "#ffffff" }}>
                  {n.label}
                </span>
              ))}
              <span className="ml-3 bg-gold-gradient text-accent-foreground px-4 py-1.5 rounded-lg text-xs font-semibold">
                Log In
              </span>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Navigation Links */}
        <SectionCard icon={Navigation} title="Navigation Links" iconColor="text-blue-600">
          <div className="space-y-2">
            {form.nav_items.map((item) => (
              <div key={item.id} className={`flex items-center gap-2 p-3 rounded-xl border transition-colors ${item.visible ? "border-border bg-muted/30" : "border-border/50 bg-muted/10 opacity-60"}`}>
                <GripVertical size={14} className="text-muted-foreground/40 shrink-0 cursor-grab" />
                {editingNav === item.id ? (
                  <>
                    <Input value={item.label} onChange={e => updateNavItem(item.id, "label", e.target.value)}
                      className="h-8 text-xs bg-card flex-1" placeholder="Label" />
                    <Input value={item.href} onChange={e => updateNavItem(item.id, "href", e.target.value)}
                      className="h-8 text-xs bg-card flex-1" placeholder="#section" />
                    <Button variant="outline" size="sm" onClick={() => setEditingNav(null)} className="h-8 px-2">
                      <Save size={12} />
                    </Button>
                  </>
                ) : (
                  <>
                    <span className="text-sm font-medium text-foreground flex-1">{item.label}</span>
                    <span className="text-xs text-muted-foreground flex-1 truncate">{item.href}</span>
                    <Switch checked={item.visible} onCheckedChange={v => updateNavItem(item.id, "visible", v)} />
                    <button onClick={() => setEditingNav(item.id)} className="p-1.5 rounded-md hover:bg-muted text-muted-foreground hover:text-foreground transition-colors">
                      <Pencil size={12} />
                    </button>
                    <button onClick={() => removeNavItem(item.id)} className="p-1.5 rounded-md hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors">
                      <Trash2 size={12} />
                    </button>
                  </>
                )}
              </div>
            ))}
          </div>
          <Button variant="outline" size="sm" onClick={addNavItem} className="gap-1.5 text-xs w-full">
            <Plus size={12} /> Add Navigation Link
          </Button>
          <div>
            <Label className="text-xs font-semibold text-foreground">Nav Font Color</Label>
            <div className="flex items-center gap-2 mt-1.5">
              <input type="color" value={form.nav_font_color} onChange={e => setForm({ ...form, nav_font_color: e.target.value })} className="w-10 h-10 rounded-lg border border-border cursor-pointer" />
              <Input value={form.nav_font_color} onChange={e => setForm({ ...form, nav_font_color: e.target.value })} className="flex-1 bg-muted/50" />
            </div>
          </div>
        </SectionCard>

        {/* Logo Settings */}
        <SectionCard icon={ImageIcon} title="Logo Settings" iconColor="text-violet-600">
          <div className="flex items-start gap-4">
            <div className={`${logoSizeClass[form.logo_size] || "w-12 h-12"} rounded-xl border-2 border-dashed border-border bg-muted flex items-center justify-center overflow-hidden shrink-0 transition-all`}>
              {logoUrl ? (
                <img src={logoUrl} alt="Logo" className="w-full h-full object-contain" />
              ) : (
                <ImageIcon className="text-muted-foreground" size={20} />
              )}
            </div>
            <div className="space-y-2 flex-1">
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" onClick={() => logoRef.current?.click()} className="gap-1.5 text-xs">
                  <Upload size={12} /> Change Logo
                </Button>
                {logoUrl && (
                  <Button variant="outline" size="sm" onClick={() => setLogoUrl(null)} className="gap-1.5 text-xs text-destructive hover:text-destructive">
                    <X size={12} /> Remove
                  </Button>
                )}
              </div>
              {uploading && <p className="text-xs text-primary animate-pulse">Uploading...</p>}
              <input ref={logoRef} type="file" accept="image/*" className="hidden" onChange={handleLogoUpload} />
            </div>
          </div>
          <div>
            <Label className="text-xs font-semibold text-foreground">Logo Size</Label>
            <Select value={form.logo_size} onValueChange={v => setForm({ ...form, logo_size: v })}>
              <SelectTrigger className="mt-1.5 bg-muted/50"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="small">Small (28px)</SelectItem>
                <SelectItem value="default">Default (36px)</SelectItem>
                <SelectItem value="large">Large (48px)</SelectItem>
                <SelectItem value="xlarge">Extra Large (64px)</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="text-xs font-semibold text-foreground">Slogan / Tagline</Label>
            <Input value={form.slogan} onChange={e => setForm({ ...form, slogan: e.target.value })} className="mt-1.5 bg-muted/50" placeholder="e.g. Premium Real Estate in Bangladesh" />
          </div>
          <div>
            <Label className="text-xs font-semibold text-foreground">Slogan Color</Label>
            <div className="flex items-center gap-2 mt-1.5">
              <input type="color" value={form.slogan_color} onChange={e => setForm({ ...form, slogan_color: e.target.value })} className="w-10 h-10 rounded-lg border border-border cursor-pointer" />
              <Input value={form.slogan_color} onChange={e => setForm({ ...form, slogan_color: e.target.value })} className="flex-1 bg-muted/50" />
            </div>
          </div>
        </SectionCard>

        {/* Background Colors */}
        <SectionCard icon={Palette} title="Background Colors" iconColor="text-pink-600">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs font-semibold text-foreground">Scrolled BG Color</Label>
              <div className="flex items-center gap-2 mt-1.5">
                <input type="color" value={form.bg_color_scrolled} onChange={e => setForm({ ...form, bg_color_scrolled: e.target.value })} className="w-10 h-10 rounded-lg border border-border cursor-pointer" />
                <Input value={form.bg_color_scrolled} onChange={e => setForm({ ...form, bg_color_scrolled: e.target.value })} className="flex-1 bg-muted/50" />
              </div>
            </div>
            <div>
              <Label className="text-xs font-semibold text-foreground">BG Opacity (%)</Label>
              <div className="flex items-center gap-2 mt-1.5">
                <input type="range" min="0" max="100" value={form.bg_opacity} onChange={e => setForm({ ...form, bg_opacity: Number(e.target.value) })} className="flex-1" />
                <span className="text-xs text-muted-foreground w-8">{form.bg_opacity}%</span>
              </div>
            </div>
          </div>
          <div>
            <Label className="text-xs font-semibold text-foreground">Header Style</Label>
            <Select value={form.header_style} onValueChange={v => setForm({ ...form, header_style: v })}>
              <SelectTrigger className="mt-1.5 bg-muted/50"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="default">Default — Full Brand</SelectItem>
                <SelectItem value="centered">Centered</SelectItem>
                <SelectItem value="minimal">Minimal — Logo Only</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-center gap-2">
            <Switch checked={form.sticky} onCheckedChange={v => setForm({ ...form, sticky: v })} />
            <Label className="text-xs">Sticky Header</Label>
          </div>
        </SectionCard>

        {/* Social Bar */}
        <SectionCard icon={Menu} title="Top Social Bar" iconColor="text-emerald-600">
          <div className="flex items-center gap-2">
            <Switch checked={form.show_social_bar} onCheckedChange={v => setForm({ ...form, show_social_bar: v })} />
            <Label className="text-xs font-semibold text-foreground">Show Social Bar</Label>
          </div>
          {form.show_social_bar && (
            <>
              <div>
                <Label className="text-xs font-semibold text-foreground">Welcome Text</Label>
                <Input value={form.social_bar_text} onChange={e => setForm({ ...form, social_bar_text: e.target.value })} className="mt-1.5 bg-muted/50" />
              </div>
              <div>
                <Label className="text-xs font-semibold text-foreground">Bar Background</Label>
                <div className="flex items-center gap-2 mt-1.5">
                  <input type="color" value={form.social_bar_bg} onChange={e => setForm({ ...form, social_bar_bg: e.target.value })} className="w-10 h-10 rounded-lg border border-border cursor-pointer" />
                  <Input value={form.social_bar_bg} onChange={e => setForm({ ...form, social_bar_bg: e.target.value })} className="flex-1 bg-muted/50" />
                </div>
              </div>
            </>
          )}
        </SectionCard>
      </div>
    </div>
  );
};

export default AdminHeaderManagement;
