'use client';
import { useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Pagination } from "@/app/components/ui/pagination";
import UserAvatar from "@/app/components/ui/userAvatar";
import { BusinessProfileShort } from "@/types/store.types";
import Image from "next/image";
import { useBusinessProfileStore } from "@/app/store/businessProfileStore";

const ITEMS_PER_PAGE = 6;

export const BusinessTable = () => {
    const { businessProfiles, setSelectedBusinessProfile, selectedBusinessProfile } = useBusinessProfileStore();
    const activeBusinessProfile: BusinessProfileShort | null = selectedBusinessProfile ?? null;
    const [currentPage, setCurrentPage] = useState(1);

    const totalPages = useMemo(
        () => Math.ceil((businessProfiles?.length || 0) / ITEMS_PER_PAGE),
        [businessProfiles]
    );

    const currentBusinessProfiles = useMemo(() => {
        if (!businessProfiles) return [];
        const start = (currentPage - 1) * ITEMS_PER_PAGE;
        return businessProfiles.slice(start, start + ITEMS_PER_PAGE);
    }, [businessProfiles, currentPage]);

    return (
        <div className="w-full flex flex-col gap-2">
            <div className="flex flex-col gap-2">
                <AnimatePresence mode="popLayout">
                    {currentBusinessProfiles.map((profile) => (
                        <motion.div
                            key={profile._id}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            transition={{ duration: 0.2 }}
                            onClick={() => setSelectedBusinessProfile(profile)}
                            className={`flex items-center gap-3 px-3 py-1 rounded-xl cursor-pointer border transition-all duration-200 ${activeBusinessProfile?._id === profile._id
                                ? 'bg-foreground/10 border-foreground/20'
                                : 'border-transparent hover:bg-foreground/5 hover:border-foreground/10'
                                }`}
                        >
                            {profile.avatar ? (
                                <div className="relative w-11 h-11 rounded-full overflow-hidden shrink-0">
                                    <Image
                                        fill
                                        src={profile.avatar}
                                        alt={profile.legalName}
                                        sizes="40px"
                                        className="object-cover"
                                    />
                                </div>
                            ) : (
                                <div className="flex justify-center items-center w-11 h-11">
                                    <UserAvatar name={profile.legalName} size="sm" />
                                </div>
                            )}
                            <div className="flex flex-col min-w-0">
                                <span className="font-medium truncate">{profile.legalName}</span>
                                <span className="flex items-center gap-1.5 w-fit">
                                    <span className="text-xs text-foreground/50 tracking-wide">{profile.type}</span>
                                </span>
                            </div>
                        </motion.div>
                    ))}
                </AnimatePresence>
            </div>

            {totalPages > 1 && (
                <div className="flex justify-center pt-4 border-t border-foreground/10">
                    <Pagination
                        currentPage={currentPage}
                        totalPages={totalPages}
                        onPageChange={setCurrentPage}
                    />
                </div>
            )}
        </div>
    );
};