import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip } from "recharts";

interface BarWidgetProps {
  title: string;
  data: { name: string; value: number; color?: string }[];
  barColor?: string;
}

const BarWidget = ({ title, data, barColor = "hsl(42, 80%, 65%)" }: BarWidgetProps) => (
  <div className="bg-card rounded-2xl border border-border p-5 h-full shadow-sm">
    <h3 className="text-sm font-semibold text-card-foreground mb-4">{title}</h3>
    <ResponsiveContainer width="100%" height={140}>
      <BarChart data={data}>
        <XAxis dataKey="name" tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} />
        <YAxis hide />
        <Tooltip
          contentStyle={{
            background: "hsl(var(--card))",
            border: "1px solid hsl(var(--border))",
            borderRadius: "12px",
            color: "hsl(var(--card-foreground))",
            fontSize: 12,
          }}
        />
        <Bar dataKey="value" fill={barColor} radius={[6, 6, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  </div>
);

export default BarWidget;
