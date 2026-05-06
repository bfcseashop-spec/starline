import ContentPageShell from "@/components/ContentPageShell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { aboutContent } from "@/data/siteContent";
import aboutLegacyImage from "@/assets/hero-skyline.png";

const About = () => {
  return (
    <ContentPageShell title={aboutContent.heroTitle} subtitle={aboutContent.heroSubtitle}>
      <div className="space-y-8">
        <div className="rounded-2xl overflow-hidden border border-border">
          <img src={aboutLegacyImage} alt="Starline construction team and company profile" className="w-full h-[320px] object-cover" />
        </div>
        <Card className="rounded-2xl border-border">
          <CardHeader>
            <CardTitle className="font-heading">Overview</CardTitle>
          </CardHeader>
          <CardContent className="text-muted-foreground leading-relaxed">
            <p>{aboutContent.intro}</p>
          </CardContent>
        </Card>

        <div className="grid gap-6">
          {aboutContent.sections.map((s) => (
            <Card key={s.title} className="rounded-2xl border-border">
              <CardHeader>
                <CardTitle className="font-heading text-xl">{s.title}</CardTitle>
              </CardHeader>
              <CardContent className="text-muted-foreground leading-relaxed">
                <p>{s.body}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </ContentPageShell>
  );
};

export default About;

