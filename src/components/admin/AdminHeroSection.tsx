import { useState, useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/components/ui/use-toast";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Save, Upload, Image as ImageIcon, Type, Palette, Eye, EyeOff, X, Loader2,
  ArrowRight, Play, Sparkles, LayoutDashboard,
} from "lucide-react";
import { motion } from "framer-motion";
import heroFallback from "@/assets/hero-skyline.jpg";

interface HeroSettings {
  banner_title: string;
  banner_subtitle: string;
  banner_image_url: string;
  badge_text: string;
  cta_primary_text: string;
  cta_primary_link: string;
  cta_secondary_text: string;
  cta_secondary_link: string;
  overlay_opacity: number;
  overlay_color: string;
  text_alignment: string;
  show_badge: boolean;
  show_scroll_indicator: boolean;
  min_height: string;
}

const defaults: HeroSettings = {
  banner_title: "Building Dreams, Crafting Futures",
  banner_subtitle: "Premium construction and real estate services by Starline Builder's Ltd.",
  banner_image_url: "",
  badge_text: "Trusted Since 2010",
  cta_primary_text: "Explore Properties",
  cta_primary_link: "#properties",
  cta_secondary_text: "Learn More",
  cta_secondary_link: "#about",
  overlay_opacity: 70,
  overlay_color: "#1a1a2e",
  text_alignment: "left",
  show_badge: true,
  show_scroll_indicator: true,
  min_height: "60vh",
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

const AdminHeroSection = () => {
  const [form, setForm] = useState<HeroSettings>({ ...defaults });
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [showPreview, setShowPreview] = useState(true);
  const bannerRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const fetch = async () => {
      const { data } = await supabase.from("site_settings").select("setting_value").eq("setting_key", "system").single();
      if (data?.setting_value && typeof data.setting_value === "object") {
        const sys = data.setting_value as Record<string, any>;
        setForm(prev => ({ ...prev, ...sys }));
      }
    };
    fetch();
  }, []);

  const handleBannerUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    const ext = file.name.split(".").pop();
    const filePath = `banners/${Date.now()}.${ext}`;
    const { error } = await supabase.storage.from("company-assets").upload(filePath, file);
    setUploading(false);
    if (error) { toast.error("Upload failed"); return; }
    const { data: pub } = supabase.storage.from("company-assets").getPublicUrl(filePath);
    setForm(prev => ({ ...prev, banner_image_url: pub.publicUrl }));
    toast.success("Banner uploaded!");
  };

  const handleSave = async () => {
    setSaving(true);
    // Merge with existing system settings
    const { data: existing } = await supabase.from("site_settings").select("setting_value").eq("setting_key", "system").single();
    const merged = { ...(existing?.setting_value as Record<string, any> || {}), ...form };
    const { error } = await supabase.from("site_settings").upsert(
      { setting_key: "system", setting_value: merged as any },
      { onConflict: "setting_key" }
    );
    setSaving(false);
    if (error) { toast.error("Failed to save"); return; }
    toast.success("Hero section saved!");
  };

  const bgImage = form.banner_image_url || heroFallback;
  const words = form.banner_title.split(" ");
  const lastTwo = words.slice(-2).join(" ");
  const firstPart = words.slice(0, -2).join(" ");

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="font-heading text-2xl font-bold text-foreground">Hero Section</h2>
          <p className="text-sm text-muted-foreground">Customize the landing page hero banner</p>
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
          <div className="relative flex items-center overflow-hidden" style={{ minHeight: "280px" }}>
            <img src={bgImage} alt="Preview" className="absolute inset-0 w-full h-full object-cover" />
            <div className="absolute inset-0" style={{ background: `linear-gradient(to right, ${form.overlay_color}e6, ${form.overlay_color}b3, ${form.overlay_color}66)` }} />
            <div className={`relative z-10 w-full p-8 ${form.text_alignment === "center" ? "text-center mx-auto max-w-2xl" : "max-w-xl"}`}>
              {form.show_badge && (
                <div className="inline-flex items-center gap-2 bg-gold/20 border border-gold/30 rounded-full px-3 py-1.5 mb-4">
                  <div className="w-1.5 h-1.5 rounded-full bg-gold" />
                  <span className="text-gold text-xs font-semibold">{form.badge_text}</span>
                </div>
              )}
              <h1 className="font-heading text-3xl md:text-4xl font-bold text-white leading-tight mb-3">
                {firstPart}{firstPart && <br />}
                <span className="text-gradient-gold">{lastTwo}</span>
              </h1>
              <p className="text-white/60 text-sm leading-relaxed mb-6 max-w-md">{form.banner_subtitle}</p>
              <div className={`flex gap-3 ${form.text_alignment === "center" ? "justify-center" : ""}`}>
                <span className="bg-gold-gradient text-accent-foreground px-5 py-2.5 rounded-xl font-semibold text-xs flex items-center gap-1.5">
                  {form.cta_primary_text} <ArrowRight size={12} />
                </span>
                <span className="border border-white/20 text-white px-5 py-2.5 rounded-xl font-semibold text-xs flex items-center gap-1.5">
                  <Play size={12} className="text-gold" /> {form.cta_secondary_text}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Banner Image */}
        <SectionCard icon={ImageIcon} title="Banner Image" iconColor="text-indigo-600">
          <div className="relative rounded-xl border-2 border-dashed border-border bg-muted/50 h-40 flex items-center justify-center overflow-hidden cursor-pointer group"
            onClick={() => bannerRef.current?.click()}>
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
                <p className="text-xs">Click to upload banner image</p>
              </div>
            )}
          </div>
          <input ref={bannerRef} type="file" accept="image/*" className="hidden" onChange={handleBannerUpload} />
          {uploading && <p className="text-xs text-primary animate-pulse">Uploading...</p>}
          {form.banner_image_url && (
            <Button variant="outline" size="sm" onClick={() => setForm(prev => ({ ...prev, banner_image_url: "" }))} className="gap-1.5 text-xs text-destructive hover:text-destructive">
              <X size={12} /> Remove Banner
            </Button>
          )}
        </SectionCard>

        {/* Text Content */}
        <SectionCard icon={Type} title="Text Content" iconColor="text-emerald-600">
          <div>
            <Label className="text-xs font-semibold text-foreground">Main Title</Label>
            <Input value={form.banner_title} onChange={e => setForm({ ...form, banner_title: e.target.value })} className="mt-1.5 bg-muted/50" placeholder="Building Dreams..." />
          </div>
          <div>
            <Label className="text-xs font-semibold text-foreground">Subtitle</Label>
            <Textarea value={form.banner_subtitle} onChange={e => setForm({ ...form, banner_subtitle: e.target.value })} className="mt-1.5 bg-muted/50" rows={3} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs font-semibold text-foreground">Badge Text</Label>
              <Input value={form.badge_text} onChange={e => setForm({ ...form, badge_text: e.target.value })} className="mt-1.5 bg-muted/50" />
            </div>
            <div className="flex items-end gap-2 pb-0.5">
              <Switch checked={form.show_badge} onCheckedChange={v => setForm({ ...form, show_badge: v })} />
              <Label className="text-xs">Show Badge</Label>
            </div>
          </div>
        </SectionCard>

        {/* Call to Action */}
        <SectionCard icon={ArrowRight} title="Call to Action Buttons" iconColor="text-amber-600">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs font-semibold text-foreground">Primary Button Text</Label>
              <Input value={form.cta_primary_text} onChange={e => setForm({ ...form, cta_primary_text: e.target.value })} className="mt-1.5 bg-muted/50" />
            </div>
            <div>
              <Label className="text-xs font-semibold text-foreground">Primary Link</Label>
              <Input value={form.cta_primary_link} onChange={e => setForm({ ...form, cta_primary_link: e.target.value })} className="mt-1.5 bg-muted/50" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs font-semibold text-foreground">Secondary Button Text</Label>
              <Input value={form.cta_secondary_text} onChange={e => setForm({ ...form, cta_secondary_text: e.target.value })} className="mt-1.5 bg-muted/50" />
            </div>
            <div>
              <Label className="text-xs font-semibold text-foreground">Secondary Link</Label>
              <Input value={form.cta_secondary_link} onChange={e => setForm({ ...form, cta_secondary_link: e.target.value })} className="mt-1.5 bg-muted/50" />
            </div>
          </div>
        </SectionCard>

        {/* Style & Layout */}
        <SectionCard icon={Palette} title="Style & Layout" iconColor="text-pink-600">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs font-semibold text-foreground">Overlay Color</Label>
              <div className="flex items-center gap-2 mt-1.5">
                <input type="color" value={form.overlay_color} onChange={e => setForm({ ...form, overlay_color: e.target.value })} className="w-10 h-10 rounded-lg border border-border cursor-pointer" />
                <Input value={form.overlay_color} onChange={e => setForm({ ...form, overlay_color: e.target.value })} className="flex-1 bg-muted/50" />
              </div>
            </div>
            <div>
              <Label className="text-xs font-semibold text-foreground">Overlay Opacity</Label>
              <div className="flex items-center gap-2 mt-1.5">
                <input type="range" min="0" max="100" value={form.overlay_opacity} onChange={e => setForm({ ...form, overlay_opacity: Number(e.target.value) })} className="flex-1" />
                <span className="text-xs text-muted-foreground w-8">{form.overlay_opacity}%</span>
              </div>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs font-semibold text-foreground">Text Alignment</Label>
              <Select value={form.text_alignment} onValueChange={v => setForm({ ...form, text_alignment: v })}>
                <SelectTrigger className="mt-1.5 bg-muted/50"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="left">Left</SelectItem>
                  <SelectItem value="center">Center</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs font-semibold text-foreground">Min Height</Label>
              <Select value={form.min_height} onValueChange={v => setForm({ ...form, min_height: v })}>
                <SelectTrigger className="mt-1.5 bg-muted/50"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="50vh">50vh — Compact</SelectItem>
                  <SelectItem value="60vh">60vh — Default</SelectItem>
                  <SelectItem value="70vh">70vh — Tall</SelectItem>
                  <SelectItem value="80vh">80vh — Full</SelectItem>
                  <SelectItem value="100vh">100vh — Full Screen</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Switch checked={form.show_scroll_indicator} onCheckedChange={v => setForm({ ...form, show_scroll_indicator: v })} />
              <Label className="text-xs">Scroll Indicator</Label>
            </div>
          </div>
        </SectionCard>
      </div>
    </div>
  );
};

export default AdminHeroSection;
