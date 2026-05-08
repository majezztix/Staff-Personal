import { motion } from 'framer-motion'
import clsx from 'clsx'

export default function StatBar({
  label,
  value,
  color,
  className = '',
}: {
  label: string
  value: number
  color: string
  className?: string
}) {
  const pct = Math.max(0, Math.min(100, value))
  return (
    <div className={clsx('w-full', className)}>
      <div className="mb-1 flex items-center justify-between text-[10px] font-bold uppercase tracking-widest text-ink-300">
        <span>{label}</span>
        <span style={{ color }}>{value.toFixed(0)}</span>
      </div>
      <div className="relative h-2 overflow-hidden rounded-full bg-ink-900/80 ring-1 ring-white/5">
        <motion.div
          className="absolute inset-y-0 left-0 rounded-full"
          style={{ background: `linear-gradient(90deg, ${color}aa, ${color})` }}
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.8, ease: [0.2, 0.8, 0.2, 1] }}
        />
        <div
          className="absolute inset-y-0 w-px"
          style={{ left: '50%', background: 'rgba(255,255,255,0.2)' }}
          aria-hidden
        />
      </div>
    </div>
  )
}
