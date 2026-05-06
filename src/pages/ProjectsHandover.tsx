import ContentPageShell from "@/components/ContentPageShell";
import ProjectsTabs from "@/components/ProjectsTabs";
import PropertiesPortfolio from "@/components/PropertiesPortfolio";
import { handoverProjects } from "@/data/siteContent";
import { usePublicProperties } from "@/hooks/usePublicProperties";

const ProjectsHandover = () => {
  const { items, loading } = usePublicProperties("handover", handoverProjects);

  return (
    <ContentPageShell
      title="Handover Properties"
      subtitle="Completed properties delivered with consistent workmanship and dependable after‑handover support."
      eyebrow="Starline Properties"
      action={<ProjectsTabs />}
    >
      <PropertiesPortfolio items={items} statusLabel="Handover" loading={loading} />
    </ContentPageShell>
  );
};

export default ProjectsHandover;

