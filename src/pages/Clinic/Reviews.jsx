import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../context/AuthContext'
import Header from '../../components/Layout/Header'
import BottomNav from '../../components/Layout/BottomNav'
import { AlertTriangle, CheckCircle, XCircle, Clock, Filter } from 'lucide-react'

export default function ClinicReviews() {
  const { user } = useAuth()
  const [reviews, setReviews] = useState([])
  const [filter, setFilter] = useState('all')
  const [loading, setLoading] = useState(true)

  useEffect(() => { fetchReviews() }, [filter])

  async function fetchReviews() {
    setLoading(true)
    const { data: clinic } = await supabase.from('clinics').select('id').eq('admin_id', user.id).single()
    if (!clinic) { setLoading(false); return }

    const doctorIds = await supabase.from('doctors').select('id').eq('clinic_id', clinic.id).then(r => (r.data||[]).map(d=>d.id))
    let q = supabase.from('reviews').select('*, profiles(full_name), doctors(full_name, specialty)')
      .in('doctor_id', doctorIds)
      .order('created_at', { ascending: false })
    if (filter !== 'all') q = q.eq('status', filter)
    const { data } = await q.limit(50)
    setReviews(data || [])
    setLoading(false)
  }

  const statusMap = {
    pending: { cls: 'badge-pending', label: 'На проверке', icon: Clock },
    human_review: { cls: 'badge-review', label: 'Ручная проверка', icon: AlertTriangle },
    approved: { cls: 'badge-approved', label: 'Опубликован', icon: CheckCircle },
    rejected: { cls: 'badge-rejected', label: 'Отклонён', icon: XCircle },
  }

  return (
    <div className="page-container">
      <Header back title="Отзывы" />

      <div className="px-4 pt-4 space-y-4 animate-in">
        {/* Filter */}
        <div className="flex gap-2 overflow-x-auto pb-1 -mx-4 px-4">
          {[['all', 'Все'], ['pending', 'Ожидают'], ['human_review', 'На проверке'], ['approved', 'Одобрены'], ['rejected', 'Отклонены']].map(([v, l]) => (
            <button key={v} onClick={() => setFilter(v)}
              className={`flex-shrink-0 px-3.5 py-2 rounded-xl text-[13px] font-semibold transition-all
                ${filter === v ? 'bg-[#1A2B4A] dark:bg-[#4A7FCC] text-white' : 'bg-[#F0F0EE] dark:bg-[#1A2230] text-[#6B7280] dark:text-[#8899AA]'}`}>
              {l}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="space-y-3">
            {[1,2,3].map(i => <div key={i} className="card h-24 animate-pulse-soft bg-[#F0F0EE] dark:bg-[#2A3040] rounded-2xl" />)}
          </div>
        ) : reviews.length > 0 ? (
          <div className="space-y-3">
            {reviews.map(r => {
              const s = statusMap[r.status] || statusMap.pending
              const Icon = s.icon
              return (
                <div key={r.id} className="card p-4 space-y-2.5">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="font-semibold text-[14px] text-[#1A1A1A] dark:text-[#F0F0EE]">
                        {r.is_anonymous ? 'Анонимный пациент' : r.profiles?.full_name || 'Пациент'}
                      </p>
                      <p className="text-[12px] text-[#C8A96E] font-medium">{r.doctors?.full_name}</p>
                    </div>
                    <div className="flex flex-col items-end gap-1">
                      <span className={`flex items-center gap-1 text-[11px] font-semibold px-2.5 py-1 rounded-lg ${s.cls}`}>
                        <Icon size={10} /> {s.label}
                      </span>
                      <span className="font-bold text-[16px] text-[#1A1A1A] dark:text-[#F0F0EE]">
                        {r.average_score?.toFixed(1) || '—'}
                      </span>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    {[
                      { label: 'Общение', val: r.communication_score },
                      { label: 'Проф.', val: r.professionalism_score },
                      { label: 'Клиника', val: r.clinic_score },
                    ].map(({ label, val }) => (
                      <div key={label} className="flex-1 bg-[#F5F5F3] dark:bg-[#252D3D] rounded-lg p-1.5 text-center">
                        <p className="text-[10px] text-[#9CA3AF]">{label}</p>
                        <p className="text-[13px] font-bold text-[#1A1A1A] dark:text-[#F0F0EE]">{val}/5</p>
                      </div>
                    ))}
                  </div>

                  {r.text && <p className="text-[13px] text-[#6B7280] dark:text-[#8899AA] leading-relaxed line-clamp-3">{r.text}</p>}

                  {r.ai_flags?.length > 0 && (
                    <div className="flex items-center gap-1.5">
                      <AlertTriangle size={12} className="text-amber-500" />
                      <span className="text-[11px] text-amber-600 dark:text-amber-400">{r.ai_flags.join(', ')}</span>
                    </div>
                  )}

                  <p className="text-[11px] text-[#BCBCBC] dark:text-[#556070]">
                    {new Date(r.created_at).toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' })}
                  </p>
                </div>
              )
            })}
          </div>
        ) : (
          <div className="card py-14 flex flex-col items-center gap-3 text-center">
            <span className="text-4xl">💬</span>
            <p className="font-semibold text-[15px] text-[#1A1A1A] dark:text-[#F0F0EE]">Нет отзывов</p>
            <p className="text-[13px] text-[#9CA3AF]">Отзывы появятся после посещений пациентов</p>
          </div>
        )}
        <div className="h-4" />
      </div>
      <BottomNav />
    </div>
  )
}
