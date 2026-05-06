import { motion } from "framer-motion";
import { Shield, Award, Users, Clock, Sparkles, HeartHandshake } from "lucide-react";
import type { WhyUsReason } from "@/hooks/useSiteSettings";

const ICON_MAP: Record<string, any> = { Shield, Award, Users, Clock, Sparkles, HeartHandshake };
const GRADIENTS = ["bg-dash-blue", "bg-dash-green", "bg-dash-orange", "bg-dash-purple", "bg-dash-pink", "bg-dash-teal"];

const defaultReasons: WhyUsReason[] = [
  { iconName: "Shield", title: "Trusted & Reliable", desc: "Over a decade of delivering projects on time with uncompromising quality standards." },
  { iconName: "Award", title: "Award Winning", desc: "Recognized by industry leaders for excellence in construction and design." },
  { iconName: "Users", title: "Client First", desc: "Dedicated project managers ensuring transparent communication at every step." },
  { iconName: "Clock", title: "On-Time Delivery", desc: "98% of our projects are completed on or before the promised date." },
  { iconName: "Sparkles", title: "Modern Design", desc: "Cutting-edge architectural designs that blend luxury with functionality." },
  { iconName: "HeartHandshake", title: "After-Sales Support", desc: "Comprehensive warranty and dedicated post-handover support team." },
];

interface Props {
  reasons?: WhyUsReason[];
}

const WhyStarline = ({ reasons }: Props) => {
  const list = reasons && reasons.length > 0 ? reasons : defaultReasons;

  return (
    <section id="about" className="py-16 md:py-20 bg-navy relative overflow-hidden">
      <div className="absolute top-0 right-0 w-96 h-96 bg-gold/5 rounded-full blur-3xl" />
      <div className="absolute bottom-0 left-0 w-64 h-64 bg-gold/5 rounded-full blur-3xl" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-10 md:mb-14"
        >
          <p className="text-gold uppercase tracking-[0.3em] text-sm font-semibold mb-3">Why Choose Us</p>
          <h2 className="font-heading text-4xl md:text-5xl font-bold text-white">
            Why <span className="text-gradient-gold">Starline</span>?
          </h2>
          <p className="text-white/50 mt-3 max-w-lg mx-auto">We don't just build properties — we build trust, quality, and lifelong relationships.</p>
        </motion.div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {list.map((r, i) => {
            const Icon = ICON_MAP[r.iconName] || Shield;
            return (
              <motion.div
                key={r.title + i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.08 }}
                className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-6 hover:bg-white/10 transition-all group"
              >
                <div className={`p-3 rounded-xl ${GRADIENTS[i % GRADIENTS.length]} w-fit mb-4`}>
                  <Icon size={22} className="text-white" />
                </div>
                <h3 className="font-heading text-lg font-bold text-white mb-2">{r.title}</h3>
                <p className="text-white/50 text-sm leading-relaxed">{r.desc}</p>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default WhyStarline;
