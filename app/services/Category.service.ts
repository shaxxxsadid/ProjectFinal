import { AttributeDataType, CategoryAttribute, ICategory } from "@/types/dbData";
import { logger } from "../lib/logger";
import Category from "../models/Category";
import mongoose, { Types } from "mongoose";
import { Products } from "../models/Products";

// Данные для создания категории
export interface CreateCategoryDTO {                    // Data Transfer Object(DTO) - данные для передачи в категории
    code: string;                                      // Уникальный код категории
    name: string;                                      // Отображаемое имя
    description?: string;                              // Описание категории
    parent?: string | null;                            // Для иерархии (подкатегории)
    attributes: CategoryAttribute[];                   // Атрибуты для фильтрации и поиска товаров в категории
    isActive?: boolean;                                // Активна ли категория
}

// Данные для обновления категории
export interface UpdateCategoryDTO {
    code?: string;                                     // Уникальный код категории
    name?: string;                                     // Отображаемое имя
    description?: string;                              // Описание категории
    parent?: string | null;                            // Для иерархии (подкатегории)
    attributes?: CategoryAttribute[];                  // Атрибуты для фильтрации и поиска товаров в категории
    isActive?: boolean;                                // Активна ли категория
}

// Данные для фильтрации категорий
export interface CategoryFilterDTO {
    search?: string;                                     // Строка поиска по имени или коду категории
    isActive?: boolean;                                  // Активна ли категория
    parent?: string | null;                              // Для иерархии (подкатегории)
    level?: number;                                      // Уровень вложенности (1 для корневых категорий)
}

// Узел дерева категорий (для UI)
export interface CategoryTreeNode {
    _id: string;
    code: string;
    name: string;
    description?: string;
    level: number;
    icon?: string;
    isActive: boolean;
    children: CategoryTreeNode[];
    productsCount?: number;
}

/** Результат операции */
export interface CategoryServiceResult<T = any> { //eslint-disable-line
    success: boolean;
    data?: T;
    error?: string;
    code?: string;
}

// Константы для ошибок
export const CATEGORY_ERRORS = {
    NOT_FOUND: 'CATEGORY_NOT_FOUND',
    CODE_EXISTS: 'CATEGORY_CODE_EXISTS',
    HAS_CHILDREN: 'CATEGORY_HAS_CHILDREN',
    HAS_PRODUCTS: 'CATEGORY_HAS_PRODUCTS',
    INVALID_PARENT: 'CATEGORY_INVALID_PARENT',
    INVALID_ATTRIBUTE: 'CATEGORY_INVALID_ATTRIBUTE',
    VALIDATION_FAILED: 'CATEGORY_VALIDATION_FAILED',
} as const;

// Сервис для работы с категориями
class CategoryService {
    async create(dto: CreateCategoryDTO): Promise<CategoryServiceResult<ICategory>> {
        try {
            // 1. Валидация входных данных
            const validationError = this.validateCreateDTO(dto);
            if (validationError) {
                return { success: false, error: validationError, code: CATEGORY_ERRORS.VALIDATION_FAILED };
            }

            // 2. Проверка уникальности кода
            const existing = await Category.findOne({ code: dto.code.toUpperCase() });
            if (existing) {
                return {
                    success: false,
                    error: `Категория с кодом "${dto.code}" уже существует`,
                    code: CATEGORY_ERRORS.CODE_EXISTS,
                };
            }

            // 3. Определение уровня вложенности
            let level = 1;
            let parentDoc: ICategory | null = null;

            if (dto.parent) {
                parentDoc = await Category.findById(dto.parent);
                if (!parentDoc) {
                    return {
                        success: false,
                        error: 'Родительская категория не найдена',
                        code: CATEGORY_ERRORS.INVALID_PARENT,
                    };
                }
                level = parentDoc.level + 1;
            }

            // 4. Валидация атрибутов
            if (dto.attributes && dto.attributes.length > 0) {
                const attrError = this.validateAttributes(dto.attributes);
                if (attrError) {
                    return { success: false, error: attrError, code: CATEGORY_ERRORS.INVALID_ATTRIBUTE };
                }
            }

            const categoryData = {
                code: dto.code.toUpperCase(),
                name: dto.name.trim(),
                description: dto.description?.trim(),
                parent: dto.parent ? new Types.ObjectId(dto.parent) : null,
                level,
                attributes: dto.attributes || [],
                isActive: dto.isActive ?? true,
            };

            const category = await Category.create(categoryData as ICategory);

            logger.info(`Category created: ${category.code} (level: ${level})`);

            return { success: true, data: category };
        } catch (error) {
            logger.error('CategoryService.create failed', error);
            return {
                success: false,
                error: 'Ошибка при создании категории',
                code: 'CREATE_ERROR',
            };
        }
    }
    async getAll(filter: CategoryFilterDTO = {}): Promise<CategoryServiceResult<ICategory[]>> {
        try {
            const query: any = {}; //eslint-disable-line

            if (filter.search) {
                query.$or = [
                    { name: { $regex: filter.search, $options: 'i' } },
                    { code: { $regex: filter.search, $options: 'i' } },
                    { description: { $regex: filter.search, $options: 'i' } },
                ];
            }
            if (filter.isActive !== undefined) query.isActive = filter.isActive;
            if (filter.parent !== undefined) query.parent = filter.parent;
            if (filter.level !== undefined) query.level = filter.level;

            const categories = await Category.find(query)
                .populate({ path: 'parent', select: 'code name level' })
                .sort({ level: 1, name: 1 })
                .lean();

            return { success: true, data: categories };
        } catch (error) {
            logger.error('CategoryService.getAll failed', error);
            return { success: false, error: 'Ошибка при получении списка категорий', code: 'GET_ERROR' };
        }
    }


    async getByCode(code: string): Promise<CategoryServiceResult<ICategory>> {
        try {
            const category = await Category.findOne({ code: code.toUpperCase() });
            if (!category) {
                return { success: false, error: 'Категория не найдена', code: CATEGORY_ERRORS.NOT_FOUND };
            }
            return { success: true, data: category };
        } catch (error) {
            logger.error('CategoryService.getByCode failed', error);
            return { success: false, error: 'Ошибка при получении категории', code: 'GET_ERROR' };
        }
    }


    async getById(id: string): Promise<CategoryServiceResult<ICategory>> {
        try {
            const category = await Category.findById(id)
                .populate({ path: 'parent', select: 'code name level' });
            if (!category) {
                return {
                    success: false,
                    error: 'Категория не найдена',
                    code: CATEGORY_ERRORS.NOT_FOUND,
                };
            }
            return { success: true, data: category };
        } catch (error) {
            logger.error('CategoryService.getById failed', error);
            return {
                success: false,
                error: 'Ошибка при получении категории',
                code: 'GET_BY_ID_ERROR',
            };
        }
    }
    // Получение дерева категорий
    async getTree(): Promise<CategoryServiceResult<CategoryTreeNode[]>> {
        try {
            const allCategories = await Category.find({ isActive: true })
                .sort({ level: 1, name: 1 })
                .lean();

            // categoryId товара хранит полный путь [root, ..., leaf].
            // $unwind позволяет посчитать один товар на каждом уровне его ветки.
            const productsCountByCategory = await Products.aggregate([
                { $unwind: '$categoryId' },
                { $group: { _id: '$categoryId', count: { $sum: 1 } } },
            ]);

            const countMap = new Map<string, number>();
            productsCountByCategory.forEach((item) => {
                countMap.set(item._id.toString(), item.count);
            });

            // Преобразуем в узлы дерева
            const nodeMap = new Map<string, CategoryTreeNode>();
            const roots: CategoryTreeNode[] = [];

            for (const cat of allCategories) {
                const node: CategoryTreeNode = {
                    _id: cat._id.toString(),
                    code: cat.code,
                    name: cat.name,
                    description: cat.description,
                    level: cat.level,
                    isActive: cat.isActive || false,
                    children: [],
                    productsCount: countMap.get(cat._id.toString()) || 0,
                };
                nodeMap.set(node._id, node);
            }

            // Собираем дерево
            for (const cat of allCategories) {
                const node = nodeMap.get(cat._id.toString())!;
                const parentId = cat.parent?.toString();

                if (parentId && nodeMap.has(parentId)) {
                    nodeMap.get(parentId)!.children.push(node);
                } else {
                    roots.push(node);
                }
            }

            return { success: true, data: roots };
        } catch (error) {
            logger.error('CategoryService.getTree failed', error);
            return { success: false, error: 'Ошибка при построении дерева', code: 'TREE_ERROR' };
        }
    }

    async update(
        id: string,
        dto: UpdateCategoryDTO
    ): Promise<CategoryServiceResult<ICategory>> {
        try {
            if (!mongoose.Types.ObjectId.isValid(id)) {
                return { success: false, error: 'Некорректный ID', code: 'INVALID_ID' };
            }

            const category = await Category.findById(id);
            if (!category) {
                return { success: false, error: 'Категория не найдена', code: CATEGORY_ERRORS.NOT_FOUND };
            }

            if (dto.code && dto.code.toUpperCase() !== category.code) {
                const existing = await Category.findOne({ code: dto.code.toUpperCase() });
                if (existing) {
                    return {
                        success: false,
                        error: `Код "${dto.code}" уже используется`,
                        code: CATEGORY_ERRORS.CODE_EXISTS,
                    };
                }
                category.code = dto.code.toUpperCase();
            }

            let parentChanged = false;

            if ('parent' in dto) {
                const parentValue = dto.parent === '' || dto.parent === undefined ? null : dto.parent;
                const oldParentId = category.parent ? String(category.parent) : null;
                const nextParentId = parentValue ? String(parentValue) : null;
                parentChanged = oldParentId !== nextParentId;

                if (nextParentId && !mongoose.Types.ObjectId.isValid(nextParentId)) {
                    return {
                        success: false,
                        error: 'Некорректный ID родительской категории',
                        code: CATEGORY_ERRORS.INVALID_PARENT,
                    };
                }

                if (nextParentId === id) {
                    return {
                        success: false,
                        error: 'Категория не может быть родителем сама себе',
                        code: CATEGORY_ERRORS.INVALID_PARENT,
                    };
                }

                if (nextParentId && await this.wouldCreateCycle(id, nextParentId)) {
                    return {
                        success: false,
                        error: 'Нельзя назначить дочернюю категорию родителем: возникнет цикл',
                        code: CATEGORY_ERRORS.INVALID_PARENT,
                    };
                }

                if (!nextParentId) {
                    category.parent = null;
                    category.level = 1;
                } else {
                    const parent = await Category.findById(nextParentId);
                    if (!parent) {
                        return {
                            success: false,
                            error: 'Родительская категория не найдена',
                            code: CATEGORY_ERRORS.INVALID_PARENT,
                        };
                    }
                    category.parent = parent._id;
                    category.level = parent.level + 1;
                }

                category.markModified('parent');
                category.markModified('level');
            }

            if (dto.name !== undefined) category.name = dto.name.trim();
            if (dto.description !== undefined) category.description = dto.description.trim();
            if (dto.isActive !== undefined) category.isActive = dto.isActive;

            if (dto.attributes !== undefined) {
                const attrError = this.validateAttributes(dto.attributes);
                if (attrError) {
                    return { success: false, error: attrError, code: CATEGORY_ERRORS.INVALID_ATTRIBUTE };
                }
                category.attributes = dto.attributes;
                category.markModified('attributes');
            }

            // Сначала сохраняем сам узел. Model middleware дополнительно проверит
            // parent и пересчитает level как последнюю линию защиты.
            await category.save();

            if (parentChanged) {
                // Уровни всех потомков зависят от нового уровня перемещённого узла.
                await this.updateChildrenLevels(id, category.level);

                // Товары хранят полный путь категорий, поэтому при перемещении
                // ветки их categoryId необходимо перестроить.
                await this.rebuildProductCategoryPathsForSubtree(id);
            }

            logger.info(`Category updated: ${category.code}`);
            return { success: true, data: category };
        } catch (error) {
            logger.error('CategoryService.update failed', error);
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Ошибка при обновлении категории',
                code: 'UPDATE_ERROR',
            };
        }
    }

    async delete(id: string): Promise<CategoryServiceResult> {
        try {
            if (!mongoose.Types.ObjectId.isValid(id)) {
                return { success: false, error: 'Некорректный ID', code: 'INVALID_ID' };
            }

            const objectId = new Types.ObjectId(id);

            const category = await Category.findById(id);
            if (!category) {
                return { success: false, error: 'Категория не найдена', code: CATEGORY_ERRORS.NOT_FOUND };
            }

            const childrenCount = await Category.countDocuments({ parent: id } as any); //eslint-disable-line
            if (childrenCount > 0) {
                return {
                    success: false,
                    error: `Невозможно удалить категорию: есть ${childrenCount} подкатегорий`,
                    code: CATEGORY_ERRORS.HAS_CHILDREN,
                };
            }

            const productsCount = await Products.countDocuments({ categoryId: objectId });
            if (productsCount > 0) {
                return {
                    success: false,
                    error: `Невозможно удалить категорию: к ней привязано ${productsCount} товаров`,
                    code: CATEGORY_ERRORS.HAS_PRODUCTS,
                };
            }

            await Category.findByIdAndDelete(id);
            logger.info(`Category deleted: ${category.code}`);

            return { success: true };
        } catch (error) {
            logger.error('CategoryService.delete failed', error);
            return { success: false, error: 'Ошибка при удалении категории', code: 'DELETE_ERROR' };
        }
    }

    /**
   * Возвращает все атрибуты категории, включая унаследованные от родителей.
   * Атрибуты дочерней категории имеют приоритет (могут переопределять родительские).
   */
    async getInheritedAttributes(id: string): Promise<CategoryServiceResult<CategoryAttribute[]>> {
        try {
            const chain = await this.getCategoryChain(id);
            if (!chain.success || !chain.data) {
                return { success: false, error: chain.error, code: chain.code };
            }

            // Объединяем атрибуты от корня к листу (с перезаписью по имени)
            const merged = new Map<string, CategoryAttribute>();
            for (const cat of chain.data) {
                for (const attr of cat.attributes) {
                    merged.set(attr.name, attr);
                }
            }

            return { success: true, data: Array.from(merged.values()) };
        } catch (error) {
            logger.error('CategoryService.getInheritedAttributes failed', error);
            return { success: false, error: 'Ошибка при получении атрибутов', code: 'ATTR_ERROR' };
        }
    }

    async getCategoryChain(id: string): Promise<CategoryServiceResult<ICategory[]>> {
        try {
            if (!mongoose.Types.ObjectId.isValid(id)) {
                return { success: false, error: 'Некорректный ID категории', code: 'INVALID_ID' };
            }

            const chain: ICategory[] = [];
            const visited = new Set<string>();
            let currentId: string | null = id;

            while (currentId) {
                if (visited.has(currentId)) {
                    return {
                        success: false,
                        error: 'Обнаружен цикл в иерархии категорий',
                        code: CATEGORY_ERRORS.INVALID_PARENT,
                    };
                }
                visited.add(currentId);

                const cat: ICategory | null = await Category.findById(currentId);
                if (!cat) {
                    return {
                        success: false,
                        error: `Категория не найдена: ${currentId}`,
                        code: CATEGORY_ERRORS.NOT_FOUND,
                    };
                }

                chain.unshift(cat);
                currentId = cat.parent?.toString() || null;
            }

            return { success: true, data: chain };
        } catch (error) {
            logger.error('CategoryService.getCategoryChain failed', error);
            return { success: false, error: 'Ошибка при получении цепочки', code: 'CHAIN_ERROR' };
        }
    }

    /**
   * Проверяет, что значения атрибутов товара соответствуют требованиям категории.
   * Используется при создании/обновлении товара.
   */
    async validateProductAttributes(
        categoryId: string,
        productAttributes: Record<string, any> //eslint-disable-line
    ): Promise<CategoryServiceResult> {
        try {
            const result = await this.getInheritedAttributes(categoryId);
            if (!result.success || !result.data) {
                return { success: false, error: result.error, code: result.code };
            }

            const errors: string[] = [];

            for (const attr of result.data) {
                const value = productAttributes[attr.name];

                // Проверка обязательности
                if (attr.required && (value === undefined || value === null || value === '')) {
                    errors.push(`Атрибут "${attr.name}" обязателен для заполнения`);
                    continue;
                }

                if (value === undefined || value === null) continue;

                // Проверка типа
                const typeError = this.validateAttributeType(attr.type, value);
                if (typeError) {
                    errors.push(`Атрибут "${attr.name}": ${typeError}`);
                }
            }

            if (errors.length > 0) {
                return {
                    success: false,
                    error: errors.join('; '),
                    code: CATEGORY_ERRORS.INVALID_ATTRIBUTE,
                };
            }

            return { success: true };
        } catch (error) {
            logger.error('CategoryService.validateProductAttributes failed', error);
            return { success: false, error: 'Ошибка валидации атрибутов', code: 'VALIDATE_ERROR' };
        }
    }

    private validateCreateDTO(dto: CreateCategoryDTO): string | null {
        if (!dto.code || dto.code.trim().length === 0) return 'Код категории обязателен';
        if (!/^[A-Z0-9_-]+$/i.test(dto.code)) {
            return 'Код может содержать только буквы, цифры, дефис и подчеркивание';
        }
        if (dto.code.length > 50) return 'Код не может превышать 50 символов';
        if (!dto.name || dto.name.trim().length === 0) return 'Название категории обязательно';
        if (dto.name.length > 100) return 'Название не может превышать 100 символов';
        return null;
    }

    /** Валидация массива атрибутов */
    private validateAttributes(attributes: CategoryAttribute[]): string | null {
        const validTypes: AttributeDataType[] = ['number', 'string', 'boolean', 'date'];
        const names = new Set<string>();

        for (const attr of attributes) {
            if (!attr.name || attr.name.trim().length === 0) {
                return 'Название атрибута обязательно';
            }
            if (!validTypes.includes(attr.type)) {
                return `Недопустимый тип атрибута "${attr.name}": ${attr.type}`;
            }
            if (names.has(attr.name)) {
                return `Дублирующееся название атрибута: "${attr.name}"`;
            }
            names.add(attr.name);
        }
        return null;
    }
    private validateAttributeType(type: AttributeDataType, value: unknown): string | null {
        switch (type) {
            case 'number':
                if (typeof value !== 'number' || isNaN(value)) return 'ожидается число';
                break;
            case 'string':
                if (typeof value !== 'string') return 'ожидается строка';
                break;
            case 'boolean':
                if (typeof value !== 'boolean') return 'ожидается логическое значение';
                break;
            case 'date':
                if (!(value instanceof Date) && isNaN(Date.parse(value as string))) return 'ожидается дата';
                break;
        }
        return null;
    }
    /** Проверяет, не станет ли новый parent потомком самой категории. */
    private async wouldCreateCycle(categoryId: string, candidateParentId: string): Promise<boolean> {
        const visited = new Set<string>();
        let currentId: string | null = candidateParentId;

        while (currentId) {
            if (currentId === categoryId) return true;
            if (visited.has(currentId)) return true;
            visited.add(currentId);

            const current = await Category.findById(currentId)
                .select('_id parent')
                .lean() as { _id: Types.ObjectId; parent?: Types.ObjectId | null } | null;

            if (!current) return false;
            currentId = current.parent ? String(current.parent) : null;
        }

        return false;
    }

    /** Возвращает ID корня ветки и всех его потомков. */
    private async getSubtreeIds(rootId: string): Promise<string[]> {
        const result: string[] = [];
        const queue: string[] = [rootId];
        const visited = new Set<string>();

        while (queue.length > 0) {
            const currentId = queue.shift()!;
            if (visited.has(currentId)) continue;
            visited.add(currentId);
            result.push(currentId);

            const children = await Category.find(
                { parent: currentId } as any // eslint-disable-line
            )
                .select('_id')
                .lean();

            children.forEach((child) => {
                queue.push(String(child._id));
            });
        }

        return result;
    }

    /**
     * После переноса категории перестраивает categoryId товаров всей ветки.
     * Leaf берётся из последнего элемента существующего categoryId, после чего
     * путь заново строится по актуальным Category.parent.
     */
    private async rebuildProductCategoryPathsForSubtree(rootId: string): Promise<void> {
        const subtreeIds = await this.getSubtreeIds(rootId);
        const objectIds = subtreeIds.map((id) => new Types.ObjectId(id));

        const products = await Products.find({
            categoryId: { $in: objectIds },
        }).select('_id categoryId');

        for (const product of products) {
            const rawPath = Array.isArray(product.categoryId)
                ? product.categoryId
                : [product.categoryId];
            const leafId = rawPath.length > 0 ? String(rawPath[rawPath.length - 1]) : '';

            if (!leafId || !mongoose.Types.ObjectId.isValid(leafId)) {
                logger.warn(`Product ${String(product._id)} has invalid category path`);
                continue;
            }

            const chain = await this.getCategoryChain(leafId);
            if (!chain.success || !chain.data) {
                logger.warn(`Failed to rebuild category path for product ${String(product._id)}: ${chain.error}`);
                continue;
            }

            const canonicalPath = chain.data
                .map((category) => category._id)
                .filter(Boolean);

            await Products.updateOne(
                { _id: product._id },
                { $set: { categoryId: canonicalPath, updatedAt: new Date() } }
            );
        }
    }

    private async updateChildrenLevels(
        parentId: string,
        parentLevel: number,
        visited = new Set<string>()
    ): Promise<void> {
        if (visited.has(parentId)) {
            throw new Error('Category hierarchy contains a cycle');
        }
        visited.add(parentId);

        const parentObjectId = new Types.ObjectId(parentId);
        const children = await Category.find({ parent: parentObjectId } as any); // eslint-disable-line

        for (const child of children) {
            child.level = parentLevel + 1;
            await Category.updateOne(
                { _id: child._id },
                { $set: { level: child.level } }
            );
            await this.updateChildrenLevels(child._id.toString(), child.level, visited);
        }
    }

}

export const categoryService = new CategoryService();
export default CategoryService;