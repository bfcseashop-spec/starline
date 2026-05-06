import ContentPageShell from "@/components/ContentPageShell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { aboutContent } from "@/data/siteContent";

const About = () => {
  return (
    <ContentPageShell title={aboutContent.heroTitle} subtitle={aboutContent.heroSubtitle}>
      <div className="space-y-8">
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

