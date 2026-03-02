import { ReactNode } from "react";

interface StatCardProps {
  value: string | number;
  label: string;
  color: string;
  icon?: ReactNode;
}

const StatCard = ({ value, label, color }: StatCardProps) => (
  <div className={`bg-card rounded-xl border border-border p-5 text-center relative overflow-hidden`}>
    <div className={`absolute top-0 left-0 right-0 h-1`} style={{ background: color }} />
    <p className="font-heading text-3xl font-bold text-card-foreground">{value}</p>
    <p className="text-muted-foreground text-sm mt-1">{label}</p>
  </div>
);

export default StatCard;
