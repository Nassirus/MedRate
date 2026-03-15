import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../context/AuthContext'
import Header from '../../components/Layout/Header'
import BottomNav from '../../components/Layout/BottomNav'
import QRScanner from '../../components/QRScanner'
import { QrCode, CheckCircle, XCircle, Clock, ScanLine } from 'lucide-react'

export default function ScanPage() {
  const { user, profile } = useAuth()
  const navigate = useNavigate()
  const [scanning, setScanning] = useState(false)
  const [result, setResult] = useState(null) // null | 'success' | 'error' | 'already'
  const [visitData, setVisitData] = useState(null)
  const [errorMsg, setErrorMsg] = useState('')
  const [processing, setProcessing] = useState(false)

  if (!user) return (
    <div className="page-container">
      <Header title="Сканировать QR" />
      <div className="px-4 pt-20 flex flex-col items-center gap-4 text-center">
        <span className="text-6xl">🔒</span>
        <p className="font-semibold text-[18px] text-[#1A1A1A] dark:text-[#F0F0EE]">Требуется авторизация</p>
        <p className="text-[14px] text-[#9CA3AF]">Войдите в аккаунт, чтобы сканировать QR-коды клиник</p>
        <button onClick={() => navigate('/login')} className="btn-primary px-8">Войти</button>
      </div>
      <BottomNav />
    </div>
  )

  const handleScan = async (rawText) => {
    setScanning(false)
    setProcessing(true)

    try {
      // QR format: medrate://visit?clinic={id}&doctor={id}&token={uuid}
      let clinicId, doctorId, token
      if (rawText.startsWith('medrate://')) {
        const url = new URL(rawText.replace('medrate://', 'https://'))
        clinicId = url.searchParams.get('clinic')
        doctorId = url.searchParams.get('doctor')
        token = url.searchParams.get('token')
      } else {
        // Try parse as JSON for demo
        const parsed = JSON.parse(rawText)
        clinicId = parsed.clinic
        doctorId = parsed.doctor
        token = parsed.token
      }

      if (!clinicId || !token) throw new Error('Неверный формат QR-кода')

      // Check if already scanned today
      const today = new Date().toISOString().split('T')[0]
      const { data: existing } = await supabase
        .from('visits')
        .select('id')
        .eq('patient_id', user.id)
        .eq('qr_token', token)
        .maybeSingle()

      if (existing) {
        setResult('already')
        return
      }

      // Create visit record
      const { data: visit, error } = await supabase.from('visits').insert({
        patient_id: user.id,
        clinic_id: clinicId,
        doctor_id: doctorId || null,
        qr_token: token,
      }).select(`
        *,
        clinics(name),
        doctors(full_name, specialty)
      `).single()

      if (error) throw error

      setVisitData(visit)
      setResult('success')

      // Update patient visits count
      await supabase.rpc('increment_visits', { user_id: user.id }).catch(() => {})

    } catch (e) {
      setErrorMsg(e.message || 'Не удалось распознать QR-код')
      setResult('error')
    } finally {
      setProcessing(false)
    }
  }

  const reset = () => {
    setResult(null)
    setVisitData(null)
    setErrorMsg('')
  }

  return (
    <div className="page-container">
      <Header title="QR-сканер" />

      {scanning && (
        <QRScanner onScan={handleScan} onClose={() => setScanning(false)} />
      )}

      <div className="px-4 pt-6 space-y-5 animate-in">
        {result === null && !processing && (
          <>
            {/* Main CTA */}
            <div className="card p-8 flex flex-col items-center gap-5 text-center">
              <div className="w-24 h-24 bg-gradient-to-br from-[#1A2B4A] to-[#2A4A7A] rounded-3xl flex items-center justify-center shadow-lg">
                <ScanLine size={44} className="text-white" />
              </div>
              <div>
                <h2 className="font-serif text-[22px] text-[#1A1A1A] dark:text-[#F0F0EE]">Сканировать QR</h2>
                <p className="text-[13px] text-[#9CA3AF] mt-2 leading-relaxed">
                  Попросите администратора клиники показать QR-код на стойке регистрации
                </p>
              </div>
              <button onClick={() => setScanning(true)} className="btn-primary w-full flex items-center justify-center gap-2">
                <QrCode size={18} />
                Открыть камеру
              </button>
            </div>

            {/* How it works */}
            <div>
              <p className="section-title mb-3">Как это работает</p>
              <div className="space-y-3">
                {[
                  { n: '1', title: 'Придите в клинику', desc: 'Зарегистрируйтесь на приём в регистратуре' },
                  { n: '2', title: 'Отсканируйте QR', desc: 'Наведите камеру на QR-код у стойки или у кабинета врача' },
                  { n: '3', title: 'Ожидайте 1 час', desc: 'После посещения можно будет оставить отзыв' },
                  { n: '4', title: 'Оцените врача', desc: 'Ваша оценка поможет другим пациентам' },
                ].map(({ n, title, desc }) => (
                  <div key={n} className="card p-4 flex items-start gap-3">
                    <div className="w-8 h-8 bg-[#1A2B4A] dark:bg-[#4A7FCC] text-white rounded-full flex items-center justify-center flex-shrink-0 text-[13px] font-bold">
                      {n}
                    </div>
                    <div>
                      <p className="font-semibold text-[14px] text-[#1A1A1A] dark:text-[#F0F0EE]">{title}</p>
                      <p className="text-[12px] text-[#9CA3AF] mt-0.5">{desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}

        {processing && (
          <div className="card p-10 flex flex-col items-center gap-4 text-center">
            <div className="w-12 h-12 border-3 border-[#1A2B4A] border-t-transparent rounded-full animate-spin" />
            <p className="text-[15px] font-semibold text-[#1A1A1A] dark:text-[#F0F0EE]">Обрабатываем QR-код...</p>
          </div>
        )}

        {result === 'success' && visitData && (
          <div className="card p-6 flex flex-col items-center gap-4 text-center animate-in">
            <div className="w-16 h-16 bg-emerald-100 dark:bg-emerald-900/30 rounded-full flex items-center justify-center">
              <CheckCircle size={32} className="text-emerald-600 dark:text-emerald-400" />
            </div>
            <div>
              <h2 className="font-serif text-[22px] text-[#1A1A1A] dark:text-[#F0F0EE]">Визит записан!</h2>
              <p className="text-[14px] text-[#9CA3AF] mt-1">{visitData.clinics?.name}</p>
              {visitData.doctors && (
                <p className="text-[13px] text-[#C8A96E] font-medium">{visitData.doctors.full_name}</p>
              )}
            </div>
            <div className="bg-amber-50 dark:bg-amber-900/20 rounded-xl p-3 w-full flex items-center gap-2">
              <Clock size={16} className="text-amber-600 dark:text-amber-400 flex-shrink-0" />
              <p className="text-[13px] text-amber-700 dark:text-amber-400">
                Вы сможете оставить отзыв через 1 час после визита
              </p>
            </div>
            <div className="flex gap-3 w-full">
              <button onClick={reset} className="btn-secondary flex-1">Сканировать ещё</button>
              <button onClick={() => navigate('/schedule')} className="btn-primary flex-1">Мои записи</button>
            </div>
          </div>
        )}

        {result === 'already' && (
          <div className="card p-6 flex flex-col items-center gap-4 text-center animate-in">
            <div className="w-16 h-16 bg-amber-100 dark:bg-amber-900/30 rounded-full flex items-center justify-center">
              <Clock size={32} className="text-amber-600 dark:text-amber-400" />
            </div>
            <div>
              <h2 className="font-serif text-[22px] text-[#1A1A1A] dark:text-[#F0F0EE]">Уже отсканировано</h2>
              <p className="text-[14px] text-[#9CA3AF] mt-1">Этот QR-код уже был использован вами ранее</p>
            </div>
            <button onClick={reset} className="btn-primary w-full">Вернуться</button>
          </div>
        )}

        {result === 'error' && (
          <div className="card p-6 flex flex-col items-center gap-4 text-center animate-in">
            <div className="w-16 h-16 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center">
              <XCircle size={32} className="text-red-500 dark:text-red-400" />
            </div>
            <div>
              <h2 className="font-serif text-[22px] text-[#1A1A1A] dark:text-[#F0F0EE]">Ошибка сканирования</h2>
              <p className="text-[13px] text-[#9CA3AF] mt-1">{errorMsg}</p>
            </div>
            <button onClick={reset} className="btn-primary w-full">Попробовать снова</button>
          </div>
        )}

        <div className="h-4" />
      </div>

      <BottomNav />
    </div>
  )
}
