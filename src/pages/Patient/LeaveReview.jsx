import { useState, useEffect } from 'react'
import { useParams, useSearchParams, useNavigate } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { analyzeReview } from '../../lib/gemini'
import { useAuth } from '../../context/AuthContext'
import Header from '../../components/Layout/Header'
import { RatingInput } from '../../components/RatingStars'
import { Avatar } from '../../components/DoctorCard'
import { ShieldCheck, Sparkles, Eye, EyeOff, AlertTriangle } from 'lucide-react'

export default function LeaveReview() {
  const { doctorId } = useParams()
  const [searchParams] = useSearchParams()
  const visitId = searchParams.get('visit')
  const navigate = useNavigate()
  const { user } = useAuth()

  const [doctor, setDoctor] = useState(null)
  const [scores, setScores] = useState({ communication: 0, professionalism: 0, clinic: 0 })
  const [text, setText] = useState('')
  const [anonymous, setAnonymous] = useState(false)
  const [loading, setLoading] = useState(false)
  const [aiAnalyzing, setAiAnalyzing] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState('')
  const [step, setStep] = useState('form') // form | ai | done

  useEffect(() => {
    supabase.from('doctors').select('*, clinics(name)').eq('id', doctorId).single()
      .then(({ data }) => setDoctor(data))
  }, [doctorId])

  const allScored = scores.communication > 0 && scores.professionalism > 0 && scores.clinic > 0

  const handleSubmit = async () => {
    if (!allScored) return setError('Пожалуйста, поставьте оценку по всем критериям')
    if (!user) return navigate('/login')

    setLoading(true)
    setAiAnalyzing(true)
    setStep('ai')
    setError('')

    try {
      // 1. AI moderation (Stage 1–2 of 12)
      const analysis = await analyzeReview({
        text,
        scores,
        doctorName: doctor?.full_name,
        clinicName: doctor?.clinics?.name
      })
      setAiAnalyzing(false)

      // Determine initial status based on AI
      let status = 'pending'
      if (analysis.recommendation === 'approve' && analysis.confidence > 0.85) {
        status = 'approved'
      } else if (analysis.recommendation === 'reject' && analysis.confidence > 0.9) {
        status = 'rejected'
      } else {
        status = 'human_review'
      }

      // 2. Insert review
      const { data: review, error: revErr } = await supabase.from('reviews').insert({
        patient_id: user.id,
        doctor_id: doctorId,
        visit_id: visitId || null,
        communication_score: scores.communication,
        professionalism_score: scores.professionalism,
        clinic_score: scores.clinic,
        text: text.trim() || null,
        is_anonymous: anonymous,
        status,
        ai_analysis: analysis,
        ai_flags: analysis.flags || [],
      }).select().single()

      if (revErr) throw revErr

      // 3. Add to moderation queue if human review needed
      if (status === 'human_review') {
        await supabase.from('moderation_queue').insert({
          review_id: review.id,
          priority: analysis.flags?.length > 0 ? 2 : 1,
          ai_summary: analysis.summary,
          status: 'pending'
        })
      }

      // 4. Mark visit as reviewed
      if (visitId) {
        await supabase.from('visits').update({ is_reviewed: true }).eq('id', visitId)
      }

      // 5. Update profile counters
      await supabase.from('profiles')
        .update({ reviews_count: supabase.rpc('increment') })
        .eq('id', user.id)

      setStep('done')
      setSubmitted(true)
    } catch (e) {
      setError(e.message || 'Ошибка отправки')
      setStep('form')
    } finally {
      setLoading(false)
    }
  }

  if (step === 'ai') return (
    <div className="min-h-screen bg-[#FAFAF9] dark:bg-[#0F1419] flex flex-col items-center justify-center px-8 gap-6">
      <div className="w-16 h-16 bg-[#EEF2F9] dark:bg-[#1A2B4A]/30 rounded-full flex items-center justify-center">
        <Sparkles size={28} className="text-[#C8A96E] animate-pulse" />
      </div>
      <div className="text-center space-y-2">
        <h2 className="font-semibold text-[18px] text-[#1A1A1A] dark:text-[#F0F0EE]">ИИ-проверка отзыва</h2>
        <p className="text-[14px] text-[#9CA3AF]">Анализируем ваш отзыв на соответствие правилам платформы...</p>
      </div>
      <div className="w-full max-w-xs space-y-2">
        {['Проверка на спам', 'Анализ тональности', 'Проверка соответствия оценок'].map((label, i) => (
          <div key={label} className="flex items-center gap-3">
            <div className="w-4 h-4 rounded-full border-2 border-[#1A2B4A] border-t-transparent animate-spin" style={{ animationDelay: `${i * 0.2}s` }} />
            <span className="text-[13px] text-[#6B7280] dark:text-[#8899AA]">{label}</span>
          </div>
        ))}
      </div>
    </div>
  )

  if (step === 'done') return (
    <div className="min-h-screen bg-[#FAFAF9] dark:bg-[#0F1419] flex flex-col items-center justify-center px-8 gap-6">
      <div className="w-20 h-20 bg-emerald-100 dark:bg-emerald-900/30 rounded-full flex items-center justify-center">
        <ShieldCheck size={36} className="text-emerald-600 dark:text-emerald-400" />
      </div>
      <div className="text-center space-y-2">
        <h2 className="font-serif text-[24px] text-[#1A1A1A] dark:text-[#F0F0EE]">Отзыв отправлен!</h2>
        <p className="text-[14px] text-[#9CA3AF] leading-relaxed">
          Отзыв прошёл проверку ИИ и будет опубликован после модерации.
        </p>
      </div>
      <div className="card p-4 w-full space-y-3">
        <p className="text-[13px] font-semibold text-[#1A1A1A] dark:text-[#F0F0EE]">Этапы модерации:</p>
        {[
          { label: '✅ Этап 1–2: ИИ-анализ', done: true },
          { label: '⏳ Этап 3–5: Ручная проверка', done: false },
          { label: '⏳ Этап 6–12: Публикация', done: false },
        ].map(({ label, done }) => (
          <div key={label} className={`text-[13px] ${done ? 'text-emerald-600 dark:text-emerald-400' : 'text-[#9CA3AF]'}`}>
            {label}
          </div>
        ))}
      </div>
      <button onClick={() => navigate(-2)} className="btn-primary w-full max-w-xs">
        Вернуться к врачу
      </button>
    </div>
  )

  return (
    <div className="page-container">
      <Header back title="Оставить отзыв" />

      <div className="px-4 pt-4 space-y-5 animate-in">
        {/* Doctor info */}
        {doctor && (
          <div className="card p-4 flex items-center gap-3">
            <Avatar name={doctor.full_name} size="md" />
            <div>
              <p className="font-semibold text-[15px] text-[#1A1A1A] dark:text-[#F0F0EE]">{doctor.full_name}</p>
              <p className="text-[13px] text-[#C8A96E]">{doctor.specialty}</p>
            </div>
          </div>
        )}

        {/* Moderation notice */}
        <div className="bg-[#EEF2F9] dark:bg-[#1A2B4A]/20 rounded-xl p-3 flex items-start gap-2">
          <ShieldCheck size={15} className="text-[#1A2B4A] dark:text-[#4A7FCC] flex-shrink-0 mt-0.5" />
          <p className="text-[12px] text-[#1A2B4A] dark:text-[#4A7FCC]">
            Отзыв проходит 12-этапную модерацию для исключения накрутки и фальсификации
          </p>
        </div>

        {/* Rating criteria */}
        <div className="card p-5 space-y-5">
          <p className="font-semibold text-[15px] text-[#1A1A1A] dark:text-[#F0F0EE]">Оцените по критериям</p>

          {[
            { key: 'communication', label: 'Коммуникативные навыки', desc: 'Насколько внимательно выслушал, объяснил диагноз' },
            { key: 'professionalism', label: 'Профессионализм', desc: 'Качество осмотра, назначений, практические навыки' },
            { key: 'clinic', label: 'Клиника', desc: 'Интерьер, оборудование, чистота, сервис' },
          ].map(({ key, label, desc }) => (
            <div key={key} className="space-y-2">
              <div>
                <p className="text-[14px] font-semibold text-[#1A1A1A] dark:text-[#F0F0EE]">{label}</p>
                <p className="text-[12px] text-[#9CA3AF]">{desc}</p>
              </div>
              <div className="flex items-center gap-3">
                <RatingInput value={scores[key]} onChange={v => setScores(s => ({ ...s, [key]: v }))} size={28} />
                {scores[key] > 0 && (
                  <span className="text-[14px] font-bold text-[#C8A96E]">{scores[key]}/5</span>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Text */}
        <div className="card p-4 space-y-3">
          <p className="font-semibold text-[15px] text-[#1A1A1A] dark:text-[#F0F0EE]">
            Комментарий <span className="text-[#9CA3AF] font-normal text-[13px]">(необязательно)</span>
          </p>
          <textarea
            value={text}
            onChange={e => setText(e.target.value)}
            placeholder="Опишите ваш визит..."
            className="input-field h-28 resize-none"
            maxLength={1000}
          />
          <p className="text-[11px] text-[#9CA3AF] text-right">{text.length}/1000</p>
        </div>

        {/* Anonymous */}
        <button onClick={() => setAnonymous(!anonymous)}
          className="card p-4 w-full flex items-center justify-between active:scale-[0.99] transition-transform">
          <div className="flex items-center gap-3">
            {anonymous ? <EyeOff size={18} className="text-[#1A2B4A] dark:text-[#4A7FCC]" /> : <Eye size={18} className="text-[#9CA3AF]" />}
            <div className="text-left">
              <p className="text-[14px] font-semibold text-[#1A1A1A] dark:text-[#F0F0EE]">Анонимный отзыв</p>
              <p className="text-[12px] text-[#9CA3AF]">Ваше имя не будет видно публично</p>
            </div>
          </div>
          <div className={`w-12 h-6 rounded-full transition-colors flex items-center px-1 ${anonymous ? 'bg-[#1A2B4A] dark:bg-[#4A7FCC]' : 'bg-[#E5E7EB] dark:bg-[#2A3040]'}`}>
            <div className={`w-4 h-4 bg-white rounded-full transition-transform ${anonymous ? 'translate-x-6' : 'translate-x-0'}`} />
          </div>
        </button>

        {error && (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 text-[13px] rounded-xl p-3 flex items-center gap-2">
            <AlertTriangle size={15} />
            {error}
          </div>
        )}

        <button onClick={handleSubmit} disabled={loading || !allScored} className="btn-primary w-full">
          {loading ? (
            <span className="flex items-center justify-center gap-2">
              <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              Отправка...
            </span>
          ) : (
            <span className="flex items-center justify-center gap-2">
              <Sparkles size={17} />
              Отправить с ИИ-проверкой
            </span>
          )}
        </button>

        <div className="h-4" />
      </div>
    </div>
  )
}
