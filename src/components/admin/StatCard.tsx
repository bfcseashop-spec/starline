import { ReactNode } from "react";

interface StatCardProps {
  value: string | number;
  label: string;
  color: string;
  gradient?: string;
  icon?: ReactNode;
}

const StatCard = ({ value, label, gradient, icon }: StatCardProps) => (
  <div className={`${gradient || "bg-dash-blue"} rounded-2xl p-5 text-white shadow-lg relative overflow-hidden`}>
    <div className="absolute -right-3 -top-3 w-16 h-16 rounded-full bg-white/10" />
    <div className="absolute -right-1 -bottom-4 w-10 h-10 rounded-full bg-white/5" />
    <div className="relative">
      {icon && <div className="mb-2">{icon}</div>}
      <p className="font-heading text-2xl font-bold">{value}</p>
      <p className="text-white/70 text-xs font-medium mt-1 uppercase tracking-wider">{label}</p>
    </div>
  </div>
);

export default StatCard;
