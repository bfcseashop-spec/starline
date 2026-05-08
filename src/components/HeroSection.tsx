import { useEffect, useMemo, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { getDefaultHeroSlides } from "@/lib/defaultHeroSlides";

interface Props {
  /** URLs for the rotating hero backgrounds (managed in Admin → Hero Section) */
  heroSlideUrls?: string[];
  /** Legacy single banner; shows as first slide if heroSlideUrls empty */
  bannerImageUrl?: string;
  overlayColor?: string;
  overlayOpacity?: number;
  minHeight?: string;
}

const HeroSection = ({
  heroSlideUrls,
  bannerImageUrl,
  overlayColor = "#1a1a2e",
  overlayOpacity = 70,
  minHeight = "60vh",
}: Props) => {
  const [currentSlide, setCurrentSlide] = useState(0);

  const defaultSlides = useMemo(() => getDefaultHeroSlides(5), []);

  const slides = useMemo(() => {
    const fromAdmin = (heroSlideUrls || []).map((u) => u.trim()).filter(Boolean);
    if (fromAdmin.length > 0) return Array.from(new Set(fromAdmin));
    const legacy = bannerImageUrl?.trim();
    if (legacy) return [legacy];
    return defaultSlides;
  }, [heroSlideUrls, bannerImageUrl, defaultSlides]);
  const hasSlides = slides.length > 0;

  useEffect(() => {
    if (slides.length <= 1) return;
    const timer = window.setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % slides.length);
    }, 5000);
    return () => window.clearInterval(timer);
  }, [slides.length]);

  useEffect(() => {
    if (currentSlide < slides.length) return;
    setCurrentSlide(0);
  }, [currentSlide, slides.length]);

  return (
    <section className="relative flex items-center overflow-hidden" style={{ minHeight }}>
      {/* Background */}
      <div className="absolute inset-0">
        {hasSlides &&
          slides.map((slide, index) => (
            <img
              key={`${slide}-${index}`}
              src={slide}
              alt={`Hero slide ${index + 1}`}
              className={`absolute inset-0 w-full h-full object-cover scale-105 transition-opacity duration-700 ${
                index === currentSlide ? "opacity-100" : "opacity-0"
              }`}
            />
          ))}
        <div
          className="absolute inset-0"
          style={{
            background: hasSlides
              ? `linear-gradient(to right, ${overlayColor}e6, ${overlayColor}b3, ${overlayColor}66)`
              : "linear-gradient(135deg, #020817 0%, #0a1633 45%, #10224a 100%)",
            opacity: overlayOpacity / 100,
          }}
        />
      </div>

      {/* Decorative shapes */}
      <div className="absolute top-20 right-10 w-72 h-72 bg-gold/10 rounded-full blur-3xl" />
      <div className="absolute bottom-20 left-10 w-96 h-96 bg-gold/5 rounded-full blur-3xl" />

      {slides.length > 1 && (
        <>
          <button
            type="button"
            aria-label="Previous slide"
            onClick={() => setCurrentSlide((prev) => (prev - 1 + slides.length) % slides.length)}
            className="absolute left-4 md:left-8 top-1/2 -translate-y-1/2 z-20 p-2.5 rounded-full bg-black/35 text-white hover:bg-black/55 transition-colors"
          >
            <ChevronLeft size={20} />
          </button>
          <button
            type="button"
            aria-label="Next slide"
            onClick={() => setCurrentSlide((prev) => (prev + 1) % slides.length)}
            className="absolute right-4 md:right-8 top-1/2 -translate-y-1/2 z-20 p-2.5 rounded-full bg-black/35 text-white hover:bg-black/55 transition-colors"
          >
            <ChevronRight size={20} />
          </button>
        </>
      )}

      {slides.length > 1 && (
        <div className="absolute bottom-6 md:bottom-8 right-6 md:right-10 z-20 flex items-center gap-2">
          {slides.map((slide, index) => (
            <button
              key={`${slide}-dot-${index}`}
              type="button"
              aria-label={`Go to slide ${index + 1}`}
              onClick={() => setCurrentSlide(index)}
              className={`h-2.5 rounded-full transition-all ${
                index === currentSlide ? "w-7 bg-gold" : "w-2.5 bg-white/55 hover:bg-white/75"
              }`}
            />
          ))}
        </div>
      )}
    </section>
  );
};

export default HeroSection;
