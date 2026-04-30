
import { getDashboardData } from "../actions/dashboard-actions";
import StatsCards from "../components/dashboard/StatsCrad";
import StockDistributionChart from "../components/dashboard/StokeDistributionChart";
import WarehouseStockChart from "../components/dashboard/WarehouseChart";

export default async function DashboardPage() {
  // Данные фетчатся на сервере, клиент получает готовый JSON
  const { stats, warehouseData, distributionData } = await getDashboardData();

  return (
    <main className="min-h-screen bg-gray-50 dark:bg-gray-950 p-4 md:p-6 space-y-6">
      <header className="flex items-center justify-between mb-2">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Панель управления</h1>
        <span className="text-sm text-gray-500 dark:text-gray-400">Обновлено: {new Date().toLocaleString('ru-RU')}</span>
      </header>

      <StatsCards stats={stats} />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <WarehouseStockChart data={warehouseData} />
        <StockDistributionChart data={distributionData} />
      </div>
    </main>
  );
}