import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../context/AuthContext'
import Header from '../../components/Layout/Header'
import BottomNav from '../../components/Layout/BottomNav'
import { RatingDisplay } from '../../components/RatingStars'
import { Users, Star, QrCode, AlertCircle, PlusCircle, CheckCircle, X } from 'lucide-react'

export default function ClinicDashboard() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [clinic, setClinic] = useState(null)
  const [stats, setStats] = useState({ doctors: 0, pendingReviews: 0, totalVisits: 0 })
  const [recentReviews, setRecentReviews] = useState([])
  const [loading, setLoading] = useState(true)

  // Модальная форма добавления врача
  const [showAddDoctor, setShowAddDoctor] = useState(false)
  const [docForm, setDocForm] = useState({ full_name: '', specialty: '', experience_years: '' })
  const [docSaving, setDocSaving] = useState(false)
  const [docError, setDocError] = useState('')

  useEffect(() => {
    if (user) fetchClinicData()
  }, [user])

  async function fetchClinicData() {
    try {
      const { data: c } = await supabase
        .from('clinics').select('*').eq('admin_id', user.id).maybeSingle()
      setClinic(c)
      if (!c) { setLoading(false); return }

      const { data: doctorsData } = await supabase
        .from('doctors').select('id').eq('clinic_id', c.id)
      const doctorIds = (doctorsData || []).map(d => d.id)

      const [{ count: pendingCount }, { count: visitsCount }, { data: reviews }] = await Promise.all([
        doctorIds.length > 0
          ? supabase.from('reviews').select('*', { count: 'exact', head: true })
              .in('doctor_id', doctorIds).eq('status', 'pending')
          : Promise.resolve({ count: 0 }),
        supabase.from('visits').select('*', { count: 'exact', head: true }).eq('clinic_id', c.id),
        doctorIds.length > 0
          ? supabase.from('reviews')
              .select('*, doctors(full_name), profiles(full_name)')
              .in('doctor_id', doctorIds)
              .order('created_at', { ascending: false }).limit(5)
          : Promise.resolve({ data: [] })
      ])

      setStats({ doctors: doctorsData?.length || 0, pendingReviews: pendingCount || 0, totalVisits: visitsCount || 0 })
      setRecentReviews(reviews || [])
    } catch(e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  async function addDoctor() {
    if (!docForm.full_name.trim() || !docForm.specialty.trim()) {
      setDocError('Заполните ФИО и специализацию')
      return
    }
    setDocSaving(true)
    setDocError('')
    try {
      const { error } = await supabase.from('doctors').insert({
        full_name: docForm.full_name.trim(),
        specialty: docForm.specialty.trim(),
        experience_years: parseInt(docForm.experience_years) || 0,
        clinic_id: clinic.id
      })
      if (error) throw error
      setDocForm({ full_name: '', specialty: '', experience_years: '' })
      setShowAddDoctor(false)
      setStats(s => ({ ...s, doctors: s.doctors + 1 }))
    } catch(e) {
      setDocError(e.message || 'Ошибка добавления')
    } finally {
      setDocSaving(false)
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

      {/* Модальная форма добавления врача */}
      {showAddDoctor && (
        <div className="fixed inset-0 z-50 flex items-end justify-center"
          style={{ background: 'rgba(0,0,0,0.4)' }}
          onClick={e => { if (e.target === e.currentTarget) setShowAddDoctor(false) }}>
          <div className="bg-white dark:bg-[#1A2230] w-full max-w-lg rounded-t-3xl p-6 space-y-4 animate-slide-up">
            <div className="flex items-center justify-between">
              <p className="font-serif text-[20px] text-[#1A1A1A] dark:text-[#F0F0EE]">Новый врач</p>
              <button onClick={() => setShowAddDoctor(false)}
                className="w-8 h-8 flex items-center justify-center rounded-full bg-[#F0F0EE] dark:bg-[#2A3040]">
                <X size={16} className="text-[#6B7280]" />
              </button>
            </div>

            <div>
              <label className="block text-[12px] font-medium text-[#6B7280] dark:text-[#8899AA] mb-1.5">ФИО врача *</label>
              <input value={docForm.full_name}
                onChange={e => setDocForm(f => ({ ...f, full_name: e.target.value }))}
                className="input-field" placeholder="Иванов Иван Иванович" />
            </div>

            <div>
              <label className="block text-[12px] font-medium text-[#6B7280] dark:text-[#8899AA] mb-1.5">Специализация *</label>
              <input value={docForm.specialty}
                onChange={e => setDocForm(f => ({ ...f, specialty: e.target.value }))}
                className="input-field" placeholder="Терапевт, Кардиолог..." />
            </div>

            <div>
              <label className="block text-[12px] font-medium text-[#6B7280] dark:text-[#8899AA] mb-1.5">Опыт (лет)</label>
              <input value={docForm.experience_years}
                onChange={e => setDocForm(f => ({ ...f, experience_years: e.target.value }))}
                className="input-field" placeholder="5" type="number" min="0" />
            </div>

            {docError && (
              <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-3 flex items-center gap-2">
                <AlertCircle size={14} className="text-red-500 flex-shrink-0" />
                <p className="text-[13px] text-red-600 dark:text-red-400">{docError}</p>
              </div>
            )}

            <div className="flex gap-3 pb-2">
              <button onClick={() => setShowAddDoctor(false)} className="btn-secondary flex-1">Отмена</button>
              <button onClick={addDoctor} disabled={docSaving} className="btn-primary flex-1">
                {docSaving
                  ? <span className="flex items-center justify-center gap-2">
                      <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"/>
                      Добавление...
                    </span>
                  : 'Добавить врача'
                }
              </button>
            </div>
          </div>
        </div>
      )}

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
        <div className="grid grid-cols-3 gap-3">
          {[
            { icon: Users, label: 'Врачей', value: stats.doctors, color: 'text-blue-600 bg-blue-50 dark:text-blue-400 dark:bg-blue-900/20', to: '/clinic/doctors' },
            { icon: AlertCircle, label: 'На проверке', value: stats.pendingReviews, color: 'text-amber-600 bg-amber-50 dark:text-amber-400 dark:bg-amber-900/20', to: '/clinic/reviews' },
            { icon: Star, label: 'Рейтинг', value: clinic.clinic_rating?.toFixed(1) || '—', color: 'text-[#C8A96E] bg-amber-50 dark:bg-amber-900/20', to: '/clinic/reviews' },
          ].map(({ icon: Icon, label, value, color, to }) => (
            <button key={label} onClick={() => navigate(to)}
              className="card p-3 flex flex-col items-center gap-2 text-center active:scale-[0.98] transition-transform">
              <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${color}`}>
                <Icon size={17} />
              </div>
              <p className="font-bold text-[20px] text-[#1A1A1A] dark:text-[#F0F0EE]">{value}</p>
              <p className="text-[11px] text-[#9CA3AF]">{label}</p>
            </button>
          ))}
        </div>

        {/* Quick actions */}
        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={() => { setDocError(''); setDocForm({ full_name: '', specialty: '', experience_years: '' }); setShowAddDoctor(true) }}
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
                  human_review: { cls: 'badge-review', label: 'Проверка' },
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
                        <p className="text-[11px] text-[#9CA3AF]">{r.doctors?.full_name}</p>
                      </div>
                      <div className="flex flex-col items-end gap-1">
                        <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-lg ${s.cls}`}>{s.label}</span>
                        <span className="font-bold text-[14px] text-[#1A1A1A] dark:text-[#F0F0EE]">
                          {r.average_score?.toFixed(1) || '—'}
                        </span>
                      </div>
                    </div>
                    {r.text && <p className="text-[12px] text-[#9CA3AF] line-clamp-2">{r.text}</p>}
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
