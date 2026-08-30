import { connectToDatabase } from "../lib/mongoose";
import { Products } from "../models/Products";
import { Stoke } from "../models/Stoke";
import { Users } from "../models/Users";
import { Warehouse } from "../models/Warehouse";
import { StockMovements } from "../models/StockMovement";

export class DashboardService {
  static async getStats() {
    await connectToDatabase();

    const [warehousesCount, productsCount, usersCount, stockTotal] =
      await Promise.all([
        Warehouse.countDocuments({ isActive: true }),
        Products.countDocuments(),
        Users.countDocuments({ isActive: true }),
        Stoke.aggregate([
          {
            $group: {
              _id: null,
              total: { $sum: { $ifNull: ['$quantity', 0] } }
            }
          }
        ])
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

    const stockAgg = await Stoke.aggregate([
      // В старых данных warehouseId может встречаться и как String,
      // и как ObjectId. Сначала приводим оба варианта к одной строке,
      // иначе MongoDB создаст две разные группы для одного склада.
      {
        $addFields: {
          normalizedWarehouseId: {
            $cond: [
              { $eq: ['$warehouseId', null] },
              null,
              { $toString: '$warehouseId' }
            ]
          }
        }
      },

      {
        $group: {
          _id: '$normalizedWarehouseId',
          available: { $sum: { $ifNull: ['$available', 0] } },
          reserved: { $sum: { $ifNull: ['$reserved', 0] } },
          quantity: { $sum: { $ifNull: ['$quantity', 0] } }
        }
      },

      // После группировки переводим нормализованный String обратно
      // в ObjectId для сопоставления с Warehouse._id.
      {
        $addFields: {
          warehouseObjectId: {
            $convert: {
              input: '$_id',
              to: 'objectId',
              onError: null,
              onNull: null
            }
          }
        }
      },

      {
        $lookup: {
          from: Warehouse.collection.name,
          localField: 'warehouseObjectId',
          foreignField: '_id',
          as: 'warehouseInfo'
        }
      },

      {
        $addFields: {
          warehouseName: {
            $cond: [
              { $gt: [{ $size: '$warehouseInfo' }, 0] },
              { $arrayElemAt: ['$warehouseInfo.name', 0] },

              // Если ссылка битая/склад удалён — Dashboard не падает,
              // а показывает понятную заглушку с исходным warehouseId.
              {
                $cond: [
                  {
                    $and: [
                      { $ne: ['$_id', null] },
                      { $ne: [{ $toString: '$_id' }, ''] }
                    ]
                  },
                  {
                    $concat: [
                      'Склад без привязки (',
                      { $toString: '$_id' },
                      ')'
                    ]
                  },
                  'Склад без привязки'
                ]
              }
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

      { $sort: { available: -1 } },
      { $limit: 5000 }
    ]);

    return stockAgg.map(
      (item: {
        warehouse: string;
        available: number;
        reserved: number;
        quantity: number;
      }) => ({
        warehouse: item.warehouse,
        available: Math.max(0, item.available || 0),
        reserved: Math.max(0, item.reserved || 0),
        quantity: Math.max(0, item.quantity || 0)
      })
    );
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
  /**
   * Аналитика по StockMovement за последние periodDays дней.
   *
   * Важно:
   * operations — количество записей движения по партиям,
   * units — количество единиц, затронутых этими записями.
   */
  static async getStockMovementStats(
    periodDays = 30
  ) {
    await connectToDatabase();

    const safePeriodDays = Math.min(
      Math.max(
        Number.isFinite(periodDays)
          ? Math.floor(periodDays)
          : 30,
        1
      ),
      365
    );

    const periodStart = new Date();
    periodStart.setDate(
      periodStart.getDate() - safePeriodDays
    );

    const grouped = await StockMovements.aggregate([
      {
        $match: {
          createdAt: {
            $gte: periodStart,
          },
        },
      },
      {
        $group: {
          _id: '$type',

          operations: {
            $sum: 1,
          },

          units: {
            $sum: {
              $ifNull: ['$quantity', 0],
            },
          },

          netStockChange: {
            $sum: {
              $subtract: [
                {
                  $ifNull: [
                    '$after.quantity',
                    0,
                  ],
                },
                {
                  $ifNull: [
                    '$before.quantity',
                    0,
                  ],
                },
              ],
            },
          },

          netReservedChange: {
            $sum: {
              $subtract: [
                {
                  $ifNull: [
                    '$after.reserved',
                    0,
                  ],
                },
                {
                  $ifNull: [
                    '$before.reserved',
                    0,
                  ],
                },
              ],
            },
          },
        },
      },
    ]);

    const lastMovement =
      await StockMovements.findOne(
        {},
        {
          createdAt: 1,
        }
      )
        .sort({
          createdAt: -1,
        })
        .lean();

    const types = [
      'reservation',
      'release',
      'issue',
      'receipt',
      'adjustment',
    ] as const;

    const emptyItem = () => ({
      operations: 0,
      units: 0,
      netStockChange: 0,
      netReservedChange: 0,
    });

    const byType = {
      reservation: emptyItem(),
      release: emptyItem(),
      issue: emptyItem(),
      receipt: emptyItem(),
      adjustment: emptyItem(),
    };

    for (const item of grouped) {
      if (
        !types.includes(
          item._id
        )
      ) {
        continue;
      }

      byType[
        item._id as keyof typeof byType
      ] = {
        operations: Math.max(
          0,
          Number(item.operations) || 0
        ),
        units: Math.max(
          0,
          Number(item.units) || 0
        ),
        netStockChange:
          Number(
            item.netStockChange
          ) || 0,
        netReservedChange:
          Number(
            item.netReservedChange
          ) || 0,
      };
    }

    const totalOperations =
      Object.values(byType).reduce(
        (sum, item) =>
          sum + item.operations,
        0
      );

    const totalUnits =
      Object.values(byType).reduce(
        (sum, item) =>
          sum + item.units,
        0
      );

    const netStockChange =
      Object.values(byType).reduce(
        (sum, item) =>
          sum + item.netStockChange,
        0
      );

    const netReservedChange =
      Object.values(byType).reduce(
        (sum, item) =>
          sum +
          item.netReservedChange,
        0
      );

    return {
      periodDays: safePeriodDays,
      periodStart:
        periodStart.toISOString(),

      totalOperations,
      totalUnits,
      netStockChange,
      netReservedChange,

      lastMovementAt:
        lastMovement?.createdAt
          ? new Date(
              lastMovement.createdAt
            ).toISOString()
          : null,

      byType,
    };
  }

}
