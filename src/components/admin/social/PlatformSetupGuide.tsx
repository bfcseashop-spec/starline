import { useState } from "react";
import {
  BookOpen,
  Check,
  ChevronDown,
  ChevronUp,
  ExternalLink,
  Info,
  ShieldAlert,
  Copy,
  Key,
  CheckCircle2,
  ArrowRight,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "@/components/ui/use-toast";
import { getGuide, type GuideStep } from "@/lib/socialSetupGuides";
import type { Platform } from "@/lib/socialApi";

interface Props {
  platform: Platform;
  /** Initially open or collapsed. */
  defaultOpen?: boolean;
}

/**
 * Renders the per-platform setup walkthrough inside the connection modal.
 * Pure UI — no side effects on the connection state.
 */
export const PlatformSetupGuide = ({ platform, defaultOpen = true }: Props) => {
  const guide = getGuide(platform);
  const [open, setOpen] = useState(defaultOpen);

  if (!guide) return null;

  return (
    <div className="border border-border rounded-xl bg-card/40 overflow-hidden">
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between gap-3 px-4 py-3 text-left hover:bg-muted/40 transition-colors"
      >
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-7 h-7 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0">
            <BookOpen size={14} />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold text-foreground">Setup guide</span>
              {guide.estimate && (
                <span className="text-[10px] uppercase tracking-wider font-bold px-1.5 py-0.5 rounded bg-muted text-muted-foreground">
                  {guide.estimate}
                </span>
              )}
            </div>
            <p className="text-[11px] text-muted-foreground truncate">{guide.summary}</p>
          </div>
        </div>
        {open ? <ChevronUp size={16} className="shrink-0 text-muted-foreground" /> : <ChevronDown size={16} className="shrink-0 text-muted-foreground" />}
      </button>

      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.18 }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-4 space-y-3 border-t border-border pt-3">
              {guide.caution && (
                <div className="flex items-start gap-2 p-2.5 bg-amber-100 dark:bg-amber-500/15 border border-amber-200 dark:border-amber-500/30 rounded-lg text-amber-800 dark:text-amber-300 text-[11px]">
                  <ShieldAlert size={13} className="shrink-0 mt-0.5" />
                  <p>{guide.caution}</p>
                </div>
              )}

              {guide.envVars && guide.envVars.length > 0 && (
                <div className="flex items-start gap-2 p-2.5 bg-muted/40 border border-border rounded-lg text-[11px]">
                  <Key size={13} className="shrink-0 mt-0.5 text-muted-foreground" />
                  <div className="min-w-0">
                    <p className="text-muted-foreground mb-1">Backend env vars used:</p>
                    <div className="flex flex-wrap gap-1">
                      {guide.envVars.map((v) => (
                        <code
                          key={v}
                          className="bg-background px-1.5 py-0.5 rounded text-[10px] border border-border text-foreground"
                        >
                          {v}
                        </code>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              <ol className="space-y-3">
                {guide.sections.map((section, idx) => (
                  <li key={idx} className="">
                    <div className="flex items-center gap-2 mb-1.5">
                      <span className="w-5 h-5 rounded-full bg-primary text-primary-foreground text-[10px] font-bold flex items-center justify-center">
                        {idx + 1}
                      </span>
                      <h4 className="text-xs font-bold text-foreground">{section.title.replace(/^\d+\.\s*/, "")}</h4>
                    </div>
                    <ul className="ml-6 space-y-1.5">
                      {section.steps.map((step, i) => (
                        <StepRow key={i} step={step} />
                      ))}
                    </ul>
                  </li>
                ))}
              </ol>

              {guide.links && guide.links.length > 0 && (
                <div className="pt-2 border-t border-border flex flex-wrap gap-2">
                  {guide.links.map((l) => (
                    <a
                      key={l.href}
                      href={l.href}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1 text-[11px] text-primary hover:underline"
                    >
                      <ExternalLink size={11} />
                      {l.label}
                    </a>
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

const StepRow = ({ step }: { step: GuideStep }) => {
  const Icon = stepIcon(step.kind);
  const tone = stepTone(step.kind);
  return (
    <li className="flex items-start gap-2 text-[12px] leading-snug">
      <Icon size={11} className={`shrink-0 mt-1 ${tone}`} />
      <div className="min-w-0 flex-1">
        <span className="text-foreground/90">
          <RichText text={step.text} href={step.href} />
        </span>
        {step.copy !== undefined && <CopyChip value={step.copy} />}
      </div>
    </li>
  );
};

function stepIcon(kind: GuideStep["kind"]) {
  switch (kind) {
    case "do":
      return ArrowRight;
    case "copy":
      return Copy;
    case "scope":
      return Check;
    case "warn":
      return ShieldAlert;
    case "link":
      return ExternalLink;
    case "env":
      return Key;
    case "note":
      return Info;
    default:
      return CheckCircle2;
  }
}

function stepTone(kind: GuideStep["kind"]): string {
  switch (kind) {
    case "warn":
      return "text-amber-600 dark:text-amber-400";
    case "scope":
      return "text-emerald-600 dark:text-emerald-400";
    case "copy":
    case "env":
      return "text-blue-600 dark:text-blue-400";
    case "link":
      return "text-primary";
    case "note":
      return "text-muted-foreground";
    default:
      return "text-muted-foreground";
  }
}

const CopyChip = ({ value }: { value: string }) => {
  const [copied, setCopied] = useState(false);
  if (!value) return null;
  const onClick = async () => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      toast.success("Copied");
      setTimeout(() => setCopied(false), 1500);
    } catch {
      toast.error("Could not copy");
    }
  };
  return (
    <div className="mt-1 flex items-center gap-1.5">
      <code className="flex-1 min-w-0 truncate font-mono text-[10.5px] bg-muted/60 border border-border rounded px-1.5 py-1 text-foreground">
        {value}
      </code>
      <button
        onClick={onClick}
        className="p-1 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted shrink-0"
        title="Copy to clipboard"
      >
        {copied ? <Check size={11} className="text-emerald-500" /> : <Copy size={11} />}
      </button>
    </div>
  );
};

/**
 * Tiny inline parser: handles **bold**, `code`, and [text](url) only.
 * Keeps the component dependency-free.
 */
const RichText = ({ text, href }: { text: string; href?: string }) => {
  const parts = parse(text);
  return (
    <>
      {parts.map((p, i) => {
        if (p.kind === "bold") return <strong key={i} className="font-semibold text-foreground">{p.text}</strong>;
        if (p.kind === "code")
          return (
            <code key={i} className="font-mono text-[10.5px] bg-muted/60 border border-border rounded px-1 py-[1px]">
              {p.text}
            </code>
          );
        if (p.kind === "link")
          return (
            <a
              key={i}
              href={p.href}
              target="_blank"
              rel="noreferrer"
              className="text-primary hover:underline inline-flex items-center gap-0.5"
            >
              {p.text}
              <ExternalLink size={9} />
            </a>
          );
        return <span key={i}>{p.text}</span>;
      })}
      {href && (
        <>
          {" "}
          <a
            href={href}
            target="_blank"
            rel="noreferrer"
            className="text-primary hover:underline inline-flex items-center gap-0.5"
          >
            open
            <ExternalLink size={9} />
          </a>
        </>
      )}
    </>
  );
};

type Token =
  | { kind: "text"; text: string }
  | { kind: "bold"; text: string }
  | { kind: "code"; text: string }
  | { kind: "link"; text: string; href: string };

function parse(input: string): Token[] {
  const tokens: Token[] = [];
  const re = /\*\*([^*]+)\*\*|`([^`]+)`|\[([^\]]+)\]\(([^)]+)\)/g;
  let last = 0;
  let m: RegExpExecArray | null;
  while ((m = re.exec(input)) !== null) {
    if (m.index > last) tokens.push({ kind: "text", text: input.slice(last, m.index) });
    if (m[1] !== undefined) tokens.push({ kind: "bold", text: m[1] });
    else if (m[2] !== undefined) tokens.push({ kind: "code", text: m[2] });
    else if (m[3] !== undefined && m[4] !== undefined) tokens.push({ kind: "link", text: m[3], href: m[4] });
    last = re.lastIndex;
  }
  if (last < input.length) tokens.push({ kind: "text", text: input.slice(last) });
  return tokens;
}
