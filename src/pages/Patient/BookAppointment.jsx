import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../context/AuthContext'
import Header from '../../components/Layout/Header'
import { Avatar } from '../../components/DoctorCard'
import { CalendarDays, Clock, CheckCircle } from 'lucide-react'

const TIMES = ['09:00', '09:30', '10:00', '10:30', '11:00', '11:30', '14:00', '14:30', '15:00', '15:30', '16:00', '16:30']

export default function BookAppointment() {
  const { doctorId } = useParams()
  const { user } = useAuth()
  const navigate = useNavigate()
  const [doctor, setDoctor] = useState(null)
  const [selectedDate, setSelectedDate] = useState('')
  const [selectedTime, setSelectedTime] = useState('')
  const [notes, setNotes] = useState('')
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)

  useEffect(() => {
    supabase.from('doctors').select('*, clinics(id, name)').eq('id', doctorId).single().then(({ data }) => setDoctor(data))
  }, [doctorId])

  // Generate next 14 days
  const dates = Array.from({ length: 14 }, (_, i) => {
    const d = new Date()
    d.setDate(d.getDate() + i + 1)
    return d
  }).filter(d => d.getDay() !== 0 && d.getDay() !== 6) // skip weekends

  const submit = async () => {
    if (!selectedDate || !selectedTime || !user) return
    setLoading(true)
    try {
      const scheduledAt = new Date(`${selectedDate}T${selectedTime}:00`)
      const { data: clinic } = await supabase.from('clinics').select('id').eq('id', doctor?.clinics?.id).single()
      await supabase.from('appointments').insert({
        patient_id: user.id,
        doctor_id: doctorId,
        clinic_id: doctor?.clinics?.id,
        scheduled_at: scheduledAt.toISOString(),
        notes: notes || null,
        status: 'pending'
      })
      setSuccess(true)
    } finally {
      setLoading(false)
    }
  }

  if (success) return (
    <div className="min-h-screen bg-[#FAFAF9] dark:bg-[#0F1419] flex flex-col items-center justify-center px-8 gap-6">
      <div className="w-20 h-20 bg-emerald-100 dark:bg-emerald-900/30 rounded-full flex items-center justify-center">
        <CheckCircle size={36} className="text-emerald-600 dark:text-emerald-400" />
      </div>
      <div className="text-center space-y-2">
        <h2 className="font-serif text-[24px] text-[#1A1A1A] dark:text-[#F0F0EE]">Запись создана!</h2>
        <p className="text-[14px] text-[#9CA3AF]">
          {selectedDate} в {selectedTime}<br />
          {doctor?.full_name}
        </p>
      </div>
      <div className="flex gap-3 w-full max-w-xs">
        <button onClick={() => navigate('/schedule')} className="btn-primary flex-1">Мои записи</button>
        <button onClick={() => navigate('/home')} className="btn-secondary flex-1">Главная</button>
      </div>
    </div>
  )

  return (
    <div className="min-h-screen bg-[#FAFAF9] dark:bg-[#0F1419] pb-8">
      <Header back title="Запись к врачу" />

      <div className="px-4 pt-4 space-y-5 animate-in">
        {doctor && (
          <div className="card p-4 flex items-center gap-3">
            <Avatar name={doctor.full_name} size="md" />
            <div>
              <p className="font-semibold text-[15px] text-[#1A1A1A] dark:text-[#F0F0EE]">{doctor.full_name}</p>
              <p className="text-[13px] text-[#C8A96E]">{doctor.specialty}</p>
              {doctor.clinics && <p className="text-[12px] text-[#9CA3AF]">{doctor.clinics.name}</p>}
            </div>
          </div>
        )}

        {/* Date picker */}
        <div className="card p-4 space-y-3">
          <div className="flex items-center gap-2">
            <CalendarDays size={16} className="text-[#1A2B4A] dark:text-[#4A7FCC]" />
            <p className="font-semibold text-[15px] text-[#1A1A1A] dark:text-[#F0F0EE]">Выберите дату</p>
          </div>
          <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1">
            {dates.map(d => {
              const str = d.toISOString().split('T')[0]
              const dayName = d.toLocaleDateString('ru-RU', { weekday: 'short' })
              const dayNum = d.getDate()
              const month = d.toLocaleDateString('ru-RU', { month: 'short' })
              return (
                <button key={str} onClick={() => setSelectedDate(str)}
                  className={`flex-shrink-0 flex flex-col items-center px-3.5 py-3 rounded-xl border transition-all
                    ${selectedDate === str
                      ? 'bg-[#1A2B4A] dark:bg-[#4A7FCC] border-transparent text-white'
                      : 'border-[#E8E8E6] dark:border-[#2A3040] text-[#1A1A1A] dark:text-[#F0F0EE]'}`}>
                  <span className="text-[10px] uppercase font-semibold opacity-70">{dayName}</span>
                  <span className="text-[18px] font-bold leading-tight">{dayNum}</span>
                  <span className="text-[10px] opacity-70">{month}</span>
                </button>
              )
            })}
          </div>
        </div>

        {/* Time picker */}
        {selectedDate && (
          <div className="card p-4 space-y-3">
            <div className="flex items-center gap-2">
              <Clock size={16} className="text-[#1A2B4A] dark:text-[#4A7FCC]" />
              <p className="font-semibold text-[15px] text-[#1A1A1A] dark:text-[#F0F0EE]">Выберите время</p>
            </div>
            <div className="grid grid-cols-4 gap-2">
              {TIMES.map(t => (
                <button key={t} onClick={() => setSelectedTime(t)}
                  className={`py-2.5 rounded-xl text-[13px] font-semibold border transition-all
                    ${selectedTime === t
                      ? 'bg-[#1A2B4A] dark:bg-[#4A7FCC] border-transparent text-white'
                      : 'border-[#E8E8E6] dark:border-[#2A3040] text-[#1A1A1A] dark:text-[#F0F0EE]'}`}>
                  {t}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Notes */}
        {selectedTime && (
          <div className="card p-4 space-y-2">
            <p className="font-semibold text-[15px] text-[#1A1A1A] dark:text-[#F0F0EE]">
              Примечание <span className="text-[#9CA3AF] font-normal text-[13px]">(необязательно)</span>
            </p>
            <textarea value={notes} onChange={e => setNotes(e.target.value)}
              className="input-field h-20 resize-none text-[13px]"
              placeholder="Опишите причину визита или особые пожелания..." />
          </div>
        )}

        {!user && (
          <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl p-3">
            <p className="text-[13px] text-amber-700 dark:text-amber-400">
              Для записи необходимо войти в аккаунт
            </p>
          </div>
        )}

        <button onClick={user ? submit : () => navigate('/login')}
          disabled={loading || !selectedDate || !selectedTime}
          className="btn-primary w-full">
          {loading ? (
            <span className="flex items-center justify-center gap-2">
              <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              Запись...
            </span>
          ) : user ? 'Записаться' : 'Войти и записаться'}
        </button>
      </div>
    </div>
  )
}
