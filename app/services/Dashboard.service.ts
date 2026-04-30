import { connectToDatabase } from "../lib/mongoose";
import { Products } from "../models/Products";
import { Stoke } from "../models/Stoke";
import { Users } from "../models/Users";
import { Warehouse } from "../models/Warehouse";

export class DashboardService {
  static async getStats() {
    await connectToDatabase();
    const [warehousesCount, productsCount, usersCount, stockTotal] = await Promise.all([
      Warehouse.countDocuments({ isActive: true }),
      Products.countDocuments(),
      Users.countDocuments({ isActive: true }),
      Stoke.aggregate([{ $group: { _id: null, total: { $sum: '$quantity' } } }])
    ]);

    return {
      totalWarehouses: warehousesCount,
      totalProducts: productsCount,
      activeUsers: usersCount,
      totalStock: stockTotal[0]?.total || 0
    };
  }

  static async getWarehouseStockData() {
    await connectToDatabase();

    // 🔥 Чистая агрегация: группируем по warehouseId, суммируем 3 поля
    const stockAgg = await Stoke.aggregate([
      {
        $group: {
          _id: '$warehouseId', // Группируем по строковому ID склада
          available: { $sum: { $ifNull: ['$available', 0] } },   // ✅ Свободно
          reserved: { $sum: { $ifNull: ['$reserved', 0] } },     // ✅ Занято
          quantity: { $sum: { $ifNull: ['$quantity', 0] } }      // ✅ Всего
        }
      },
      {
        $lookup: {
          from: 'Warehouse',
          localField: '_id',          // warehouseId из Stoke (String)
          foreignField: '_id',        // _id из Warehouse (ObjectId)
          as: 'warehouseInfo'
        }
      },
      {
        $addFields: {
          warehouseName: {
            $cond: [
              { $eq: [{ $size: '$warehouseInfo' }, 0] },
              { $concat: ['Склад_', { $substr: ['$_id', -4, 4] }] }, // Заглушка: Склад_1234
              { $arrayElemAt: ['$warehouseInfo.name', 0] }
            ]
          }
        }
      },
      {
        $project: {
          _id: 0,
          warehouse: '$warehouseName',
          available: 1,
          reserved: 1,
          quantity: 1
        }
      },
      { $sort: { available: -1 } }, // Сортируем по свободному месту
      { $limit: 5000 }              // Защита от перегрузки
    ]);

    // 🔥 Возвращаем ВСЕ склады (даже если имя не нашлось)
    return stockAgg.map((item: { warehouse: string; available: number; reserved: number; quantity: number }) => ({
      warehouse: item.warehouse,
      available: Math.max(0, item.available || 0),
      reserved: Math.max(0, item.reserved || 0),
      quantity: Math.max(0, item.quantity || 0)
    }));
  }

  static async getStockDistribution() {
    await connectToDatabase();
    const data = await Stoke.aggregate([
      {
        $group: {
          _id: null,
          totalAvailable: { $sum: { $ifNull: ['$available', 0] } },
          totalReserved: { $sum: { $ifNull: ['$reserved', 0] } }
        }
      }
    ]);

    const res = data[0];
    const available = res?.totalAvailable || 0;
    const reserved = res?.totalReserved || 0;

    return [
      { status: 'Свободно', value: available },
      { status: 'Занято', value: reserved }
    ];
  }
}