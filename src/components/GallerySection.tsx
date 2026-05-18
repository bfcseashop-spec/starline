import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

const FALLBACK = [
  "https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?auto=format&fit=crop&w=1200&q=80",
  "https://images.unsplash.com/photo-1448630360428-65456885c650?auto=format&fit=crop&w=1200&q=80",
  "https://images.unsplash.com/photo-1486325212027-8081e485255e?auto=format&fit=crop&w=1200&q=80",
  "https://images.unsplash.com/photo-1503174971373-b1f69850bded?auto=format&fit=crop&w=1200&q=80",
  "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?auto=format&fit=crop&w=1200&q=80",
  "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=1200&q=80",
  "https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?auto=format&fit=crop&w=1200&q=80",
  "https://images.unsplash.com/photo-1493809842364-78817add7ffb?auto=format&fit=crop&w=1200&q=80",
];

const GallerySection = () => {
  const [images, setImages] = useState<string[]>(FALLBACK);

  useEffect(() => {
    (async () => {
      try {
        const { data } = await supabase
          .from("project_media")
          .select("url, media_type")
          .eq("media_type", "image")
          .order("sort_order", { ascending: true })
          .limit(8);
        if (data && data.length >= 4) setImages(data.map((d) => d.url));
      } catch {/* keep fallback */}
    })();
  }, []);

  return (
    <section id="gallery" className="py-20 bg-secondary/30">
      <div className="container">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <span className="text-accent uppercase tracking-[0.25em] text-xs font-semibold">Gallery</span>
          <h2 className="mt-3 text-foreground">A look inside our projects</h2>
          <p className="mt-4 text-muted-foreground">Architecture, interiors and community spaces from across our portfolio.</p>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
          {images.slice(0, 8).map((src, i) => (
            <div
              key={`${src}-${i}`}
              className={`group relative overflow-hidden rounded-xl ${i % 5 === 0 ? "row-span-2 aspect-[3/4]" : "aspect-square"}`}
            >
              <img
                src={src}
                alt={`Gallery image ${i + 1}`}
                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                loading="lazy"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-primary/40 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default GallerySection;
