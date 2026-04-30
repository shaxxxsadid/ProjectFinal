'use server';

import { DashboardService } from "../services/Dashboard.service";
import { unstable_cache } from 'next/cache';

export async function getDashboardData() {
  // Здесь мы вызываем сервис
  const stats = await DashboardService.getStats();
  const warehouseData = await DashboardService.getWarehouseStockData();
  const distributionData = await DashboardService.getStockDistribution();

  return { stats, warehouseData, distributionData };
}

export async function createNewsAction(formData: FormData) {
  // Логика новости тоже может жить в сервисе, если она сложная
  const title = formData.get('title');
  console.log("Сервис вызван для создания новости:", title);
  return { success: true };
}