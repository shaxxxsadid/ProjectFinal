// components/providers/CrudProductModal.tsx
'use client';

import {
  ProductShort,
  ProductStorageType,
  ProductPackaging,
  ProductStorageConditions,
  ProductCertification,
} from "@/types/store.types";
import { FieldConfig, FormModal } from "../../modal";

interface ProductUpdateData {
  name?: string;
  sku?: string;
  categoryId?: string;
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
  avatarUrl?: string; // Придёт как Base64 строка
}

interface CrudProductModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: ProductUpdateData) => Promise<{ success: boolean; error?: string }>;
  mode?: 'create' | 'edit';
  initialValues?: Partial<ProductShort>;
}

// Названия сертификатов — маппятся в схему certifications: [{ name, value }]
const CERTIFICATION_KEYS = ['CE', 'ISO9001', 'ISO14001', 'ISO45001'] as const;
type CertificationKey = typeof CERTIFICATION_KEYS[number];

// Числовые поля верхнего уровня — парсим в парсФлоат при сабмите
const NUMERIC_FIELDS = [
  'price', 'length', 'width', 'height', 'weight',
  'loadCapacity', 'volumeM3', 'palletQuantity',
] as const;

// Булевы legacy-поля верхнего уровня (не путать с certifications[])
const BOOLEAN_FIELDS = ['isHeatTreated', 'isIPPC_Certified'] as const;

export const CrudProductModal = ({
  isOpen, onClose, onSubmit, mode = 'create', initialValues,
}: CrudProductModalProps) => {
  const iv = initialValues;

  const certLookup = (key: CertificationKey): boolean =>
    iv?.certifications?.find((c) => c.name === key)?.value ?? false;

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
    { name: 'categoryId', label: 'Category ID', type: 'text', initialValue: initialValues?.categoryId || '', placeholder: 'Enter category ID' },
    { name: 'price', label: 'Price', type: 'number', required: mode === 'create', initialValue: iv?.price?.toString() || '', placeholder: '0', min: '0', step: '0.01' },

    // size width x height x length
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

    // логистика
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

    // упаковка
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

    // условия хранения
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

    // В режиме edit шлём только то, что реально заполнено/тронуто —
    // остальное остаётся нетронутым на бэкенде (см. description модалки)
    const shouldInclude = (key: string) => mode === 'create' || isTouchedOrFilled(key);

    const typedData: ProductUpdateData = {};

    if (shouldInclude('name') && data.name?.trim()) typedData.name = data.name.trim();
    if (shouldInclude('sku') && data.sku?.trim()) typedData.sku = data.sku.trim();
    if (shouldInclude('categoryId') && data.categoryId?.trim()) typedData.categoryId = data.categoryId.trim();
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

    // packaging — собираем вложенный объект, только если что-то заполнено
    const packagingUnit = data.packagingUnit?.trim();
    const packagingQty = data.packagingQuantityPerUnit?.trim();
    if (packagingUnit || packagingQty) {
      typedData.packaging = {
        ...(packagingUnit ? { unit: packagingUnit as ProductPackaging['unit'] } : {}),
        ...(packagingQty ? { quantityPerUnit: parseFloat(packagingQty) } : {}),
      };
    }

    // storageConditions — аналогично, только заполненные значения
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

    // certifications — берём только чекбоксы, которые пользователь реально тронул
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
      isOpen={isOpen} onClose={onClose}
      title={mode === 'create' ? 'Create product' : 'Edit product'}
      description={mode === 'edit' ? 'Leave fields empty to keep current values' : 'Fill in product details'}
      fields={fields} onSubmit={handleFormSubmit}
      submitLabel={mode === 'create' ? 'Create' : 'Save changes'} mode={mode}
    />
  );
};