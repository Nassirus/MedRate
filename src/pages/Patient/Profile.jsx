import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { supabase } from '../../lib/supabase'
import Header from '../../components/Layout/Header'
import BottomNav from '../../components/Layout/BottomNav'
import { Avatar } from '../../components/DoctorCard'
import { useTheme } from '../../context/ThemeContext'
import {
  User, Phone, BadgeCheck, QrCode, Star, Tag, ChevronRight,
  Moon, Sun, LogOut, Settings, ShieldCheck, Edit3
} from 'lucide-react'

export default function Profile() {
  const { user, profile, signOut, refreshProfile } = useAuth()
  const { dark, toggle } = useTheme()
  const navigate = useNavigate()
  const [editing, setEditing] = useState(false)
  const [form, setForm] = useState({ full_name: profile?.full_name || '', phone: profile?.phone || '' })
  const [saving, setSaving] = useState(false)

  if (!user) return (
    <div className="page-container">
      <Header title="Профиль" />
      <div className="px-4 pt-20 flex flex-col items-center gap-4 text-center">
        <span className="text-5xl">👤</span>
        <p className="font-semibold text-[18px] text-[#1A1A1A] dark:text-[#F0F0EE]">Войдите в аккаунт</p>
        <button onClick={() => navigate('/login')} className="btn-primary px-8">Войти</button>
        <button onClick={() => navigate('/register')} className="btn-secondary px-8">Зарегистрироваться</button>
      </div>
      <BottomNav />
    </div>
  )

  const handleSave = async () => {
    setSaving(true)
    await supabase.from('profiles').update(form).eq('id', user.id)
    await refreshProfile()
    setSaving(false)
    setEditing(false)
  }

  const discountPercent = Math.min(
    Math.floor((profile?.reviews_count || 0) / Math.max(profile?.visits_count || 1, 1) * 10),
    10
  )

  return (
    <div className="page-container">
      <Header title="Профиль" />

      <div className="px-4 pt-4 space-y-4 animate-in">
        {/* Profile card */}
        <div className="card p-5">
          <div className="flex items-center gap-4">
            <Avatar name={profile?.full_name || user.email || ''} size="xl" />
            <div className="flex-1 min-w-0">
              <p className="font-serif text-[20px] text-[#1A1A1A] dark:text-[#F0F0EE] leading-tight">
                {profile?.full_name || 'Пользователь'}
              </p>
              <p className="text-[13px] text-[#9CA3AF] mt-0.5">{user.email}</p>
              <div className="flex items-center gap-1.5 mt-2">
                <span className={`text-[11px] font-semibold px-2.5 py-1 rounded-lg
                  ${profile?.role === 'clinic_admin' ? 'badge-review'
                  : profile?.role === 'moderator' ? 'bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-400'
                  : 'badge-approved'}`}>
                  {profile?.role === 'clinic_admin' ? 'Клиника' : profile?.role === 'moderator' ? 'Модератор' : 'Пациент'}
                </span>
                {profile?.iin && (
                  <span className="flex items-center gap-1 text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold">
                    <BadgeCheck size={12} /> Верифицирован
                  </span>
                )}
              </div>
            </div>
            <button onClick={() => setEditing(!editing)}
              className="w-9 h-9 flex items-center justify-center rounded-full bg-[#F0F0EE] dark:bg-[#2A3040]">
              <Edit3 size={16} className="text-[#6B7280]" />
            </button>
          </div>

          {editing && (
            <div className="mt-4 space-y-3 border-t border-[#E8E8E6] dark:border-[#2A3040] pt-4">
              <input value={form.full_name} onChange={e => setForm(f => ({ ...f, full_name: e.target.value }))}
                className="input-field" placeholder="ФИО" />
              <input value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))}
                className="input-field" placeholder="Телефон" type="tel" />
              <div className="flex gap-3">
                <button onClick={() => setEditing(false)} className="btn-secondary flex-1 text-[14px] py-2.5">Отмена</button>
                <button onClick={handleSave} disabled={saving} className="btn-primary flex-1 text-[14px] py-2.5">
                  {saving ? 'Сохранение...' : 'Сохранить'}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-3">
          {[
            { label: 'Визиты', value: profile?.visits_count || 0, icon: QrCode, color: 'text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20' },
            { label: 'Отзывы', value: profile?.reviews_count || 0, icon: Star, color: 'text-[#C8A96E] bg-amber-50 dark:bg-amber-900/20' },
            { label: 'Скидка', value: `${discountPercent}%`, icon: Tag, color: 'text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/20' },
          ].map(({ label, value, icon: Icon, color }) => (
            <div key={label} className="card p-4 flex flex-col items-center gap-2 text-center">
              <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${color}`}>
                <Icon size={18} />
              </div>
              <p className="font-bold text-[20px] text-[#1A1A1A] dark:text-[#F0F0EE]">{value}</p>
              <p className="text-[11px] text-[#9CA3AF]">{label}</p>
            </div>
          ))}
        </div>

        {/* Discount info */}
        {discountPercent > 0 && (
          <div className="bg-gradient-to-br from-[#C8A96E] to-[#B8954A] rounded-2xl p-4 text-white">
            <div className="flex items-center gap-2 mb-1">
              <Tag size={16} />
              <span className="font-semibold text-[14px]">Ваша скидка: {discountPercent}%</span>
            </div>
            <p className="text-[12px] text-white/80">
              Начисляется за активность — оставляйте больше отзывов для увеличения скидки
            </p>
          </div>
        )}

        {/* Settings sections */}
        <div className="card overflow-hidden">
          <p className="px-4 pt-4 section-title">Настройки</p>
          <div className="divide-y divide-[#F0F0EE] dark:divide-[#2A3040]">
            {[
              {
                icon: dark ? Sun : Moon, label: dark ? 'Светлый режим' : 'Тёмный режим',
                action: toggle, color: 'text-[#6B7280]'
              },
              {
                icon: ShieldCheck, label: 'Безопасность и конфиденциальность',
                action: () => {}, color: 'text-[#6B7280]'
              },
              {
                icon: Settings, label: 'Настройки уведомлений',
                action: () => {}, color: 'text-[#6B7280]'
              },
            ].map(({ icon: Icon, label, action, color }) => (
              <button key={label} onClick={action}
                className="w-full flex items-center justify-between px-4 py-4 active:bg-[#F5F5F3] dark:active:bg-[#252D3D] transition-colors">
                <div className="flex items-center gap-3">
                  <Icon size={18} className={color} />
                  <span className="text-[14px] text-[#1A1A1A] dark:text-[#F0F0EE]">{label}</span>
                </div>
                <ChevronRight size={16} className="text-[#9CA3AF]" />
              </button>
            ))}
          </div>
        </div>

        {/* Sign out */}
        <button onClick={() => { signOut(); navigate('/login') }}
          className="w-full flex items-center justify-center gap-2 py-4 rounded-2xl border border-red-200 dark:border-red-800 text-red-500 dark:text-red-400 font-medium text-[14px] active:scale-[0.99] transition-transform">
          <LogOut size={18} />
          Выйти из аккаунта
        </button>

        <div className="h-4" />
      </div>

      <BottomNav />
    </div>
  )
}
