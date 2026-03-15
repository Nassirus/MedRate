import { useNavigate } from 'react-router-dom'
import { RatingDisplay } from './RatingStars'
import { MapPin, ChevronRight } from 'lucide-react'

export default function DoctorCard({ doctor, compact = false }) {
  const navigate = useNavigate()

  if (compact) return (
    <button onClick={() => navigate(`/doctor/${doctor.id}`)}
      className="card flex items-center gap-3 p-3 w-full text-left active:scale-[0.99] transition-transform">
      <Avatar name={doctor.full_name} size="sm" />
      <div className="flex-1 min-w-0">
        <p className="font-semibold text-[14px] text-[#1A1A1A] dark:text-[#F0F0EE] truncate">{doctor.full_name}</p>
        <p className="text-[12px] text-[#6B7280] dark:text-[#8899AA] truncate">{doctor.specialty}</p>
        <RatingDisplay value={doctor.total_rating} size={11} count={doctor.review_count} />
      </div>
      <ChevronRight size={16} className="text-[#9CA3AF] flex-shrink-0" />
    </button>
  )

  return (
    <button onClick={() => navigate(`/doctor/${doctor.id}`)}
      className="card p-4 w-full text-left active:scale-[0.99] transition-all hover:shadow-card-hover">
      <div className="flex items-start gap-3">
        <Avatar name={doctor.full_name} size="md" />
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div>
              <p className="font-semibold text-[15px] text-[#1A1A1A] dark:text-[#F0F0EE]">{doctor.full_name}</p>
              <p className="text-[13px] text-[#C8A96E] font-medium mt-0.5">{doctor.specialty}</p>
            </div>
            <div className="flex flex-col items-end">
              <div className="bg-[#1A2B4A] dark:bg-[#4A7FCC] text-white text-[13px] font-bold
                px-2.5 py-1 rounded-xl">
                {doctor.total_rating > 0 ? doctor.total_rating.toFixed(1) : '—'}
              </div>
            </div>
          </div>

          {doctor.clinics?.name && (
            <div className="flex items-center gap-1 mt-2">
              <MapPin size={12} className="text-[#9CA3AF]" />
              <span className="text-[12px] text-[#9CA3AF] truncate">{doctor.clinics.name}</span>
            </div>
          )}

          <div className="flex items-center justify-between mt-2">
            <RatingDisplay value={doctor.total_rating} size={12} showValue={false} />
            <span className="text-[12px] text-[#9CA3AF]">{doctor.review_count} отзывов</span>
          </div>
        </div>
      </div>
    </button>
  )
}

export function Avatar({ name = '', size = 'md', className = '' }) {
  const initials = name.split(' ').slice(0, 2).map(n => n[0]).join('').toUpperCase()
  const colors = [
    'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300',
    'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300',
    'bg-violet-100 text-violet-700 dark:bg-violet-900/40 dark:text-violet-300',
    'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300',
    'bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-300',
  ]
  const color = colors[name.charCodeAt(0) % colors.length]

  const sizes = {
    sm: 'w-9 h-9 text-[12px]',
    md: 'w-12 h-12 text-[14px]',
    lg: 'w-16 h-16 text-[18px]',
    xl: 'w-20 h-20 text-[22px]',
  }

  return (
    <div className={`${sizes[size]} ${color} rounded-2xl flex items-center justify-center font-semibold flex-shrink-0 ${className}`}>
      {initials || '?'}
    </div>
  )
}
