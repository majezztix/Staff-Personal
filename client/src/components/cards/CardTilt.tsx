import { motion, useMotionValue, useTransform, useSpring } from 'framer-motion'
import type { ReactNode } from 'react'
import { useRef } from 'react'

export default function CardTilt({
  children,
  intensity = 12,
  className = '',
}: {
  children: ReactNode
  intensity?: number
  className?: string
}) {
  const ref = useRef<HTMLDivElement>(null)
  const x = useMotionValue(0.5)
  const y = useMotionValue(0.5)

  const rotateX = useSpring(useTransform(y, [0, 1], [intensity, -intensity]), { stiffness: 200, damping: 20 })
  const rotateY = useSpring(useTransform(x, [0, 1], [-intensity, intensity]), { stiffness: 200, damping: 20 })
  const shineX = useTransform(x, (v) => `${v * 100}%`)
  const shineY = useTransform(y, (v) => `${v * 100}%`)
  const holoAngle = useTransform(x, [0, 1], [0, 360])

  function onMove(e: React.PointerEvent) {
    const r = ref.current?.getBoundingClientRect()
    if (!r) return
    x.set((e.clientX - r.left) / r.width)
    y.set((e.clientY - r.top) / r.height)
  }
  function onLeave() {
    x.set(0.5)
    y.set(0.5)
  }

  return (
    <motion.div
      ref={ref}
      onPointerMove={onMove}
      onPointerLeave={onLeave}
      style={{ rotateX, rotateY, transformStyle: 'preserve-3d', perspective: 1200 }}
      className={`relative ${className}`}
    >
      <div className="relative" style={{ transformStyle: 'preserve-3d' }}>
        {children}
        <motion.div
          aria-hidden
          className="pointer-events-none absolute inset-0 rounded-[inherit] mix-blend-soft-light"
          style={{
            background: useTransform(
              [shineX, shineY] as any,
              ([sx, sy]: any) =>
                `radial-gradient(circle at ${sx} ${sy}, rgba(255,255,255,0.55), transparent 45%)`
            ),
          }}
        />
        <motion.div
          aria-hidden
          className="pointer-events-none absolute inset-0 rounded-[inherit] opacity-40 mix-blend-overlay"
          style={{
            background: useTransform(
              holoAngle,
              (a) =>
                `conic-gradient(from ${a}deg at 50% 50%, #ff5e7e, #ffd166, #06d6a0, #118ab2, #8338ec, #ff5e7e)`
            ),
          }}
        />
      </div>
    </motion.div>
  )
}
