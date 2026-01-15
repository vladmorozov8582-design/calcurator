# Calculator.ru - Решатель задач с AI

Сайт-решатель задач в стиле Glassmorphism с научным калькулятором.

## Технологии
- React + TypeScript + Vite
- Tailwind CSS 4.0
- Supabase (Backend + Edge Functions)
- OpenRouter API (GPT-4o)

## Деплой на Vercel

### 1. Загрузите проект на GitHub
1. Создайте репозиторий на GitHub
2. Загрузите все файлы

### 2. Импортируйте в Vercel
1. Перейдите на https://vercel.com
2. Нажмите "Import Project"
3. Выберите ваш GitHub репозиторий
4. Vercel автоматически определит настройки

### 3. Добавьте переменные окружения
В Vercel Dashboard → Settings → Environment Variables:

```
VITE_SUPABASE_URL = ваш-supabase-url
VITE_SUPABASE_ANON_KEY = ваш-supabase-anon-key
```

### 4. Деплой Edge Function в Supabase

```bash
# Установите Supabase CLI
npm install -g supabase

# Залогиньтесь
supabase login

# Задеплойте функцию
supabase functions deploy server --project-ref ваш-project-id
```

### 5. Настройте домен calculator.ru
В Vercel: Settings → Domains → добавьте calculator.ru

В REG.RU измените DNS:
- A-запись: @ → 76.76.21.21
- CNAME: www → cname.vercel-dns.com.

## Локальная разработка

```bash
npm install
npm run dev
```

## Структура проекта
```
/App.tsx                          - Главный компонент
/components/calculator.tsx        - Научный калькулятор
/components/task-input.tsx        - Загрузка и ввод задачи
/components/solution-display.tsx  - Отображение решения
/components/api-key-setup.tsx     - Настройка OpenRouter API ключа
/supabase/functions/server/       - Backend (Edge Function)
/styles/globals.css               - Glassmorphism стили
```

## OpenRouter API Key
При первом использовании сайт попросит ввести OpenRouter API ключ.
Получите его на: https://openrouter.ai/keys
