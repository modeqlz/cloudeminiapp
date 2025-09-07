-- Создаем уникальный индекс для telegram_id если его нет
CREATE UNIQUE INDEX IF NOT EXISTS users_telegram_id_key ON public.users (telegram_id);

-- Включаем Row Level Security
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- Создаем политики доступа (разрешаем операции для анонимных пользователей)
DROP POLICY IF EXISTS "Enable read access for all users" ON public.users;
DROP POLICY IF EXISTS "Enable insert for all users" ON public.users; 
DROP POLICY IF EXISTS "Enable update for all users" ON public.users;

CREATE POLICY "Enable read access for all users" ON public.users
    FOR SELECT USING (true);

CREATE POLICY "Enable insert for all users" ON public.users
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Enable update for all users" ON public.users
    FOR UPDATE USING (true);

-- Проверяем структуру таблицы
SELECT 
    column_name, 
    data_type, 
    is_nullable, 
    column_default
FROM information_schema.columns 
WHERE table_name = 'users' 
  AND table_schema = 'public'
ORDER BY ordinal_position;