import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";

const faqs = [
  { q: "How do I book an apartment with Starline?", a: "Visit our office or submit an enquiry. A booking is confirmed once the booking amount is paid and documentation is completed." },
  { q: "What payment methods do you accept?", a: "We accept bank transfer, bKash and Nagad. Detailed instalment plans are shared during the booking discussion." },
  { q: "Do you handle Rajuk and utility approvals?", a: "Yes. Our in-house operations team manages all statutory approvals and utility connections end-to-end." },
  { q: "Are your projects ready for handover on time?", a: "Timely handover is one of our core promises. Every project has a transparent construction schedule shared with owners." },
  { q: "Do you provide after-handover support?", a: "Absolutely. We guide owners on building management, maintenance coordination and any future enhancements." },
  { q: "Can I customize interiors of my apartment?", a: "Limited customization is supported during early construction phases. Speak to our team for available options." },
];

const FAQ = () => (
  <section id="faq" className="py-20 bg-background">
    <div className="container max-w-4xl">
      <div className="text-center mb-12">
        <span className="text-accent uppercase tracking-[0.25em] text-xs font-semibold">Questions</span>
        <h2 className="mt-3 text-foreground">Frequently Asked Questions</h2>
        <p className="mt-4 text-muted-foreground">Clear answers to the things buyers most often ask us.</p>
      </div>
      <Accordion type="single" collapsible className="space-y-3">
        {faqs.map((f, i) => (
          <AccordionItem key={i} value={`item-${i}`} className="bg-card border border-border rounded-xl px-5">
            <AccordionTrigger className="text-left font-semibold text-foreground hover:no-underline">{f.q}</AccordionTrigger>
            <AccordionContent className="text-muted-foreground leading-relaxed">{f.a}</AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    </div>
  </section>
);

export default FAQ;
