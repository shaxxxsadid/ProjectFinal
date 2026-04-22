// components/roles/CrudRoleModal.tsx
'use client';

import { RoleShort } from "@/types/store.types";
import { FieldConfig, FormModal } from "../../modal";


interface RoleUpdateData {
  name?: string;
  priority?: number;
  description?: string;
}

interface CrudRoleModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: RoleUpdateData) => Promise<{ success: boolean; error?: string }>;
  mode?: 'create' | 'edit';
  initialValues?: Partial<RoleShort>;
}

export const CrudRoleModal = ({
  isOpen,
  onClose,
  onSubmit,
  mode = 'create',
  initialValues,
}: CrudRoleModalProps) => {
  const fields: FieldConfig[] = [
    {
      name: 'name',
      label: 'Role name',
      type: 'text',
      required: true,
      initialValue: initialValues?.name || '',
      placeholder: 'e.g. Admin, Manager',
    },
    {
      name: 'priority',
      label: 'Priority',
      type: 'number',
      required: mode === 'create',
      initialValue: initialValues?.priority?.toString() || '',
      placeholder: '0-100',
    },
    {
      name: 'description',
      label: 'Description',
      type: 'textarea',
      initialValue: initialValues?.description || '',
      placeholder: 'Optional role description',
    },
  ];

  const handleFormSubmit = async (data: Record<string, string>) => {
    // В режиме edit отправляем только заполненные поля
    const filtered = mode === 'edit'
      ? Object.fromEntries(Object.entries(data).filter(([, v]) => v.trim() !== ''))
      : data;

    // 🔁 Конвертируем priority в число
    const payload: RoleUpdateData = { ...filtered };
    if (payload.priority !== undefined && String(payload.priority).trim() !== '') {
      payload.priority = Number(payload.priority);
    }

    return onSubmit(payload);
  };

  return (
    <FormModal
      key={initialValues ? JSON.stringify(initialValues) : 'new'}
      isOpen={isOpen}
      onClose={onClose}
      title={mode === 'create' ? 'Create role' : 'Edit role'}
      description={mode === 'edit' ? 'Leave fields empty to keep current values' : 'Fill in role details'}
      fields={fields}
      onSubmit={handleFormSubmit}
      submitLabel={mode === 'create' ? 'Create' : 'Save changes'}
      mode={mode}
    />
  );
};