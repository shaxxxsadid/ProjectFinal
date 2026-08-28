import {
  FaBoxArchive,
  FaBoxesStacked,
  FaUsers,
  FaWarehouse,
} from "react-icons/fa6";

interface DashboardStats {
  totalWarehouses: number;
  totalProducts: number;
  activeUsers: number;
  totalStock: number;
}

interface StatsCardsProps {
  stats: DashboardStats;
}

const formatNumber = (value: number) =>
  new Intl.NumberFormat("ru-RU").format(value);

export default function StatsCards({
  stats,
}: StatsCardsProps) {
  const cards = [
    {
      label: "Активные склады",
      value: stats.totalWarehouses,
      caption: "Работают в системе",
      icon: FaWarehouse,
    },
    {
      label: "Товарные позиции",
      value: stats.totalProducts,
      caption: "В каталоге продукции",
      icon: FaBoxesStacked,
    },
    {
      label: "Активные пользователи",
      value: stats.activeUsers,
      caption: "Имеют доступ к системе",
      icon: FaUsers,
    },
    {
      label: "Общий остаток",
      value: stats.totalStock,
      caption: "Единиц на всех складах",
      icon: FaBoxArchive,
    },
  ];

  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
      {cards.map((card) => {
        const Icon = card.icon;

        return (
          <article
            key={card.label}
            className="group relative overflow-hidden rounded-2xl border border-border bg-card/65 p-4 transition-all duration-200 hover:-translate-y-0.5 hover:bg-muted/60"
          >
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0">
                <div className="text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                  {card.label}
                </div>

                <div className="mt-2 text-3xl font-bold tracking-tight text-foreground">
                  {formatNumber(card.value)}
                </div>

                <div className="mt-1 text-xs text-muted-foreground">
                  {card.caption}
                </div>
              </div>

              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-box/20 bg-box/10 text-box">
                <Icon className="text-lg" />
              </div>
            </div>

            <div className="absolute inset-x-4 bottom-0 h-px origin-left scale-x-0 bg-box/50 transition-transform duration-300 group-hover:scale-x-100" />
          </article>
        );
      })}
    </div>
  );
}
