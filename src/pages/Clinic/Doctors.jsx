import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../context/AuthContext'
import Header from '../../components/Layout/Header'
import BottomNav from '../../components/Layout/BottomNav'
import { Avatar } from '../../components/DoctorCard'
import { RatingDisplay } from '../../components/RatingStars'
import { PlusCircle, Star, Users, AlertCircle } from 'lucide-react'

export default function ClinicDoctors() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [clinic, setClinic] = useState(null)
  const [doctors, setDoctors] = useState([])
  const [loading, setLoading] = useState(true)
  const [showAdd, setShowAdd] = useState(false)
  const [form, setForm] = useState({ full_name: '', specialty: '', experience_years: '', bio: '' })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => { if (user) fetchData() }, [user])

  async function fetchData() {
    try {
      const { data: c, error: ce } = await supabase
        .from('clinics').select('*').eq('admin_id', user.id).maybeSingle()
      setClinic(c)
      if (c) {
        const { data: docs } = await supabase
          .from('doctors').select('*').eq('clinic_id', c.id)
          .order('total_rating', { ascending: false })
        setDoctors(docs || [])
      }
    } catch(e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  async function addDoctor() {
    if (!form.full_name.trim() || !form.specialty.trim()) {
      setError('Заполните ФИО и специализацию')
      return
    }
    if (!clinic) {
      setError('Сначала создайте клинику')
      return
    }
    setSaving(true)
    setError('')
    try {
      const { data, error: insertErr } = await supabase.from('doctors').insert({
        full_name: form.full_name.trim(),
        specialty: form.specialty.trim(),
        bio: form.bio.trim() || null,
        experience_years: parseInt(form.experience_years) || 0,
        clinic_id: clinic.id
      }).select().single()

      if (insertErr) throw insertErr

      setDoctors(prev => [data, ...prev])
      setForm({ full_name: '', specialty: '', experience_years: '', bio: '' })
      setShowAdd(false)
    } catch(e) {
      setError(e.message || 'Ошибка добавления врача')
    } finally {
      setSaving(false)
    }
  }

  async function toggleActive(doctor) {
    await supabase.from('doctors').update({ is_active: !doctor.is_active }).eq('id', doctor.id)
    setDoctors(prev => prev.map(d => d.id === doctor.id ? { ...d, is_active: !d.is_active } : d))
  }

  if (loading) return (
    <div className="page-container flex items-center justify-center">
      <div className="w-8 h-8 border-2 border-[#1A2B4A] border-t-transparent rounded-full animate-spin" />
    </div>
  )

  // Нет клиники — редирект на создание
  if (!clinic) return (
    <div className="page-container">
      <Header back title="Врачи" />
      <div className="px-4 pt-16 flex flex-col items-center gap-4 text-center">
        <span className="text-5xl">🏥</span>
        <p className="font-semibold text-[18px] text-[#1A1A1A] dark:text-[#F0F0EE]">Сначала создайте клинику</p>
        <p className="text-[14px] text-[#9CA3AF]">Чтобы добавлять врачей, нужен профиль клиники</p>
        <button onClick={() => navigate('/clinic/setup')} className="btn-primary px-8">
          Создать клинику
        </button>
      </div>
      <BottomNav />
    </div>
  )

  return (
    <div className="page-container">
      <Header back title="Врачи" />

      <div className="px-4 pt-4 space-y-4 animate-in">
        <button onClick={() => { setShowAdd(!showAdd); setError('') }}
          className="btn-primary w-full flex items-center justify-center gap-2">
          <PlusCircle size={18} />
          {showAdd ? 'Закрыть форму' : 'Добавить врача'}
        </button>

        {showAdd && (
          <div className="card p-5 space-y-3 animate-in">
            <p className="font-semibold text-[15px] text-[#1A1A1A] dark:text-[#F0F0EE]">Новый врач</p>

            <div>
              <label className="block text-[12px] font-medium text-[#6B7280] dark:text-[#8899AA] mb-1">
                ФИО врача *
              </label>
              <input
                value={form.full_name}
                onChange={e => setForm(f => ({ ...f, full_name: e.target.value }))}
                className="input-field"
                placeholder="Иванов Иван Иванович"
              />
            </div>

            <div>
              <label className="block text-[12px] font-medium text-[#6B7280] dark:text-[#8899AA] mb-1">
                Специализация *
              </label>
              <input
                value={form.specialty}
                onChange={e => setForm(f => ({ ...f, specialty: e.target.value }))}
                className="input-field"
                placeholder="Терапевт, Кардиолог..."
              />
            </div>

            <div>
              <label className="block text-[12px] font-medium text-[#6B7280] dark:text-[#8899AA] mb-1">
                Опыт (лет)
              </label>
              <input
                value={form.experience_years}
                onChange={e => setForm(f => ({ ...f, experience_years: e.target.value }))}
                className="input-field"
                placeholder="5"
                type="number"
                min="0"
              />
            </div>

            <div>
              <label className="block text-[12px] font-medium text-[#6B7280] dark:text-[#8899AA] mb-1">
                Описание
              </label>
              <textarea
                value={form.bio}
                onChange={e => setForm(f => ({ ...f, bio: e.target.value }))}
                className="input-field h-20 resize-none"
                placeholder="Краткое описание врача..."
              />
            </div>

            {error && (
              <div className="flex items-center gap-2 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-3">
                <AlertCircle size={15} className="text-red-500 flex-shrink-0" />
                <p className="text-[13px] text-red-600 dark:text-red-400">{error}</p>
              </div>
            )}

            <div className="flex gap-3">
              <button onClick={() => { setShowAdd(false); setError('') }} className="btn-secondary flex-1">
                Отмена
              </button>
              <button
                onClick={addDoctor}
                disabled={saving || !form.full_name.trim() || !form.specialty.trim()}
                className="btn-primary flex-1"
              >
                {saving
                  ? <span className="flex items-center justify-center gap-2">
                      <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Добавление...
                    </span>
                  : 'Добавить'
                }
              </button>
            </div>
          </div>
        )}

        {doctors.length > 0 ? (
          <div className="space-y-3">
            {doctors.map(d => (
              <div key={d.id} className="card p-4">
                <div className="flex items-start gap-3">
                  <Avatar name={d.full_name} size="md" />
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-[14px] text-[#1A1A1A] dark:text-[#F0F0EE]">{d.full_name}</p>
                    <p className="text-[13px] text-[#C8A96E] font-medium">{d.specialty}</p>
                    {d.experience_years > 0 && (
                      <p className="text-[12px] text-[#9CA3AF]">Опыт: {d.experience_years} лет</p>
                    )}
                    <RatingDisplay value={d.total_rating} size={11} count={d.review_count} />
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <button onClick={() => toggleActive(d)}
                      className={`text-[11px] font-semibold px-2.5 py-1 rounded-lg transition-colors
                        ${d.is_active ? 'badge-approved' : 'badge-rejected'}`}>
                      {d.is_active ? 'Активен' : 'Неактивен'}
                    </button>
                    <button onClick={() => navigate(`/doctor/${d.id}`)}
                      className="flex items-center gap-1 text-[12px] text-[#9CA3AF]">
                      <Star size={11} /> Профиль
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : !showAdd && (
          <div className="card py-12 flex flex-col items-center gap-3 text-center">
            <Users size={40} className="text-[#E5E7EB] dark:text-[#2A3040]" />
            <p className="font-semibold text-[15px] text-[#1A1A1A] dark:text-[#F0F0EE]">Нет врачей</p>
            <p className="text-[13px] text-[#9CA3AF]">Нажмите «Добавить врача» выше</p>
          </div>
        )}

        <div className="h-4" />
      </div>
      <BottomNav />
    </div>
  )
}
