import { Star } from 'lucide-react'

export function RatingDisplay({ value = 0, size = 14, showValue = true, count }) {
  const rounded = Math.round(value * 2) / 2

  return (
    <div className="flex items-center gap-1.5">
      <div className="flex items-center gap-0.5">
        {[1, 2, 3, 4, 5].map(i => (
          <Star key={i} size={size}
            className={i <= rounded ? 'star-filled fill-[#C8A96E]' : 'star-empty fill-[#E5E7EB] dark:fill-[#374151] text-[#E5E7EB] dark:text-[#374151]'}
          />
        ))}
      </div>
      {showValue && (
        <span className="text-[13px] font-semibold text-[#1A1A1A] dark:text-[#F0F0EE]">
          {value > 0 ? value.toFixed(1) : '—'}
        </span>
      )}
      {count !== undefined && (
        <span className="text-[12px] text-[#9CA3AF]">({count})</span>
      )}
    </div>
  )
}

export function RatingInput({ value, onChange, size = 32 }) {
  return (
    <div className="flex items-center gap-2">
      {[1, 2, 3, 4, 5].map(i => (
        <button key={i} type="button" onClick={() => onChange(i)}
          className="transition-transform active:scale-90">
          <Star size={size}
            className={i <= value
              ? 'star-filled fill-[#C8A96E] text-[#C8A96E]'
              : 'star-empty fill-[#E5E7EB] dark:fill-[#2A3040] text-[#E5E7EB] dark:text-[#2A3040]'
            }
          />
        </button>
      ))}
    </div>
  )
}

export function RatingBar({ label, value }) {
  const pct = (value / 5) * 100

  return (
    <div className="space-y-1.5">
      <div className="flex justify-between items-center">
        <span className="text-[13px] text-[#6B7280] dark:text-[#8899AA]">{label}</span>
        <span className="text-[13px] font-semibold text-[#1A1A1A] dark:text-[#F0F0EE]">
          {value > 0 ? value.toFixed(1) : '—'}
        </span>
      </div>
      <div className="h-1.5 bg-[#F0F0EE] dark:bg-[#2A3040] rounded-full overflow-hidden">
        <div className="h-full rounded-full bg-[#C8A96E] transition-all duration-500"
          style={{ width: `${pct}%` }} />
      </div>
    </div>
  )
}
