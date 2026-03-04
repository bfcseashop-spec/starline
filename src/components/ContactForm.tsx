import { useState } from "react";
import { motion } from "framer-motion";
import { Send } from "lucide-react";
import { z } from "zod";
import { toast } from "@/components/ui/use-toast";

const contactSchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(100),
  email: z.string().trim().email("Invalid email address").max(255),
  phone: z.string().trim().max(20).optional(),
  message: z.string().trim().min(1, "Message is required").max(2000),
});

interface Props {
  propertyTitle: string;
}

const ContactForm = ({ propertyTitle }: Props) => {
  const [form, setForm] = useState({ name: "", email: "", phone: "", message: "" });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const result = contactSchema.safeParse(form);
    if (!result.success) {
      const fieldErrors: Record<string, string> = {};
      result.error.errors.forEach((err) => {
        if (err.path[0]) fieldErrors[err.path[0] as string] = err.message;
      });
      setErrors(fieldErrors);
      return;
    }
    setErrors({});
    setSubmitted(true);
    toast.success("Inquiry sent! We'll get back to you soon.");
  };

  const update = (field: string, value: string) => {
    setForm((f) => ({ ...f, [field]: value }));
    if (errors[field]) setErrors((e) => ({ ...e, [field]: "" }));
  };

  if (submitted) {
    return (
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="bg-card rounded-xl border border-border p-8 text-center">
        <div className="w-14 h-14 bg-gold/20 rounded-full flex items-center justify-center mx-auto mb-4">
          <Send size={24} className="text-gold" />
        </div>
        <h3 className="font-heading text-xl font-semibold text-card-foreground mb-2">Inquiry Sent!</h3>
        <p className="text-muted-foreground text-sm">Our team will contact you shortly about {propertyTitle}.</p>
      </motion.div>
    );
  }

  const inputClass = (field: string) =>
    `w-full bg-muted text-foreground rounded-lg px-4 py-3 text-sm outline-none border transition-shadow ${
      errors[field] ? "border-destructive" : "border-border focus:ring-2 focus:ring-gold/40"
    }`;

  return (
    <div className="bg-card rounded-xl border border-border p-6 md:p-8">
      <h3 className="font-heading text-xl font-semibold text-card-foreground mb-1">Inquire About This Property</h3>
      <p className="text-muted-foreground text-sm mb-6">Fill out the form and our agent will get in touch.</p>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <input placeholder="Full Name *" value={form.name} onChange={(e) => update("name", e.target.value)} className={inputClass("name")} />
          {errors.name && <p className="text-destructive text-xs mt-1">{errors.name}</p>}
        </div>
        <div>
          <input placeholder="Email Address *" type="email" value={form.email} onChange={(e) => update("email", e.target.value)} className={inputClass("email")} />
          {errors.email && <p className="text-destructive text-xs mt-1">{errors.email}</p>}
        </div>
        <div>
          <input placeholder="Phone Number (optional)" value={form.phone} onChange={(e) => update("phone", e.target.value)} className={inputClass("phone")} />
        </div>
        <div>
          <textarea
            placeholder="Your Message *"
            rows={4}
            value={form.message}
            onChange={(e) => update("message", e.target.value)}
            className={inputClass("message") + " resize-none"}
          />
          {errors.message && <p className="text-destructive text-xs mt-1">{errors.message}</p>}
        </div>
        <button type="submit" className="w-full bg-gold-gradient text-accent-foreground py-3 rounded-lg font-semibold text-sm hover:opacity-90 transition-opacity flex items-center justify-center gap-2">
          <Send size={16} />
          Send Inquiry
        </button>
      </form>
    </div>
  );
};

export default ContactForm;
