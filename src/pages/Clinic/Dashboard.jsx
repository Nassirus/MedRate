import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../context/AuthContext'
import Header from '../../components/Layout/Header'
import BottomNav from '../../components/Layout/BottomNav'
import { RatingDisplay } from '../../components/RatingStars'
import { Users, Star, QrCode, TrendingUp, AlertCircle, PlusCircle, CheckCircle } from 'lucide-react'

export default function ClinicDashboard() {
  const { user, profile } = useAuth()
  const navigate = useNavigate()
  const [clinic, setClinic] = useState(null)
  const [stats, setStats] = useState({ doctors: 0, pendingReviews: 0, totalVisits: 0, appointments: 0 })
  const [recentReviews, setRecentReviews] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (user) fetchClinicData()
  }, [user])

  async function fetchClinicData() {
    try {
      const { data: c } = await supabase.from('clinics').select('*').eq('admin_id', user.id).single()
      setClinic(c)
      if (!c) { setLoading(false); return }

      const [{ count: doctorsCount }, { count: pendingCount }, { count: visitsCount }, { count: aptsCount }, { data: reviews }] = await Promise.all([
        supabase.from('doctors').select('*', { count: 'exact', head: true }).eq('clinic_id', c.id),
        supabase.from('reviews').select('*', { count: 'exact', head: true }).in('doctor_id',
          await supabase.from('doctors').select('id').eq('clinic_id', c.id).then(r => (r.data||[]).map(d=>d.id))
        ).eq('status', 'pending'),
        supabase.from('visits').select('*', { count: 'exact', head: true }).eq('clinic_id', c.id),
        supabase.from('appointments').select('*', { count: 'exact', head: true }).eq('clinic_id', c.id),
        supabase.from('reviews').select('*, doctors(full_name), profiles(full_name)').in('doctor_id',
          await supabase.from('doctors').select('id').eq('clinic_id', c.id).then(r => (r.data||[]).map(d=>d.id))
        ).order('created_at', { ascending: false }).limit(5)
      ])

      setStats({ doctors: doctorsCount || 0, pendingReviews: pendingCount || 0, totalVisits: visitsCount || 0, appointments: aptsCount || 0 })
      setRecentReviews(reviews || [])
    } finally {
      setLoading(false)
    }
  }

  if (loading) return (
    <div className="page-container flex items-center justify-center">
      <div className="w-8 h-8 border-2 border-[#1A2B4A] border-t-transparent rounded-full animate-spin" />
    </div>
  )

  if (!clinic) return (
    <div className="page-container">
      <Header title="Дашборд" />
      <div className="px-4 pt-8 space-y-5">
        <div className="card p-6 text-center space-y-4">
          <span className="text-5xl">🏥</span>
          <h2 className="font-serif text-[22px] text-[#1A1A1A] dark:text-[#F0F0EE]">Добавьте вашу клинику</h2>
          <p className="text-[14px] text-[#9CA3AF]">Создайте профиль клиники для управления врачами и QR-кодами</p>
          <button onClick={() => navigate('/clinic/setup')} className="btn-primary w-full flex items-center justify-center gap-2">
            <PlusCircle size={18} /> Создать клинику
          </button>
        </div>
      </div>
      <BottomNav />
    </div>
  )

  return (
    <div className="page-container">
      <Header title="Дашборд" />

      <div className="px-4 pt-4 space-y-4 animate-in">
        {/* Clinic header */}
        <div className="card p-5">
          <div className="flex items-start gap-3">
            <div className="w-14 h-14 bg-gradient-to-br from-[#1A2B4A] to-[#2A4A7A] rounded-2xl flex items-center justify-center flex-shrink-0">
              <span className="text-white font-bold text-[22px]">{clinic.name[0]}</span>
            </div>
            <div className="flex-1">
              <h1 className="font-serif text-[20px] text-[#1A1A1A] dark:text-[#F0F0EE]">{clinic.name}</h1>
              <p className="text-[13px] text-[#9CA3AF]">{clinic.address}</p>
              <div className="flex items-center gap-2 mt-1">
                <RatingDisplay value={clinic.clinic_rating} count={clinic.review_count} size={12} />
                {clinic.is_verified && (
                  <span className="flex items-center gap-1 text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold">
                    <CheckCircle size={11} /> Верифицирована
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Stats grid */}
        <div className="grid grid-cols-2 gap-3">
          {[
            { icon: Users, label: 'Врачей', value: stats.doctors, color: 'text-blue-600 bg-blue-50 dark:text-blue-400 dark:bg-blue-900/20', to: '/clinic/doctors' },
            { icon: AlertCircle, label: 'Ожид. отзывов', value: stats.pendingReviews, color: 'text-amber-600 bg-amber-50 dark:text-amber-400 dark:bg-amber-900/20', to: '/clinic/reviews' },
            { icon: QrCode, label: 'Посещений', value: stats.totalVisits, color: 'text-violet-600 bg-violet-50 dark:text-violet-400 dark:bg-violet-900/20', to: '/clinic/qr' },
            { icon: Star, label: 'Рейтинг', value: clinic.clinic_rating?.toFixed(1) || '—', color: 'text-[#C8A96E] bg-amber-50 dark:bg-amber-900/20', to: '/clinic/reviews' },
          ].map(({ icon: Icon, label, value, color, to }) => (
            <button key={label} onClick={() => navigate(to)}
              className="card p-4 flex flex-col items-start gap-3 active:scale-[0.98] transition-transform text-left">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${color}`}>
                <Icon size={19} />
              </div>
              <div>
                <p className="font-bold text-[22px] text-[#1A1A1A] dark:text-[#F0F0EE]">{value}</p>
                <p className="text-[12px] text-[#9CA3AF]">{label}</p>
              </div>
            </button>
          ))}
        </div>

        {/* Quick actions */}
        <div className="grid grid-cols-2 gap-3">
          <button onClick={() => navigate('/clinic/doctors/add')}
            className="btn-primary flex items-center justify-center gap-2 text-[14px]">
            <PlusCircle size={16} /> Добавить врача
          </button>
          <button onClick={() => navigate('/clinic/qr')}
            className="btn-secondary flex items-center justify-center gap-2 text-[14px]">
            <QrCode size={16} /> QR-коды
          </button>
        </div>

        {/* Recent reviews */}
        <div>
          <p className="section-title mb-3">Последние отзывы</p>
          {recentReviews.length > 0 ? (
            <div className="space-y-3">
              {recentReviews.map(r => {
                const statusMap = {
                  pending: { cls: 'badge-pending', label: 'На проверке' },
                  human_review: { cls: 'badge-review', label: 'Ручная проверка' },
                  approved: { cls: 'badge-approved', label: 'Опубликован' },
                  rejected: { cls: 'badge-rejected', label: 'Отклонён' },
                }
                const s = statusMap[r.status] || statusMap.pending
                return (
                  <div key={r.id} className="card p-4 space-y-2">
                    <div className="flex items-center justify-between gap-2">
                      <div>
                        <p className="font-semibold text-[13px] text-[#1A1A1A] dark:text-[#F0F0EE]">
                          {r.is_anonymous ? 'Анонимный' : r.profiles?.full_name || 'Пациент'}
                        </p>
                        <p className="text-[11px] text-[#9CA3AF]">врач: {r.doctors?.full_name}</p>
                      </div>
                      <div className="flex flex-col items-end gap-1">
                        <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-lg ${s.cls}`}>{s.label}</span>
                        <span className="font-bold text-[14px] text-[#1A1A1A] dark:text-[#F0F0EE]">
                          {r.average_score?.toFixed(1) || '—'}
                        </span>
                      </div>
                    </div>
                    {r.text && <p className="text-[12px] text-[#9CA3AF] line-clamp-2">{r.text}</p>}
                    {r.ai_flags?.length > 0 && (
                      <div className="flex items-center gap-1.5">
                        <AlertCircle size={12} className="text-amber-500" />
                        <span className="text-[11px] text-amber-600 dark:text-amber-400">{r.ai_flags.join(', ')}</span>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          ) : (
            <div className="card py-8 flex flex-col items-center gap-2 text-center">
              <span className="text-3xl">💬</span>
              <p className="text-[13px] text-[#9CA3AF]">Отзывов пока нет</p>
            </div>
          )}
        </div>

        <div className="h-4" />
      </div>

      <BottomNav />
    </div>
  )
}
