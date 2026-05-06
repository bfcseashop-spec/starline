import { motion } from "framer-motion";
import { ArrowRight, Play } from "lucide-react";

interface Props {
  bannerTitle?: string;
  bannerSubtitle?: string;
  bannerImageUrl?: string;
  badgeText?: string;
  showBadge?: boolean;
  ctaPrimaryText?: string;
  ctaPrimaryLink?: string;
  ctaSecondaryText?: string;
  ctaSecondaryLink?: string;
  overlayColor?: string;
  overlayOpacity?: number;
  textAlignment?: string;
  minHeight?: string;
  showScrollIndicator?: boolean;
}

const HeroSection = ({
  bannerTitle,
  bannerSubtitle,
  bannerImageUrl,
  badgeText = "Trusted Since 2010",
  showBadge = true,
  ctaPrimaryText = "Explore Properties",
  ctaPrimaryLink = "#properties",
  ctaSecondaryText = "Learn More",
  ctaSecondaryLink = "#about",
  overlayColor = "#1a1a2e",
  overlayOpacity = 70,
  textAlignment = "left",
  minHeight = "60vh",
  showScrollIndicator = true,
}: Props) => {
  const normalizeHref = (href: string) => {
    if (!href) return "/";
    if (href.startsWith("#")) return `/${href}`;
    return href;
  };

  const imageCandidate = (bannerImageUrl || "").trim();
  const hasValidBannerImage =
    imageCandidate.length > 0 &&
    !/logo(\.|-|_)?/i.test(imageCandidate) &&
    !/\/logo\.png$/i.test(imageCandidate);
  const title = bannerTitle || "Building Dreams, Crafting Futures";
  const subtitle = bannerSubtitle || "Premium construction and real estate services by Starline Builder's Ltd. We build more than structures — we create lasting legacies.";

  const words = title.split(" ");
  const lastTwo = words.slice(-2).join(" ");
  const firstPart = words.slice(0, -2).join(" ");

  const isCenter = textAlignment === "center";

  return (
    <section className="relative flex items-center overflow-hidden" style={{ minHeight }}>
      {/* Background */}
      <div className="absolute inset-0">
        {hasValidBannerImage && (
          <img src={imageCandidate} alt="Hero banner" className="w-full h-full object-cover scale-105" />
        )}
        <div
          className="absolute inset-0"
          style={{
            background: hasValidBannerImage
              ? `linear-gradient(to right, ${overlayColor}e6, ${overlayColor}b3, ${overlayColor}66)`
              : "linear-gradient(135deg, #020817 0%, #0a1633 45%, #10224a 100%)",
            opacity: overlayOpacity / 100,
          }}
        />
      </div>

      {/* Decorative shapes */}
      <div className="absolute top-20 right-10 w-72 h-72 bg-gold/10 rounded-full blur-3xl" />
      <div className="absolute bottom-20 left-10 w-96 h-96 bg-gold/5 rounded-full blur-3xl" />

      {/* Content */}
      <div className={`relative z-10 max-w-7xl mx-auto px-6 w-full py-28 md:py-32 ${isCenter ? "text-center" : ""}`}>
        <div className={isCenter ? "max-w-2xl mx-auto" : "max-w-2xl"}>
          {showBadge && (
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6 }}
              className={`inline-flex items-center gap-2 bg-gold/20 backdrop-blur-sm border border-gold/30 rounded-full px-4 py-2 mb-8`}
            >
              <div className="w-2 h-2 rounded-full bg-gold animate-pulse" />
              <span className="text-gold text-sm font-semibold tracking-wide">{badgeText}</span>
            </motion.div>
          )}

          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="font-heading text-5xl md:text-7xl font-bold text-white leading-[1.06] mb-6"
          >
            {firstPart}{firstPart && <br />}
            <span className="text-gradient-gold">{lastTwo}</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className={`text-white/60 text-lg md:text-xl leading-relaxed mb-10 ${isCenter ? "mx-auto" : ""} max-w-lg`}
          >
            {subtitle}
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.6 }}
            className={`flex flex-wrap gap-4 ${isCenter ? "justify-center" : ""}`}
          >
            <a
              href={normalizeHref(ctaPrimaryLink || "")}
              className="bg-gold-gradient text-accent-foreground px-8 py-4 rounded-xl font-semibold text-sm flex items-center gap-2 hover:opacity-90 transition-all shadow-lg shadow-gold/20"
            >
              {ctaPrimaryText} <ArrowRight size={16} />
            </a>
            <a
              href={normalizeHref(ctaSecondaryLink || "")}
              className="border border-white/20 text-white px-8 py-4 rounded-xl font-semibold text-sm flex items-center gap-2 hover:bg-white/10 transition-all backdrop-blur-sm"
            >
              <Play size={16} className="text-gold" /> {ctaSecondaryText}
            </a>
          </motion.div>
        </div>
      </div>

      {/* Scroll indicator */}
      {showScrollIndicator && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.2 }}
          className="absolute bottom-8 left-1/2 -translate-x-1/2"
        >
          <div className="w-6 h-10 border-2 border-white/30 rounded-full flex justify-center pt-2">
            <motion.div
              animate={{ y: [0, 12, 0] }}
              transition={{ duration: 1.5, repeat: Infinity }}
              className="w-1.5 h-1.5 bg-gold rounded-full"
            />
          </div>
        </motion.div>
      )}
    </section>
  );
};

export default HeroSection;
