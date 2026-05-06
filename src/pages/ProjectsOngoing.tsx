import ContentPageShell from "@/components/ContentPageShell";
import ProjectsTabs from "@/components/ProjectsTabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MapPin } from "lucide-react";
import { ongoingProjects } from "@/data/siteContent";

const ProjectsOngoing = () => {
  return (
    <ContentPageShell
      title="Ongoing Projects"
      subtitle="Projects currently under construction, tracked with care from planning to finishing—built to be durable, functional, and comfortable."
      eyebrow="Starline Portfolio"
      action={<ProjectsTabs />}
    >
      <div className="grid gap-6">
        {ongoingProjects.map((p) => (
          <Card key={p.name} className="rounded-2xl border-border">
            <CardHeader>
              <CardTitle className="font-heading text-xl">{p.name}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-muted-foreground text-sm flex items-start gap-2">
                <MapPin size={16} className="text-gold mt-0.5 shrink-0" />
                <span>
                  {p.address}, {p.city}
                </span>
              </p>
              {p.notes && <p className="text-muted-foreground leading-relaxed">{p.notes}</p>}
            </CardContent>
          </Card>
        ))}
      </div>
    </ContentPageShell>
  );
};

export default ProjectsOngoing;

