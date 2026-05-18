import { useState } from "react";
import { z } from "zod";
import { MapPin, Phone, Mail, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const schema = z.object({
  name: z.string().trim().min(2, "Please enter your name").max(80),
  email: z.string().trim().email("Invalid email").max(180).optional().or(z.literal("")),
  phone: z.string().trim().min(6, "Please enter a phone number").max(30),
  subject: z.string().trim().max(120).optional().or(z.literal("")),
  message: z.string().trim().min(5, "Message is too short").max(1500),
});

const ContactSection = ({ phone, email, address }: { phone?: string; email?: string; address?: string }) => {
  const [form, setForm] = useState({ name: "", email: "", phone: "", subject: "", message: "" });
  const [saving, setSaving] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = schema.safeParse(form);
    if (!parsed.success) {
      toast.error(parsed.error.errors[0].message);
      return;
    }
    setSaving(true);
    const { error } = await supabase.from("contact_messages").insert(parsed.data as any);
    setSaving(false);
    if (error) {
      toast.error("Could not send. Please try again.");
      return;
    }
    toast.success("Thanks! We'll reach out shortly.");
    setForm({ name: "", email: "", phone: "", subject: "", message: "" });
  };

  return (
    <section id="contact" className="py-20 bg-background">
      <div className="container">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <span className="text-accent uppercase tracking-[0.25em] text-xs font-semibold">Get in Touch</span>
          <h2 className="mt-3 text-foreground">Talk to a property advisor</h2>
          <p className="mt-4 text-muted-foreground">Tell us what you're looking for — we'll respond within one business day.</p>
        </div>
        <div className="grid lg:grid-cols-5 gap-8">
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-card border border-border rounded-2xl p-6">
              <h3 className="text-lg font-semibold text-foreground mb-4">Reach us directly</h3>
              <div className="space-y-4 text-sm">
                <div className="flex items-start gap-3">
                  <span className="w-9 h-9 rounded-lg bg-primary/10 text-primary flex items-center justify-center flex-shrink-0"><MapPin size={16} /></span>
                  <div>
                    <div className="font-medium text-foreground">Office</div>
                    <div className="text-muted-foreground">{address || "3-No, Gate, Road#11, House#E43, Block#E, Level-1, B-1, Niketon, Gulshan, Dhaka-1212"}</div>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <span className="w-9 h-9 rounded-lg bg-primary/10 text-primary flex items-center justify-center flex-shrink-0"><Phone size={16} /></span>
                  <div>
                    <div className="font-medium text-foreground">Phone</div>
                    <a href={`tel:${phone || "+8801707099952"}`} className="text-muted-foreground hover:text-primary">{phone || "+880 1707-099952"}</a>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <span className="w-9 h-9 rounded-lg bg-primary/10 text-primary flex items-center justify-center flex-shrink-0"><Mail size={16} /></span>
                  <div>
                    <div className="font-medium text-foreground">Email</div>
                    <a href={`mailto:${email || "admin@starlineb.com"}`} className="text-muted-foreground hover:text-primary">{email || "admin@starlineb.com"}</a>
                  </div>
                </div>
              </div>
            </div>
            <div className="overflow-hidden rounded-2xl border border-border h-56">
              <iframe
                title="Office location"
                src="https://www.google.com/maps?q=Niketon+Gulshan+Dhaka&output=embed"
                className="w-full h-full"
                loading="lazy"
              />
            </div>
          </div>

          <form onSubmit={submit} className="lg:col-span-3 bg-card border border-border rounded-2xl p-6 md:p-8 space-y-4">
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Name</label>
                <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Your full name" required maxLength={80} />
              </div>
              <div>
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Phone</label>
                <Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="+880 ..." required maxLength={30} />
              </div>
              <div>
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Email</label>
                <Input value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="you@email.com" type="email" maxLength={180} />
              </div>
              <div>
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Subject</label>
                <Input value={form.subject} onChange={(e) => setForm({ ...form, subject: e.target.value })} placeholder="How can we help?" maxLength={120} />
              </div>
            </div>
            <div>
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Message</label>
              <Textarea value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })} rows={5} placeholder="Tell us about the home you're looking for..." required maxLength={1500} />
            </div>
            <Button type="submit" disabled={saving} className="w-full sm:w-auto">
              <Send size={16} className="mr-2" />
              {saving ? "Sending..." : "Send message"}
            </Button>
          </form>
        </div>
      </div>
    </section>
  );
};

export default ContactSection;
