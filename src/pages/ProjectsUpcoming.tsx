import ContentPageShell from "@/components/ContentPageShell";
import ProjectsTabs from "@/components/ProjectsTabs";
import PropertiesPortfolio from "@/components/PropertiesPortfolio";
import { upcomingProjects } from "@/data/siteContent";
import { usePublicProperties } from "@/hooks/usePublicProperties";

const ProjectsUpcoming = () => {
  const { items, loading } = usePublicProperties("upcoming", upcomingProjects);

  return (
    <ContentPageShell
      title="Upcoming Properties"
      subtitle="Discover what’s next in our pipeline of planned residential developments."
      eyebrow="Starline Properties"
      action={<ProjectsTabs />}
    >
      <PropertiesPortfolio items={items} statusLabel="Upcoming" loading={loading} />
    </ContentPageShell>
  );
};

export default ProjectsUpcoming;

