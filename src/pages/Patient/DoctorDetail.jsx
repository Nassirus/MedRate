import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../context/AuthContext'
import Header from '../../components/Layout/Header'
import BottomNav from '../../components/Layout/BottomNav'
import { RatingDisplay, RatingBar } from '../../components/RatingStars'
import { Avatar } from '../../components/DoctorCard'
import { MapPin, Clock, Star, CalendarPlus, ShieldCheck, Lock } from 'lucide-react'

export default function DoctorDetail() {
  const { id } = useParams()
  const { user, profile } = useAuth()
  const navigate = useNavigate()
  const [doctor, setDoctor] = useState(null)
  const [reviews, setReviews] = useState([])
  const [canReview, setCanReview] = useState(null) // null=loading, false=no, visit=visit obj
  const [hasReviewed, setHasReviewed] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchDoctor()
    if (user) checkReviewEligibility()
  }, [id, user])

  async function fetchDoctor() {
    const { data } = await supabase
      .from('doctors')
      .select('*, clinics(id, name, address, city, phone)')
      .eq('id', id)
      .single()
    setDoctor(data)

    const { data: rev } = await supabase
      .from('reviews')
      .select('*, profiles(full_name)')
      .eq('doctor_id', id)
      .eq('status', 'approved')
      .order('created_at', { ascending: false })
    setReviews(rev || [])
    setLoading(false)
  }

  async function checkReviewEligibility() {
    // Check if user already reviewed this doctor
    const { data: existing } = await supabase
      .from('reviews')
      .select('id')
      .eq('doctor_id', id)
      .eq('patient_id', user.id)
      .maybeSingle()
    setHasReviewed(!!existing)

    // Check if user has an eligible visit
    const { data: visit } = await supabase
      .from('visits')
      .select('*')
      .eq('doctor_id', id)
      .eq('patient_id', user.id)
      .eq('is_reviewed', false)
      .lte('can_review_at', new Date().toISOString())
      .order('scanned_at', { ascending: false })
      .limit(1)
      .maybeSingle()
    setCanReview(visit || false)
  }

  if (loading) return (
    <div className="page-container flex items-center justify-center">
      <div className="w-8 h-8 border-2 border-[#1A2B4A] border-t-transparent rounded-full animate-spin" />
    </div>
  )

  if (!doctor) return (
    <div className="page-container flex items-center justify-center">
      <p className="text-[#9CA3AF]">Врач не найден</p>
    </div>
  )

  return (
    <div className="page-container">
      <Header back title="" />

      <div className="px-4 pt-4 space-y-4 animate-in">
        {/* Doctor hero */}
        <div className="card p-5">
          <div className="flex items-start gap-4">
            <Avatar name={doctor.full_name} size="xl" />
            <div className="flex-1">
              <h1 className="font-serif text-[20px] text-[#1A1A1A] dark:text-[#F0F0EE] leading-tight">
                {doctor.full_name}
              </h1>
              <p className="text-[#C8A96E] font-medium text-[14px] mt-0.5">{doctor.specialty}</p>
              {doctor.experience_years > 0 && (
                <p className="text-[12px] text-[#9CA3AF] mt-0.5">Опыт: {doctor.experience_years} лет</p>
              )}
            </div>
          </div>

          {doctor.bio && (
            <p className="text-[13px] text-[#6B7280] dark:text-[#8899AA] mt-4 leading-relaxed">{doctor.bio}</p>
          )}

          {/* Rating score */}
          <div className="mt-4 p-3 bg-[#F5F5F3] dark:bg-[#252D3D] rounded-xl">
            <div className="flex items-center justify-between mb-3">
              <span className="text-[13px] font-semibold text-[#6B7280] dark:text-[#8899AA]">Рейтинг</span>
              <div className="flex items-center gap-2">
                <RatingDisplay value={doctor.total_rating} count={doctor.review_count} />
              </div>
            </div>
            <div className="space-y-2.5">
              <RatingBar label="Коммуникация" value={doctor.communication_rating} />
              <RatingBar label="Профессионализм" value={doctor.professionalism_rating} />
              <RatingBar label="Клиника" value={doctor.clinic_criteria_rating} />
            </div>
          </div>

          {/* Clinic */}
          {doctor.clinics && (
            <button onClick={() => navigate(`/clinic/${doctor.clinics.id}`)}
              className="mt-3 flex items-center gap-2 text-[13px] text-[#6B7280] dark:text-[#8899AA] w-full">
              <MapPin size={14} className="text-[#9CA3AF] flex-shrink-0" />
              <span className="truncate">{doctor.clinics.name}, {doctor.clinics.address}</span>
            </button>
          )}
        </div>

        {/* Actions */}
        <div className="grid grid-cols-2 gap-3">
          <button onClick={() => navigate(`/book/${doctor.id}`)}
            className="btn-primary flex items-center justify-center gap-2">
            <CalendarPlus size={17} />
            Записаться
          </button>

          {!user ? (
            <button onClick={() => navigate('/login')}
              className="btn-secondary flex items-center justify-center gap-2 text-[14px]">
              <Lock size={15} />
              Войти для отзыва
            </button>
          ) : hasReviewed ? (
            <div className="btn-secondary flex items-center justify-center gap-2 text-[14px] opacity-60">
              <ShieldCheck size={15} />
              Отзыв оставлен
            </div>
          ) : canReview ? (
            <button onClick={() => navigate(`/review/${doctor.id}?visit=${canReview.id}`)}
              className="bg-[#C8A96E] text-white font-medium rounded-2xl px-4 py-3.5 flex items-center justify-center gap-2 active:scale-95 transition-all">
              <Star size={17} />
              Оставить отзыв
            </button>
          ) : (
            <div className="btn-secondary flex items-center justify-center gap-2 text-[13px] opacity-70 text-center leading-tight px-3">
              <Clock size={14} />
              <span>Сканируйте QR в клинике</span>
            </div>
          )}
        </div>

        {/* Reviews */}
        <div>
          <p className="section-title mb-3">Отзывы ({reviews.length})</p>
          {reviews.length > 0 ? (
            <div className="space-y-3">
              {reviews.map(r => <ReviewCard key={r.id} review={r} />)}
            </div>
          ) : (
            <div className="card py-10 flex flex-col items-center gap-3 text-center">
              <span className="text-3xl">💬</span>
              <p className="text-[13px] text-[#9CA3AF]">Пока нет отзывов</p>
              <p className="text-[12px] text-[#BCBCBC] dark:text-[#556070]">
                Посетите врача и оставьте отзыв первым
              </p>
            </div>
          )}
        </div>

        <div className="h-4" />
      </div>

      <BottomNav />
    </div>
  )
}

function ReviewCard({ review }) {
  const name = review.is_anonymous ? 'Анонимный пациент' : review.profiles?.full_name || 'Пациент'
  const date = new Date(review.created_at).toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' })

  return (
    <div className="card p-4 space-y-2.5">
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="text-[14px] font-semibold text-[#1A1A1A] dark:text-[#F0F0EE]">{name}</p>
          <p className="text-[12px] text-[#9CA3AF]">{date}</p>
        </div>
        <div className="bg-[#1A2B4A] dark:bg-[#4A7FCC] text-white text-[13px] font-bold px-2.5 py-1 rounded-xl">
          {review.average_score?.toFixed(1) || '—'}
        </div>
      </div>

      <div className="grid grid-cols-3 gap-2">
        {[
          { label: 'Общение', val: review.communication_score },
          { label: 'Проф.', val: review.professionalism_score },
          { label: 'Клиника', val: review.clinic_score },
        ].map(({ label, val }) => (
          <div key={label} className="bg-[#F5F5F3] dark:bg-[#252D3D] rounded-xl p-2 text-center">
            <p className="text-[11px] text-[#9CA3AF]">{label}</p>
            <p className="text-[14px] font-bold text-[#1A1A1A] dark:text-[#F0F0EE]">{val}/5</p>
          </div>
        ))}
      </div>

      {review.text && (
        <p className="text-[13px] text-[#6B7280] dark:text-[#8899AA] leading-relaxed">{review.text}</p>
      )}
    </div>
  )
}
