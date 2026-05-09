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
      <div className="mb-1.5 flex items-center justify-between">
        <span
          className="text-[10px] font-bold uppercase tracking-[0.12em]"
          style={{ color: '#94A3B8' }}
        >
          {label}
        </span>
        <span className="font-display text-xs font-bold tabular-nums" style={{ color }}>
          {value.toFixed(0)}
        </span>
      </div>
      {/* Progress track — fixed dark color so it reads inside the always-dark card */}
      <div
        className="relative h-1.5 overflow-hidden rounded-full"
        style={{ backgroundColor: 'rgba(255,255,255,0.08)' }}
      >
        <motion.div
          className="absolute inset-y-0 left-0 rounded-full"
          style={{
            background: `linear-gradient(90deg, ${color}88 0%, ${color} 100%)`,
            boxShadow: `0 0 8px 0 ${color}66`,
          }}
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
        />
        <div
          className="pointer-events-none absolute inset-y-0 w-px"
          style={{ left: '50%', backgroundColor: 'rgba(255,255,255,0.18)' }}
          aria-hidden
        />
      </div>
    </div>
  )
}
