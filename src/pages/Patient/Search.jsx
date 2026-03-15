import { useState, useEffect, useRef } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { searchAssistant } from '../../lib/gemini'
import Header from '../../components/Layout/Header'
import BottomNav from '../../components/Layout/BottomNav'
import DoctorCard from '../../components/DoctorCard'
import { RatingDisplay } from '../../components/RatingStars'
import { Search, SlidersHorizontal, Sparkles, ChevronRight, X } from 'lucide-react'

const TABS = [
  { id: 'doctors', label: 'Врачи' },
  { id: 'clinics', label: 'Клиники' },
]

export default function SearchPage() {
  const [params] = useSearchParams()
  const navigate = useNavigate()
  const [tab, setTab] = useState(params.get('tab') || 'doctors')
  const [query, setQuery] = useState(params.get('q') || '')
  const [doctors, setDoctors] = useState([])
  const [clinics, setClinics] = useState([])
  const [loading, setLoading] = useState(false)
  const [aiSuggestion, setAiSuggestion] = useState(null)
  const [sortBy, setSortBy] = useState('rating')
  const timerRef = useRef(null)

  useEffect(() => {
    fetchAll()
  }, [tab, sortBy])

  useEffect(() => {
    clearTimeout(timerRef.current)
    timerRef.current = setTimeout(() => {
      fetchAll()
      if (query.length > 3) {
        searchAssistant(query).then(r => r.suggestion ? setAiSuggestion(r) : setAiSuggestion(null))
      } else {
        setAiSuggestion(null)
      }
    }, 400)
  }, [query])

  async function fetchAll() {
    setLoading(true)
    try {
      if (tab === 'doctors') {
        let q = supabase.from('doctors').select('*, clinics(name)').eq('is_active', true)
        if (query) q = q.ilike('full_name', `%${query}%`)
        if (sortBy === 'rating') q = q.order('total_rating', { ascending: false })
        else q = q.order('review_count', { ascending: false })
        const { data } = await q.limit(30)
        setDoctors(data || [])
      } else {
        let q = supabase.from('clinics').select('*')
        if (query) q = q.ilike('name', `%${query}%`)
        if (sortBy === 'rating') q = q.order('clinic_rating', { ascending: false })
        else q = q.order('review_count', { ascending: false })
        const { data } = await q.limit(30)
        setClinics(data || [])
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="page-container">
      <Header title="Поиск" />

      <div className="px-4 pt-4 space-y-4 animate-in">
        {/* Search input */}
        <div className="relative">
          <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-[#9CA3AF]" />
          <input
            type="search"
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder={tab === 'doctors' ? 'Врач, специализация...' : 'Название клиники...'}
            className="input-field pl-11 pr-10"
          />
          {query && (
            <button onClick={() => setQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-[#9CA3AF]">
              <X size={16} />
            </button>
          )}
        </div>

        {/* AI suggestion */}
        {aiSuggestion && (
          <div className="bg-[#EEF2F9] dark:bg-[#1A2B4A]/30 rounded-xl p-3 flex items-start gap-2">
            <Sparkles size={14} className="text-[#C8A96E] flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-[12px] font-semibold text-[#1A2B4A] dark:text-[#4A7FCC]">
                ИИ: {aiSuggestion.specialty}
              </p>
              <p className="text-[12px] text-[#6B7280] dark:text-[#8899AA]">{aiSuggestion.suggestion}</p>
            </div>
          </div>
        )}

        {/* Tabs + sort */}
        <div className="flex items-center justify-between">
          <div className="flex bg-[#F0F0EE] dark:bg-[#1A2230] rounded-xl p-1 gap-1">
            {TABS.map(t => (
              <button key={t.id} onClick={() => setTab(t.id)}
                className={`px-4 py-2 rounded-lg text-[13px] font-semibold transition-all
                  ${tab === t.id
                    ? 'bg-white dark:bg-[#2A3040] text-[#1A1A1A] dark:text-[#F0F0EE] shadow-sm'
                    : 'text-[#9CA3AF]'
                  }`}>
                {t.label}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-1.5">
            <SlidersHorizontal size={14} className="text-[#9CA3AF]" />
            <select value={sortBy} onChange={e => setSortBy(e.target.value)}
              className="text-[13px] text-[#6B7280] dark:text-[#8899AA] bg-transparent border-none outline-none">
              <option value="rating">По рейтингу</option>
              <option value="reviews">По отзывам</option>
            </select>
          </div>
        </div>

        {/* Results */}
        {loading ? (
          <div className="space-y-3">
            {[1,2,3,4].map(i => (
              <div key={i} className="card h-24 animate-pulse-soft bg-[#F0F0EE] dark:bg-[#2A3040] rounded-2xl" />
            ))}
          </div>
        ) : tab === 'doctors' ? (
          doctors.length > 0 ? (
            <div className="space-y-3">
              {doctors.map(d => <DoctorCard key={d.id} doctor={d} />)}
            </div>
          ) : (
            <EmptySearch query={query} entity="врачей" />
          )
        ) : (
          clinics.length > 0 ? (
            <div className="space-y-3">
              {clinics.map(c => (
                <button key={c.id} onClick={() => navigate(`/clinic/${c.id}`)}
                  className="card p-4 w-full text-left flex items-center gap-3 active:scale-[0.99] transition-transform">
                  <div className="w-12 h-12 bg-gradient-to-br from-[#1A2B4A] to-[#2A4A7A] rounded-2xl flex items-center justify-center flex-shrink-0">
                    <span className="text-white font-bold text-[18px]">{c.name[0]}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-[14px] text-[#1A1A1A] dark:text-[#F0F0EE] truncate">{c.name}</p>
                    <p className="text-[12px] text-[#9CA3AF] truncate">{c.address} · {c.city}</p>
                    <RatingDisplay value={c.clinic_rating} size={11} count={c.review_count} />
                  </div>
                  <ChevronRight size={16} className="text-[#9CA3AF] flex-shrink-0" />
                </button>
              ))}
            </div>
          ) : (
            <EmptySearch query={query} entity="клиник" />
          )
        )}
        <div className="h-4" />
      </div>

      <BottomNav />
    </div>
  )
}

function EmptySearch({ query, entity }) {
  return (
    <div className="flex flex-col items-center gap-3 py-16 text-center">
      <span className="text-4xl">🔍</span>
      <p className="text-[15px] font-semibold text-[#1A1A1A] dark:text-[#F0F0EE]">
        {query ? `Ничего не найдено` : `Нет ${entity}`}
      </p>
      <p className="text-[13px] text-[#9CA3AF]">
        {query ? `По запросу «${query}» результатов нет` : `${entity} появятся после добавления`}
      </p>
    </div>
  )
}
