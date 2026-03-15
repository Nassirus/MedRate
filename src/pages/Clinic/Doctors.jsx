import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../context/AuthContext'
import Header from '../../components/Layout/Header'
import BottomNav from '../../components/Layout/BottomNav'
import { Avatar } from '../../components/DoctorCard'
import { RatingDisplay } from '../../components/RatingStars'
import { PlusCircle, Pencil, Star, Users } from 'lucide-react'

export default function ClinicDoctors() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [clinic, setClinic] = useState(null)
  const [doctors, setDoctors] = useState([])
  const [loading, setLoading] = useState(true)
  const [showAdd, setShowAdd] = useState(false)
  const [form, setForm] = useState({ full_name: '', specialty: '', experience_years: '', bio: '' })
  const [saving, setSaving] = useState(false)

  useEffect(() => { fetchData() }, [user])

  async function fetchData() {
    const { data: c } = await supabase.from('clinics').select('*').eq('admin_id', user.id).single()
    setClinic(c)
    if (c) {
      const { data: docs } = await supabase.from('doctors').select('*').eq('clinic_id', c.id).order('total_rating', { ascending: false })
      setDoctors(docs || [])
    }
    setLoading(false)
  }

  async function addDoctor() {
    if (!form.full_name || !form.specialty) return
    setSaving(true)
    try {
      const { data } = await supabase.from('doctors').insert({
        ...form,
        experience_years: parseInt(form.experience_years) || 0,
        clinic_id: clinic.id
      }).select().single()
      setDoctors(prev => [data, ...prev])
      setForm({ full_name: '', specialty: '', experience_years: '', bio: '' })
      setShowAdd(false)
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

  return (
    <div className="page-container">
      <Header back title="Врачи" />

      <div className="px-4 pt-4 space-y-4 animate-in">
        <button onClick={() => setShowAdd(!showAdd)}
          className="btn-primary w-full flex items-center justify-center gap-2">
          <PlusCircle size={18} /> Добавить врача
        </button>

        {showAdd && (
          <div className="card p-5 space-y-3">
            <p className="font-semibold text-[15px] text-[#1A1A1A] dark:text-[#F0F0EE]">Новый врач</p>
            <input value={form.full_name} onChange={e => setForm(f => ({ ...f, full_name: e.target.value }))}
              className="input-field" placeholder="ФИО врача *" />
            <input value={form.specialty} onChange={e => setForm(f => ({ ...f, specialty: e.target.value }))}
              className="input-field" placeholder="Специализация * (напр. Терапевт)" />
            <input value={form.experience_years} onChange={e => setForm(f => ({ ...f, experience_years: e.target.value }))}
              className="input-field" placeholder="Опыт (лет)" type="number" />
            <textarea value={form.bio} onChange={e => setForm(f => ({ ...f, bio: e.target.value }))}
              className="input-field h-20 resize-none" placeholder="Краткое описание (необязательно)" />
            <div className="flex gap-3">
              <button onClick={() => setShowAdd(false)} className="btn-secondary flex-1">Отмена</button>
              <button onClick={addDoctor} disabled={saving || !form.full_name || !form.specialty} className="btn-primary flex-1">
                {saving ? 'Добавление...' : 'Добавить'}
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
        ) : (
          <div className="card py-12 flex flex-col items-center gap-3 text-center">
            <Users size={40} className="text-[#E5E7EB] dark:text-[#2A3040]" />
            <p className="font-semibold text-[15px] text-[#1A1A1A] dark:text-[#F0F0EE]">Нет врачей</p>
            <p className="text-[13px] text-[#9CA3AF]">Добавьте первого врача в вашу клинику</p>
          </div>
        )}
        <div className="h-4" />
      </div>
      <BottomNav />
    </div>
  )
}
