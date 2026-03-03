import type { MotionProps, Variants, Transition  } from "motion/react";

export const buttonPresets = {
    // Пульсация кнопки
    pulse: {
        animate: {
            boxShadow: [
                "0 0 0px rgba(0,0,0,0)",
                "0 0 15px rgba(255, 255, 255, 1)",
                "0 0 0px rgba(0,0,0,0)",
            ],
        },
        transition: {
            duration: 3,
            repeat: Infinity,
            ease: "easeInOut",
        },
    } as MotionProps,
    glow: {
        whileHover: {
            boxShadow: "0 0 25px rgba(59, 130, 246, 0.6)",
            scale: 1.08,
        },
        transition: {
            type: "spring",
            stiffness: 400,
            damping: 17,
        },
    } as MotionProps,

    bouncy: {
        whileHover: { scale: 1.1, rotate: 2 },
        whileTap: { scale: 0.92, rotate: 0 },
        transition: { type: "spring", stiffness: 500, damping: 15 },
    } as MotionProps,

    themeToggle: {
        whileHover: {
            scale: 1.15,
            rotate: 10,
            boxShadow: "0 0 20px rgba(255,255,255,0.3)",
        },
        whileTap: { scale: 0.9, rotate: 0 },
        transition: { type: "spring", stiffness: 450, damping: 20, mass: 0.15 },
    } as MotionProps,

    launch: {
        whileHover: {
            scale: 1.1,
            y: -3,
            boxShadow: "0 10px 40px -10px rgba(59,130,246,0.5)",
        },
        whileTap: { scale: 0.95, y: 0 },
        transition: { type: "spring", stiffness: 400, damping: 10 },
    } as MotionProps,

    gradientGlow: {
        whileHover: {
            scale: 1.05,
            boxShadow: [
                "0 0 10px rgba(139,92,246,0.3)",
                "0 0 20px rgba(59,130,246,0.3)",
                "0 0 10px rgba(139,92,246,0.3)",
            ],
        },
        transition: {
            boxShadow: { duration: 1.5, repeat: Infinity, repeatType: "mirror" as const },
            scale: { type: "spring", stiffness: 400, damping: 17 },
        },
    } as MotionProps,
};

export const textAnimations = {
  fadeIn: {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 1, ease: [0.42, 0.97, 0.52, 1.49] },
  },
  slideUp: {
    initial: { opacity: 0, y: 40 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.6, ease: "easeOut" },
  },
  scaleIn: {
    initial: { opacity: 0, scale: 0.9 },
    animate: { opacity: 1, scale: 1 },
    transition: { duration: 0.4, ease: [0.42, 0.97, 0.52, 1.49] },
  },
  slideUpAndFade: {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.6, ease: [0.42, 0.97, 0.52, 1.49] },
  },
  slideRight: {
    initial: { opacity: 0, x: -20 },
    animate: { opacity: 1, x: 0 },
    transition: { duration: 0.6, ease: [0.42, 0.97, 0.52, 1.49] },
  },
  typing: {
    initial: { 
      width: 0, 
      opacity: 1, 
      overflow: "hidden" // Скрываем текст за пределами ширины
    },
    animate: { 
      width: "fit-content", // Или "100%", если контейнер фиксирован
      opacity: 1, 
      overflow: "hidden" 
    },
    transition: { 
      duration: 2, 
      ease: "linear" // Печать должна быть равномерной
    },
  },
} as const;

export const linkTransitions = {
  smooth: { duration: 0.3, ease: [0.42, 0.97, 0.52, 1.49] },
  spring: { type: "spring", stiffness: 400, damping: 17 },
  quick: { duration: 0.2, ease: "easeOut" },
} satisfies Record<string, Transition>;

// ✨ Пресеты анимаций для ссылок
export const linkAnimations = {
  // 🔹 Default — простое появление
  default: {
    initial: { opacity: 0, y: 0, transition: linkTransitions.smooth },
    animate: { opacity: 1, y: 0, transition: linkTransitions.smooth },
    whileHover: { y: -2, transition: linkTransitions.smooth },
    whileTap: { scale: 0.98, transition: linkTransitions.quick },
  },

  // 🔹 Fade — плавное появление
  fade: {
    initial: { opacity: 0, transition: linkTransitions.quick },
    animate: { opacity: 1, transition: linkTransitions.quick },
    whileHover: { opacity: 0.8, transition: linkTransitions.quick },
  },

  // 🔹 Slide — появление снизу
  slide: {
    initial: { opacity: 0, y: 10, transition: linkTransitions.smooth },
    animate: { opacity: 1, y: 0, transition: linkTransitions.smooth },
    whileHover: { y: -3, x: 3, transition: linkTransitions.spring },
    whileTap: { scale: 0.95, transition: linkTransitions.quick },
  },

  // 🔹 Scale — масштабирование
  scale: {
    initial: { scale: 0.9, opacity: 0, transition: linkTransitions.smooth },
    animate: { scale: 1, opacity: 1, transition: linkTransitions.smooth },
    whileHover: { scale: 1.05, transition: linkTransitions.spring },
    whileTap: { scale: 0.95, transition: linkTransitions.quick },
  },

  // 🔹 Bounce — подпрыгивание
  bounce: {
    initial: { y: -20, opacity: 0, transition: { type: "spring", stiffness: 300, damping: 15 } },
    animate: { y: 0, opacity: 1, transition: { type: "spring", stiffness: 300, damping: 15 } },
    whileHover: { y: -5, transition: linkTransitions.spring },
  },

  // 🔹 Rotate — поворот иконки
  rotate: {
    initial: { rotate: -90, opacity: 0, transition: linkTransitions.spring },
    animate: { rotate: 0, opacity: 1, transition: linkTransitions.spring },
    whileHover: { rotate: 10, transition: linkTransitions.spring },
    whileTap: { rotate: -5, transition: linkTransitions.quick },
  },

} as const satisfies Record<string, Variants>;

export type LinkAnimationPreset = keyof typeof linkAnimations;

export const horizontalWrapper = {
  left: {
    initial: { opacity: 0, x: -20 },
    animate: { opacity: 1, x: 0 },
    transition: { duration: 0.6, ease: [0.42, 0.97, 0.52, 1.49] },
  },
  right: {
    initial: { opacity: 0, x: 20 },
    animate: { opacity: 1, x: 0 },
    transition: { duration: 0.6, ease: [0.42, 0.97, 0.52, 1.49] },
  }
}