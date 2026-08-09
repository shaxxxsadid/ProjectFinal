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
    level?: number;                                      // Уровень вложенности (0 для корневых категорий)
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
                isActive: true,
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
                .populate({ path: 'parent', select: 'code name' })
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
            const category = await Category.findById(id);
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

            // Считаем количество товаров в каждой категории
            const productsCountByCategory = await Products.aggregate([
                { $match: { isActive: true } },
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

            // Проверка уникальности нового кода
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

            // Обновление родителя и пересчёт уровня
            if (dto.parent !== undefined) {
                if (dto.parent === id) {
                    return {
                        success: false,
                        error: 'Категория не может быть родителем сама себе',
                        code: CATEGORY_ERRORS.INVALID_PARENT,
                    };
                }

                if (dto.parent === null) {
                    category.parent = null;
                    category.level = 1;
                } else {
                    const parent = await Category.findById(dto.parent);
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

                // Рекурсивно обновляем уровни всех дочерних категорий
                await this.updateChildrenLevels(id, category.level);
            }

            // Обновление остальных полей
            if (dto.name !== undefined) category.name = dto.name.trim();
            if (dto.description !== undefined) category.description = dto.description.trim();
            if (dto.isActive !== undefined) category.isActive = dto.isActive;

            if (dto.attributes !== undefined) {
                const attrError = this.validateAttributes(dto.attributes);
                if (attrError) {
                    return { success: false, error: attrError, code: CATEGORY_ERRORS.INVALID_ATTRIBUTE };
                }
                category.attributes = dto.attributes;
            }

            await category.save();
            logger.info(`Category updated: ${category.code}`);

            return { success: true, data: category };
        } catch (error) {
            logger.error('CategoryService.update failed', error);
            return { success: false, error: 'Ошибка при обновлении категории', code: 'UPDATE_ERROR' };
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
            const chain: ICategory[] = [];
            let currentId: string | null = id;

            while (currentId) {
                const cat: ICategory | null = await Category.findById(currentId);
                if (!cat) break;
                chain.unshift(cat); // Добавляем в начало, чтобы корень был первым
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
    private async updateChildrenLevels(parentId: string, parentLevel: number): Promise<void> {
        const parentObjectId = new Types.ObjectId(parentId);
        const children = await Category.find({ parent: parentObjectId } as any); //eslint-disable-line

        for (const child of children) {
            child.level = parentLevel + 1;
            await Category.updateOne(
                { _id: child._id },
                { $set: { level: child.level } }
            );
            await this.updateChildrenLevels(child._id.toString(), child.level);
        }
    }
}

export const categoryService = new CategoryService();
export default CategoryService;