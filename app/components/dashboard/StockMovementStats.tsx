import {
  FaArrowRightArrowLeft,
  FaBoxOpen,
  FaBoxArchive,
  FaClockRotateLeft,
} from "react-icons/fa6";

interface MovementMetric {
  operations: number;
  units: number;
  netStockChange: number;
  netReservedChange: number;
}

export interface StockMovementStatsData {
  periodDays: number;
  periodStart: string;

  totalOperations: number;
  totalUnits: number;
  netStockChange: number;
  netReservedChange: number;

  lastMovementAt: string | null;

  byType: {
    reservation: MovementMetric;
    release: MovementMetric;
    issue: MovementMetric;
    receipt: MovementMetric;
    adjustment: MovementMetric;
  };
}

interface StockMovementStatsProps {
  data: StockMovementStatsData;
}

const formatNumber = (value: number) =>
  new Intl.NumberFormat("ru-RU").format(value);

const formatSigned = (value: number) => {
  const formatted = formatNumber(
    Math.abs(value)
  );

  if (value > 0) {
    return `+${formatted}`;
  }

  if (value < 0) {
    return `−${formatted}`;
  }

  return "0";
};

const formatDate = (
  value: string | null
) => {
  if (!value) {
    return "Операций пока нет";
  }

  const date = new Date(value);

  if (
    Number.isNaN(date.getTime())
  ) {
    return "—";
  }

  return new Intl.DateTimeFormat(
    "ru-RU",
    {
      dateStyle: "medium",
      timeStyle: "short",
    }
  ).format(date);
};

export default function StockMovementStats({
  data,
}: StockMovementStatsProps) {
  const movementTypes = [
    {
      key: "receipt" as const,
      label: "Поступления",
      caption: "Новые партии",
    },
    {
      key: "reservation" as const,
      label: "Резервы",
      caption: "Под заказы",
    },
    {
      key: "release" as const,
      label: "Снятие резерва",
      caption: "Отменённые резервы",
    },
    {
      key: "issue" as const,
      label: "Выдачи",
      caption: "Фактически списано",
    },
    {
      key: "adjustment" as const,
      label: "Корректировки",
      caption: "Ручные изменения",
    },
  ];

  const maxUnits = Math.max(
    1,
    ...movementTypes.map(
      ({ key }) =>
        data.byType[key].units
    )
  );

  const summary = [
    {
      label: "Операций",
      value: formatNumber(
        data.totalOperations
      ),
      caption: `За ${data.periodDays} дней`,
      icon: FaArrowRightArrowLeft,
    },
    {
      label: "Единиц в движении",
      value: formatNumber(
        data.totalUnits
      ),
      caption: "Суммарный объём операций",
      icon: FaBoxArchive,
    },
    {
      label: "Изменение остатка",
      value: formatSigned(
        data.netStockChange
      ),
      caption: "Quantity за период",
      icon: FaBoxOpen,
    },
    {
      label: "Изменение резерва",
      value: formatSigned(
        data.netReservedChange
      ),
      caption: "Reserved за период",
      icon: FaClockRotateLeft,
    },
  ];

  return (
    <article className="mt-6 rounded-3xl bg-muted/20 p-5 shadow-sm">
      <div className="flex flex-col gap-3 pb-2 md:flex-row md:items-end md:justify-between">
        <div>
          <div className="mb-2 h-1 w-8 rounded-full bg-box/80" />
          <div className="text-[10px] font-semibold uppercase tracking-[0.22em] text-box/80">
            Stock movements
          </div>

          <h2 className="mt-1 text-lg font-bold text-foreground">
            Движение запасов
          </h2>

          <p className="mt-1 max-w-2xl text-xs leading-relaxed text-muted-foreground">
            Операции резервирования,
            поступления, выдачи и ручные
            корректировки за последние{" "}
            {data.periodDays} дней.
          </p>
        </div>

        <div className="rounded-2xl bg-background/55 px-3 py-2 shadow-sm">
          <div className="text-[9px] font-semibold uppercase tracking-wider text-muted-foreground">
            Последняя операция
          </div>
          <div className="mt-0.5 text-xs font-medium text-foreground">
            {formatDate(
              data.lastMovementAt
            )}
          </div>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-3 lg:grid-cols-4">
        {summary.map((item) => {
          const Icon = item.icon;

          return (
            <div
              key={item.label}
              className="rounded-2xl bg-background/45 p-3 shadow-sm"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="text-[9px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                    {item.label}
                  </div>

                  <div className="mt-1.5 text-xl font-bold tabular-nums text-foreground">
                    {item.value}
                  </div>

                  <div className="mt-0.5 text-[10px] text-muted-foreground">
                    {item.caption}
                  </div>
                </div>

                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-box/10 text-box">
                  <Icon className="text-sm" />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-4 grid grid-cols-1 gap-2 md:grid-cols-5">
        {movementTypes.map(
          ({
            key,
            label,
            caption,
          }) => {
            const metric =
              data.byType[key];

            const width =
              metric.units > 0
                ? Math.max(
                    5,
                    Math.round(
                      (metric.units /
                        maxUnits) *
                        100
                    )
                  )
                : 0;

            return (
              <div
                key={key}
                className="rounded-2xl bg-muted/35 p-3"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <div className="text-xs font-semibold text-foreground">
                      {label}
                    </div>
                    <div className="mt-0.5 text-[9px] text-muted-foreground">
                      {caption}
                    </div>
                  </div>

                  <span className="shrink-0 text-[10px] font-semibold tabular-nums text-muted-foreground">
                    {metric.operations} оп.
                  </span>
                </div>

                <div className="mt-3 flex items-end justify-between gap-2">
                  <span className="text-lg font-bold tabular-nums text-foreground">
                    {formatNumber(
                      metric.units
                    )}
                  </span>

                  <span className="text-[9px] uppercase tracking-wider text-muted-foreground">
                    ед.
                  </span>
                </div>

                <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-foreground/10">
                  <div
                    className="h-full rounded-full bg-box transition-all duration-500"
                    style={{
                      width: `${width}%`,
                    }}
                  />
                </div>
              </div>
            );
          }
        )}
      </div>
    </article>
  );
}
