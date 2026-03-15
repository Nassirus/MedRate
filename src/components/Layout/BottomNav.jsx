import { Home, Search, QrCode, Clock, User, LayoutDashboard, Users, Star, ShieldCheck } from 'lucide-react'
import { NavLink } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'

const patientTabs = [
  { to: '/home', icon: Home, label: 'Главная' },
  { to: '/search', icon: Search, label: 'Поиск' },
  { to: '/scan', icon: QrCode, label: 'QR' },
  { to: '/schedule', icon: Clock, label: 'Записи' },
  { to: '/profile', icon: User, label: 'Профиль' },
]

const clinicTabs = [
  { to: '/clinic/dashboard', icon: LayoutDashboard, label: 'Дашборд' },
  { to: '/clinic/doctors', icon: Users, label: 'Врачи' },
  { to: '/clinic/qr', icon: QrCode, label: 'QR-коды' },
  { to: '/clinic/reviews', icon: Star, label: 'Отзывы' },
]

const moderatorTabs = [
  { to: '/moderation', icon: ShieldCheck, label: 'Модерация' },
]

export default function BottomNav() {
  const { profile } = useAuth()
  const role = profile?.role || 'patient'

  const tabs = role === 'clinic_admin' ? clinicTabs
    : role === 'moderator' ? moderatorTabs
    : patientTabs

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 safe-bottom
      bg-white/90 dark:bg-[#1A2230]/90 backdrop-blur-xl
      border-t border-[#E8E8E6] dark:border-[#2A3040]">
      <div className="flex items-center justify-around px-2 h-16">
        {tabs.map(({ to, icon: Icon, label }) => (
          <NavLink key={to} to={to} className={({ isActive }) =>
            `flex flex-col items-center gap-0.5 px-4 py-2 rounded-xl transition-all duration-150 min-w-[56px]
            ${isActive
              ? 'text-[#1A2B4A] dark:text-[#4A7FCC]'
              : 'text-[#9CA3AF] dark:text-[#556070]'
            }`
          }>
            {({ isActive }) => (
              <>
                {to === '/scan'
                  ? <div className={`w-12 h-12 rounded-2xl flex items-center justify-center -mt-6 shadow-lg transition-colors
                      ${isActive ? 'bg-[#1A2B4A] dark:bg-[#4A7FCC]' : 'bg-[#1A2B4A] dark:bg-[#4A7FCC]'}`}>
                      <Icon size={22} className="text-white" />
                    </div>
                  : <>
                      <div className={`w-7 h-7 flex items-center justify-center rounded-lg transition-all
                        ${isActive ? 'bg-[#EEF2F9] dark:bg-[#1A2B4A]/40' : ''}`}>
                        <Icon size={19} />
                      </div>
                      <span className="text-[10px] font-medium leading-none">{label}</span>
                    </>
                }
              </>
            )}
          </NavLink>
        ))}
      </div>
    </nav>
  )
}
