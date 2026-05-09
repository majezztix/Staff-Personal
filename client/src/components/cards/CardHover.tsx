import { motion } from 'framer-motion'
import type { ReactNode } from 'react'

/**
 * CardHover — clean lift + glow hover effect.
 * Replaces the 3D parallax tilt with something subtler and more refined:
 * - 6px lift on hover with smooth ease-out-expo
 * - subtle scale (1.015) so it feels deliberate not jumpy
 * - colored glow shadow that picks up the archetype tone via CSS var
 * - tap feedback (slight scale-down) for immediate touch response
 */
export default function CardHover({
  children,
  glowColor,
  className = '',
}: {
  children: ReactNode
  glowColor?: string
  className?: string
}) {
  return (
    <motion.div
      whileHover={{ y: -6, scale: 1.015 }}
      whileTap={{ scale: 0.99 }}
      transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
      className={`relative ${className}`}
      style={
        glowColor
          ? ({ '--card-glow': `${glowColor}55` } as React.CSSProperties)
          : undefined
      }
    >
      {/* Floor glow that intensifies on hover */}
      {glowColor && (
        <motion.div
          aria-hidden
          className="pointer-events-none absolute -inset-2 -z-10 rounded-[28px] opacity-0 blur-2xl transition-opacity duration-300"
          style={{ background: `radial-gradient(closest-side, ${glowColor}40, transparent 70%)` }}
          whileHover={{ opacity: 1 }}
        />
      )}
      {children}
    </motion.div>
  )
}
