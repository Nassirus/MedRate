import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../context/AuthContext'
import { getMedicalTip } from '../../lib/gemini'
import Header from '../../components/Layout/Header'
import BottomNav from '../../components/Layout/BottomNav'
import DoctorCard from '../../components/DoctorCard'
import { RatingDisplay } from '../../components/RatingStars'
import { ChevronRight, Sparkles, Star, CalendarClock, MapPin, Stethoscope } from 'lucide-react'

const SPECIALTIES = ['Терапевт', 'Стоматолог', 'Кардиолог', 'Хирург', 'Педиатр', 'Невролог', 'Офтальмолог', 'ЛОР']

export default function Home() {
  const { profile } = useAuth()
  const navigate = useNavigate()
  const [topDoctors, setTopDoctors] = useState([])
  const [topClinics, setTopClinics] = useState([])
  const [tip, setTip] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchData()
    getMedicalTip('общее здоровье').then(setTip)
  }, [])

  async function fetchData() {
    try {
      const [{ data: docs }, { data: clinics }] = await Promise.all([
        supabase.from('doctors').select('*, clinics(name)').order('total_rating', { ascending: false }).limit(5),
        supabase.from('clinics').select('*').order('clinic_rating', { ascending: false }).limit(4)
      ])
      setTopDoctors(docs || [])
      setTopClinics(clinics || [])
    } finally {
      setLoading(false)
    }
  }

  const hour = new Date().getHours()
  const greeting = hour < 12 ? 'Доброе утро' : hour < 17 ? 'Добрый день' : 'Добрый вечер'
  const firstName = profile?.full_name?.split(' ')[1] || profile?.full_name?.split(' ')[0] || ''

  return (
    <div className="page-container">
      <Header />

      <div className="px-4 pt-4 space-y-6 animate-in">
        {/* Greeting */}
        <div>
          <p className="text-[13px] text-[#9CA3AF] dark:text-[#556070]">{greeting}</p>
          <h1 className="font-serif text-[26px] text-[#1A1A1A] dark:text-[#F0F0EE] leading-tight">
            {firstName ? `${firstName} 👋` : 'Добро пожаловать'}
          </h1>
        </div>

        {/* AI Tip */}
        {tip && (
          <div className="bg-gradient-to-br from-[#1A2B4A] to-[#2A4A7A] dark:from-[#1A2B4A] dark:to-[#0E1830]
            rounded-2xl p-4 flex items-start gap-3">
            <span className="text-2xl flex-shrink-0">{tip.icon}</span>
            <div>
              <div className="flex items-center gap-1.5 mb-1">
                <Sparkles size={12} className="text-[#C8A96E]" />
                <span className="text-[11px] font-semibold text-[#C8A96E] uppercase tracking-wider">Совет дня</span>
              </div>
              <p className="text-[13px] text-white/90 leading-relaxed">{tip.tip}</p>
            </div>
          </div>
        )}

        {/* Quick actions */}
        <div className="grid grid-cols-2 gap-3">
          {[
            { icon: Star, label: 'Рейтинг врачей', color: 'bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400', to: '/search' },
            { icon: CalendarClock, label: 'Мои записи', color: 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400', to: '/schedule' },
            { icon: MapPin, label: 'Ближайшие клиники', color: 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400', to: '/search?tab=clinics' },
            { icon: Stethoscope, label: 'Специализации', color: 'bg-violet-50 dark:bg-violet-900/20 text-violet-600 dark:text-violet-400', to: '/search' },
          ].map(({ icon: Icon, label, color, to }) => (
            <button key={label} onClick={() => navigate(to)}
              className="card p-4 flex flex-col gap-3 text-left active:scale-[0.98] transition-transform">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${color}`}>
                <Icon size={20} />
              </div>
              <span className="text-[13px] font-semibold text-[#1A1A1A] dark:text-[#F0F0EE] leading-tight">{label}</span>
            </button>
          ))}
        </div>

        {/* Specialties */}
        <div>
          <p className="section-title mb-3">Специализации</p>
          <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide -mx-4 px-4">
            {SPECIALTIES.map(s => (
              <button key={s} onClick={() => navigate(`/search?q=${s}`)}
                className="flex-shrink-0 bg-white dark:bg-[#1A2230] border border-[#E8E8E6] dark:border-[#2A3040]
                  text-[13px] font-medium text-[#1A1A1A] dark:text-[#F0F0EE] px-4 py-2 rounded-xl
                  active:scale-95 transition-transform">
                {s}
              </button>
            ))}
          </div>
        </div>

        {/* Top doctors */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <p className="section-title">Лучшие врачи</p>
            <button onClick={() => navigate('/search')} className="flex items-center gap-1 text-[13px] text-[#1A2B4A] dark:text-[#4A7FCC] font-medium">
              Все <ChevronRight size={14} />
            </button>
          </div>
          {loading ? (
            <div className="space-y-3">
              {[1, 2, 3].map(i => (
                <div key={i} className="card h-20 animate-pulse-soft bg-[#F0F0EE] dark:bg-[#2A3040]" />
              ))}
            </div>
          ) : topDoctors.length > 0 ? (
            <div className="space-y-3">
              {topDoctors.map(d => <DoctorCard key={d.id} doctor={d} />)}
            </div>
          ) : (
            <EmptyState icon="👨‍⚕️" text="Врачи появятся здесь после добавления клиниками" />
          )}
        </div>

        {/* Top clinics */}
        {topClinics.length > 0 && (
          <div>
            <div className="flex items-center justify-between mb-3">
              <p className="section-title">Клиники</p>
              <button onClick={() => navigate('/search?tab=clinics')} className="flex items-center gap-1 text-[13px] text-[#1A2B4A] dark:text-[#4A7FCC] font-medium">
                Все <ChevronRight size={14} />
              </button>
            </div>
            <div className="space-y-3">
              {topClinics.map(c => (
                <button key={c.id} onClick={() => navigate(`/clinic/${c.id}`)}
                  className="card p-4 w-full text-left flex items-center gap-3 active:scale-[0.99] transition-transform">
                  <div className="w-12 h-12 bg-gradient-to-br from-[#1A2B4A] to-[#2A4A7A] rounded-2xl flex items-center justify-center flex-shrink-0">
                    <span className="text-white font-bold text-[16px]">{c.name[0]}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-[14px] text-[#1A1A1A] dark:text-[#F0F0EE] truncate">{c.name}</p>
                    <p className="text-[12px] text-[#9CA3AF] truncate">{c.address}</p>
                    <RatingDisplay value={c.clinic_rating} size={11} count={c.review_count} />
                  </div>
                  <ChevronRight size={16} className="text-[#9CA3AF] flex-shrink-0" />
                </button>
              ))}
            </div>
          </div>
        )}
        <div className="h-4" />
      </div>

      <BottomNav />
    </div>
  )
}

function EmptyState({ icon, text }) {
  return (
    <div className="card py-10 flex flex-col items-center gap-3 text-center px-6">
      <span className="text-4xl">{icon}</span>
      <p className="text-[13px] text-[#9CA3AF]">{text}</p>
    </div>
  )
}
