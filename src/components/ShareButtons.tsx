import { Facebook, Link as LinkIcon, MessageCircle } from "lucide-react";
import { toast } from "sonner";

const ShareButtons = ({ title }: { title: string }) => {
  const url = typeof window !== "undefined" ? window.location.href : "";
  const encoded = encodeURIComponent(url);
  const txt = encodeURIComponent(title);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(url);
      toast.success("Link copied to clipboard");
    } catch {
      toast.error("Could not copy link");
    }
  };

  return (
    <div className="flex items-center gap-2">
      <span className="text-sm text-muted-foreground mr-1">Share:</span>
      <a
        href={`https://www.facebook.com/sharer/sharer.php?u=${encoded}`}
        target="_blank"
        rel="noreferrer"
        aria-label="Share on Facebook"
        className="w-9 h-9 inline-flex items-center justify-center rounded-full bg-secondary text-foreground hover:bg-primary hover:text-primary-foreground transition"
      >
        <Facebook size={16} />
      </a>
      <a
        href={`https://wa.me/?text=${txt}%20${encoded}`}
        target="_blank"
        rel="noreferrer"
        aria-label="Share on WhatsApp"
        className="w-9 h-9 inline-flex items-center justify-center rounded-full bg-secondary text-foreground hover:bg-primary hover:text-primary-foreground transition"
      >
        <MessageCircle size={16} />
      </a>
      <button
        type="button"
        onClick={copy}
        aria-label="Copy link"
        className="w-9 h-9 inline-flex items-center justify-center rounded-full bg-secondary text-foreground hover:bg-primary hover:text-primary-foreground transition"
      >
        <LinkIcon size={16} />
      </button>
    </div>
  );
};

export default ShareButtons;
