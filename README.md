# MedRate MVP 🏥

Прозрачный рейтинг врачей и клиник Казахстана — PWA с 12-этапной модерацией, ИИ-анализом и QR-верификацией посещений.

---

## 🚀 Быстрый старт

### 1. Клонировать и установить

```bash
git clone https://github.com/YOUR_USERNAME/medrate.git
cd medrate
npm install
```

### 2. Настроить переменные окружения

Создайте файл `.env` в корне проекта:

```env
VITE_SUPABASE_URL=https://kuvbspxpommthwakjfvk.supabase.co
VITE_SUPABASE_ANON_KEY=your_anon_key
VITE_GEMINI_API_KEY=your_gemini_key
```

### 3. Настроить базу данных Supabase

Откройте [Supabase SQL Editor](https://app.supabase.com) и выполните весь файл:

```
supabase/schema.sql
```

### 4. Запустить локально

```bash
npm run dev
```

Откройте http://localhost:5173

---

## 🌐 Деплой на Vercel

### Вариант A: Через Vercel CLI (быстро)

```bash
npm install -g vercel
vercel --prod
```

При деплое добавьте переменные окружения в Vercel Dashboard:
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`
- `VITE_GEMINI_API_KEY`

### Вариант B: Через GitHub (рекомендуется)

1. Создайте репозиторий на GitHub
2. Загрузите код:
   ```bash
   git init
   git add .
   git commit -m "Initial MedRate MVP"
   git remote add origin https://github.com/YOUR_USERNAME/medrate.git
   git push -u origin main
   ```
3. На [vercel.com](https://vercel.com) → **New Project** → импортируйте репозиторий
4. В настройках проекта добавьте 3 переменные окружения
5. Деплой произойдёт автоматически

### Настройка GitHub Actions (автодеплой)

Добавьте секреты в GitHub → Settings → Secrets:
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`
- `VITE_GEMINI_API_KEY`
- `VERCEL_TOKEN` — из [vercel.com/account/tokens](https://vercel.com/account/tokens)
- `VERCEL_ORG_ID` — из `.vercel/project.json` после первого деплоя
- `VERCEL_PROJECT_ID` — из `.vercel/project.json`

---

## 🗂️ Структура проекта

```
medrate/
├── src/
│   ├── context/
│   │   ├── AuthContext.jsx      # Авторизация Supabase
│   │   └── ThemeContext.jsx     # Тёмный/светлый режим
│   ├── lib/
│   │   ├── supabase.js          # Клиент Supabase
│   │   └── gemini.js            # Gemini AI (анализ отзывов, поиск, советы)
│   ├── components/
│   │   ├── Layout/
│   │   │   ├── Header.jsx       # Шапка + логотип MedRate
│   │   │   └── BottomNav.jsx    # Нижняя навигация
│   │   ├── DoctorCard.jsx       # Карточка врача
│   │   ├── RatingStars.jsx      # Звёзды (просмотр / ввод / шкала)
│   │   └── QRScanner.jsx        # Камера + QR-сканер
│   ├── pages/
│   │   ├── Auth/
│   │   │   ├── Login.jsx
│   │   │   └── Register.jsx     # 2-шаговая регистрация
│   │   ├── Patient/
│   │   │   ├── Home.jsx         # Главная + AI-совет дня
│   │   │   ├── Search.jsx       # Поиск врачей/клиник + AI-ассистент
│   │   │   ├── DoctorDetail.jsx # Профиль врача + отзывы
│   │   │   ├── LeaveReview.jsx  # Форма отзыва + AI-модерация
│   │   │   ├── Scan.jsx         # QR-сканер (реальная камера)
│   │   │   ├── Schedule.jsx     # Записи и история посещений
│   │   │   ├── Profile.jsx      # Профиль + скидки + настройки
│   │   │   └── BookAppointment.jsx  # Запись к врачу
│   │   ├── Clinic/
│   │   │   ├── Dashboard.jsx    # Дашборд клиники
│   │   │   ├── Doctors.jsx      # Управление врачами
│   │   │   ├── QRGenerator.jsx  # Генератор QR-кодов
│   │   │   ├── Reviews.jsx      # Просмотр отзывов клиники
│   │   │   └── Setup.jsx        # Регистрация клиники
│   │   └── Moderation/
│   │       └── ModerationPanel.jsx  # Панель модерации (все 12 этапов)
│   ├── App.jsx                  # Роутинг
│   ├── main.jsx                 # Точка входа
│   └── index.css                # Tailwind + CSS переменные
├── supabase/
│   └── schema.sql               # Полная схема БД + RLS + триггеры
├── .github/workflows/
│   └── deploy.yml               # CI/CD → Vercel
├── vercel.json                  # SPA rewrites + security headers
├── vite.config.js               # Vite + PWA plugin
└── tailwind.config.js           # Тема MedRate
```

---

## 🔐 Роли пользователей

| Роль | Возможности |
|------|------------|
| `patient` | Поиск, запись, QR-скан, отзывы, история |
| `clinic_admin` | Дашборд, врачи, QR-генератор, просмотр отзывов |
| `moderator` | Полная панель модерации, 12 этапов |

---

## 🛡️ 12 этапов модерации

| # | Этап | Тип |
|---|------|-----|
| 1 | Регистрация по телефону + ИИН | Авто |
| 2 | Только реальный пациент процедуры | Авто |
| 3 | Один отзыв на врача | Авто |
| 4 | Изменение только после повторного визита | Авто |
| 5 | QR-сканирование в регистратуре | Авто |
| 6 | Задержка 1 час после скана | Авто |
| 7 | ИИ-анализ токсичности (Gemini) | Авто |
| 8 | ИИ-анализ несоответствия оценок | Авто |
| 9 | Ручная модерация подозрительных | Ручной |
| 10 | Анонимная проверка клиники | Ручной |
| 11 | Обновление рейтинга в 00:00 | Авто |
| 12 | Мониторинг аномальных паттернов | Авто |

---

## 🤖 Gemini AI интеграция

- **Анализ отзывов** — проверка токсичности, спама, рекламы, несоответствия оценок
- **Поисковый ассистент** — определение специализации по симптомам
- **Совет дня** — персональные советы по здоровью на главной

---

## 📱 PWA возможности

- Установка на главный экран (iOS / Android)
- Offline режим (Service Worker + Workbox)
- Push-уведомления (настраивается)
- Полноэкранный режим без браузерного chrome

---

## 🗄️ База данных (Supabase)

Таблицы: `profiles`, `clinics`, `doctors`, `visits`, `reviews`, `appointments`, `moderation_queue`

Автоматические триггеры:
- Создание профиля при регистрации
- Пересчёт рейтинга врача при одобрении отзыва
- Обновление рейтинга клиники

RLS (Row Level Security) — включён на всех таблицах.

---

## 🛠️ Технологии

- **Frontend**: React 18, Vite, Tailwind CSS
- **PWA**: vite-plugin-pwa, Workbox
- **БД**: Supabase (PostgreSQL + RLS + Realtime)
- **AI**: Google Gemini 2.0 Flash
- **QR**: html5-qrcode (камера), qrcode.react (генерация)
- **Роутинг**: React Router v6
- **Деплой**: Vercel + GitHub Actions
