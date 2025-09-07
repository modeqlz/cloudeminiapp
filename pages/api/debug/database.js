import { createClient } from '@supabase/supabase-js';

export default async function handler(req, res) {
  console.log('🔍 Тестирование подключения к базе данных...');

  // Проверяем переменные окружения
  const envCheck = {
    url: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
    service_role: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
    url_value: process.env.NEXT_PUBLIC_SUPABASE_URL || 'NOT SET',
    service_role_preview: process.env.SUPABASE_SERVICE_ROLE_KEY ? 
      `${process.env.SUPABASE_SERVICE_ROLE_KEY.substring(0, 30)}...` : 'NOT SET'
  };

  if (!envCheck.url || !envCheck.service_role) {
    return res.status(500).json({
      status: 'ERROR',
      error: 'Missing Supabase environment variables',
      env_check: envCheck
    });
  }

  // Создаем клиент
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
    { 
      auth: { 
        persistSession: false,
        autoRefreshToken: false 
      },
      db: { schema: 'public' }
    }
  );

  try {
    // Тест 1: Проверка подключения к таблице users
    console.log('🧪 Тест 1: Проверка существования таблицы users');
    const { data: tableCheck, error: tableError } = await supabase
      .from('users')
      .select('count', { count: 'exact', head: true });

    if (tableError) {
      console.error('❌ Ошибка доступа к таблице users:', tableError);
      return res.status(500).json({
        status: 'TABLE_ERROR',
        test: 'table_access',
        error: tableError.message,
        code: tableError.code,
        details: tableError.details,
        hint: tableError.hint
      });
    }

    // Тест 2: Попытка создания тестового пользователя
    console.log('🧪 Тест 2: Тестовый upsert пользователя');
    const testUser = {
      telegram_id: 999999999, // Тестовый ID
      username: 'test_user',
      first_name: 'Test',
      last_name: 'User',
      name: 'Test User',
      avatar_url: '/placeholder.png',
      updated_at: new Date().toISOString()
    };

    const { data: upsertData, error: upsertError } = await supabase
      .from('users')
      .upsert(testUser, { 
        onConflict: 'telegram_id',
        ignoreDuplicates: false 
      })
      .select('*')
      .single();

    if (upsertError) {
      console.error('❌ Ошибка upsert тестового пользователя:', upsertError);
      return res.status(500).json({
        status: 'UPSERT_ERROR',
        test: 'user_upsert',
        error: upsertError.message,
        code: upsertError.code,
        details: upsertError.details,
        hint: upsertError.hint,
        test_user: testUser
      });
    }

    // Тест 3: Удаление тестового пользователя
    console.log('🧪 Тест 3: Удаление тестового пользователя');
    const { error: deleteError } = await supabase
      .from('users')
      .delete()
      .eq('telegram_id', 999999999);

    console.log('✅ Все тесты базы данных прошли успешно');

    return res.status(200).json({
      status: 'SUCCESS',
      message: 'Database connection and operations working correctly',
      tests: {
        table_access: 'PASSED',
        user_upsert: 'PASSED', 
        user_delete: deleteError ? 'FAILED' : 'PASSED'
      },
      env_check: envCheck,
      table_count: tableCheck,
      test_user_created: upsertData,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ Критическая ошибка тестирования базы:', error);
    return res.status(500).json({
      status: 'CRITICAL_ERROR',
      error: error.message,
      stack: error.stack,
      env_check: envCheck
    });
  }
}