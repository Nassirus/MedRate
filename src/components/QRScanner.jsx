import { useEffect, useRef, useState } from 'react'
import { Html5Qrcode } from 'html5-qrcode'
import { X } from 'lucide-react'

export default function QRScanner({ onScan, onClose }) {
  const scannerRef = useRef(null)
  const [error, setError] = useState(null)
  const [scanning, setScanning] = useState(false)

  useEffect(() => {
    const scanner = new Html5Qrcode('qr-reader')
    scannerRef.current = scanner

    scanner.start(
      { facingMode: 'environment' },
      { fps: 10, qrbox: { width: 250, height: 250 } },
      (decodedText) => {
        scanner.stop().catch(() => {})
        onScan(decodedText)
      },
      () => {}
    ).then(() => setScanning(true))
    .catch(err => {
      setError('Нет доступа к камере. Разрешите использование камеры в настройках браузера.')
      console.error(err)
    })

    return () => {
      scanner.stop().catch(() => {})
    }
  }, [])

  return (
    <div className="fixed inset-0 z-50 bg-black flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-4 pt-safe">
        <span className="text-white font-semibold text-[17px]">Сканировать QR</span>
        <button onClick={onClose}
          className="w-9 h-9 bg-white/10 rounded-full flex items-center justify-center">
          <X size={20} className="text-white" />
        </button>
      </div>

      {/* Scanner */}
      <div className="flex-1 flex flex-col items-center justify-center gap-6 px-8">
        {error ? (
          <div className="text-center space-y-4">
            <div className="text-6xl">📷</div>
            <p className="text-white/80 text-[15px]">{error}</p>
            <button onClick={onClose} className="btn-secondary">Закрыть</button>
          </div>
        ) : (
          <>
            <div className="relative w-full max-w-[280px] aspect-square">
              <div id="qr-reader" className="w-full h-full rounded-2xl overflow-hidden" />
              {/* Corner overlay */}
              {['top-0 left-0', 'top-0 right-0', 'bottom-0 left-0', 'bottom-0 right-0'].map((pos, i) => (
                <div key={i} className={`absolute ${pos} w-8 h-8 border-[3px] border-[#C8A96E]
                  ${i === 0 ? 'rounded-tl-xl border-r-0 border-b-0'
                  : i === 1 ? 'rounded-tr-xl border-l-0 border-b-0'
                  : i === 2 ? 'rounded-bl-xl border-r-0 border-t-0'
                  : 'rounded-br-xl border-l-0 border-t-0'}`} />
              ))}
              {scanning && (
                <div className="absolute top-0 left-0 right-0 h-0.5 bg-[#C8A96E] animate-bounce" />
              )}
            </div>
            <p className="text-white/70 text-[14px] text-center">
              Наведите камеру на QR-код в регистратуре клиники
            </p>
          </>
        )}
      </div>
    </div>
  )
}
