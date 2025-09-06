# 🗄️ Настройка базы данных для поиска пользователей

## 🚀 Быстрая настройка с Supabase (рекомендуется)

### 1. Создание проекта

1. Перейдите на [supabase.com](https://supabase.com)
2. Нажмите "Start your project"
3. Создайте аккаунт или войдите
4. Нажмите "New Project"
5. Заполните:
   - **Name**: `cloudeminiapp` 
   - **Database Password**: (придумайте надежный пароль)
   - **Region**: выберите ближайший к вам

### 2. Создание таблицы пользователей

В Supabase Dashboard:
1. Перейдите в **SQL Editor**
2. Создайте новый запрос и выполните:

```sql
-- Создаем таблицу пользователей
CREATE TABLE users (
  id BIGSERIAL PRIMARY KEY,
  telegram_id BIGINT UNIQUE NOT NULL,
  username TEXT,
  first_name TEXT,
  last_name TEXT,
  name TEXT GENERATED ALWAYS AS (
    TRIM(COALESCE(first_name, '') || ' ' || COALESCE(last_name, ''))
  ) STORED,
  avatar_url TEXT,
  verified BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Создаем индексы для быстрого поиска
CREATE INDEX idx_users_username ON users USING gin(to_tsvector('english', username));
CREATE INDEX idx_users_name ON users USING gin(to_tsvector('english', name));
CREATE INDEX idx_users_telegram_id ON users(telegram_id);

-- Включаем Row Level Security
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Политика: все могут читать публичные данные
CREATE POLICY "Users are viewable by everyone" 
ON users FOR SELECT 
USING (true);

-- Политика: пользователи могут обновлять свои данные
CREATE POLICY "Users can update own data" 
ON users FOR UPDATE 
USING (auth.uid()::text = telegram_id::text);

-- Добавляем тестовых пользователей
INSERT INTO users (telegram_id, username, first_name, last_name, avatar_url, verified) VALUES
(1, 'modelqz', 'Model', 'QZ', '/placeholder.png', true),
(2, 'vampi', 'Vampi', '', '/placeholder.png', true),
(3, 'modeqlz', 'Mode', 'QLZ', '/placeholder.png', true),
(4, 'john_doe', 'John', 'Doe', '/placeholder.png', false),
(5, 'alice_smith', 'Alice', 'Smith', '/placeholder.png', true),
(6, 'dev_master', 'Dev', 'Master', '/placeholder.png', false),
(7, 'crypto_trader', 'Crypto', 'Trader', '/placeholder.png', true),
(8, 'spectra_market', 'Spectra', 'Market', '/placeholder.png', true);
```

### 3. Получение API ключей

1. В Supabase Dashboard перейдите в **Settings** → **API**
2. Скопируйте:
   - **Project URL** 
   - **anon public** ключ

### 4. Настройка переменных окружения

Создайте файл `.env.local` в корне проекта:

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key

# Existing Telegram bot token
BOT_TOKEN=your-bot-token
```

### 5. Обновление API поиска

Замените в `pages/home.js` строку:
```javascript
const response = await fetch(`/api/searchUsers?q=${encodeURIComponent(trimmed)}`);
```

На:
```javascript
const response = await fetch(`/api/searchUsersDB?q=${encodeURIComponent(trimmed)}`);
```

### 6. Автоматическое добавление пользователей

Обновите `pages/api/auth/telegram.js`:

```javascript
import { upsertUser } from '../../lib/supabase';

// После успешной валидации добавьте:
if (user) {
  await upsertUser(user); // Автоматически добавляем в БД
}
```

## 🎯 Готово!

Теперь:
1. ✅ **Поиск работает** через реальную базу данных
2. ✅ **Пользователи автоматически добавляются** при входе
3. ✅ **Быстрый поиск** по имени и никнейму
4. ✅ **Масштабируемость** до миллионов пользователей

## 📊 Альтернативные варианты

### PlanetScale (MySQL)
```bash
npm install @planetscale/database
```

### Vercel Postgres
```bash
npm install @vercel/postgres
```

### MongoDB Atlas
```bash
npm install mongodb
```

---

**💡 Совет**: Начните с Supabase — это самый простой способ добавить полноценную базу данных за 10 минут!