interface ListWidgetProps {
  title: string;
  items: { label: string; value: string | number; color?: string }[];
}

const ListWidget = ({ title, items }: ListWidgetProps) => (
  <div className="bg-card rounded-2xl border border-border p-5 h-full shadow-sm">
    <h3 className="text-sm font-semibold text-card-foreground mb-4">{title}</h3>
    <div className="space-y-3">
      {items.map((item) => (
        <div key={item.label} className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">{item.label}</span>
          <span className="text-sm font-bold text-card-foreground" style={item.color ? { color: item.color } : undefined}>
            {item.value}
          </span>
        </div>
      ))}
    </div>
  </div>
);

export default ListWidget;
