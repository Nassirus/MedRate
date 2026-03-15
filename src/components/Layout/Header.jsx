import { Bell, Moon, Sun, ArrowLeft } from 'lucide-react'
import { useTheme } from '../../context/ThemeContext'
import { useNavigate } from 'react-router-dom'

export default function Header({ title, back, actions, transparent }) {
  const { dark, toggle } = useTheme()
  const navigate = useNavigate()

  return (
    <header className={`sticky top-0 z-40 safe-top ${transparent ? 'bg-transparent' : 'bg-[#FAFAF9] dark:bg-[#0F1419]'} border-b border-[#E8E8E6] dark:border-[#2A3040]`}>
      <div className="flex items-center justify-between px-4 h-14">
        <div className="flex items-center gap-3">
          {back && (
            <button onClick={() => navigate(-1)}
              className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-black/5 dark:hover:bg-white/5 transition-colors">
              <ArrowLeft size={20} className="text-[#1A1A1A] dark:text-[#F0F0EE]" />
            </button>
          )}
          {title && (
            <span className="font-semibold text-[17px] text-[#1A1A1A] dark:text-[#F0F0EE]">{title}</span>
          )}
          {!title && !back && (
            <div className="flex items-center gap-2">
              <MedRateLogo size={28} />
              <span className="font-serif text-[20px] font-normal tracking-wide text-[#1A2B4A] dark:text-[#4A7FCC]">
                MedRate
              </span>
            </div>
          )}
        </div>

        <div className="flex items-center gap-1">
          {actions}
          <button onClick={toggle}
            className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-black/5 dark:hover:bg-white/5 transition-colors">
            {dark
              ? <Sun size={18} className="text-[#C8A96E]" />
              : <Moon size={18} className="text-[#6B7280]" />
            }
          </button>
          <button className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-black/5 dark:hover:bg-white/5 transition-colors relative">
            <Bell size={18} className="text-[#6B7280] dark:text-[#8899AA]" />
          </button>
        </div>
      </div>
    </header>
  )
}

// Inline SVG logo (MR monogram)
export function MedRateLogo({ size = 32, className = '' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" fill="none"
      xmlns="http://www.w3.org/2000/svg" className={className}>
      <path d="M10 85V35C10 20 20 15 30 15C38 15 44 20 50 28C56 20 62 15 70 15C80 15 90 20 90 35V85"
        stroke="currentColor" strokeWidth="6" strokeLinecap="round" fill="none"
        className="text-[#1A2B4A] dark:text-[#4A7FCC]" />
      <path d="M70 50C80 50 85 55 85 63C85 71 80 76 70 76L85 85"
        stroke="currentColor" strokeWidth="6" strokeLinecap="round" fill="none"
        className="text-[#1A2B4A] dark:text-[#4A7FCC]" />
    </svg>
  )
}
