import { LineChart, Line, XAxis, YAxis, ResponsiveContainer, Tooltip, Area, AreaChart } from "recharts";

interface LineWidgetProps {
  title: string;
  subtitle?: string;
  subtitleValue?: string | number;
  data: { name: string; value: number }[];
  lineColor?: string;
}

const LineWidget = ({ title, subtitle, subtitleValue, data, lineColor = "hsl(0, 70%, 65%)" }: LineWidgetProps) => (
  <div className="bg-card rounded-xl border border-border p-5 h-full">
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
          <linearGradient id="areaFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={lineColor} stopOpacity={0.15} />
            <stop offset="100%" stopColor={lineColor} stopOpacity={0} />
          </linearGradient>
        </defs>
        <XAxis dataKey="name" tick={{ fontSize: 10 }} stroke="hsl(220, 10%, 45%)" axisLine={false} tickLine={false} />
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
        <Area type="monotone" dataKey="value" stroke={lineColor} fill="url(#areaFill)" strokeWidth={2} dot={false} />
      </AreaChart>
    </ResponsiveContainer>
  </div>
);

export default LineWidget;
