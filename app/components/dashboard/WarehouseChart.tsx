'use client';

interface WarehouseStockChartProps {
  data: Array<{
    warehouse: string;
    quantity: number;
    available: number;
    reserved: number;
  }>;
}

const formatNumber = (value: number) =>
  new Intl.NumberFormat('ru-RU').format(value);

export default function WarehouseStockChart({
  data,
}: WarehouseStockChartProps) {
  if (!data?.length) {
    return (
      <div className="flex h-56 items-center justify-center text-sm text-muted-foreground">
        Нет данных по складским остаткам
      </div>
    );
  }

  const maxValue = Math.max(
    1,
    ...data.flatMap((item) => [
      Number(item.available) || 0,
      Number(item.reserved) || 0,
    ])
  );

  const scale = [100, 75, 50, 25, 0];

  return (
    <div className="pt-3">
      <div className="relative h-52">
        {/* Сетка и шкала */}
        <div className="pointer-events-none absolute inset-0 flex flex-col justify-between">
          {scale.map((percent) => (
            <div
              key={percent}
              className="flex items-center gap-2"
            >
              <span className="w-9 shrink-0 text-right text-[9px] tabular-nums text-muted-foreground">
                {formatNumber(
                  Math.round(
                    (maxValue * percent) / 100
                  )
                )}
              </span>

              <div className="h-px flex-1 bg-border/75" />
            </div>
          ))}
        </div>

        {/* Столбцы */}
        <div className="absolute bottom-0 left-11 right-0 top-0 flex items-end gap-3 px-2">
          {data.map((item) => {
            const available = Math.max(
              0,
              Number(item.available) || 0
            );

            const reserved = Math.max(
              0,
              Number(item.reserved) || 0
            );

            const availableHeight =
              (available / maxValue) * 100;

            const reservedHeight =
              (reserved / maxValue) * 100;

            return (
              <div
                key={item.warehouse}
                className="group flex h-full min-w-0 flex-1 items-end justify-center"
                title={`${item.warehouse}
Свободно: ${formatNumber(available)}
Зарезервировано: ${formatNumber(reserved)}
Всего: ${formatNumber(Number(item.quantity) || 0)}`}
              >
                <div className="flex h-full w-full max-w-16 items-end justify-center gap-1">
                  <div
                    className="min-w-2 flex-1 rounded-t-md bg-box transition-opacity duration-200 group-hover:opacity-80"
                    style={{
                      height: `${availableHeight}%`,
                    }}
                  />

                  <div
                    className="min-w-2 flex-1 rounded-t-md bg-foreground/30 transition-colors duration-200 group-hover:bg-foreground/40"
                    style={{
                      height: `${reservedHeight}%`,
                    }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Подписи складов */}
      <div className="ml-11 mt-2 flex gap-3 px-2">
        {data.map((item) => (
          <div
            key={item.warehouse}
            className="min-w-0 flex-1 text-center"
            title={item.warehouse}
          >
            <span className="mx-auto block max-w-28 truncate text-[10px] text-muted-foreground">
              {item.warehouse}
            </span>
          </div>
        ))}
      </div>

      {/* Легенда */}
      <div className="mt-3 flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-[11px] text-muted-foreground">
        <div className="flex items-center gap-2">
          <span className="h-2.5 w-2.5 rounded-sm bg-box" />
          <span>Свободно</span>
        </div>

        <div className="flex items-center gap-2">
          <span className="h-2.5 w-2.5 rounded-sm bg-foreground/30" />
          <span>Зарезервировано</span>
        </div>
      </div>
    </div>
  );
}
