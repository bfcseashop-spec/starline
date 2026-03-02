import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip } from "recharts";

interface BarWidgetProps {
  title: string;
  data: { name: string; value: number; color?: string }[];
  barColor?: string;
}

const BarWidget = ({ title, data, barColor = "hsl(42, 80%, 65%)" }: BarWidgetProps) => (
  <div className="bg-card rounded-xl border border-border p-5 h-full">
    <h3 className="text-sm font-semibold text-card-foreground mb-4">{title}</h3>
    <ResponsiveContainer width="100%" height={140}>
      <BarChart data={data}>
        <XAxis dataKey="name" tick={{ fontSize: 11 }} stroke="hsl(220, 10%, 45%)" axisLine={false} tickLine={false} />
        <YAxis hide />
        <Tooltip
          contentStyle={{
            background: "hsl(220, 30%, 12%)",
            border: "1px solid hsl(220, 30%, 20%)",
            borderRadius: "8px",
            color: "hsl(220, 15%, 92%)",
            fontSize: 12,
          }}
        />
        <Bar dataKey="value" fill={barColor} radius={[4, 4, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  </div>
);

export default BarWidget;
