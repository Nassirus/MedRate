import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../context/AuthContext'
import Header from '../../components/Layout/Header'
import BottomNav from '../../components/Layout/BottomNav'
import { Avatar } from '../../components/DoctorCard'
import { Clock, CheckCircle, XCircle, CalendarDays, QrCode, Star } from 'lucide-react'

const TABS = ['Записи', 'История']

export default function Schedule() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [tab, setTab] = useState(0)
  const [appointments, setAppointments] = useState([])
  const [visits, setVisits] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (user) fetchData()
    else setLoading(false)
  }, [user])

  async function fetchData() {
    const [{ data: apts }, { data: vis }] = await Promise.all([
      supabase.from('appointments')
        .select('*, doctors(full_name, specialty), clinics(name)')
        .eq('patient_id', user.id)
        .order('scheduled_at', { ascending: false }),
      supabase.from('visits')
        .select('*, doctors(full_name, specialty, id), clinics(name)')
        .eq('patient_id', user.id)
        .order('scanned_at', { ascending: false })
    ])
    setAppointments(apts || [])
    setVisits(vis || [])
    setLoading(false)
  }

  if (!user) return (
    <div className="page-container">
      <Header title="Расписание" />
      <div className="px-4 pt-20 flex flex-col items-center gap-4 text-center">
        <span className="text-5xl">📅</span>
        <p className="font-semibold text-[18px] text-[#1A1A1A] dark:text-[#F0F0EE]">Войдите в аккаунт</p>
        <button onClick={() => navigate('/login')} className="btn-primary px-8">Войти</button>
      </div>
      <BottomNav />
    </div>
  )

  return (
    <div className="page-container">
      <Header title="Расписание" />

      <div className="px-4 pt-4 space-y-4 animate-in">
        {/* Tabs */}
        <div className="flex bg-[#F0F0EE] dark:bg-[#1A2230] rounded-xl p-1 gap-1">
          {TABS.map((t, i) => (
            <button key={t} onClick={() => setTab(i)}
              className={`flex-1 py-2.5 rounded-lg text-[14px] font-semibold transition-all
                ${tab === i ? 'bg-white dark:bg-[#2A3040] text-[#1A1A1A] dark:text-[#F0F0EE] shadow-sm' : 'text-[#9CA3AF]'}`}>
              {t}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="space-y-3">
            {[1,2,3].map(i => (
              <div key={i} className="card h-24 animate-pulse-soft bg-[#F0F0EE] dark:bg-[#2A3040] rounded-2xl" />
            ))}
          </div>
        ) : tab === 0 ? (
          appointments.length > 0 ? (
            <div className="space-y-3">
              {appointments.map(a => <AppointmentCard key={a.id} apt={a} onNavigate={navigate} />)}
            </div>
          ) : (
            <Empty icon="📅" text="Нет предстоящих записей" action={() => navigate('/search')} actionLabel="Найти врача" />
          )
        ) : (
          visits.length > 0 ? (
            <div className="space-y-3">
              {visits.map(v => <VisitCard key={v.id} visit={v} onNavigate={navigate} />)}
            </div>
          ) : (
            <Empty icon="🏥" text="История посещений пуста" action={() => navigate('/scan')} actionLabel="Сканировать QR" />
          )
        )}
        <div className="h-4" />
      </div>

      <BottomNav />
    </div>
  )
}

function AppointmentCard({ apt, onNavigate }) {
  const statusMap = {
    pending: { label: 'Ожидает', cls: 'badge-pending', icon: Clock },
    confirmed: { label: 'Подтверждено', cls: 'badge-approved', icon: CheckCircle },
    cancelled: { label: 'Отменено', cls: 'badge-rejected', icon: XCircle },
    completed: { label: 'Завершено', cls: 'badge-approved', icon: CheckCircle },
  }
  const s = statusMap[apt.status] || statusMap.pending
  const Icon = s.icon
  const date = apt.scheduled_at ? new Date(apt.scheduled_at).toLocaleString('ru-RU', {
    day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit'
  }) : 'Дата не указана'

  return (
    <button onClick={() => apt.doctors && onNavigate(`/doctor/${apt.doctor_id}`)}
      className="card p-4 w-full text-left flex items-center gap-3 active:scale-[0.99] transition-transform">
      <Avatar name={apt.doctors?.full_name || '?'} size="md" />
      <div className="flex-1 min-w-0">
        <p className="font-semibold text-[14px] text-[#1A1A1A] dark:text-[#F0F0EE] truncate">
          {apt.doctors?.full_name || 'Врач'}
        </p>
        <p className="text-[12px] text-[#C8A96E] font-medium">{apt.doctors?.specialty}</p>
        <div className="flex items-center gap-1.5 mt-1">
          <CalendarDays size={12} className="text-[#9CA3AF]" />
          <span className="text-[12px] text-[#9CA3AF]">{date}</span>
        </div>
      </div>
      <span className={`text-[11px] font-semibold px-2.5 py-1 rounded-lg ${s.cls}`}>{s.label}</span>
    </button>
  )
}

function VisitCard({ visit, onNavigate }) {
  const date = new Date(visit.scanned_at).toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' })
  const canReviewAt = new Date(visit.can_review_at)
  const now = new Date()
  const canReview = !visit.is_reviewed && now >= canReviewAt

  return (
    <div className="card p-4 space-y-3">
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 bg-[#EEF2F9] dark:bg-[#1A2B4A]/30 rounded-xl flex items-center justify-center flex-shrink-0">
          <QrCode size={18} className="text-[#1A2B4A] dark:text-[#4A7FCC]" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-[14px] text-[#1A1A1A] dark:text-[#F0F0EE]">
            {visit.clinics?.name || 'Клиника'}
          </p>
          {visit.doctors && (
            <p className="text-[12px] text-[#C8A96E] font-medium">{visit.doctors.full_name}</p>
          )}
          <p className="text-[12px] text-[#9CA3AF] mt-0.5">{date}</p>
        </div>
        {visit.is_reviewed && (
          <span className="badge-approved text-[11px] font-semibold px-2.5 py-1 rounded-lg">Отзыв оставлен</span>
        )}
      </div>

      {canReview && visit.doctors && (
        <button onClick={() => onNavigate(`/review/${visit.doctors.id}?visit=${visit.id}`)}
          className="w-full bg-[#C8A96E] text-white font-medium rounded-xl py-2.5 flex items-center justify-center gap-2 text-[13px] active:scale-[0.99] transition-transform">
          <Star size={15} />
          Оставить отзыв
        </button>
      )}

      {!visit.is_reviewed && !canReview && (
        <div className="flex items-center gap-2 bg-amber-50 dark:bg-amber-900/20 rounded-xl p-2.5">
          <Clock size={13} className="text-amber-600 dark:text-amber-400 flex-shrink-0" />
          <p className="text-[12px] text-amber-700 dark:text-amber-400">
            Отзыв доступен с {canReviewAt.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })}
          </p>
        </div>
      )}
    </div>
  )
}

function Empty({ icon, text, action, actionLabel }) {
  return (
    <div className="flex flex-col items-center gap-4 py-16 text-center">
      <span className="text-5xl">{icon}</span>
      <p className="text-[15px] font-semibold text-[#1A1A1A] dark:text-[#F0F0EE]">{text}</p>
      {action && (
        <button onClick={action} className="btn-primary px-6">{actionLabel}</button>
      )}
    </div>
  )
}
