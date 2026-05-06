import ContentPageShell from "@/components/ContentPageShell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { privacyContent } from "@/data/siteContent";

const Privacy = () => {
  return (
    <ContentPageShell title={privacyContent.title} subtitle={privacyContent.intro}>
      <div className="space-y-6">
        {privacyContent.sections.map((s) => (
          <Card key={s.heading} className="rounded-2xl border-border">
            <CardHeader>
              <CardTitle className="font-heading text-xl">{s.heading}</CardTitle>
            </CardHeader>
            <CardContent className="text-muted-foreground leading-relaxed">
              <p>{s.body}</p>
            </CardContent>
          </Card>
        ))}
        <p className="text-xs text-muted-foreground/70">{privacyContent.lastUpdated}</p>
      </div>
    </ContentPageShell>
  );
};

export default Privacy;

