// components/Link.tsx
'use client';

import { motion } from "motion/react";
import NextLink from "next/link";
import type { LinkProps } from "next/link";
import type { HTMLMotionProps } from "motion/react";
import { linkAnimations, type LinkAnimationPreset } from "@/app/lib/motion-presets";

interface AnimatedLinkProps 
  extends Omit<HTMLMotionProps<"a">, "href" | "children">,
          Omit<LinkProps, "href"> {
  href: string;
  children?: React.ReactNode;
  className?: string;
  preset?: LinkAnimationPreset;
  newTab?: boolean;
}

export default function AnimatedLink({
  href,
  children,
  className = "",
  preset = "default",
  newTab = false,
  ...motionProps
}: AnimatedLinkProps) {
  // Получаем пресет анимации
  const animation = linkAnimations[preset];
  
  return (
    <NextLink
      href={href}
      target={newTab ? "_blank" : undefined}
      rel={newTab ? "noopener noreferrer" : undefined}
      className={className}
    >
      <motion.span
        {...animation}
        {...motionProps}
      >
        {children}
      </motion.span>
    </NextLink>
  );
}