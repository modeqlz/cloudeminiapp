# 🔧 Настройка переменных окружения в Vercel

## ❌ Проблема: "Server configuration error"

Ошибка возникает из-за отсутствующих переменных окружения в Vercel.

## ✅ Решение: Добавить переменные в Vercel Dashboard

### 📋 Шаги настройки:

1. **Открой Vercel Dashboard:** https://vercel.com/dashboard
2. **Выбери проект:** cloudeminiapp  
3. **Settings → Environment Variables**
4. **Добавь следующие переменные:**

#### 🔑 Обязательные переменные:

| Название | Значение | Где взять |
|----------|----------|-----------||
| `NEXT_PUBLIC_SUPABASE_URL` | `https://your-project.supabase.co` | Supabase Dashboard → Settings → API |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | `eyJhbGc...` (anon key) | Supabase Dashboard → Settings → API |
| `SUPABASE_SERVICE_ROLE_KEY` | `eyJhbGc...` (service_role key) | Supabase Dashboard → Settings → API |
| `TELEGRAM_BOT_TOKEN` | `123456789:ABC...` | @BotFather в Telegram |

### 🎯 Как получить токен бота:

1. Напиши **@BotFather** в Telegram
2. Отправь `/newbot`
3. Следуй инструкциям
4. Скопируй токен (формат: `123456789:ABC-DEF1234ghIkl-zyx57W2v1u123ew11`)

### 🚀 После добавления переменных:

1. **Environments:** Выбери ✅ Production ✅ Preview ✅ Development
2. **Save** для каждой переменной
3. **Deployments → ⋯ → Redeploy** (принудительный передеплой)

### 🔍 Проверка настройки:

Открой: `https://your-domain.vercel.app/api/debug/env`

Должно показать: `"status": "OK"`

## 🆘 Если проблемы остались:

1. Проверь что переменные добавлены для **Production**
2. Сделай **Redeploy** без кэша
3. Подожди 2-3 минуты после деплоя
4. Открой `/api/debug/env` для диагностики

---
**После настройки Telegram WebApp авторизация будет работать!** ✅