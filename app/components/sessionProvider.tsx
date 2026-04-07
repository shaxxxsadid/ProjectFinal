"use client"; // Помечаем как Client Component

import { SessionProvider } from "next-auth/react";

export function SessionProviderWrapper({
  children,
}: {
  children: React.ReactNode;
}) {
  return <SessionProvider refetchInterval={0}>{children}</SessionProvider>;
}