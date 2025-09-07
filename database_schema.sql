-- Удаляем таблицу если существует (осторожно - удалит все данные!)
-- DROP TABLE IF EXISTS public.users CASCADE;

-- Создаем таблицу users с правильной структурой
CREATE TABLE IF NOT EXISTS public.users (
  id SERIAL PRIMARY KEY,
  telegram_id BIGINT UNIQUE NOT NULL,
  username TEXT,
  first_name TEXT,
  last_name TEXT,
  name TEXT,
  avatar_url TEXT DEFAULT '/placeholder.png',
  verified BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Если таблица уже существует, добавляем недостающие колонки
DO $$ 
BEGIN
    -- Проверяем и добавляем поле name если его нет
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'users' AND column_name = 'name'
    ) THEN
        ALTER TABLE public.users ADD COLUMN name TEXT;
    END IF;
    
    -- Проверяем и добавляем поле verified если его нет
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'users' AND column_name = 'verified'
    ) THEN
        ALTER TABLE public.users ADD COLUMN verified BOOLEAN DEFAULT false;
    END IF;
    
    -- Проверяем и добавляем поле avatar_url если его нет
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'users' AND column_name = 'avatar_url'
    ) THEN
        ALTER TABLE public.users ADD COLUMN avatar_url TEXT DEFAULT '/placeholder.png';
    END IF;
END $$;

-- Создаем или пересоздаем индексы
DROP INDEX IF EXISTS idx_users_telegram_id;
DROP INDEX IF EXISTS idx_users_username;

CREATE INDEX idx_users_telegram_id ON public.users(telegram_id);
CREATE INDEX idx_users_username ON public.users(username) WHERE username IS NOT NULL;

-- Функция для автоматического обновления updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Удаляем старый триггер если существует
DROP TRIGGER IF EXISTS update_users_updated_at ON public.users;

-- Создаем триггер для автоматического обновления updated_at
CREATE TRIGGER update_users_updated_at 
    BEFORE UPDATE ON public.users 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Включаем Row Level Security
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- Удаляем старые политики
DROP POLICY IF EXISTS "Users can view and update own data" ON public.users;
DROP POLICY IF EXISTS "Enable read access for all users" ON public.users;
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON public.users;

-- Создаем политики доступа (разрешаем все операции для анонимных пользователей)
CREATE POLICY "Enable read access for all users" ON public.users
    FOR SELECT USING (true);

CREATE POLICY "Enable insert for all users" ON public.users
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Enable update for all users" ON public.users
    FOR UPDATE USING (true);

-- Обновляем поле name для существующих записей без name
UPDATE public.users 
SET name = TRIM(COALESCE(first_name, '') || ' ' || COALESCE(last_name, ''))
WHERE name IS NULL OR name = '';

-- Проверяем результат
SELECT 
    COUNT(*) as total_users,
    COUNT(CASE WHEN name IS NOT NULL AND name != '' THEN 1 END) as users_with_name,
    COUNT(CASE WHEN username IS NOT NULL THEN 1 END) as users_with_username
FROM public.users;