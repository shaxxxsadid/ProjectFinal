// components/providers/CrudProviderModal.tsx
'use client';

import { ProviderShort } from "@/types/store.types";
import { FieldConfig, FormModal } from "../../modal";

interface ProviderUpdateData {
  displayName?: string;
  publicId?: string;
}

interface CrudProviderModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: ProviderUpdateData) => Promise<{ success: boolean; error?: string }>;
  mode?: 'create' | 'edit';
  initialValues?: Partial<ProviderShort>;
}

export const CrudProviderModal = ({
  isOpen,
  onClose,
  onSubmit,
  mode = 'create',
  initialValues,
}: CrudProviderModalProps) => {
  const fields: FieldConfig[] = [
    {
      name: 'displayName',
      label: 'Display name',
      type: 'text',
      required: mode === 'create',
      initialValue: initialValues?.displayName || '',
      placeholder: 'Enter provider name',
    },
    {
      name: 'publicId',
      label: 'Public ID',
      type: 'text',
      required: mode === 'create',
      initialValue: initialValues?.publicId || '',
      placeholder: 'unique-provider-id',
    },
  ];

  const handleFormSubmit = async (data: Record<string, string>) => {
    // В режиме edit отправляем только заполненные поля
    const filtered = mode === 'edit'
      ? Object.fromEntries(Object.entries(data).filter(([, v]) => v.trim() !== ''))
      : data;

    return onSubmit(filtered as ProviderUpdateData);
  };

  return (
    <FormModal
      key={initialValues ? JSON.stringify(initialValues) : 'new'}
      isOpen={isOpen}
      onClose={onClose}
      title={mode === 'create' ? 'Create provider' : 'Edit provider'}
      description={mode === 'edit' ? 'Leave fields empty to keep current values' : 'Fill in provider details'}
      fields={fields}
      onSubmit={handleFormSubmit}
      submitLabel={mode === 'create' ? 'Create' : 'Save changes'}
      mode={mode}
    />
  );
};