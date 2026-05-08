import { motion } from 'framer-motion'
import type { ReactNode } from 'react'

export default function CardFlip({
  flipped,
  front,
  back,
  className = '',
}: {
  flipped: boolean
  front: ReactNode
  back: ReactNode
  className?: string
}) {
  return (
    <div className={`relative ${className}`} style={{ perspective: 1400 }}>
      <motion.div
        animate={{ rotateY: flipped ? 180 : 0 }}
        transition={{ duration: 0.6, ease: [0.2, 0.8, 0.2, 1] }}
        className="relative h-full w-full"
        style={{ transformStyle: 'preserve-3d' }}
      >
        <div className="absolute inset-0" style={{ backfaceVisibility: 'hidden' }}>
          {front}
        </div>
        <div
          className="absolute inset-0"
          style={{ backfaceVisibility: 'hidden', transform: 'rotateY(180deg)' }}
        >
          {back}
        </div>
      </motion.div>
    </div>
  )
}
