import { useState, useEffect, useRef, useMemo } from "react";
import { backend } from "@/lib/backendClient";
import { toast } from "@/components/ui/use-toast";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Save, Upload, Image as ImageIcon, Type, Palette, Eye, EyeOff, Loader2,
  ArrowRight, Play, ChevronLeft, ChevronRight, Link2, Trash2, ArrowUp, ArrowDown,
} from "lucide-react";
import { getDefaultHeroSlides } from "@/lib/defaultHeroSlides";
import { adminToastErr, adminToastOk } from "@/lib/adminToast";

interface HeroSettings {
  banner_title: string;
  banner_subtitle: string;
  banner_image_url: string;
  hero_slide_urls: string[];
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
  hero_slide_urls: [],
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

function pickHeroSlice(sys: Record<string, unknown>): Partial<HeroSettings> {
  return {
    banner_title: typeof sys.banner_title === "string" ? sys.banner_title : undefined,
    banner_subtitle: typeof sys.banner_subtitle === "string" ? sys.banner_subtitle : undefined,
    banner_image_url: typeof sys.banner_image_url === "string" ? sys.banner_image_url : undefined,
    hero_slide_urls: Array.isArray(sys.hero_slide_urls) ? (sys.hero_slide_urls.filter((u) => typeof u === "string") as string[]) : undefined,
    badge_text: typeof sys.badge_text === "string" ? sys.badge_text : undefined,
    cta_primary_text: typeof sys.cta_primary_text === "string" ? sys.cta_primary_text : undefined,
    cta_primary_link: typeof sys.cta_primary_link === "string" ? sys.cta_primary_link : undefined,
    cta_secondary_text: typeof sys.cta_secondary_text === "string" ? sys.cta_secondary_text : undefined,
    cta_secondary_link: typeof sys.cta_secondary_link === "string" ? sys.cta_secondary_link : undefined,
    overlay_opacity: typeof sys.overlay_opacity === "number" ? sys.overlay_opacity : undefined,
    overlay_color: typeof sys.overlay_color === "string" ? sys.overlay_color : undefined,
    text_alignment: typeof sys.text_alignment === "string" ? sys.text_alignment : undefined,
    show_badge: typeof sys.show_badge === "boolean" ? sys.show_badge : undefined,
    show_scroll_indicator: typeof sys.show_scroll_indicator === "boolean" ? sys.show_scroll_indicator : undefined,
    min_height: typeof sys.min_height === "string" ? sys.min_height : undefined,
  };
}

const SectionCard = ({
  icon: Icon,
  title,
  children,
  iconColor = "text-primary",
}: {
  icon: typeof ImageIcon;
  title: string;
  children: React.ReactNode;
  iconColor?: string;
}) => (
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
  const [slideUrlDraft, setSlideUrlDraft] = useState("");
  const [previewSlideIdx, setPreviewSlideIdx] = useState(0);

  const slidesRef = useRef<HTMLInputElement>(null);

  const previewSlides = useMemo(() => {
    const u = form.hero_slide_urls.filter((s) => s.trim()).map((s) => s.trim());
    return u.length > 0 ? u : getDefaultHeroSlides(5);
  }, [form.hero_slide_urls]);

  useEffect(() => {
    if (previewSlideIdx >= previewSlides.length) setPreviewSlideIdx(0);
  }, [previewSlideIdx, previewSlides.length]);

  useEffect(() => {
    const fetch = async () => {
      const { data, error } = await backend.from("site_settings").select("setting_value").eq("setting_key", "system").single();
      if (error) {
        adminToastErr(error, "Couldn't load hero settings");
        return;
      }
      if (data?.setting_value && typeof data.setting_value === "object") {
        const sys = data.setting_value as Record<string, unknown>;
        const parsed = pickHeroSlice(sys);
        let slides = (parsed.hero_slide_urls || []).slice();
        if (!slides.length && typeof parsed.banner_image_url === "string" && parsed.banner_image_url.trim()) {
          slides = [parsed.banner_image_url.trim()];
        }
        setForm(() => ({
          ...defaults,
          ...parsed,
          hero_slide_urls: slides,
          banner_image_url: slides[0] || parsed.banner_image_url || "",
        }));
      }
    };
    fetch();
  }, []);

  const addSlidesFromUpload = async (files: FileList | null) => {
    if (!files?.length) return;
    setUploading(true);
    try {
      const next = [...form.hero_slide_urls];
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        if (!file.type.startsWith("image/")) {
          toast.error(`${file.name} is not an image`);
          continue;
        }
        if (file.size > 5 * 1024 * 1024) {
          toast.error(`${file.name} is too large (max 5MB)`);
          continue;
        }
        const ext = file.name.split(".").pop()?.replace(/[^a-zA-Z0-9]/g, "") || "jpg";
        const filePath = `hero-slides/${Date.now()}-${i}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
        const { error: uploadErr } = await backend.storage.from("company-assets").upload(filePath, file);
        if (uploadErr) {
          adminToastErr(uploadErr, "Upload failed");
          continue;
        }
        const { data: pub } = backend.storage.from("company-assets").getPublicUrl(filePath);
        next.push(pub.publicUrl);
      }
      if (next.length > form.hero_slide_urls.length) {
        setForm((prev) => ({ ...prev, hero_slide_urls: next, banner_image_url: next[0] || prev.banner_image_url }));
        adminToastOk("Hero image(s) added");
      }
    } finally {
      setUploading(false);
      if (slidesRef.current) slidesRef.current.value = "";
    }
  };

  const addSlideFromUrl = () => {
    const raw = slideUrlDraft.trim();
    if (!raw) {
      toast.error("Enter an image URL");
      return;
    }
    try {
      const u = new URL(raw);
      if (!/^https?:$/i.test(u.protocol)) throw new Error("protocol");
    } catch {
      toast.error("Enter a valid http(s) image URL");
      return;
    }
    const next = [...form.hero_slide_urls, raw];
    setForm((prev) => ({ ...prev, hero_slide_urls: next, banner_image_url: next[0] || prev.banner_image_url }));
    setSlideUrlDraft("");
    adminToastOk("Slide URL added");
  };

  const removeSlideAt = (index: number) => {
    const next = form.hero_slide_urls.filter((_, i) => i !== index);
    setForm((prev) => ({ ...prev, hero_slide_urls: next, banner_image_url: next[0] || "" }));
    adminToastOk("Slide removed");
  };

  const moveSlide = (index: number, dir: -1 | 1) => {
    const j = index + dir;
    if (j < 0 || j >= form.hero_slide_urls.length) return;
    const next = [...form.hero_slide_urls];
    const t = next[index];
    next[index] = next[j];
    next[j] = t;
    setForm((prev) => ({ ...prev, hero_slide_urls: next, banner_image_url: next[0] || prev.banner_image_url }));
  };

  const fillDefaultPropertySlides = () => {
    const d = getDefaultHeroSlides(5);
    setForm((prev) => ({ ...prev, hero_slide_urls: d, banner_image_url: d[0] || "" }));
    adminToastOk("Filled with default property photos (save to publish)");
  };

  const clearSlides = () => {
    setForm((prev) => ({ ...prev, hero_slide_urls: [], banner_image_url: "" }));
    adminToastOk("Slides cleared — the live site will use default property images until you save");
  };

  const handleSave = async () => {
    setSaving(true);
    const slides = form.hero_slide_urls.map((s) => s.trim()).filter(Boolean);
    try {
      const { data: existing, error: exErr } = await backend
        .from("site_settings")
        .select("setting_value")
        .eq("setting_key", "system")
        .single();
      if (exErr) {
        adminToastErr(exErr, "Failed to read settings");
        return;
      }
      const merged: Record<string, unknown> = {
        ...(typeof existing?.setting_value === "object" && existing.setting_value !== null ? (existing.setting_value as Record<string, unknown>) : {}),
        ...form,
        hero_slide_urls: slides,
        banner_image_url: slides[0] || "",
      };

      const { error } = await backend.from("site_settings").upsert(
        { setting_key: "system", setting_value: merged },
        { onConflict: "setting_key" },
      );
      if (error) {
        adminToastErr(error, "Save failed");
        return;
      }
      setForm((prev) => ({ ...prev, hero_slide_urls: slides, banner_image_url: slides[0] || "" }));
      adminToastOk("Hero section saved successfully");
    } finally {
      setSaving(false);
    }
  };

  const title = form.banner_title;
  const words = title.split(" ");
  const lastTwo = words.slice(-2).join(" ");
  const firstPart = words.slice(0, -2).join(" ");
  const isCenterPreview = form.text_alignment === "center";

  const previewBg = previewSlides[previewSlideIdx] ?? previewSlides[0];

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="font-heading text-2xl font-bold text-foreground">Hero Section</h2>
          <p className="text-sm text-muted-foreground">Hero text, carousel images, and layout (saved under site_settings.system)</p>
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
            {previewSlides.length > 0 && previewBg && (
              <img src={previewBg} alt="" className="absolute inset-0 w-full h-full object-cover scale-105" />
            )}
            <div
              className="absolute inset-0"
              style={{
                background: previewSlides.length
                  ? `linear-gradient(to right, ${form.overlay_color}e6, ${form.overlay_color}b3, ${form.overlay_color}66)`
                  : `linear-gradient(135deg, #020817ee, #10224aea)`,
                opacity: form.overlay_opacity / 100,
              }}
            />
            <div className={`relative z-10 w-full p-8 ${isCenterPreview ? "text-center mx-auto max-w-2xl" : "max-w-xl"}`}>
              {form.show_badge && (
                <div className="inline-flex items-center gap-2 bg-gold/20 border border-gold/30 rounded-full px-3 py-1.5 mb-4">
                  <div className="w-1.5 h-1.5 rounded-full bg-gold" />
                  <span className="text-gold text-xs font-semibold">{form.badge_text}</span>
                </div>
              )}
              <h2 className="font-heading text-3xl md:text-4xl font-bold text-white leading-tight mb-3">
                {firstPart}{firstPart && <br />}
                <span className="text-gradient-gold">{lastTwo}</span>
              </h2>
              <p className="text-white/60 text-sm leading-relaxed mb-6 max-w-md">{form.banner_subtitle}</p>
              <div className={`flex gap-3 ${isCenterPreview ? "justify-center" : ""}`}>
                <span className="bg-gold-gradient text-accent-foreground px-5 py-2.5 rounded-xl font-semibold text-xs flex items-center gap-1.5">
                  {form.cta_primary_text} <ArrowRight size={12} />
                </span>
                <span className="border border-white/20 text-white px-5 py-2.5 rounded-xl font-semibold text-xs flex items-center gap-1.5">
                  <Play size={12} className="text-gold" /> {form.cta_secondary_text}
                </span>
              </div>
              {!form.hero_slide_urls.length ? (
                <p className="text-white/55 text-[11px] mt-6 max-w-sm">
                  Preview uses default property images (none saved yet). Configure slides below — or leave empty to keep defaults on the site.
                </p>
              ) : (
                <p className="text-white/55 text-[11px] mt-6">Preview carousel: {previewSlides.length} slide(s)</p>
              )}
            </div>

            {previewSlides.length > 1 && (
              <>
                <button
                  type="button"
                  className="absolute left-3 top-1/2 z-20 -translate-y-1/2 rounded-full bg-black/40 p-2 text-white hover:bg-black/55"
                  onClick={() => setPreviewSlideIdx((i) => (i - 1 + previewSlides.length) % previewSlides.length)}
                  aria-label="Previous"
                >
                  <ChevronLeft size={18} />
                </button>
                <button
                  type="button"
                  className="absolute right-3 top-1/2 z-20 -translate-y-1/2 rounded-full bg-black/40 p-2 text-white hover:bg-black/55"
                  onClick={() => setPreviewSlideIdx((i) => (i + 1) % previewSlides.length)}
                  aria-label="Next"
                >
                  <ChevronRight size={18} />
                </button>
              </>
            )}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Hero slider */}
        <SectionCard icon={ImageIcon} title="Hero carousel" iconColor="text-indigo-600">
          <p className="text-xs text-muted-foreground">
            Add multiple images for the rotating hero. If empty after save, visitors see photos from your default property catalog automatically.
          </p>
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" size="sm" type="button" onClick={() => slidesRef.current?.click()} disabled={uploading} className="gap-1.5 text-xs">
              {uploading ? <Loader2 size={14} className="animate-spin" /> : <Upload size={14} />}
              Upload image(s)
            </Button>
            <input ref={slidesRef} type="file" accept="image/*" multiple className="hidden" onChange={(e) => addSlidesFromUpload(e.target.files)} />
            <Button variant="outline" size="sm" type="button" className="text-xs" onClick={fillDefaultPropertySlides}>
              Use default properties
            </Button>
            <Button variant="ghost" size="sm" type="button" className="text-xs text-destructive hover:text-destructive" onClick={clearSlides}>
              Clear all slides
            </Button>
          </div>
          <div className="flex gap-2">
            <Input
              value={slideUrlDraft}
              onChange={(e) => setSlideUrlDraft(e.target.value)}
              placeholder="https://…"
              className="bg-muted/50 text-sm"
            />
            <Button type="button" size="sm" variant="secondary" onClick={addSlideFromUrl} className="gap-1 shrink-0">
              <Link2 size={14} /> Add URL
            </Button>
          </div>
          <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
            {form.hero_slide_urls.length === 0 ? (
              <p className="text-xs text-muted-foreground py-4 text-center border border-dashed border-border rounded-xl">No custom slides — site uses default property images</p>
            ) : (
              form.hero_slide_urls.map((url, index) => (
                <div key={`${url}-${index}`} className="flex items-center gap-2 rounded-xl border border-border bg-muted/30 p-2">
                  <img src={url} alt="" className="w-14 h-10 rounded-md object-cover shrink-0 border border-border" />
                  <p className="text-[11px] text-muted-foreground truncate flex-1 font-mono">{url}</p>
                  <div className="flex items-center gap-0.5 shrink-0">
                    <Button type="button" variant="ghost" size="icon" className="h-8 w-8" onClick={() => moveSlide(index, -1)} disabled={index === 0}>
                      <ArrowUp size={14} />
                    </Button>
                    <Button type="button" variant="ghost" size="icon" className="h-8 w-8" onClick={() => moveSlide(index, 1)} disabled={index === form.hero_slide_urls.length - 1}>
                      <ArrowDown size={14} />
                    </Button>
                    <Button type="button" variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => removeSlideAt(index)}>
                      <Trash2 size={14} />
                    </Button>
                  </div>
                </div>
              ))
            )}
          </div>
        </SectionCard>

        {/* Text Content */}
        <SectionCard icon={Type} title="Text content" iconColor="text-emerald-600">
          <div>
            <Label className="text-xs font-semibold text-foreground">Main Title</Label>
            <Input value={form.banner_title} onChange={(e) => setForm({ ...form, banner_title: e.target.value })} className="mt-1.5 bg-muted/50" placeholder="Building Dreams..." />
          </div>
          <div>
            <Label className="text-xs font-semibold text-foreground">Subtitle</Label>
            <Textarea value={form.banner_subtitle} onChange={(e) => setForm({ ...form, banner_subtitle: e.target.value })} className="mt-1.5 bg-muted/50" rows={3} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs font-semibold text-foreground">Badge Text</Label>
              <Input value={form.badge_text} onChange={(e) => setForm({ ...form, badge_text: e.target.value })} className="mt-1.5 bg-muted/50" />
            </div>
            <div className="flex items-end gap-2 pb-0.5">
              <Switch checked={form.show_badge} onCheckedChange={(v) => setForm({ ...form, show_badge: v })} />
              <Label className="text-xs">Show Badge</Label>
            </div>
          </div>
        </SectionCard>

        {/* Call to Action */}
        <SectionCard icon={ArrowRight} title="Call to action" iconColor="text-amber-600">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs font-semibold text-foreground">Primary Button Text</Label>
              <Input value={form.cta_primary_text} onChange={(e) => setForm({ ...form, cta_primary_text: e.target.value })} className="mt-1.5 bg-muted/50" />
            </div>
            <div>
              <Label className="text-xs font-semibold text-foreground">Primary Link</Label>
              <Input value={form.cta_primary_link} onChange={(e) => setForm({ ...form, cta_primary_link: e.target.value })} className="mt-1.5 bg-muted/50" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs font-semibold text-foreground">Secondary Button Text</Label>
              <Input value={form.cta_secondary_text} onChange={(e) => setForm({ ...form, cta_secondary_text: e.target.value })} className="mt-1.5 bg-muted/50" />
            </div>
            <div>
              <Label className="text-xs font-semibold text-foreground">Secondary Link</Label>
              <Input value={form.cta_secondary_link} onChange={(e) => setForm({ ...form, cta_secondary_link: e.target.value })} className="mt-1.5 bg-muted/50" />
            </div>
          </div>
        </SectionCard>

        {/* Style & Layout */}
        <SectionCard icon={Palette} title="Style & layout" iconColor="text-pink-600">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs font-semibold text-foreground">Overlay Color</Label>
              <div className="flex items-center gap-2 mt-1.5">
                <input type="color" value={form.overlay_color} onChange={(e) => setForm({ ...form, overlay_color: e.target.value })} className="w-10 h-10 rounded-lg border border-border cursor-pointer" />
                <Input value={form.overlay_color} onChange={(e) => setForm({ ...form, overlay_color: e.target.value })} className="flex-1 bg-muted/50" />
              </div>
            </div>
            <div>
              <Label className="text-xs font-semibold text-foreground">Overlay Opacity</Label>
              <div className="flex items-center gap-2 mt-1.5">
                <input type="range" min="0" max="100" value={form.overlay_opacity} onChange={(e) => setForm({ ...form, overlay_opacity: Number(e.target.value) })} className="flex-1" />
                <span className="text-xs text-muted-foreground w-8">{form.overlay_opacity}%</span>
              </div>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs font-semibold text-foreground">Text Alignment</Label>
              <Select value={form.text_alignment} onValueChange={(v) => setForm({ ...form, text_alignment: v })}>
                <SelectTrigger className="mt-1.5 bg-muted/50"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="left">Left</SelectItem>
                  <SelectItem value="center">Center</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs font-semibold text-foreground">Min Height</Label>
              <Select value={form.min_height} onValueChange={(v) => setForm({ ...form, min_height: v })}>
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
              <Switch checked={form.show_scroll_indicator} onCheckedChange={(v) => setForm({ ...form, show_scroll_indicator: v })} />
              <Label className="text-xs">Scroll Indicator</Label>
            </div>
          </div>
        </SectionCard>
      </div>
    </div>
  );
};

export default AdminHeroSection;
