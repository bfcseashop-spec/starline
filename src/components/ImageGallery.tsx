import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface Props {
  images: string[];
  title: string;
}

const ImageGallery = ({ images, title }: Props) => {
  const [current, setCurrent] = useState(0);

  const prev = () => setCurrent((c) => (c === 0 ? images.length - 1 : c - 1));
  const next = () => setCurrent((c) => (c === images.length - 1 ? 0 : c + 1));

  return (
    <div className="space-y-4">
      {/* Main image */}
      <div className="relative aspect-[16/9] rounded-xl overflow-hidden bg-muted">
        <AnimatePresence mode="wait">
          <motion.img
            key={current}
            src={images[current]}
            alt={`${title} - Photo ${current + 1}`}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="w-full h-full object-cover"
          />
        </AnimatePresence>

        <button
          onClick={prev}
          className="absolute left-4 top-1/2 -translate-y-1/2 bg-primary/60 backdrop-blur-sm hover:bg-primary/80 text-primary-foreground rounded-full p-2 transition-colors"
          aria-label="Previous image"
        >
          <ChevronLeft size={20} />
        </button>
        <button
          onClick={next}
          className="absolute right-4 top-1/2 -translate-y-1/2 bg-primary/60 backdrop-blur-sm hover:bg-primary/80 text-primary-foreground rounded-full p-2 transition-colors"
          aria-label="Next image"
        >
          <ChevronRight size={20} />
        </button>

        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
          {images.map((_, i) => (
            <button
              key={i}
              onClick={() => setCurrent(i)}
              className={`w-2 h-2 rounded-full transition-all ${i === current ? "bg-gold w-6" : "bg-primary-foreground/40"}`}
              aria-label={`Go to image ${i + 1}`}
            />
          ))}
        </div>
      </div>

      {/* Thumbnails */}
      <div className="flex gap-3">
        {images.map((img, i) => (
          <button
            key={i}
            onClick={() => setCurrent(i)}
            className={`flex-1 aspect-[4/3] rounded-lg overflow-hidden border-2 transition-all ${
              i === current ? "border-gold" : "border-transparent opacity-60 hover:opacity-100"
            }`}
          >
            <img src={img} alt={`${title} thumbnail ${i + 1}`} className="w-full h-full object-cover" />
          </button>
        ))}
      </div>
    </div>
  );
};

export default ImageGallery;
