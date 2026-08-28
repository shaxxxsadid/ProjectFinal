'use client';

interface StockDistributionChartProps {
  data: Array<{
    status: string;
    value: number;
  }>;
}

const formatNumber = (value: number) =>
  new Intl.NumberFormat('ru-RU').format(value);

export default function StockDistributionChart({
  data,
}: StockDistributionChartProps) {
  const totalAvailable =
    data.find(
      (item) => item.status === 'Свободно'
    )?.value ?? 0;

  const totalReserved =
    data.find(
      (item) => item.status === 'Занято'
    )?.value ?? 0;

  const total =
    totalAvailable + totalReserved;

  const availablePercent =
    total > 0
      ? Math.round(
          (totalAvailable / total) * 100
        )
      : 0;

  const reservedPercent =
    total > 0
      ? Math.round(
          (totalReserved / total) * 100
        )
      : 0;

  return (
    <div className="flex flex-col pt-3">
      <div className="flex items-center justify-center py-1">
        <div
          role="img"
          aria-label={`Свободно ${availablePercent}%, в резерве ${reservedPercent}%`}
          className="relative h-36 w-36 shrink-0 rounded-full"
          style={{
            background:
              total > 0
                ? `conic-gradient(
                    var(--box) 0% ${availablePercent}%,
                    color-mix(in oklab, var(--foreground) 30%, transparent) ${availablePercent}% 100%
                  )`
                : 'color-mix(in oklab, var(--foreground) 10%, transparent)',
          }}
        >
          <div className="absolute inset-[22%] flex items-center justify-center rounded-full border border-border bg-card">
            <div className="text-center">
              <div className="text-xl font-bold text-foreground">
                {formatNumber(total)}
              </div>

              <div className="mt-0.5 text-[9px] uppercase tracking-[0.18em] text-muted-foreground">
                единиц
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-2 grid grid-cols-2 gap-2">
        <div className="rounded-xl border border-border bg-muted/40 px-3 py-2">
          <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
            <span className="h-2.5 w-2.5 rounded-sm bg-box" />
            Свободно
          </div>

          <div className="mt-1 flex items-end justify-between gap-2">
            <span className="text-sm font-semibold text-foreground">
              {formatNumber(totalAvailable)}
            </span>

            <span className="text-[10px] text-muted-foreground">
              {availablePercent}%
            </span>
          </div>
        </div>

        <div className="rounded-xl border border-border bg-muted/40 px-3 py-2">
          <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
            <span className="h-2.5 w-2.5 rounded-sm bg-foreground/30" />
            В резерве
          </div>

          <div className="mt-1 flex items-end justify-between gap-2">
            <span className="text-sm font-semibold text-foreground">
              {formatNumber(totalReserved)}
            </span>

            <span className="text-[10px] text-muted-foreground">
              {reservedPercent}%
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
