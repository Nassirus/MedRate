import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../context/AuthContext'
import Header from '../../components/Layout/Header'
import BottomNav from '../../components/Layout/BottomNav'
import { analyzeReview } from '../../lib/gemini'
import { ShieldCheck, Sparkles, CheckCircle, XCircle, AlertTriangle, RefreshCw, Eye } from 'lucide-react'

const MODERATION_STAGES = [
  { n: 1, title: 'Регистрация по телефону и ИИН', auto: true, desc: 'Только верифицированные пользователи' },
  { n: 2, title: 'Только реальный пациент', auto: true, desc: 'Привязан к конкретной процедуре' },
  { n: 3, title: 'Один отзыв на врача', auto: true, desc: 'Один пациент — один отзыв' },
  { n: 4, title: 'Повторный визит', auto: true, desc: 'Изменение только после повторного посещения' },
  { n: 5, title: 'QR-сканирование в регистратуре', auto: true, desc: 'Посещение подтверждается QR' },
  { n: 6, title: 'Задержка 1 час после визита', auto: true, desc: 'Отзыв только через час после скана' },
  { n: 7, title: 'ИИ-анализ токсичности', auto: true, desc: 'Gemini проверяет спам, рекламу, мат' },
  { n: 8, title: 'ИИ-анализ несоответствия оценок', auto: true, desc: 'Сравнение текста и числовых оценок' },
  { n: 9, title: 'Ручная модерация', auto: false, desc: 'Подозрительные отзывы проверяются вручную' },
  { n: 10, title: 'Анонимная проверка клиники', auto: false, desc: 'Периодические тайные визиты' },
  { n: 11, title: 'Обновление рейтинга', auto: true, desc: 'Рейтинг обновляется ежедневно в 00:00' },
  { n: 12, title: 'Мониторинг аномалий', auto: true, desc: 'Отслеживание подозрительных паттернов' },
]

export default function ModerationPanel() {
  const { user, profile } = useAuth()
  const [queue, setQueue] = useState([])
  const [selected, setSelected] = useState(null)
  const [view, setView] = useState('queue') // queue | stages
  const [loading, setLoading] = useState(true)
  const [processing, setProcessing] = useState(null)
  const [note, setNote] = useState('')

  useEffect(() => { fetchQueue() }, [])

  async function fetchQueue() {
    const { data } = await supabase
      .from('moderation_queue')
      .select(`
        *,
        reviews(
          *, 
          profiles(full_name, iin),
          doctors(full_name, specialty),
          visits(scanned_at)
        )
      `)
      .eq('status', 'pending')
      .order('priority', { ascending: false })
    setQueue(data || [])
    setLoading(false)
  }

  async function reRunAI(item) {
    const r = item.reviews
    setProcessing(item.id)
    const analysis = await analyzeReview({
      text: r.text,
      scores: { communication: r.communication_score, professionalism: r.professionalism_score, clinic: r.clinic_score },
      doctorName: r.doctors?.full_name,
    })
    await supabase.from('reviews').update({ ai_analysis: analysis, ai_flags: analysis.flags || [] }).eq('id', r.id)
    await supabase.from('moderation_queue').update({ ai_summary: analysis.summary, status: 'in_review' }).eq('id', item.id)
    setSelected({ ...item, reviews: { ...r, ai_analysis: analysis, ai_flags: analysis.flags || [] } })
    setProcessing(null)
    fetchQueue()
  }

  async function decide(item, decision) {
    setProcessing(item.id)
    const status = decision === 'approve' ? 'approved' : 'rejected'
    await supabase.from('reviews').update({
      status,
      moderated_by: user.id,
      moderation_notes: note
    }).eq('id', item.reviews.id)
    await supabase.from('moderation_queue').update({ status: 'resolved', assigned_to: user.id }).eq('id', item.id)
    setQueue(prev => prev.filter(q => q.id !== item.id))
    setSelected(null)
    setNote('')
    setProcessing(null)
  }

  const isAdmin = ['moderator', 'clinic_admin'].includes(profile?.role)

  if (!isAdmin) return (
    <div className="page-container">
      <Header title="Модерация" />
      <div className="px-4 pt-20 flex flex-col items-center gap-4 text-center">
        <ShieldCheck size={48} className="text-[#E5E7EB] dark:text-[#2A3040]" />
        <p className="font-semibold text-[18px] text-[#1A1A1A] dark:text-[#F0F0EE]">Нет доступа</p>
        <p className="text-[14px] text-[#9CA3AF]">Этот раздел доступен только модераторам</p>
      </div>
      <BottomNav />
    </div>
  )

  return (
    <div className="page-container">
      <Header title="Модерация" />

      <div className="px-4 pt-4 space-y-4 animate-in">
        {/* View toggle */}
        <div className="flex bg-[#F0F0EE] dark:bg-[#1A2230] rounded-xl p-1 gap-1">
          {[['queue', 'Очередь'], ['stages', '12 этапов']].map(([v, l]) => (
            <button key={v} onClick={() => setView(v)}
              className={`flex-1 py-2.5 rounded-lg text-[14px] font-semibold transition-all
                ${view === v ? 'bg-white dark:bg-[#2A3040] text-[#1A1A1A] dark:text-[#F0F0EE] shadow-sm' : 'text-[#9CA3AF]'}`}>
              {l} {v === 'queue' && queue.length > 0 && (
                <span className="ml-1.5 bg-red-500 text-white text-[10px] rounded-full px-1.5 py-0.5">{queue.length}</span>
              )}
            </button>
          ))}
        </div>

        {view === 'stages' ? (
          <div className="space-y-2">
            <p className="text-[13px] text-[#9CA3AF] dark:text-[#556070] leading-relaxed">
              MedRate использует 12-этапную систему модерации для обеспечения честности рейтингов
            </p>
            {MODERATION_STAGES.map(s => (
              <div key={s.n} className="card p-4 flex items-start gap-3">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 text-[12px] font-bold
                  ${s.auto ? 'bg-[#1A2B4A] dark:bg-[#4A7FCC] text-white' : 'bg-[#C8A96E] text-white'}`}>
                  {s.n}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <p className="font-semibold text-[13px] text-[#1A1A1A] dark:text-[#F0F0EE]">{s.title}</p>
                    <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-md
                      ${s.auto ? 'bg-[#EEF2F9] text-[#1A2B4A] dark:bg-[#1A2B4A]/30 dark:text-[#4A7FCC]' : 'bg-amber-50 text-amber-700 dark:bg-amber-900/20 dark:text-amber-400'}`}>
                      {s.auto ? 'Авто' : 'Ручной'}
                    </span>
                  </div>
                  <p className="text-[12px] text-[#9CA3AF] mt-0.5">{s.desc}</p>
                </div>
              </div>
            ))}
          </div>
        ) : selected ? (
          <ReviewDetail
            item={selected}
            processing={processing}
            note={note}
            onNoteChange={setNote}
            onRerunAI={() => reRunAI(selected)}
            onApprove={() => decide(selected, 'approve')}
            onReject={() => decide(selected, 'reject')}
            onBack={() => setSelected(null)}
          />
        ) : loading ? (
          <div className="space-y-3">
            {[1,2,3].map(i => <div key={i} className="card h-24 animate-pulse-soft bg-[#F0F0EE] dark:bg-[#2A3040] rounded-2xl" />)}
          </div>
        ) : queue.length > 0 ? (
          <div className="space-y-3">
            {queue.map(item => (
              <button key={item.id} onClick={() => setSelected(item)}
                className="card p-4 w-full text-left space-y-2 active:scale-[0.99] transition-transform">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="font-semibold text-[14px] text-[#1A1A1A] dark:text-[#F0F0EE]">
                      {item.reviews?.is_anonymous ? 'Анонимный пациент' : item.reviews?.profiles?.full_name || 'Пациент'}
                    </p>
                    <p className="text-[12px] text-[#9CA3AF]">врач: {item.reviews?.doctors?.full_name}</p>
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    <span className={`text-[11px] font-bold px-2 py-0.5 rounded-lg
                      ${item.priority >= 2 ? 'bg-red-100 text-red-600 dark:bg-red-900/20 dark:text-red-400' : 'badge-pending'}`}>
                      {item.priority >= 2 ? '🚨 Срочно' : 'Обычный'}
                    </span>
                    <span className="font-bold text-[15px] text-[#1A1A1A] dark:text-[#F0F0EE]">
                      {((item.reviews?.communication_score + item.reviews?.professionalism_score + item.reviews?.clinic_score) / 3).toFixed(1)}
                    </span>
                  </div>
                </div>
                {item.ai_summary && (
                  <p className="text-[12px] text-[#9CA3AF] line-clamp-2">{item.ai_summary}</p>
                )}
                {item.reviews?.ai_flags?.length > 0 && (
                  <div className="flex items-center gap-1">
                    <AlertTriangle size={12} className="text-amber-500" />
                    <span className="text-[11px] text-amber-600 dark:text-amber-400">{item.reviews.ai_flags.join(', ')}</span>
                  </div>
                )}
                <div className="flex items-center gap-1 text-[#1A2B4A] dark:text-[#4A7FCC]">
                  <Eye size={13} />
                  <span className="text-[12px] font-medium">Просмотреть и принять решение</span>
                </div>
              </button>
            ))}
          </div>
        ) : (
          <div className="card py-16 flex flex-col items-center gap-3 text-center">
            <ShieldCheck size={48} className="text-emerald-400" />
            <p className="font-semibold text-[18px] text-[#1A1A1A] dark:text-[#F0F0EE]">Очередь пуста</p>
            <p className="text-[14px] text-[#9CA3AF]">Все отзывы проверены</p>
          </div>
        )}
        <div className="h-4" />
      </div>
      <BottomNav />
    </div>
  )
}

function ReviewDetail({ item, processing, note, onNoteChange, onRerunAI, onApprove, onReject, onBack }) {
  const r = item.reviews
  const ai = r?.ai_analysis

  return (
    <div className="space-y-4 animate-in">
      <button onClick={onBack} className="flex items-center gap-1.5 text-[13px] text-[#1A2B4A] dark:text-[#4A7FCC] font-medium">
        ← Назад к очереди
      </button>

      {/* Review details */}
      <div className="card p-5 space-y-4">
        <p className="font-semibold text-[16px] text-[#1A1A1A] dark:text-[#F0F0EE]">Детали отзыва</p>
        <div className="grid grid-cols-3 gap-2">
          {[
            { label: 'Общение', val: r?.communication_score },
            { label: 'Проф.', val: r?.professionalism_score },
            { label: 'Клиника', val: r?.clinic_score },
          ].map(({ label, val }) => (
            <div key={label} className="bg-[#F5F5F3] dark:bg-[#252D3D] rounded-xl p-2.5 text-center">
              <p className="text-[11px] text-[#9CA3AF]">{label}</p>
              <p className="text-[18px] font-bold text-[#1A1A1A] dark:text-[#F0F0EE]">{val}/5</p>
            </div>
          ))}
        </div>
        {r?.text ? (
          <div className="bg-[#F5F5F3] dark:bg-[#252D3D] rounded-xl p-3">
            <p className="text-[13px] text-[#1A1A1A] dark:text-[#F0F0EE] leading-relaxed">"{r.text}"</p>
          </div>
        ) : (
          <p className="text-[13px] text-[#9CA3AF] italic">Без текстового комментария</p>
        )}
        <div className="flex flex-col gap-1 text-[12px] text-[#9CA3AF]">
          <span>👤 {r?.is_anonymous ? 'Анонимный' : r?.profiles?.full_name || 'Пациент'}</span>
          <span>🏥 {r?.doctors?.full_name} ({r?.doctors?.specialty})</span>
          {r?.profiles?.iin && <span>✅ ИИН верифицирован: {r.profiles.iin.substring(0, 4)}**** </span>}
        </div>
      </div>

      {/* AI Analysis */}
      <div className="card p-5 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles size={16} className="text-[#C8A96E]" />
            <p className="font-semibold text-[14px] text-[#1A1A1A] dark:text-[#F0F0EE]">ИИ-анализ</p>
          </div>
          <button onClick={onRerunAI} disabled={!!processing}
            className="flex items-center gap-1.5 text-[12px] text-[#1A2B4A] dark:text-[#4A7FCC] font-medium">
            <RefreshCw size={13} className={processing === item.id ? 'animate-spin' : ''} />
            Повторить
          </button>
        </div>

        {ai ? (
          <div className="space-y-2">
            <div className={`px-3 py-2 rounded-xl flex items-center gap-2
              ${ai.recommendation === 'approve' ? 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400'
              : ai.recommendation === 'reject' ? 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400'
              : 'bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400'}`}>
              {ai.recommendation === 'approve' ? <CheckCircle size={14} /> : ai.recommendation === 'reject' ? <XCircle size={14} /> : <AlertTriangle size={14} />}
              <span className="font-semibold text-[13px]">
                {ai.recommendation === 'approve' ? 'ИИ рекомендует одобрить' : ai.recommendation === 'reject' ? 'ИИ рекомендует отклонить' : 'Требует ручной проверки'}
                {' '}({Math.round((ai.confidence || 0) * 100)}%)
              </span>
            </div>
            {ai.summary && <p className="text-[13px] text-[#6B7280] dark:text-[#8899AA]">{ai.summary}</p>}
            {ai.reason && <p className="text-[12px] text-[#9CA3AF] italic">Обоснование: {ai.reason}</p>}
            <div className="flex flex-wrap gap-2">
              {[
                { key: 'toxicity', label: '☣️ Токсичность' },
                { key: 'spam', label: '🚫 Спам' },
                { key: 'advertising', label: '📢 Реклама' },
                { key: 'inconsistent_scores', label: '⚠️ Несоответствие оценок' },
              ].filter(f => ai[f.key]).map(f => (
                <span key={f.key} className="badge-pending text-[11px] font-medium px-2.5 py-1 rounded-lg">{f.label}</span>
              ))}
            </div>
          </div>
        ) : (
          <p className="text-[13px] text-[#9CA3AF]">ИИ-анализ не проводился</p>
        )}
      </div>

      {/* Moderator note */}
      <div className="card p-4 space-y-2">
        <p className="font-semibold text-[14px] text-[#1A1A1A] dark:text-[#F0F0EE]">Заметка модератора</p>
        <textarea value={note} onChange={e => onNoteChange(e.target.value)}
          className="input-field h-20 resize-none text-[13px]"
          placeholder="Причина решения (необязательно)..." />
      </div>

      {/* Decision buttons */}
      <div className="grid grid-cols-2 gap-3">
        <button onClick={onReject} disabled={!!processing}
          className="flex items-center justify-center gap-2 py-4 rounded-2xl bg-red-50 dark:bg-red-900/20
            border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 font-semibold text-[14px]
            active:scale-[0.98] transition-transform disabled:opacity-50">
          <XCircle size={18} />
          Отклонить
        </button>
        <button onClick={onApprove} disabled={!!processing}
          className="flex items-center justify-center gap-2 py-4 rounded-2xl bg-emerald-50 dark:bg-emerald-900/20
            border border-emerald-200 dark:border-emerald-800 text-emerald-600 dark:text-emerald-400 font-semibold text-[14px]
            active:scale-[0.98] transition-transform disabled:opacity-50">
          <CheckCircle size={18} />
          Одобрить
        </button>
      </div>
    </div>
  )
}
