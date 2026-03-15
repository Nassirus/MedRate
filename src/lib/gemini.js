const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY
const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`

/**
 * Analyze a review for moderation using Gemini AI.
 * Returns structured analysis with flags, summary, and recommendation.
 */
export async function analyzeReview({ text, scores, doctorName, clinicName }) {
  const prompt = `
Ты — система модерации медицинских отзывов для платформы MedRate (Казахстан).
Проанализируй следующий отзыв пациента и верни ТОЛЬКО JSON без markdown:

Врач: ${doctorName || 'Не указан'}
Клиника: ${clinicName || 'Не указана'}
Оценки: Коммуникация ${scores.communication}/5 | Профессионализм ${scores.professionalism}/5 | Клиника ${scores.clinic}/5
Текст отзыва: "${text || '(без текста)'}"

Верни JSON в формате:
{
  "recommendation": "approve" | "human_review" | "reject",
  "confidence": 0.0-1.0,
  "flags": ["список проблем если есть"],
  "summary": "краткое резюме отзыва на русском",
  "toxicity": false,
  "spam": false,
  "advertising": false,
  "inconsistent_scores": false,
  "reason": "обоснование решения на русском"
}

Критерии для reject: мат, личные оскорбления, явная реклама/антиреклама.
Критерии для human_review: подозрительные паттерны, несоответствие оценок тексту.
Критерии для approve: обычный честный отзыв пациента.
`

  try {
    const res = await fetch(GEMINI_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { temperature: 0.1, maxOutputTokens: 800 }
      })
    })

    if (!res.ok) throw new Error('Gemini API error')
    const data = await res.json()
    const raw = data.candidates?.[0]?.content?.parts?.[0]?.text || '{}'
    const cleaned = raw.replace(/```json\n?|```\n?/g, '').trim()
    return JSON.parse(cleaned)
  } catch (e) {
    console.error('Gemini analysis failed:', e)
    return {
      recommendation: 'human_review',
      confidence: 0,
      flags: ['ai_unavailable'],
      summary: 'ИИ-анализ недоступен, требуется ручная проверка',
      reason: 'Ошибка подключения к ИИ',
      toxicity: false,
      spam: false,
      advertising: false,
      inconsistent_scores: false
    }
  }
}

/**
 * Generate a medical tip or health insight
 */
export async function getMedicalTip(specialty) {
  const prompt = `Дай один краткий полезный совет по здоровью связанный с ${specialty || 'общим здоровьем'}. 
  Верни ТОЛЬКО JSON: {"tip": "текст совета", "icon": "emoji"}`

  try {
    const res = await fetch(GEMINI_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { temperature: 0.7, maxOutputTokens: 150 }
      })
    })
    const data = await res.json()
    const raw = data.candidates?.[0]?.content?.parts?.[0]?.text || '{}'
    const cleaned = raw.replace(/```json\n?|```\n?/g, '').trim()
    return JSON.parse(cleaned)
  } catch {
    return { tip: 'Регулярно проходите профилактические осмотры', icon: '🏥' }
  }
}

/**
 * AI-powered doctor search assistant
 */
export async function searchAssistant(query) {
  const prompt = `Пользователь ищет медицинскую помощь: "${query}"
  Верни ТОЛЬКО JSON: {
    "specialty": "специализация врача по-русски",
    "keywords": ["ключевые слова для поиска"],
    "suggestion": "краткая рекомендация пользователю"
  }`

  try {
    const res = await fetch(GEMINI_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { temperature: 0.3, maxOutputTokens: 200 }
      })
    })
    const data = await res.json()
    const raw = data.candidates?.[0]?.content?.parts?.[0]?.text || '{}'
    const cleaned = raw.replace(/```json\n?|```\n?/g, '').trim()
    return JSON.parse(cleaned)
  } catch {
    return { specialty: '', keywords: [query], suggestion: '' }
  }
}
