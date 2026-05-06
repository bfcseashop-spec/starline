import { Link, useLocation } from "react-router-dom";

const tabs = [
  { label: "Ongoing", to: "/projects/ongoing" },
  { label: "Upcoming", to: "/projects/upcoming" },
  { label: "Handover", to: "/projects/handover" },
];

const ProjectsTabs = () => {
  const location = useLocation();

  return (
    <div className="inline-flex rounded-full bg-muted/70 p-1 text-xs md:text-sm mb-8">
      {tabs.map((tab) => {
        const isActive = location.pathname === tab.to;
        return (
          <Link
            key={tab.to}
            to={tab.to}
            className={`px-4 md:px-6 py-2 rounded-full font-semibold transition-all ${
              isActive
                ? "bg-navy text-white shadow-sm"
                : "text-muted-foreground hover:text-foreground hover:bg-muted"
            }`}
          >
            {tab.label}
          </Link>
        );
      })}
    </div>
  );
};

export default ProjectsTabs;

