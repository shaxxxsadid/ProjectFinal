'use client';
import { useRef, useState } from "react";
import { toast } from "react-hot-toast";
import { AnimatePresence, motion } from "framer-motion";
import { FaCamera } from "react-icons/fa6";
import UserAvatar from "@/app/components/ui/userAvatar";
import { UserCrudModal } from "@/app/components/ui/UserCrudModal";
import { useUserStore } from "@/app/store/userStore";
import { useRoleStore } from "@/app/store/roleStore";
import { useBusinessProfileStore } from "@/app/store/businessProfileStore";
import { UserShort } from "@/types/store.types";

export const UserDetails = () => {
  const { selectedUser, setSelectedUser, toggleUserActive, updateUser, deleteUser, uploadAvatar, avatarVersions } = useUserStore();
  const { roles } = useRoleStore();
  const { businessProfiles } = useBusinessProfileStore();
  
  const activeUser: UserShort | null = selectedUser ?? null;
  const [isModalOpen, setIsModalOpen] = useState(false);
  const avatarInputRef = useRef<HTMLInputElement>(null);
  const [avatarUploading, setAvatarUploading] = useState(false);

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !activeUser) return;
    setAvatarUploading(true);
    try {
      await uploadAvatar(activeUser._id, file);
      toast.success('Avatar updated');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to upload avatar');
    } finally {
      setAvatarUploading(false);
      if (avatarInputRef.current) avatarInputRef.current.value = '';
    }
  };

  // Плейсхолдер резервирует место в гриде, предотвращая скачки верстки
  if (!activeUser) {
    return <div className="w-full h-90 rounded-3xl border border-transparent" />;
  }

  return (
    <>
      <AnimatePresence mode="wait">
        <motion.div
          key="details-panel"
          initial={{ opacity: 0, x: 20, scale: 0.95 }}
          animate={{ opacity: 1, x: 0, scale: 1 }}
          exit={{ opacity: 0, x: 20, scale: 0.95 }}
          transition={{ type: 'spring', stiffness: 300, damping: 25 }}
          className="flex flex-col gap-5 p-6 bg-background border border-foreground/20 backdrop-blur-2xl rounded-3xl shadow-2xl w-full shrink-0 overflow-hidden"
        >
          {/* Header */}
          <div className="flex items-center justify-between border-b border-foreground/10 pb-4">
            <span className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Details</span>
            <button onClick={() => setSelectedUser(null)} className="p-1 rounded-full hover:bg-foreground/10 transition-colors text-muted-foreground hover:text-foreground">✕</button>
          </div>

          {/* Avatar & Toggle */}
          <div className="flex flex-col items-center gap-3">
            <div className="relative  group">
              <UserAvatar 
                size="xl" 
                email={activeUser.email} 
                name={activeUser.username ?? `${activeUser.firstName} ${activeUser.lastName}`} 
                avatarVersion={avatarVersions?.[activeUser.email] ?? avatarVersions?.[activeUser._id]} 
              />
              <input ref={avatarInputRef} type="file" accept="image/*" onChange={handleAvatarChange} className="hidden" />
              <button
                type="button"
                onClick={() => avatarInputRef.current?.click()}
                disabled={avatarUploading}
                className="absolute inset-0 cursor-pointer flex flex-col items-center justify-center gap-1 bg-black/50 text-white rounded-full opacity-0 group-hover:opacity-100 transition-all duration-200 disabled:opacity-30"
              >
                {avatarUploading
                  ? <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  : <><FaCamera className="w-5 h-5" /><span className="text-[10px] font-medium">Change</span></>
                }
              </button>
            </div>

            <div className="text-center">
              <h3 className="font-bold text-lg truncate">{activeUser.username ?? `${activeUser.firstName} ${activeUser.lastName}`}</h3>
              <p className="text-xs text-muted-foreground mt-1 truncate">{activeUser.email}</p>
            </div>

            <div className="flex items-center gap-3">
              <span className={`text-xs font-medium ${activeUser.isActive ? 'text-emerald-500' : 'text-slate-500'}`}>
                {activeUser.isActive ? 'Active' : 'Inactive'}
              </span>
              <button
                onClick={() => toggleUserActive(activeUser._id)}
                className={`relative w-11 h-6 rounded-full border transition-all duration-300 ${
                  activeUser.isActive ? 'bg-emerald-500/20 border-emerald-500/30' : 'bg-foreground/5 border-foreground/20'
                }`}
              >
                <motion.span
                  layout
                  transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                  className={`absolute top-0.5 w-5 h-5 rounded-full ${activeUser.isActive ? 'bg-emerald-500 left-5' : 'bg-foreground/30 left-0.5'}`}
                />
              </button>
            </div>
          </div>

          {/* Info Fields */}
          <div className="space-y-3 pt-2">
            {[
              { label: 'Username', value: activeUser.username || '—' },
              { label: 'Full name', value: `${activeUser.firstName ?? ''} ${activeUser.lastName ?? ''}`.trim() || '—' },
              { label: 'Role', value: roles?.find(r => r._id === activeUser.roleId)?.name || '—' },
              { label: 'Business', value: businessProfiles?.find(b => b._id === activeUser.businessProfileId)?.legalName || '—' },
              { label: 'Created', value: new Date(activeUser.createdAt).toLocaleDateString('ru-RU', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) },
              { label: 'Updated', value: new Date(activeUser.updatedAt).toLocaleDateString('ru-RU', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) },
            ].map(({ label, value }) => (
              <div key={label} className="flex items-center justify-between gap-4 py-2.5 border-b border-foreground/5 last:border-0">
                <span className="text-xs uppercase text-muted-foreground font-bold tracking-wider shrink-0">{label}</span>
                <span className="text-sm text-right truncate font-medium" title={value}>{value}</span>
              </div>
            ))}
          </div>

          {/* Actions */}
          <div className="flex gap-2 pt-2 border-t border-foreground/10">
            <button
              onClick={() => setIsModalOpen(true)}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-xl border border-teal-500/20 text-teal-500 text-sm font-medium hover:bg-foreground/5 transition-colors duration-200"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 3.487a2.25 2.25 0 1 1 3.182 3.182L7.5 19.213l-4.5 1.125 1.125-4.5L16.862 3.487z" />
              </svg>
              Edit
            </button>
            <button
              onClick={() => { deleteUser(activeUser._id); toast.success('User deleted'); }}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-xl border border-red-500/20 text-red-500 text-sm font-medium hover:bg-red-500/10 transition-colors duration-200"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
              Delete
            </button>
          </div>
        </motion.div>
      </AnimatePresence>

      <UserCrudModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={async (data) => {
          const res = await updateUser(activeUser!._id, data);
          if (res.success) toast.success('User updated');
          else toast.error(res.error || 'Update failed');
          return res;
        }}
        mode="edit"
        initialValues={{
          username: activeUser?.username,
          firstName: activeUser?.firstName,
          lastName: activeUser?.lastName,
          email: activeUser?.email,
          roleId: activeUser?.roleId,
          businessProfileId: activeUser?.businessProfileId,
        }}
      />
    </>
  );
};