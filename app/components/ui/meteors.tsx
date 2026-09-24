"use client"

import { useMemo } from "react"
import { cn } from "@/lib/utils"

export interface MeteorsProps {
  className?: string
  children?: React.ReactNode
  /** Number of meteors */
  count?: number
  /** Meteor angle in degrees (215 = diagonal down-left) */
  angle?: number
  /** Meteor color */
  color?: string
  /** Tail gradient color */
  tailColor?: string
}

interface MeteorData {
  id: number
  left: number
  delay: number
  duration: number
}

export function Meteors({
  className,
  children,
  count = 20,
  angle = 215,
  color = "var(--box)",
  tailColor = "var(--box)",
}: MeteorsProps) {
  const meteors = useMemo<MeteorData[]>(() => {
    const pseudoRandom = (seed: number) => {
      const value = Math.sin(seed * 12.9898) * 43758.5453
      return value - Math.floor(value)
    }

    return Array.from({ length: count }, (_, i) => ({
      id: i,
      left: i * (100 / count),
      delay: pseudoRandom(i + 1) * 5,
      duration: 3 + pseudoRandom(i + count + 17) * 7,
    }))
  }, [count])

  return (
    <div className={cn("fixed inset-0 overflow-hidden", className)}>
      {/* Keyframe animation - uses vmax for viewport scaling */}
      <style>{`
        @keyframes meteor-fall {
          0% {
            transform: rotate(${angle}deg) translateX(0);
            opacity: 1;
          }
          70% {
            opacity: 1;
          }
          100% {
            transform: rotate(${angle}deg) translateX(-100vmax);
            opacity: 0;
          }
        }
      `}</style>

      {/* Subtle gradient overlay */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background: `
            radial-gradient(ellipse at 50% 0%, color-mix(in srgb, var(--box) 12%, transparent) 0%, transparent 50%),
            radial-gradient(ellipse at 100% 100%, color-mix(in srgb, var(--box) 8%, transparent) 0%, transparent 50%)
          `,
        }}
      />

      {/* Meteors */}
      {meteors.map(meteor => (
        <span
          key={meteor.id}
          className="absolute h-0.5 w-0.5 rounded-full"
          style={{
            top: "-40px",
            left: `${meteor.left}%`,
            backgroundColor: color,
            boxShadow: "0 0 0 1px color-mix(in srgb, var(--foreground) 10%, transparent)",
            animation: `meteor-fall ${meteor.duration}s linear infinite`,
            animationDelay: `${meteor.delay}s`,
          }}
        >
          {/* Tail */}
          <span
            className="absolute top-1/2 -translate-y-1/2"
            style={{
              left: "100%",
              width: "50px",
              height: "1px",
              background: `linear-gradient(to right, ${tailColor}, transparent)`,
            }}
          />
        </span>
      ))}

      {/* Vignette */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse at center, transparent 0%, transparent 58%, color-mix(in srgb, var(--background) 65%, transparent) 100%)",
        }}
      />

      {/* Content layer */}
      {children && <div className="relative z-10 h-full w-full">{children}</div>}
    </div>
  )
}

export default function MeteorsDemo() {
  return <Meteors />
}
