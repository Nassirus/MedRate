import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../context/AuthContext'
import Header from '../../components/Layout/Header'
import BottomNav from '../../components/Layout/BottomNav'
import { QRCodeSVG } from 'qrcode.react'
import { Download, RefreshCw, Copy, CheckCheck } from 'lucide-react'

export default function ClinicQR() {
  const { user } = useAuth()
  const [clinic, setClinic] = useState(null)
  const [doctors, setDoctors] = useState([])
  const [selectedDoctor, setSelectedDoctor] = useState('all')
  const [qrToken, setQrToken] = useState(null)
  const [copied, setCopied] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchData()
  }, [user])

  async function fetchData() {
    const { data: c } = await supabase.from('clinics').select('*').eq('admin_id', user.id).single()
    setClinic(c)
    if (c) {
      const { data: docs } = await supabase.from('doctors').select('id, full_name, specialty').eq('clinic_id', c.id).eq('is_active', true)
      setDoctors(docs || [])
      generateToken(c.id, null)
    }
    setLoading(false)
  }

  function generateToken(clinicId, doctorId) {
    const token = `${Date.now()}-${Math.random().toString(36).substring(2, 10)}`
    setQrToken({ clinicId: clinicId || clinic?.id, doctorId, token })
  }

  const qrValue = qrToken
    ? JSON.stringify({
        clinic: qrToken.clinicId,
        doctor: qrToken.doctorId,
        token: qrToken.token
      })
    : ''

  const handleCopy = () => {
    navigator.clipboard.writeText(qrValue)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  if (loading) return (
    <div className="page-container flex items-center justify-center">
      <div className="w-8 h-8 border-2 border-[#1A2B4A] border-t-transparent rounded-full animate-spin" />
    </div>
  )

  return (
    <div className="page-container">
      <Header back title="QR-коды" />

      <div className="px-4 pt-4 space-y-5 animate-in">
        {/* Doctor selector */}
        <div className="card p-4 space-y-3">
          <p className="font-semibold text-[15px] text-[#1A1A1A] dark:text-[#F0F0EE]">Выберите врача</p>
          <div className="space-y-2">
            <button onClick={() => { setSelectedDoctor('all'); generateToken(clinic?.id, null) }}
              className={`w-full flex items-center justify-between px-4 py-3 rounded-xl border transition-colors
                ${selectedDoctor === 'all'
                  ? 'border-[#1A2B4A] dark:border-[#4A7FCC] bg-[#EEF2F9] dark:bg-[#1A2B4A]/20'
                  : 'border-[#E8E8E6] dark:border-[#2A3040]'}`}>
              <div className="text-left">
                <p className="text-[14px] font-semibold text-[#1A1A1A] dark:text-[#F0F0EE]">🏥 Общий QR клиники</p>
                <p className="text-[12px] text-[#9CA3AF]">Для регистратуры, без привязки к врачу</p>
              </div>
              {selectedDoctor === 'all' && <div className="w-5 h-5 bg-[#1A2B4A] dark:bg-[#4A7FCC] rounded-full flex items-center justify-center">
                <div className="w-2 h-2 bg-white rounded-full" />
              </div>}
            </button>

            {doctors.map(d => (
              <button key={d.id} onClick={() => { setSelectedDoctor(d.id); generateToken(clinic?.id, d.id) }}
                className={`w-full flex items-center justify-between px-4 py-3 rounded-xl border transition-colors
                  ${selectedDoctor === d.id
                    ? 'border-[#1A2B4A] dark:border-[#4A7FCC] bg-[#EEF2F9] dark:bg-[#1A2B4A]/20'
                    : 'border-[#E8E8E6] dark:border-[#2A3040]'}`}>
                <div className="text-left">
                  <p className="text-[14px] font-semibold text-[#1A1A1A] dark:text-[#F0F0EE]">{d.full_name}</p>
                  <p className="text-[12px] text-[#9CA3AF]">{d.specialty}</p>
                </div>
                {selectedDoctor === d.id && <div className="w-5 h-5 bg-[#1A2B4A] dark:bg-[#4A7FCC] rounded-full flex items-center justify-center">
                  <div className="w-2 h-2 bg-white rounded-full" />
                </div>}
              </button>
            ))}
          </div>
        </div>

        {/* QR Display */}
        {qrToken && (
          <div className="card p-6 flex flex-col items-center gap-5">
            <div>
              <p className="text-center font-semibold text-[15px] text-[#1A1A1A] dark:text-[#F0F0EE] mb-1">
                {clinic?.name}
              </p>
              {selectedDoctor !== 'all' && (
                <p className="text-center text-[13px] text-[#C8A96E]">
                  {doctors.find(d => d.id === selectedDoctor)?.full_name}
                </p>
              )}
            </div>

            {/* QR Code */}
            <div className="p-4 bg-white rounded-2xl shadow-card">
              <QRCodeSVG
                value={qrValue}
                size={220}
                level="H"
                includeMargin={false}
                fgColor="#1A2B4A"
              />
            </div>

            <p className="text-[12px] text-[#9CA3AF] text-center">
              Распечатайте или покажите этот QR-код пациентам после приёма
            </p>

            {/* Actions */}
            <div className="flex gap-3 w-full">
              <button onClick={() => generateToken(clinic?.id, selectedDoctor === 'all' ? null : selectedDoctor)}
                className="btn-secondary flex-1 flex items-center justify-center gap-2 text-[14px]">
                <RefreshCw size={15} /> Обновить
              </button>
              <button onClick={handleCopy}
                className="btn-secondary flex-1 flex items-center justify-center gap-2 text-[14px]">
                {copied ? <><CheckCheck size={15} className="text-emerald-500" /> Скопировано</> : <><Copy size={15} /> Скопировать</>}
              </button>
            </div>
          </div>
        )}

        {/* Usage tips */}
        <div className="card p-4 space-y-3">
          <p className="font-semibold text-[14px] text-[#1A1A1A] dark:text-[#F0F0EE]">💡 Как использовать</p>
          {[
            'Распечатайте QR-код и разместите на стойке регистрации',
            'Для каждого врача создайте отдельный QR на дверь кабинета',
            'Пациент сканирует QR после завершения приёма',
            'Через 1 час пациенту откроется возможность оставить отзыв',
          ].map((t, i) => (
            <div key={i} className="flex items-start gap-2">
              <div className="w-5 h-5 bg-[#EEF2F9] dark:bg-[#1A2B4A]/30 rounded-full flex items-center justify-center flex-shrink-0 text-[10px] font-bold text-[#1A2B4A] dark:text-[#4A7FCC] mt-0.5">
                {i + 1}
              </div>
              <p className="text-[13px] text-[#6B7280] dark:text-[#8899AA]">{t}</p>
            </div>
          ))}
        </div>

        <div className="h-4" />
      </div>

      <BottomNav />
    </div>
  )
}
