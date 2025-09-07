-- SQL МИГРАЦИЯ ДЛЯ ИСПРАВЛЕНИЯ TELEGRAM АУТЕНТИФИКАЦИИ
-- Выполни в Supabase Dashboard → SQL Editor

-- 1. Создаем уникальный индекс на telegram_id если не существует
CREATE UNIQUE INDEX IF NOT EXISTS users_telegram_id_key ON public.users (telegram_id);

-- 2. Включаем Row Level Security
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- 3. Создаем политику для service_role (полный доступ)
DO $$
BEGIN
  -- Удаляем существующие политики если есть
  DROP POLICY IF EXISTS "Service role full access" ON public.users;
  
  -- Создаем новую политику для service_role
  CREATE POLICY "Service role full access" ON public.users
  FOR ALL 
  TO service_role
  USING (true)
  WITH CHECK (true);
END $$;

-- 4. Создаем политику для authenticated пользователей (доступ к своим данным)
DO $$
BEGIN
  -- Удаляем существующие политики если есть
  DROP POLICY IF EXISTS "Users can view own profile" ON public.users;
  DROP POLICY IF EXISTS "Users can update own profile" ON public.users;
  
  -- Политика просмотра своего профиля
  CREATE POLICY "Users can view own profile" ON public.users
  FOR SELECT 
  TO authenticated
  USING (telegram_id = (auth.jwt() ->> 'telegram_id')::bigint);
  
  -- Политика обновления своего профиля  
  CREATE POLICY "Users can update own profile" ON public.users
  FOR UPDATE 
  TO authenticated
  USING (telegram_id = (auth.jwt() ->> 'telegram_id')::bigint)
  WITH CHECK (telegram_id = (auth.jwt() ->> 'telegram_id')::bigint);
END $$;

-- 5. Проверяем структуру таблицы
SELECT 
  column_name, 
  data_type, 
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_name = 'users' 
  AND table_schema = 'public'
ORDER BY ordinal_position;

-- 6. Проверяем индексы
SELECT 
  indexname,
  indexdef
FROM pg_indexes 
WHERE tablename = 'users' 
  AND schemaname = 'public';

-- 7. Проверяем политики RLS
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies 
WHERE tablename = 'users';