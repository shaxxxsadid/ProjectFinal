// UserCrudModal.tsx
'use client';

import { useEffect } from 'react';
import { FieldConfig, FormModal } from "./modal";
import { useRoleStore } from '@/app/store/roleStore';
import { useBusinessProfileStore } from '@/app/store/businessProfileStore';

interface UserUpdateData {
  username?: string;
  password?: string;
  roleId?: string;
  businessProfileId?: string;
  lastName?: string;
  firstName?: string;
  email?: string;
}

interface UserCrudModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: UserUpdateData) => Promise<{ success: boolean; error?: string }>;
  mode?: 'create' | 'edit';
  initialValues?: Partial<UserUpdateData>;
}

export const UserCrudModal = ({ isOpen, onClose, onSubmit, mode = 'create', initialValues }: UserCrudModalProps) => {
  const fields: FieldConfig[] = [
    {
      name: 'firstName',
      label: 'First name',
      type: 'text',
      required: mode === 'create',
      initialValue: initialValues?.firstName || '',
    },
    {
      name: 'lastName',
      label: 'Last name',
      type: 'text',
      required: mode === 'create',
      initialValue: initialValues?.lastName || '',
    },
    {
      name: 'username',
      label: 'Username',
      type: 'text',
      required: mode === 'create',
      autoComplete: 'username',
      initialValue: initialValues?.username || '',
    },
    {
      name: 'email',
      label: 'Email',
      type: 'email',
      required: mode === 'create',
      autoComplete: 'email',
      initialValue: initialValues?.email || '',
    },
    {
      name: 'roleId',
      label: 'Role',
      type: 'select',
      initialValue: initialValues?.roleId || '',
      options: [],
    },
    {
      name: 'businessProfileId',
      label: 'Business',
      type: 'select',
      initialValue: initialValues?.businessProfileId || '',
      options: [],
    },
    {
      name: 'password',
      label: mode === 'edit' ? 'New password' : 'Password',
      type: 'password',
      required: mode === 'create',
      autoComplete: 'new-password',
      placeholder: '••••••••',
    },
  ];

  const handleFormSubmit = async (data: Record<string, string>) => {
    // фильтруем пустые поля при edit — не отправляем то что не изменили
    const filtered = mode === 'edit'
      ? Object.fromEntries(Object.entries(data).filter(([, v]) => v.trim() !== ''))
      : data;

    return onSubmit(filtered as UserUpdateData);
  };

  const { roles, fetchRoles } = useRoleStore();
  const { businessProfiles, fetchBusinessProfiles } = useBusinessProfileStore();

  useEffect(() => {
    if (!roles) fetchRoles();
    if (!businessProfiles) fetchBusinessProfiles();
  }, [roles, fetchRoles, businessProfiles, fetchBusinessProfiles]);
  const fieldsWithOptions = fields.map(f => {
    if (f.name === 'roleId') {
      return {
        ...f,
        options: (roles || []).map(r => ({
          value: r._id,
          label: r.name
        }))
      };
    }
    if (f.name === 'businessProfileId') {
      // ✅ businessProfiles теперь гарантированно массив
      const list = businessProfiles || [];
      if (list.length === 0) {
        return { ...f, options: [{ value: '', label: 'No business profiles', disabled: true }] };
      }
      return {
        ...f,
        options: list.map(b => ({
          value: b._id,
          label: b.legalName || b.profileNumber || b.taxId || b._id
        }))
      };
    }
    return f;
  });

  return (
    <FormModal
      key={initialValues ? JSON.stringify(initialValues) : 'new'}
      isOpen={isOpen}
      onClose={onClose}
      title={mode === 'create' ? 'Create user' : 'Edit user'}
      description={mode === 'edit' ? 'Leave fields empty to keep current values' : 'Fill in user details'}
      fields={fieldsWithOptions}
      onSubmit={handleFormSubmit}
      submitLabel={mode === 'create' ? 'Create' : 'Save changes'}
      mode={mode}
    />
  );
};