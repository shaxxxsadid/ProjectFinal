'use server';

import { DashboardService } from "../services/Dashboard.service";

export async function getDashboardData() {
  const [
    stats,
    warehouseData,
    distributionData,
    movementStats,
  ] = await Promise.all([
    DashboardService.getStats(),
    DashboardService.getWarehouseStockData(),
    DashboardService.getStockDistribution(),
    DashboardService.getStockMovementStats(30),
  ]);

  return {
    stats,
    warehouseData,
    distributionData,
    movementStats,
  };
}

export async function createNewsAction(formData: FormData) {
  // Логика новости тоже может жить в сервисе, если она сложная
  const title = formData.get('title');
  console.log("Сервис вызван для создания новости:", title);
  return { success: true };
}
