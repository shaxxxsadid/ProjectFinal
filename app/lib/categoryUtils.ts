import { CategoryShort, CategoryParentRef } from '@/types/store.types';

/**
 * Возвращает массив id: сама категория + все её потомки (рекурсивно, на любую глубину).
 * Нужно для фильтра товаров по категории — чтобы выбор родителя ("Электроника")
 * находил и товары, привязанные к дочерним категориям ("Ноутбуки", "Смартфоны" и т.д.),
 * а не только товары с точным совпадением categoryId.
 */
export const getCategoryWithDescendantIds = (
    categoryId: string,
    categories: CategoryShort[]
): string[] => {
    const result = [String(categoryId)];
    const stack = [String(categoryId)];

    while (stack.length) {
        const currentId = stack.pop()!;

        categories.forEach((cat) => {
            const parentId =
                typeof cat.parent === 'string'
                    ? cat.parent
                    : cat.parent && typeof cat.parent === 'object'
                        ? (cat.parent as CategoryParentRef)._id
                        : null;

            if (parentId && String(parentId) === currentId && !result.includes(String(cat._id))) {
                result.push(String(cat._id));
                stack.push(String(cat._id));
            }
        });
    }

    return result;
};