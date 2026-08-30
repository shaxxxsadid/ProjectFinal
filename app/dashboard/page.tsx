import { BackgroundPaths } from "@/app/components/ui/paths";
import { getDashboardData } from "../actions/dashboard-actions";
import StatsCards from "../components/dashboard/StatsCrad";
import WarehouseStockChart from "../components/dashboard/WarehouseChart";
import StockDistributionChart from "../components/dashboard/StokeDistributionChart";
import StockMovementStats from "../components/dashboard/StockMovementStats";

const formatNumber = (value: number) =>
  new Intl.NumberFormat("ru-RU").format(value);

export default async function DashboardPage() {
  const {
    stats,
    warehouseData,
    distributionData,
    movementStats,
  } = await getDashboardData();

  const totalAvailable =
    distributionData.find(
      (item) => item.status === "Свободно"
    )?.value ?? 0;

  const totalReserved =
    distributionData.find(
      (item) => item.status === "Занято"
    )?.value ?? 0;

  const trackedStock =
    totalAvailable + totalReserved;

  const availablePercent =
    trackedStock > 0
      ? Math.round(
          (totalAvailable / trackedStock) * 100
        )
      : 0;

  const reservedPercent =
    trackedStock > 0
      ? Math.round(
          (totalReserved / trackedStock) * 100
        )
      : 0;

  const updatedAt =
    new Intl.DateTimeFormat("ru-RU", {
      dateStyle: "medium",
      timeStyle: "short",
    }).format(new Date());

  return (
    <div className="relative min-h-screen w-full overflow-hidden bg-background text-foreground">
      <BackgroundPaths className="absolute inset-0 z-0 bg-background text-foreground" />

      <main className="relative z-10 mx-auto flex min-h-screen w-[92%] max-w-7xl items-center py-8 md:py-10">
        <section className="w-full rounded-3xl bg-background/90 p-4 shadow-2xl backdrop-blur-2xl md:p-6 lg:p-8">
          <header className="flex flex-col gap-5 pb-3 md:flex-row md:items-end md:justify-between">
            <div>
              <div className="mb-2 flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-box shadow-sm" />
                <span className="text-[11px] font-semibold uppercase tracking-[0.28em] text-foreground/45">
                  Reporting · Analytics
                </span>
              </div>

              <h1 className="text-3xl font-bold tracking-tight md:text-4xl">
                Панель управления
              </h1>

              <p className="mt-2 max-w-2xl text-sm leading-relaxed text-foreground/50">
                Сводная информация по складам, товарам,
                пользователям и текущему состоянию запасов.
              </p>
            </div>

            <div className="flex items-center gap-3 rounded-2xl bg-muted/55 px-4 py-3 shadow-sm">
              <span className="relative flex h-2.5 w-2.5">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-box opacity-40" />
                <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-box" />
              </span>

              <div className="min-w-0">
                <div className="text-[10px] font-semibold uppercase tracking-widest text-foreground/35">
                  Данные актуальны
                </div>
                <div className="mt-0.5 text-xs font-medium text-foreground/70">
                  {updatedAt}
                </div>
              </div>
            </div>
          </header>

          <div className="mt-6">
            <StatsCards stats={stats} />
          </div>

          <div className="mt-7 grid grid-cols-1 items-start gap-6 xl:grid-cols-[1.55fr_1fr]">
            <article className="min-w-0 rounded-3xl bg-muted/25 p-4 shadow-sm md:p-5">
              <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <div className="mb-2 h-1 w-8 rounded-full bg-box/80" />
                  <div className="text-[10px] font-semibold uppercase tracking-[0.22em] text-box/80">
                    Warehouses
                  </div>
                  <h2 className="mt-1 text-xl font-bold">
                    Остатки по складам
                  </h2>
                  <p className="mt-1 text-xs leading-relaxed text-foreground/45">
                    Свободные и зарезервированные позиции по
                    каждому складу.
                  </p>
                </div>

                <span className="w-fit rounded-full bg-box/10 px-3 py-1 text-[10px] font-semibold uppercase tracking-wider text-box">
                  {warehouseData.length} складов
                </span>
              </div>

              <WarehouseStockChart data={warehouseData} />
            </article>

            <article className="min-w-0 rounded-3xl bg-muted/25 p-4 shadow-sm md:p-5">
              <div className="mb-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <div className="mb-2 h-1 w-8 rounded-full bg-box/80" />
                  <div className="text-[10px] font-semibold uppercase tracking-[0.22em] text-box/80">
                    Stock health
                  </div>
                  <h2 className="mt-1 text-xl font-bold">
                    Структура запасов
                  </h2>
                  <p className="mt-1 text-xs leading-relaxed text-foreground/45">
                    Доля свободных и зарезервированных
                    товарных единиц.
                  </p>
                </div>

                <span className="w-fit rounded-full bg-muted/70 px-3 py-1 text-[10px] font-semibold uppercase tracking-wider text-foreground/55">
                  {formatNumber(trackedStock)} ед.
                </span>
              </div>

              <StockDistributionChart
                data={distributionData}
              />
            </article>
          </div>

          <StockMovementStats
            data={movementStats}
          />

          <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-[1.25fr_0.75fr]">
            <article className="rounded-3xl bg-muted/25 p-5 shadow-sm">
              <div className="flex flex-col gap-1">
                <span className="text-[10px] font-semibold uppercase tracking-[0.22em] text-foreground/35">
                  Inventory status
                </span>
                <h2 className="text-lg font-bold">
                  Состояние запасов
                </h2>
              </div>

              <div className="mt-5 space-y-5">
                <div>
                  <div className="mb-2 flex items-end justify-between gap-4">
                    <div>
                      <div className="text-sm font-semibold">
                        Свободно
                      </div>
                      <div className="mt-0.5 text-xs text-foreground/40">
                        Доступно для новых заказов
                      </div>
                    </div>

                    <div className="text-right">
                      <div className="text-lg font-bold text-box">
                        {formatNumber(totalAvailable)}
                      </div>
                      <div className="text-[10px] uppercase tracking-wider text-foreground/35">
                        {availablePercent}% запасов
                      </div>
                    </div>
                  </div>

                  <div className="h-2 overflow-hidden rounded-full bg-foreground/10">
                    <div
                      className="h-full rounded-full bg-box transition-all duration-500"
                      style={{
                        width: `${availablePercent}%`,
                      }}
                    />
                  </div>
                </div>

                <div>
                  <div className="mb-2 flex items-end justify-between gap-4">
                    <div>
                      <div className="text-sm font-semibold">
                        Зарезервировано
                      </div>
                      <div className="mt-0.5 text-xs text-foreground/40">
                        Ожидает сборки или выдачи
                      </div>
                    </div>

                    <div className="text-right">
                      <div className="text-lg font-bold text-foreground/70">
                        {formatNumber(totalReserved)}
                      </div>
                      <div className="text-[10px] uppercase tracking-wider text-foreground/35">
                        {reservedPercent}% запасов
                      </div>
                    </div>
                  </div>

                  <div className="h-2 overflow-hidden rounded-full bg-foreground/10">
                    <div
                      className="h-full rounded-full bg-foreground/35 transition-all duration-500"
                      style={{
                        width: `${reservedPercent}%`,
                      }}
                    />
                  </div>
                </div>
              </div>
            </article>

            <article className="relative overflow-hidden rounded-3xl bg-box/[0.055] p-5 shadow-sm">
              <div
                aria-hidden
                className="pointer-events-none absolute -right-16 -top-16 h-44 w-44 rounded-full bg-box/10 blur-3xl"
              />

              <div className="relative">
                <span className="text-[10px] font-semibold uppercase tracking-[0.22em] text-box/75">
                  Warehouse overview
                </span>

                <h2 className="mt-1 text-lg font-bold">
                  Складской контур
                </h2>

                <p className="mt-2 text-xs leading-relaxed text-foreground/50">
                  В статистике учитываются текущие остатки
                  всех партий. Резерв уменьшает доступное
                  количество, а фактическая выдача уменьшает
                  общий складской остаток.
                </p>

                <div className="mt-5 grid grid-cols-2 gap-3">
                  <div className="rounded-2xl bg-background/65 p-3 shadow-sm">
                    <div className="text-[10px] uppercase tracking-wider text-foreground/35">
                      Активных складов
                    </div>
                    <div className="mt-1 text-2xl font-bold">
                      {formatNumber(
                        stats.totalWarehouses
                      )}
                    </div>
                  </div>

                  <div className="rounded-2xl bg-background/65 p-3 shadow-sm">
                    <div className="text-[10px] uppercase tracking-wider text-foreground/35">
                      Общий остаток
                    </div>
                    <div className="mt-1 text-2xl font-bold">
                      {formatNumber(stats.totalStock)}
                    </div>
                  </div>
                </div>
              </div>
            </article>
          </div>
        </section>
      </main>
    </div>
  );
}
