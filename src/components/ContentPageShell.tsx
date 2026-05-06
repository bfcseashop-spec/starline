import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { useSiteSettings } from "@/hooks/useSiteSettings";

interface Props {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  eyebrow?: string;
  action?: React.ReactNode;
}

const ContentPageShell = ({ title, subtitle, children, eyebrow, action }: Props) => {
  const { system, company, social, socialPlatforms, headerConfig, footerContent, loading } = useSiteSettings();

  return (
    <div className="min-h-screen bg-background">
      {!loading && (
        <style>{`
          :root {
            --dynamic-primary: ${system.primary_color};
            --dynamic-accent: ${system.accent_color};
          }
        `}</style>
      )}
      <Navbar company={company} headerConfig={headerConfig} social={social} socialPlatforms={socialPlatforms} />

      <main className="pt-32 pb-20">
        <section className="max-w-5xl mx-auto px-6">
          <div className="mb-10 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="text-gold uppercase tracking-[0.3em] text-xs font-semibold mb-3">
                {eyebrow || "Starline Builder's Ltd."}
              </p>
              <h1 className="text-3xl md:text-4xl font-heading font-bold text-foreground">{title}</h1>
              {subtitle && (
                <p className="text-muted-foreground mt-3 text-sm md:text-base leading-relaxed max-w-3xl">
                  {subtitle}
                </p>
              )}
            </div>
            {action && <div className="md:mb-1">{action}</div>}
          </div>
          {children}
        </section>
      </main>

      <Footer company={company} social={social} content={footerContent} />
    </div>
  );
};

export default ContentPageShell;

