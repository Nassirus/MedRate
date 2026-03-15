import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { Eye, EyeOff } from 'lucide-react'
import { MedRateLogo } from '../../components/Layout/Header'

export default function Login() {
  const { signIn } = useAuth()
  const navigate = useNavigate()
  const [form, setForm] = useState({ email: '', password: '' })
  const [showPw, setShowPw] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handle = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await signIn(form)
      navigate('/home')
    } catch (err) {
      setError('Неверный email или пароль')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#FAFAF9] dark:bg-[#0F1419] flex flex-col">
      {/* Top decoration */}
      <div className="h-40 bg-gradient-to-br from-[#1A2B4A] to-[#2A4A7A] flex flex-col items-center justify-center gap-3">
        <div className="flex items-center gap-2">
          <MedRateLogo size={36} className="[&_path]:stroke-white" />
          <span className="font-serif text-[28px] text-white tracking-wide">MedRate</span>
        </div>
        <p className="text-white/60 text-[13px]">Прозрачный рейтинг врачей</p>
      </div>

      {/* Form card */}
      <div className="flex-1 px-5 -mt-6">
        <div className="card p-6 animate-in">
          <h2 className="font-serif text-[22px] text-[#1A1A1A] dark:text-[#F0F0EE] mb-6">Войти</h2>

          <form onSubmit={handle} className="space-y-4">
            <div>
              <label className="block text-[13px] font-medium text-[#6B7280] dark:text-[#8899AA] mb-1.5">
                Email
              </label>
              <input type="email" required
                className="input-field"
                placeholder="example@mail.com"
                value={form.email}
                onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
              />
            </div>

            <div>
              <label className="block text-[13px] font-medium text-[#6B7280] dark:text-[#8899AA] mb-1.5">
                Пароль
              </label>
              <div className="relative">
                <input type={showPw ? 'text' : 'password'} required
                  className="input-field pr-12"
                  placeholder="••••••••"
                  value={form.password}
                  onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                />
                <button type="button" onClick={() => setShowPw(!showPw)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#9CA3AF]">
                  {showPw ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            {error && (
              <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800
                text-red-600 dark:text-red-400 text-[13px] rounded-xl p-3">
                {error}
              </div>
            )}

            <button type="submit" disabled={loading} className="btn-primary w-full mt-2">
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Вход...
                </span>
              ) : 'Войти'}
            </button>
          </form>

          <div className="mt-6 text-center">
            <span className="text-[14px] text-[#6B7280] dark:text-[#8899AA]">Нет аккаунта? </span>
            <Link to="/register" className="text-[14px] font-semibold text-[#1A2B4A] dark:text-[#4A7FCC]">
              Зарегистрироваться
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
