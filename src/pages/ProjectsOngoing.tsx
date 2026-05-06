import ContentPageShell from "@/components/ContentPageShell";
import ProjectsTabs from "@/components/ProjectsTabs";
import PropertiesPortfolio from "@/components/PropertiesPortfolio";
import { ongoingProjects } from "@/data/siteContent";
import { usePublicProperties } from "@/hooks/usePublicProperties";

const ProjectsOngoing = () => {
  const { items, loading } = usePublicProperties("ongoing", ongoingProjects);

  return (
    <ContentPageShell
      title="Ongoing Properties"
      subtitle="Properties currently under construction, tracked with care from planning to finishing."
      eyebrow="Starline Properties"
      action={<ProjectsTabs />}
    >
      <PropertiesPortfolio items={items} statusLabel="Ongoing" loading={loading} />
    </ContentPageShell>
  );
};

export default ProjectsOngoing;

