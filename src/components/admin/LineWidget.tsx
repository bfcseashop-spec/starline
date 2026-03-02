import { AreaChart, Area, XAxis, YAxis, ResponsiveContainer, Tooltip } from "recharts";

interface LineWidgetProps {
  title: string;
  subtitle?: string;
  subtitleValue?: string | number;
  data: { name: string; value: number }[];
  lineColor?: string;
}

const LineWidget = ({ title, subtitle, subtitleValue, data, lineColor = "hsl(0, 70%, 65%)" }: LineWidgetProps) => {
  const gradientId = `area-${title.replace(/\s/g, "")}`;

  return (
    <div className="bg-card rounded-2xl border border-border p-5 h-full shadow-sm">
      <h3 className="text-sm font-semibold text-card-foreground mb-1">{title}</h3>
      {subtitle && (
        <div className="flex items-baseline gap-2 mb-3">
          <span className="text-2xl font-heading font-bold" style={{ color: lineColor }}>{subtitleValue}</span>
          <span className="text-xs text-muted-foreground">{subtitle}</span>
        </div>
      )}
      <ResponsiveContainer width="100%" height={120}>
        <AreaChart data={data}>
          <defs>
            <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={lineColor} stopOpacity={0.2} />
              <stop offset="100%" stopColor={lineColor} stopOpacity={0} />
            </linearGradient>
          </defs>
          <XAxis dataKey="name" tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} />
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
          <Area type="monotone" dataKey="value" stroke={lineColor} fill={`url(#${gradientId})`} strokeWidth={2.5} dot={false} />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
};

export default LineWidget;
