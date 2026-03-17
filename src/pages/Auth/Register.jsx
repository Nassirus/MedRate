import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { Eye, EyeOff, ChevronDown } from 'lucide-react'
import { MedRateLogo } from '../../components/Layout/Header'

export default function Register() {
  const { signUp } = useAuth()
  const navigate = useNavigate()
  const [step, setStep] = useState(1)
  const [form, setForm] = useState({
    email: '', password: '', fullName: '', iin: '', phone: '', role: 'patient'
  })
  const [showPw, setShowPw] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  const nextStep = (e) => {
    e.preventDefault()
    setError('')
    if (step === 1) {
      if (!form.fullName || !form.phone) return setError('Заполните все поля')
      if (form.iin && form.iin.length !== 12) return setError('ИИН должен содержать 12 цифр')
      setStep(2)
    }
  }

  const submit = async (e) => {
    e.preventDefault()
    setError('')
    if (form.password.length < 6) return setError('Пароль минимум 6 символов')
    setLoading(true)
    try {
      await signUp(form)
      navigate('/home')
    } catch (err) {
      setError(err.message || 'Ошибка регистрации')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#FAFAF9] dark:bg-[#0F1419] flex flex-col">
      <div className="h-40 bg-gradient-to-br from-[#1A2B4A] to-[#2A4A7A] flex flex-col items-center justify-center gap-3">
        <div className="flex items-center gap-2">
          <MedRateLogo size={36} className="[&_path]:stroke-white" />
          <span className="font-serif text-[28px] text-white tracking-wide">MedRate</span>
        </div>
        <div className="flex gap-2">
          {[1, 2].map(i => (
            <div key={i} className={`h-1 rounded-full transition-all duration-300
              ${i === step ? 'w-8 bg-[#C8A96E]' : i < step ? 'w-4 bg-white/60' : 'w-4 bg-white/20'}`} />
          ))}
        </div>
      </div>

      <div className="flex-1 px-5 -mt-6">
        <div className="card p-6 animate-in">
          <h2 className="font-serif text-[22px] text-[#1A1A1A] dark:text-[#F0F0EE] mb-1">
            {step === 1 ? 'Личные данные' : 'Аккаунт'}
          </h2>
          <p className="text-[13px] text-[#9CA3AF] mb-6">Шаг {step} из 2</p>

          {step === 1 ? (
            <form onSubmit={nextStep} className="space-y-4">
              {/* Role selector */}
              <div>
                <label className="block text-[13px] font-medium text-[#6B7280] dark:text-[#8899AA] mb-1.5">Тип аккаунта</label>
                <div className="relative">
                  <select value={form.role} onChange={e => set('role', e.target.value)}
                    className="input-field appearance-none pr-10">
                    <option value="patient">Пациент</option>
                    <option value="clinic_admin">Администратор клиники</option>
                  </select>
                  <ChevronDown size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#9CA3AF] pointer-events-none" />
                </div>
              </div>

              <div>
                <label className="block text-[13px] font-medium text-[#6B7280] dark:text-[#8899AA] mb-1.5">ФИО</label>
                <input type="text" required className="input-field" placeholder="Иванов Иван Иванович"
                  value={form.fullName} onChange={e => set('fullName', e.target.value)} />
              </div>

              <div>
                <label className="block text-[13px] font-medium text-[#6B7280] dark:text-[#8899AA] mb-1.5">
                  Телефон
                </label>
                <input type="tel" required className="input-field" placeholder="+7 (777) 000-00-00"
                  value={form.phone} onChange={e => set('phone', e.target.value)} />
              </div>

              {form.role === 'patient' && (
                <div>
                  <label className="block text-[13px] font-medium text-[#6B7280] dark:text-[#8899AA] mb-1.5">
                    ИИН <span className="text-[#9CA3AF] font-normal">(необязательно)</span>
                  </label>
                  <input type="text" maxLength={12} className="input-field" placeholder="123456789012"
                    value={form.iin} onChange={e => set('iin', e.target.value.replace(/\D/g, ''))} />
                  <p className="text-[11px] text-[#9CA3AF] mt-1">Используется для верификации личности</p>
                </div>
              )}

              {error && <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 text-[13px] rounded-xl p-3">{error}</div>}
              <button type="submit" className="btn-primary w-full">Далее →</button>
            </form>
          ) : (
            <form onSubmit={submit} className="space-y-4">
              <div>
                <label className="block text-[13px] font-medium text-[#6B7280] dark:text-[#8899AA] mb-1.5">Email</label>
                <input type="email" required className="input-field" placeholder="example@mail.com"
                  value={form.email} onChange={e => set('email', e.target.value)} />
              </div>

              <div>
                <label className="block text-[13px] font-medium text-[#6B7280] dark:text-[#8899AA] mb-1.5">Пароль</label>
                <div className="relative">
                  <input type={showPw ? 'text' : 'password'} required className="input-field pr-12"
                    placeholder="Минимум 6 символов"
                    value={form.password} onChange={e => set('password', e.target.value)} />
                  <button type="button" onClick={() => setShowPw(!showPw)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[#9CA3AF]">
                    {showPw ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              {error && <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 text-[13px] rounded-xl p-3">{error}</div>}

              <div className="flex gap-3">
                <button type="button" onClick={() => setStep(1)} className="btn-secondary flex-1">← Назад</button>
                <button type="submit" disabled={loading} className="btn-primary flex-1">
                  {loading ? <span className="flex items-center justify-center gap-2">
                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Создание...
                  </span> : 'Создать аккаунт'}
                </button>
              </div>
            </form>
          )}

          <div className="mt-6 text-center">
            <span className="text-[14px] text-[#6B7280] dark:text-[#8899AA]">Уже есть аккаунт? </span>
            <Link to="/login" className="text-[14px] font-semibold text-[#1A2B4A] dark:text-[#4A7FCC]">Войти</Link>
          </div>
        </div>
      </div>
    </div>
  )
}
