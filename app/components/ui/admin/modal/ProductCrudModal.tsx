// components/providers/CrudProductModal.tsx
'use client';
import { useMemo } from 'react';
import {
  ProductShort,
  ProductStorageType,
  ProductPackaging,
  ProductStorageConditions,
  ProductCertification,
  CategoryParentRef,
} from "@/types/store.types";
import { CategoryChildCreateData, FieldConfig, FormModal } from "../../modal";
import { useCategoryStore } from "@/app/store/categoryStore";

interface ProductUpdateData {
  name?: string;
  sku?: string;
  categoryId?: string[];
  price?: number;
  length?: number;
  width?: number;
  height?: number;
  weight?: number;
  loadCapacity?: number;
  volumeM3?: number;
  palletQuantity?: number;
  storageType?: ProductStorageType;
  packaging?: ProductPackaging;
  storageConditions?: ProductStorageConditions;
  isHeatTreated?: boolean;
  isIPPC_Certified?: boolean;
  expiryDate?: string;
  certifications?: ProductCertification[];
  avatarUrl?: string;
}

interface CrudProductModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: ProductUpdateData) => Promise<{ success: boolean; error?: string }>;
  mode?: 'create' | 'edit';
  initialValues?: Partial<ProductShort>;
}

const CERTIFICATION_KEYS = ['CE', 'ISO9001', 'ISO14001', 'ISO45001'] as const;
type CertificationKey = typeof CERTIFICATION_KEYS[number];

const NUMERIC_FIELDS = [
  'price', 'length', 'width', 'height', 'weight',
  'loadCapacity', 'volumeM3', 'palletQuantity',
] as const;

const BOOLEAN_FIELDS = ['isHeatTreated', 'isIPPC_Certified'] as const;

const getCategoryParentId = (parent: unknown): string | null => {
  if (!parent) return null;
  if (typeof parent === 'string') return parent;
  if (typeof parent === 'object' && '_id' in parent) {
    const id = (parent as CategoryParentRef)._id;
    return id ? String(id) : null;
  }
  return null;
};

export const CrudProductModal = ({
  isOpen, onClose, onSubmit, mode = 'create', initialValues,
}: CrudProductModalProps) => {
  const iv = initialValues;
  const { categories, createCategory } = useCategoryStore();

  /**
   * Для edit восстанавливаем полный путь до самой конкретной категории.
   * Это также поддерживает старые товары, где в categoryId мог храниться только leaf ID.
   */
  const initialCategoryIds = iv?.categoryId;

  const initialCategoryPath = useMemo(() => {
    const rawIds = initialCategoryIds
      ? (Array.isArray(initialCategoryIds) ? initialCategoryIds : [initialCategoryIds]).map(String)
      : [];

    if (rawIds.length === 0 || !categories?.length) return rawIds;

    const leafId = rawIds[rawIds.length - 1];
    const path: string[] = [];
    const visited = new Set<string>();
    let currentId: string | null = leafId;

    while (currentId && !visited.has(currentId)) {
      visited.add(currentId);
      const category = categories.find((cat) => String(cat._id) === currentId);

      if (!category) {
        // Если категория не найдена в store, не ломаем edit старого товара.
        return rawIds;
      }

      path.unshift(String(category._id));
      currentId = getCategoryParentId(category.parent);
    }

    return path.length > 0 ? path : rawIds;
  }, [initialCategoryIds, categories]);


  const handleCreateSubcategory = async (
    parentId: string,
    data: CategoryChildCreateData
  ): Promise<{ success: boolean; error?: string; id?: string }> => {
    const parentCategory = categories?.find((category) => String(category._id) === String(parentId));

    if (!parentCategory) {
      return { success: false, error: 'Родительская категория не найдена' };
    }

    const normalizedCode = data.code.trim().toUpperCase();
    const result = await createCategory({
      code: normalizedCode,
      name: data.name.trim(),
      description: '',
      parent: String(parentId),
      attributes: [],
      isActive: true,
    });

    if (!result.success) {
      return { success: false, error: result.error || 'Не удалось создать подкатегорию' };
    }

    // createCategory после POST уже обновляет categoryStore через fetchCategories().
    // Ищем созданную категорию в свежем store, потому что POST-ответ Category
    // может содержать id вместо _id, тогда как GET /api/categories возвращает _id.
    const refreshedCategories = useCategoryStore.getState().categories ?? [];
    const createdCategory = refreshedCategories.find((category) =>
      category.code.toUpperCase() === normalizedCode &&
      getCategoryParentId(category.parent) === String(parentId)
    );

    return {
      success: true,
      id: createdCategory ? String(createdCategory._id) : undefined,
    };
  };

  const certLookup = (key: CertificationKey): boolean =>
    iv?.certifications?.find((c) => c.name === key)?.value ?? false;

  /**
   * Передаём категории в FormModal плоским списком с parentValue.
   * Сам FormModal уже строит из этого последовательность Level 1 -> Level 2 -> ...
   */
  const categoryOptions = useMemo(() => {
    if (!categories || categories.length === 0) return [];

    return [...categories]
      .sort((a, b) => a.name.localeCompare(b.name))
      .map((category) => ({
        value: String(category._id),
        label: category.name,
        parentValue: getCategoryParentId(category.parent),
      }));
  }, [categories]);

  const fields: FieldConfig[] = [
    {
      name: 'avatarUrl',
      label: 'Product image',
      type: 'file',
      accept: 'image/png,image/jpeg,image/webp',
      placeholder: 'PNG, JPG or WebP up to 5MB',
      meta: { fallbackName: initialValues?.name || 'Product' },
    },
    { name: 'name', label: 'Product name', type: 'text', required: mode === 'create', initialValue: initialValues?.name || '', placeholder: 'Enter product name' },
    { name: 'sku', label: 'SKU', type: 'text', required: mode === 'create', initialValue: initialValues?.sku || '', placeholder: 'e.g. PAL-EU-001' },

    // Каскадный выбор: родитель -> Level 2 -> Level 3 -> ...
    {
      name: 'categoryId',
      label: 'Category',
      type: 'category-cascade',
      required: true,
      initialValue: initialCategoryPath.join(','),
      options: categoryOptions,
      placeholder: categories?.length ? 'Выберите категорию' : 'Нет доступных категорий',
      onCreateChild: handleCreateSubcategory,
    },

    { name: 'price', label: 'Price', type: 'number', required: mode === 'create', initialValue: iv?.price?.toString() || '', placeholder: '0', min: '0', step: '0.01' },
    {
      name: 'size',
      label: 'Size',
      type: 'group',
      gridCols: 3,
      children: [
        { name: 'width', label: 'Width (mm)', type: 'number', initialValue: initialValues?.width?.toString() || '', placeholder: '800', min: '0', step: '0.1' },
        { name: 'height', label: 'Height (mm)', type: 'number', initialValue: initialValues?.height?.toString() || '', placeholder: '144', min: '0', step: '0.1' },
        { name: 'length', label: 'Length (mm)', type: 'number', initialValue: initialValues?.length?.toString() || '', placeholder: '1200', min: '0', step: '0.1' },
      ],
    },
    { name: 'weight', label: 'Weight (kg)', type: 'number', initialValue: initialValues?.weight?.toString() || '', placeholder: '25', min: '0', step: '0.1' },
    {
      name: 'logistics',
      label: 'Logistics',
      type: 'group',
      gridCols: 3,
      children: [
        { name: 'loadCapacity', label: 'Load capacity (kg)', type: 'number', initialValue: iv?.loadCapacity?.toString() || '', placeholder: '1000', min: '0', step: '0.1' },
        { name: 'volumeM3', label: 'Volume (m³)', type: 'number', initialValue: iv?.volumeM3?.toString() || '', placeholder: '1.2', min: '0', step: '0.01' },
        { name: 'palletQuantity', label: 'Pallet quantity', type: 'number', initialValue: iv?.palletQuantity?.toString() || '', placeholder: '10', min: '0', step: '1' },
      ],
    },
    {
      name: 'storageType',
      label: 'Storage type',
      type: 'select',
      initialValue: iv?.storageType || '',
      options: [
        { value: 'сыпучие', label: 'Сыпучие' },
        { value: 'навал', label: 'Навал' },
        { value: 'настольные', label: 'Настольные' },
        { value: 'контейнеры', label: 'Контейнеры' },
      ],
    },
    {
      name: 'packaging',
      label: 'Packaging',
      type: 'group',
      gridCols: 2,
      children: [
        {
          name: 'packagingUnit', label: 'Unit', type: 'select',
          initialValue: iv?.packaging?.unit || '',
          options: [
            { value: 'шт', label: 'шт' },
            { value: 'кг', label: 'кг' },
            { value: 'м', label: 'м' },
            { value: 'паллет', label: 'паллет' },
          ],
        },
        { name: 'packagingQuantityPerUnit', label: 'Quantity per unit', type: 'number', initialValue: iv?.packaging?.quantityPerUnit?.toString() || '', placeholder: '1', min: '0', step: '1' },
      ],
    },
    {
      name: 'storageConditions',
      label: 'Storage conditions',
      type: 'group',
      gridCols: 3,
      children: [
        { name: 'temperatureMin', label: 'Temp min (°C)', type: 'number', initialValue: iv?.storageConditions?.temperatureMin?.toString() || '', placeholder: '-10', step: '0.1' },
        { name: 'temperatureMax', label: 'Temp max (°C)', type: 'number', initialValue: iv?.storageConditions?.temperatureMax?.toString() || '', placeholder: '25', step: '0.1' },
        { name: 'humidityMax', label: 'Humidity max (%)', type: 'number', initialValue: iv?.storageConditions?.humidityMax?.toString() || '', placeholder: '60', min: '0', max: '100', step: '1' },
      ],
    },
    { name: 'expiryDate', label: 'Expiry date', type: 'text', initialValue: iv?.expiryDate || '', placeholder: 'ГГГГ-ММ-ДД' },
    {
      name: 'flags',
      label: 'Certifications (legacy flags)',
      type: 'group',
      gridCols: 2,
      children: [
        { name: 'isHeatTreated', label: 'Heat treated', type: 'checkbox', initialValue: initialValues?.isHeatTreated ? 'true' : '' },
        { name: 'isIPPC_Certified', label: 'IPPC certified', type: 'checkbox', initialValue: initialValues?.isIPPC_Certified ? 'true' : '' },
      ],
    },
    {
      name: 'certifications',
      label: 'Certifications',
      type: 'group',
      gridCols: 2,
      children: CERTIFICATION_KEYS.map((key) => ({
        name: `cert_${key}`,
        label: key,
        type: 'checkbox' as const,
        initialValue: certLookup(key) ? 'true' : '',
      })),
    },
  ];

  const handleFormSubmit = async (data: Record<string, string>) => {
    const isTouchedOrFilled = (key: string) => {
      const v = data[key];
      return v !== undefined && v.trim() !== '';
    };

    const shouldInclude = (key: string) => mode === 'create' || isTouchedOrFilled(key);
    const typedData: ProductUpdateData = {};

    if (shouldInclude('name') && data.name?.trim()) typedData.name = data.name.trim();
    if (shouldInclude('sku') && data.sku?.trim()) typedData.sku = data.sku.trim();

    // category-cascade хранит выбранный путь как "level1Id,level2Id,level3Id".
    if (data.categoryId?.trim()) {
      typedData.categoryId = data.categoryId
        .split(',')
        .map((id) => id.trim())
        .filter(Boolean);
    }

    if (shouldInclude('storageType') && data.storageType?.trim()) {
      typedData.storageType = data.storageType.trim() as ProductUpdateData['storageType'];
    }
    if (shouldInclude('expiryDate') && data.expiryDate?.trim()) typedData.expiryDate = data.expiryDate.trim();
    if (data.avatarUrl?.trim()) typedData.avatarUrl = data.avatarUrl;

    NUMERIC_FIELDS.forEach((field) => {
      if (isTouchedOrFilled(field)) {
        const parsed = parseFloat(data[field]);
        if (!Number.isNaN(parsed)) {
          typedData[field as keyof ProductUpdateData] = parsed as never;
        }
      }
    });

    BOOLEAN_FIELDS.forEach((field) => {
      if (data[field] !== undefined) {
        typedData[field as keyof ProductUpdateData] = (data[field] === 'true') as never;
      }
    });

    const packagingUnit = data.packagingUnit?.trim();
    const packagingQty = data.packagingQuantityPerUnit?.trim();
    if (packagingUnit || packagingQty) {
      typedData.packaging = {
        ...(packagingUnit ? { unit: packagingUnit as ProductPackaging['unit'] } : {}),
        ...(packagingQty ? { quantityPerUnit: parseFloat(packagingQty) } : {}),
      };
    }

    const tMin = data.temperatureMin?.trim();
    const tMax = data.temperatureMax?.trim();
    const hMax = data.humidityMax?.trim();
    if (tMin || tMax || hMax) {
      typedData.storageConditions = {
        ...(tMin ? { temperatureMin: parseFloat(tMin) } : {}),
        ...(tMax ? { temperatureMax: parseFloat(tMax) } : {}),
        ...(hMax ? { humidityMax: parseFloat(hMax) } : {}),
      };
    }

    const touchedCerts = CERTIFICATION_KEYS.filter((key) => data[`cert_${key}`] !== undefined);
    if (mode === 'create' || touchedCerts.length > 0) {
      const keysToSend = mode === 'create' ? CERTIFICATION_KEYS : touchedCerts;
      typedData.certifications = keysToSend.map((key) => ({
        name: key,
        value: data[`cert_${key}`] === 'true',
      }));
    }

    return onSubmit(typedData);
  };

  return (
    <FormModal
      key={initialValues ? JSON.stringify(initialValues) : 'new'}
      isOpen={isOpen}
      onClose={onClose}
      title={mode === 'create' ? 'Create product' : 'Edit product'}
      description={mode === 'edit' ? 'Leave fields empty to keep current values' : 'Fill in product details'}
      fields={fields}
      onSubmit={handleFormSubmit}
      submitLabel={mode === 'create' ? 'Create' : 'Save changes'}
      mode={mode}
    />
  );
};
