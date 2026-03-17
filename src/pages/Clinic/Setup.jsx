import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../context/AuthContext'
import Header from '../../components/Layout/Header'
import { Building2, MapPin, Phone, Clock } from 'lucide-react'

const CATEGORIES = ['Терапия', 'Стоматология', 'Кардиология', 'Хирургия', 'Педиатрия', 'Неврология', 'Офтальмология', 'Гинекология', 'Урология', 'ЛОР']

export default function ClinicSetup() {
  const { user, refreshProfile } = useAuth()
  const navigate = useNavigate()
  const [form, setForm] = useState({
    name: '', address: '', city: 'Алматы', description: '', phone: '', working_hours: '09:00–18:00'
  })
  const [selectedCats, setSelectedCats] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))
  const toggleCat = (c) => setSelectedCats(prev => prev.includes(c) ? prev.filter(x => x !== c) : [...prev, c])

  const submit = async (e) => {
    e.preventDefault()
    if (!form.name || !form.address) return setError('Заполните обязательные поля')
    setLoading(true)
    try {
      await supabase.from('clinics').insert({
        ...form,
        categories: selectedCats,
        admin_id: user.id
      })
      await refreshProfile()
      navigate('/clinic/dashboard')
    } catch (err) {
      setError(err.message || 'Ошибка создания клиники')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#FAFAF9] dark:bg-[#0F1419] pb-8">
      <Header back title="Создать клинику" />

      <div className="px-4 pt-4 space-y-4 animate-in">
        <div className="bg-gradient-to-br from-[#1A2B4A] to-[#2A4A7A] rounded-2xl p-4 flex items-center gap-3">
          <div className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center">
            <Building2 size={20} className="text-white" />
          </div>
          <div>
            <p className="font-semibold text-white text-[14px]">Профиль клиники</p>
            <p className="text-white/60 text-[12px]">Заполните данные для регистрации</p>
          </div>
        </div>

        <form onSubmit={submit} className="space-y-4">
          <div className="card p-5 space-y-4">
            <p className="font-semibold text-[15px] text-[#1A1A1A] dark:text-[#F0F0EE]">Основная информация</p>
            <div>
              <label className="block text-[13px] font-medium text-[#6B7280] dark:text-[#8899AA] mb-1.5">Название клиники *</label>
              <input required className="input-field" placeholder="Медицинский центр «Здоровье»"
                value={form.name} onChange={e => set('name', e.target.value)} />
            </div>
            <div>
              <label className="block text-[13px] font-medium text-[#6B7280] dark:text-[#8899AA] mb-1.5">Описание</label>
              <textarea className="input-field h-20 resize-none" placeholder="Краткое описание клиники..."
                value={form.description} onChange={e => set('description', e.target.value)} />
            </div>
          </div>

          <div className="card p-5 space-y-4">
            <p className="font-semibold text-[15px] text-[#1A1A1A] dark:text-[#F0F0EE]">Адрес и контакты</p>
            <div className="relative">
              <MapPin size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-[#9CA3AF]" />
              <input required className="input-field pl-10" placeholder="Адрес *"
                value={form.address} onChange={e => set('address', e.target.value)} />
            </div>
            <input className="input-field" placeholder="Город"
              value={form.city} onChange={e => set('city', e.target.value)} />
            <div className="relative">
              <Phone size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-[#9CA3AF]" />
              <input className="input-field pl-10" placeholder="+7 (777) 000-00-00" type="tel"
                value={form.phone} onChange={e => set('phone', e.target.value)} />
            </div>
            <div className="relative">
              <Clock size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-[#9CA3AF]" />
              <input className="input-field pl-10" placeholder="08:00–20:00"
                value={form.working_hours} onChange={e => set('working_hours', e.target.value)} />
            </div>
          </div>

          <div className="card p-5 space-y-3">
            <p className="font-semibold text-[15px] text-[#1A1A1A] dark:text-[#F0F0EE]">Специализации</p>
            <div className="flex flex-wrap gap-2">
              {CATEGORIES.map(c => (
                <button key={c} type="button" onClick={() => toggleCat(c)}
                  className={`px-3 py-1.5 rounded-xl text-[13px] font-medium border transition-all
                    ${selectedCats.includes(c)
                      ? 'bg-[#1A2B4A] dark:bg-[#4A7FCC] border-transparent text-white'
                      : 'border-[#E8E8E6] dark:border-[#2A3040] text-[#6B7280] dark:text-[#8899AA]'}`}>
                  {c}
                </button>
              ))}
            </div>
          </div>

          {error && (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 text-[13px] rounded-xl p-3">{error}</div>
          )}

          <button type="submit" disabled={loading} className="btn-primary w-full">
            {loading ? 'Создание...' : 'Создать клинику'}
          </button>
        </form>
      </div>
    </div>
  )
}
