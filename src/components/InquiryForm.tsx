import { useState } from "react";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const schema = z.object({
  name: z.string().trim().min(2, "Please enter your name").max(80),
  email: z.string().trim().email("Invalid email").max(180).optional().or(z.literal("")),
  phone: z.string().trim().min(6, "Please enter a phone number").max(30),
  message: z.string().trim().max(1000).optional().or(z.literal("")),
});

const InquiryForm = ({ projectId, projectName }: { projectId: string; projectName: string }) => {
  const [form, setForm] = useState({ name: "", email: "", phone: "", message: `I'm interested in ${projectName}. Please share more details.` });
  const [saving, setSaving] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = schema.safeParse(form);
    if (!parsed.success) {
      toast.error(parsed.error.errors[0].message);
      return;
    }
    setSaving(true);
    const { error } = await supabase.from("project_inquiries").insert({ ...parsed.data, project_id: projectId } as any);
    setSaving(false);
    if (error) { toast.error("Could not send inquiry."); return; }
    toast.success("Inquiry received. Our team will reach out shortly.");
    setForm({ ...form, name: "", email: "", phone: "" });
  };

  return (
    <form onSubmit={submit} className="space-y-3">
      <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Full name" required maxLength={80} />
      <Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="Phone" required maxLength={30} />
      <Input value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="Email (optional)" type="email" maxLength={180} />
      <Textarea value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })} rows={4} maxLength={1000} />
      <Button type="submit" disabled={saving} className="w-full">{saving ? "Sending..." : "Request information"}</Button>
    </form>
  );
};

export default InquiryForm;
