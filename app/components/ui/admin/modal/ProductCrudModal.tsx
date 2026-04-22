// components/providers/CrudProductModal.tsx
'use client';

import { ProductShort } from "@/types/store.types";
import { FieldConfig, FormModal } from "../../modal";

interface ProductUpdateData {
  name?: string;
  sku?: string;
  categoryId?: string;
  length?: number;
  width?: number;
  height?: number;
  weight?: number;
  loadCapacity?: number;
  isHeatTreated?: boolean;
  isIPPC_Certified?: boolean;
  avatarUrl?: string; // 👈 упрощённо: ссылка на изображение
}

interface CrudProductModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: ProductUpdateData) => Promise<{ success: boolean; error?: string }>;
  mode?: 'create' | 'edit';
  initialValues?: Partial<ProductShort>;
}

export const CrudProductModal = ({
  isOpen,
  onClose,
  onSubmit,
  mode = 'create',
  initialValues,
}: CrudProductModalProps) => {
  const fields: FieldConfig[] = [
    {
      name: 'name',
      label: 'Product name',
      type: 'text',
      required: mode === 'create',
      initialValue: initialValues?.name || '',
      placeholder: 'Enter product name',
    },
    {
      name: 'sku',
      label: 'SKU',
      type: 'text',
      required: mode === 'create',
      initialValue: initialValues?.sku || '',
      placeholder: 'e.g. PAL-EU-001',
    },
    {
      name: 'categoryId',
      label: 'Category ID',
      type: 'text',
      required: false,
      initialValue: initialValues?.categoryId || '',
      placeholder: 'Enter category ID',
    },
    {
      name: 'length',
      label: 'Length (mm)',
      type: 'number',
      required: false,
      initialValue: initialValues?.length?.toString() || '',
      placeholder: '1200',
    },
    {
      name: 'width',
      label: 'Width (mm)',
      type: 'number',
      required: false,
      initialValue: initialValues?.width?.toString() || '',
      placeholder: '800',
    },
    {
      name: 'height',
      label: 'Height (mm)',
      type: 'number',
      required: false,
      initialValue: initialValues?.height?.toString() || '',
      placeholder: '144',
    },
    {
      name: 'weight',
      label: 'Weight (kg)',
      type: 'number',
      required: false,
      initialValue: initialValues?.weight?.toString() || '',
      placeholder: '25',
    },
    {
      name: 'isHeatTreated',
      label: 'Heat treated',
      type: 'checkbox',
      required: false,
      initialValue: initialValues?.isHeatTreated ? 'true' : '',
    },
    {
      name: 'isIPPC_Certified',
      label: 'IPPC certified',
      type: 'checkbox',
      required: false,
      initialValue: initialValues?.isIPPC_Certified ? 'true' : '',
    },
    {
      name: 'avatarUrl',
      label: 'Image URL',
      type: 'text',
      required: false,
      initialValue: '', // 👈 avatar — сложный объект, упрощаем до URL
      placeholder: 'https://example.com/image.jpg',
    },
  ];

  const handleFormSubmit = async (data: Record<string, string>) => {
    // В режиме edit отправляем только заполненные поля
    const filtered = mode === 'edit'
      ? Object.fromEntries(
          Object.entries(data).filter(([, v]) => {
            // Для checkbox: 'true'/'false' — валидные значения
            if (['isHeatTreated', 'isIPPC_Certified'].includes(data.name)) {
              return true;
            }
            return v.trim() !== '';
          })
        )
      : data;

    // Конвертируем типы
    const typedData: ProductUpdateData = { ...filtered };

    // Числовые поля
    const numberFields = ['length', 'width', 'height', 'weight', 'loadCapacity'] as const;
    numberFields.forEach((field) => {
      if (filtered[field] && filtered[field].trim() !== '') {
        typedData[field] = parseFloat(filtered[field]);
      }
    });

    // Boolean поля
    if (filtered.isHeatTreated !== undefined) {
      typedData.isHeatTreated = filtered.isHeatTreated === 'true';
    }
    if (filtered.isIPPC_Certified !== undefined) {
      typedData.isIPPC_Certified = filtered.isIPPC_Certified === 'true';
    }

    return onSubmit(typedData);
  };

  return (
    <FormModal
      key={initialValues ? JSON.stringify(initialValues) : 'new'}
      isOpen={isOpen}
      onClose={onClose}
      title={mode === 'create' ? 'Create product' : 'Edit product'}
      description={
        mode === 'edit'
          ? 'Leave fields empty to keep current values'
          : 'Fill in product details'
      }
      fields={fields}
      onSubmit={handleFormSubmit}
      submitLabel={mode === 'create' ? 'Create' : 'Save changes'}
      mode={mode}
    />
  );
};