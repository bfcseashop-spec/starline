import { PieChart, Pie, Cell, ResponsiveContainer } from "recharts";

interface DonutWidgetProps {
  title: string;
  total: number;
  data: { name: string; value: number; color: string }[];
}

const DonutWidget = ({ title, total, data }: DonutWidgetProps) => (
  <div className="bg-card rounded-2xl border border-border p-5 h-full shadow-sm">
    <h3 className="text-sm font-semibold text-card-foreground mb-4">{title}</h3>
    <div className="flex items-center gap-4">
      <div className="relative w-28 h-28 shrink-0">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie data={data} cx="50%" cy="50%" innerRadius={30} outerRadius={48} dataKey="value" strokeWidth={2} stroke="hsl(var(--card))">
              {data.map((entry, i) => (
                <Cell key={i} fill={entry.color} />
              ))}
            </Pie>
          </PieChart>
        </ResponsiveContainer>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="font-heading text-2xl font-bold text-card-foreground">{total}</span>
        </div>
      </div>
      <div className="space-y-2">
        {data.map((d) => (
          <div key={d.name} className="flex items-center gap-2 text-xs">
            <span className="w-3 h-3 rounded-full shrink-0 shadow-sm" style={{ background: d.color }} />
            <span className="text-muted-foreground">
              <span className="font-bold text-card-foreground">{d.value}</span> {d.name}
            </span>
          </div>
        ))}
      </div>
    </div>
  </div>
);

export default DonutWidget;
