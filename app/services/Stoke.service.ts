import { Types } from "mongoose";
import { logger } from "../lib/logger";
import { Stoke } from "../models/Stoke";
import type { StockMutationResult, StockQuantitySnapshot } from "@/types/stockMovement.types";

export interface StockReservationRequestItem {
    productId: string;
    quantity: number;
    name?: string;
}

export interface StockReservationAllocation {
    stockId: string;
    productId: string;
    warehouseId: string;
    batchNumber: string;
    quantity: number;
}

type StokeRow = {
    _id: Types.ObjectId;
    productId: string;
    warehouseId: string;
    quantity: number;
    reserved: number;
    available: number;
    batchNumber?: string;
    expiryDate?: Date | null;
    createdAt?: Date | null;
};

export class StokeReservationError extends Error {
    code: string;

    constructor(message: string, code: string) {
        super(message);
        this.name = "StokeReservationError";
        this.code = code;
    }
}

class StokeService {
    async getAllStoke() {
        try {
            return await Stoke.find();
        } catch (error) {
            logger.error(error as Error);
            throw error;
        }
    }

    async getStokeByProductId(productId: string) {
        try {
            return await Stoke.findOne({ productId });
        } catch (error) {
            logger.error(error as Error);
            throw error;
        }
    }

    async getStokeByWarehouseId(warehouseId: string) {
        try {
            return await Stoke.find({ warehouseId });
        } catch (error) {
            logger.error(error as Error);
            throw error;
        }
    }

    async createStoke(stokeData: {
        productId: string;
        warehouseId: string;
        quantity: number;
        reserved: number;
        available: number;
        batchNumber: string;
        expiryDate: Date;
    }) {
        try {
            return await Stoke.create(stokeData);
        } catch (error) {
            logger.error(error as Error);
            throw error;
        }
    }

    async updateStoke(
        _id: string,
        updateData: {
            productId?: string;
            warehouseId?: string;
            quantity?: number;
            reserved?: number;
            available?: number;
            batchNumber?: string;
            expiryDate?: Date;
        }
    ) {
        try {
            const updatedStoke = await Stoke.findByIdAndUpdate(
                _id,
                { ...updateData, updatedAt: new Date() },
                { new: true }
            );
            return updatedStoke;
        } catch (error) {
            logger.error(error as Error);
            throw error;
        }
    }

    async deleteStoke(_id: string) {
        try {
            return await Stoke.findByIdAndDelete(_id);
        } catch (error) {
            logger.error(error as Error);
            throw error;
        }
    }

    // -----------------------------------------------------------------
    // Orders / reservation logic
    // -----------------------------------------------------------------

    /**
     * FEFO:
     * 1) сначала партии с expiryDate;
     * 2) среди них — ближайший срок годности;
     * 3) бессрочные партии идут после партий со сроком;
     * 4) при равенстве — более старая партия первой.
     */
    private sortRowsFefo(rows: StokeRow[]): StokeRow[] {
        return [...rows].sort((a, b) => {
            const aExpiry =
                a.expiryDate instanceof Date
                    ? a.expiryDate.getTime()
                    : Number.POSITIVE_INFINITY;
            const bExpiry =
                b.expiryDate instanceof Date
                    ? b.expiryDate.getTime()
                    : Number.POSITIVE_INFINITY;

            if (aExpiry !== bExpiry) return aExpiry - bExpiry;

            const aCreated =
                a.createdAt instanceof Date ? a.createdAt.getTime() : 0;
            const bCreated =
                b.createdAt instanceof Date ? b.createdAt.getTime() : 0;

            return aCreated - bCreated;
        });
    }

    private normalizeAllocation(
        allocation: StockReservationAllocation
    ): StockReservationAllocation {
        return {
            stockId: String(allocation.stockId),
            productId: String(allocation.productId),
            warehouseId: String(allocation.warehouseId),
            batchNumber: String(allocation.batchNumber ?? ""),
            quantity: Number(allocation.quantity),
        };
    }

    private toSnapshot(value: {
        quantity: unknown;
        reserved: unknown;
        available: unknown;
    }): StockQuantitySnapshot {
        return {
            quantity: Number(value.quantity) || 0,
            reserved: Number(value.reserved) || 0,
            available: Number(value.available) || 0,
        };
    }

    /**
     * Возвращает ID складов, которые могут ЦЕЛИКОМ выполнить заказ
     * из текущих available-остатков.
     *
     * Проверка выполняется непосредственно по MongoDB, поэтому dropdown
     * Admin → Orders больше не зависит от persisted Zustand stokeStore.
     *
     * Правила совпадают с резервированием:
     * - available > 0;
     * - просроченные партии не участвуют;
     * - available суммируется по всем партиям одного товара на складе;
     * - склад подходит только если покрывает ВСЕ товары заказа.
     */
    async getEligibleWarehouseIds(
        items: StockReservationRequestItem[]
    ): Promise<string[]> {
        if (!Array.isArray(items) || items.length === 0) {
            return [];
        }

        // Объединяем одинаковые productId на случай, если товар
        // оказался в заказе несколькими строками.
        const requiredByProduct = new Map<string, number>();

        for (const item of items) {
            const productId = String(item.productId ?? "").trim();
            const quantity = Number(item.quantity);

            if (!Types.ObjectId.isValid(productId)) {
                throw new StokeReservationError(
                    `Некорректный productId: ${productId || "empty"}`,
                    "INVALID_PRODUCT"
                );
            }

            if (!Number.isInteger(quantity) || quantity <= 0) {
                throw new StokeReservationError(
                    "Количество для проверки склада должно быть положительным целым числом",
                    "INVALID_QUANTITY"
                );
            }

            requiredByProduct.set(
                productId,
                (requiredByProduct.get(productId) ?? 0) + quantity
            );
        }

        const productIds = Array.from(requiredByProduct.keys());

        const rows = (await Stoke.find({
            productId: { $in: productIds },
            available: { $gt: 0 },
        }).lean()) as unknown as StokeRow[];

        const now = Date.now();

        // warehouseId -> productId -> суммарный available
        const availabilityByWarehouse =
            new Map<string, Map<string, number>>();

        for (const row of rows) {
            if (
                row.expiryDate instanceof Date &&
                row.expiryDate.getTime() < now
            ) {
                continue;
            }

            const warehouseId = String(row.warehouseId ?? "").trim();
            const productId = String(row.productId ?? "").trim();
            const available = Math.max(
                0,
                Number(row.available) || 0
            );

            if (!warehouseId || !productId || available <= 0) {
                continue;
            }

            let warehouseAvailability =
                availabilityByWarehouse.get(warehouseId);

            if (!warehouseAvailability) {
                warehouseAvailability = new Map<string, number>();
                availabilityByWarehouse.set(
                    warehouseId,
                    warehouseAvailability
                );
            }

            warehouseAvailability.set(
                productId,
                (warehouseAvailability.get(productId) ?? 0) + available
            );
        }

        const eligibleWarehouseIds: string[] = [];

        for (const [
            warehouseId,
            warehouseAvailability,
        ] of availabilityByWarehouse) {
            const canFulfillEntireOrder =
                Array.from(requiredByProduct.entries()).every(
                    ([productId, requiredQuantity]) =>
                        (warehouseAvailability.get(productId) ?? 0) >=
                        requiredQuantity
                );

            if (canFulfillEntireOrder) {
                eligibleWarehouseIds.push(warehouseId);
            }
        }

        return eligibleWarehouseIds;
    }

    /**
     * Строит план резерва без изменения БД.
     * Просроченные партии не используются.
     */
    private async buildReservationPlan(
        warehouseId: string,
        items: StockReservationRequestItem[]
    ): Promise<StockReservationAllocation[]> {
        if (!warehouseId || !Types.ObjectId.isValid(warehouseId)) {
            throw new StokeReservationError(
                "Некорректный склад для резервирования",
                "INVALID_WAREHOUSE"
            );
        }

        if (!Array.isArray(items) || items.length === 0) {
            throw new StokeReservationError(
                "В заказе нет товаров для резервирования",
                "INVALID_RESERVATION_ITEMS"
            );
        }

        const now = Date.now();
        const allocations: StockReservationAllocation[] = [];

        for (const item of items) {
            const productId = String(item.productId);
            const required = Number(item.quantity);

            if (!Types.ObjectId.isValid(productId)) {
                throw new StokeReservationError(
                    `Некорректный productId: ${productId}`,
                    "INVALID_PRODUCT"
                );
            }

            if (!Number.isInteger(required) || required <= 0) {
                throw new StokeReservationError(
                    "Количество для резервирования должно быть положительным целым числом",
                    "INVALID_QUANTITY"
                );
            }

            const rows = (await Stoke.find({
                productId,
                warehouseId,
                available: { $gt: 0 },
            }).lean()) as unknown as StokeRow[];

            // Не резервируем просроченные партии.
            const usableRows = this.sortRowsFefo(
                rows.filter((row) => {
                    if (!(row.expiryDate instanceof Date)) return true;
                    return row.expiryDate.getTime() >= now;
                })
            );

            const totalAvailable = usableRows.reduce(
                (sum, row) => sum + Math.max(0, Number(row.available) || 0),
                0
            );

            if (totalAvailable < required) {
                const productLabel = item.name
                    ? `«${item.name}»`
                    : productId;

                throw new StokeReservationError(
                    `Недостаточно товара ${productLabel} на выбранном складе. Доступно: ${totalAvailable}, требуется: ${required}.`,
                    "INSUFFICIENT_STOCK"
                );
            }

            let remaining = required;

            for (const row of usableRows) {
                if (remaining <= 0) break;

                const available = Math.max(
                    0,
                    Number(row.available) || 0
                );

                if (available <= 0) continue;

                const take = Math.min(available, remaining);

                allocations.push({
                    stockId: String(row._id),
                    productId,
                    warehouseId,
                    batchNumber: String(row.batchNumber ?? ""),
                    quantity: take,
                });

                remaining -= take;
            }

            if (remaining > 0) {
                throw new StokeReservationError(
                    `Не удалось построить полный резерв для товара ${item.name ?? productId}`,
                    "RESERVATION_PLAN_FAILED"
                );
            }
        }

        return allocations;
    }

    /**
     * Резервирует товары:
     * available -= N
     * reserved  += N
     *
     * Если одна из партий изменилась конкурентным запросом,
     * уже применённые изменения откатываются.
     */
    async reserveOrderItems(
        warehouseId: string,
        items: StockReservationRequestItem[]
    ): Promise<StockMutationResult[]> {
        const plan = await this.buildReservationPlan(
            warehouseId,
            items
        );

        const applied: StockReservationAllocation[] = [];
        const mutations: StockMutationResult[] = [];

        try {
            for (const rawAllocation of plan) {
                const allocation =
                    this.normalizeAllocation(rawAllocation);

                const updated = await Stoke.findOneAndUpdate(
                    {
                        _id: allocation.stockId,
                        productId: allocation.productId,
                        warehouseId: allocation.warehouseId,
                        available: { $gte: allocation.quantity },
                        quantity: { $gte: allocation.quantity },
                    },
                    {
                        $inc: {
                            available: -allocation.quantity,
                            reserved: allocation.quantity,
                        },
                        $set: {
                            updatedAt: new Date(),
                        },
                    },
                    { new: true }
                );

                if (!updated) {
                    throw new StokeReservationError(
                        "Остатки склада изменились во время резервирования. Повторите подтверждение заказа.",
                        "STOCK_CHANGED"
                    );
                }

                const after = this.toSnapshot(updated);
                const before: StockQuantitySnapshot = {
                    quantity: after.quantity,
                    reserved:
                        after.reserved - allocation.quantity,
                    available:
                        after.available + allocation.quantity,
                };

                applied.push(allocation);

                mutations.push({
                    ...allocation,
                    before,
                    after,
                });
            }

            return mutations;
        } catch (error) {
            if (applied.length > 0) {
                await this.rollbackAppliedReservation(applied);
            }

            if (error instanceof StokeReservationError) {
                throw error;
            }

            logger.error(error as Error);
            throw new StokeReservationError(
                "Не удалось зарезервировать товар",
                "RESERVATION_FAILED"
            );
        }
    }

    /**
     * Возврат резерва при отмене:
     * reserved  -= N
     * available += N
     */
    async releaseReservationAllocations(
        allocations: StockReservationAllocation[]
    ): Promise<StockMutationResult[]> {
        const released: StockReservationAllocation[] = [];
        const mutations: StockMutationResult[] = [];

        try {
            for (const rawAllocation of allocations) {
                const allocation =
                    this.normalizeAllocation(rawAllocation);

                const updated = await Stoke.findOneAndUpdate(
                    {
                        _id: allocation.stockId,
                        productId: allocation.productId,
                        warehouseId: allocation.warehouseId,
                        reserved: { $gte: allocation.quantity },
                    },
                    {
                        $inc: {
                            reserved: -allocation.quantity,
                            available: allocation.quantity,
                        },
                        $set: {
                            updatedAt: new Date(),
                        },
                    },
                    { new: true }
                );

                if (!updated) {
                    throw new StokeReservationError(
                        `Не удалось освободить резерв партии ${allocation.batchNumber || allocation.stockId}`,
                        "RELEASE_FAILED"
                    );
                }

                const after = this.toSnapshot(updated);
                const before: StockQuantitySnapshot = {
                    quantity: after.quantity,
                    reserved:
                        after.reserved + allocation.quantity,
                    available:
                        after.available - allocation.quantity,
                };

                released.push(allocation);

                mutations.push({
                    ...allocation,
                    before,
                    after,
                });
            }

            return mutations;
        } catch (error) {
            // Возвращаем уже освобождённые позиции обратно в резерв,
            // чтобы не получить частично отменённый заказ.
            if (released.length > 0) {
                await this.restoreReservationAllocations(released);
            }

            if (error instanceof StokeReservationError) {
                throw error;
            }

            logger.error(error as Error);
            throw new StokeReservationError(
                "Не удалось освободить резерв заказа",
                "RELEASE_FAILED"
            );
        }
    }

    /**
     * Фактическая выдача / передача перевозчику:
     * quantity -= N
     * reserved -= N
     * available не меняется, потому что оно было уменьшено при резерве.
     */
    async commitReservationAllocations(
        allocations: StockReservationAllocation[]
    ): Promise<StockMutationResult[]> {
        const committed: StockReservationAllocation[] = [];
        const mutations: StockMutationResult[] = [];

        try {
            for (const rawAllocation of allocations) {
                const allocation =
                    this.normalizeAllocation(rawAllocation);

                const updated = await Stoke.findOneAndUpdate(
                    {
                        _id: allocation.stockId,
                        productId: allocation.productId,
                        warehouseId: allocation.warehouseId,
                        reserved: { $gte: allocation.quantity },
                        quantity: { $gte: allocation.quantity },
                    },
                    {
                        $inc: {
                            quantity: -allocation.quantity,
                            reserved: -allocation.quantity,
                        },
                        $set: {
                            updatedAt: new Date(),
                        },
                    },
                    { new: true }
                );

                if (!updated) {
                    throw new StokeReservationError(
                        `Не удалось списать резерв партии ${allocation.batchNumber || allocation.stockId}`,
                        "COMMIT_FAILED"
                    );
                }

                const after = this.toSnapshot(updated);
                const before: StockQuantitySnapshot = {
                    quantity:
                        after.quantity + allocation.quantity,
                    reserved:
                        after.reserved + allocation.quantity,
                    available: after.available,
                };

                committed.push(allocation);

                mutations.push({
                    ...allocation,
                    before,
                    after,
                });
            }

            return mutations;
        } catch (error) {
            // Возвращаем уже списанные позиции, чтобы операция была
            // максимально близка к атомарной даже без MongoDB replica set.
            if (committed.length > 0) {
                await this.restoreCommittedAllocations(committed);
            }

            if (error instanceof StokeReservationError) {
                throw error;
            }

            logger.error(error as Error);
            throw new StokeReservationError(
                "Не удалось списать зарезервированный товар",
                "COMMIT_FAILED"
            );
        }
    }

    /**
     * Используется Order.service как компенсация,
     * если резерв склада применился, но сохранение заказа не прошло.
     */
    async restoreReservationAllocations(
        allocations: StockReservationAllocation[]
    ): Promise<void> {
        for (const rawAllocation of [...allocations].reverse()) {
            const allocation =
                this.normalizeAllocation(rawAllocation);

            const updated = await Stoke.findOneAndUpdate(
                {
                    _id: allocation.stockId,
                    productId: allocation.productId,
                    warehouseId: allocation.warehouseId,
                    available: { $gte: allocation.quantity },
                    quantity: { $gte: allocation.quantity },
                },
                {
                    $inc: {
                        available: -allocation.quantity,
                        reserved: allocation.quantity,
                    },
                    $set: {
                        updatedAt: new Date(),
                    },
                },
                { new: true }
            );

            if (!updated) {
                logger.error(
                    new Error(
                        `Critical: failed to restore reservation for stock ${allocation.stockId}`
                    )
                );
                throw new StokeReservationError(
                    "Не удалось восстановить складской резерв после ошибки",
                    "RESERVATION_ROLLBACK_FAILED"
                );
            }
        }
    }

    /**
     * Компенсация после неудачного сохранения Order:
     * возвращает уже списанный товар обратно в quantity/reserved.
     * available не меняется.
     */
    async restoreCommittedAllocations(
        allocations: StockReservationAllocation[]
    ): Promise<void> {
        for (const rawAllocation of [...allocations].reverse()) {
            const allocation =
                this.normalizeAllocation(rawAllocation);

            const updated = await Stoke.findByIdAndUpdate(
                allocation.stockId,
                {
                    $inc: {
                        quantity: allocation.quantity,
                        reserved: allocation.quantity,
                    },
                    $set: {
                        updatedAt: new Date(),
                    },
                },
                { new: true }
            );

            if (!updated) {
                logger.error(
                    new Error(
                        `Critical: failed to restore committed stock ${allocation.stockId}`
                    )
                );
                throw new StokeReservationError(
                    "Не удалось восстановить списанный товар после ошибки",
                    "COMMIT_ROLLBACK_FAILED"
                );
            }
        }
    }

    /**
     * Внутренний откат только что применённого резерва.
     */
    private async rollbackAppliedReservation(
        allocations: StockReservationAllocation[]
    ): Promise<void> {
        for (const rawAllocation of [...allocations].reverse()) {
            const allocation =
                this.normalizeAllocation(rawAllocation);

            const updated = await Stoke.findOneAndUpdate(
                {
                    _id: allocation.stockId,
                    reserved: { $gte: allocation.quantity },
                },
                {
                    $inc: {
                        reserved: -allocation.quantity,
                        available: allocation.quantity,
                    },
                    $set: {
                        updatedAt: new Date(),
                    },
                },
                { new: true }
            );

            if (!updated) {
                logger.error(
                    new Error(
                        `Critical: failed reservation rollback for stock ${allocation.stockId}`
                    )
                );
                throw new StokeReservationError(
                    "Критическая ошибка отката складского резерва",
                    "RESERVATION_ROLLBACK_FAILED"
                );
            }
        }
    }
}

export const stokeService = new StokeService();
