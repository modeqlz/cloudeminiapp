// ЭКСТРЕННАЯ ДИАГНОСТИКА SUPABASE
export default async function handler(req, res) {
  console.log('🚨 ЭКСТРЕННАЯ ДИАГНОСТИКА SUPABASE');

  // Шаг 1: Проверка переменных окружения
  const env = {
    url: process.env.NEXT_PUBLIC_SUPABASE_URL,
    service_role: process.env.SUPABASE_SERVICE_ROLE_KEY,
    anon: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    bot: process.env.TELEGRAM_BOT_TOKEN
  };

  console.log('🔍 Переменные окружения:', {
    url_exists: !!env.url,
    url_preview: env.url ? `${env.url.substring(0, 50)}...` : 'ОТСУТСТВУЕТ',
    service_role_exists: !!env.service_role,
    service_role_preview: env.service_role ? `${env.service_role.substring(0, 50)}...` : 'ОТСУТСТВУЕТ',
    anon_exists: !!env.anon,
    bot_exists: !!env.bot
  });

  // Если переменные отсутствуют
  if (!env.url || !env.service_role) {
    return res.status(500).json({
      error: 'КРИТИЧНО: Отсутствуют переменные Supabase',
      missing: {
        url: !env.url,
        service_role: !env.service_role
      },
      help: 'Добавь переменные в Vercel → Settings → Environment Variables'
    });
  }

  try {
    // Шаг 2: Импорт Supabase
    console.log('📦 Попытка импорта @supabase/supabase-js...');
    const { createClient } = await import('@supabase/supabase-js');
    console.log('✅ Supabase импортирован успешно');

    // Шаг 3: Создание клиента
    console.log('🔗 Создание Supabase клиента...');
    const supabase = createClient(env.url, env.service_role, {
      auth: { persistSession: false, autoRefreshToken: false },
      db: { schema: 'public' }
    });
    console.log('✅ Supabase клиент создан');

    // Шаг 4: Проверка подключения
    console.log('🏃 Проверка подключения к базе...');
    const { data: connectionTest, error: connectionError } = await supabase
      .from('users')
      .select('count', { count: 'exact', head: true });

    if (connectionError) {
      console.error('❌ Ошибка подключения:', connectionError);
      return res.status(500).json({
        step: 'CONNECTION_FAILED',
        error: connectionError.message,
        code: connectionError.code,
        details: connectionError.details,
        hint: connectionError.hint,
        possible_causes: [
          'Неправильный SUPABASE_SERVICE_ROLE_KEY',
          'Неправильный NEXT_PUBLIC_SUPABASE_URL',
          'Таблица users не существует',
          'RLS блокирует доступ'
        ]
      });
    }

    console.log('✅ Подключение к таблице users работает');

    // Шаг 5: Тест создания пользователя (точно как в основном API)
    console.log('👤 Тест создания пользователя...');
    const testProfile = {
      telegram_id: 888888888,
      username: 'emergency_test',
      first_name: 'Emergency',
      last_name: 'Test',
      name: 'Emergency Test',
      avatar_url: '/placeholder.png',
      updated_at: new Date().toISOString()
    };

    const { data: upsertResult, error: upsertError } = await supabase
      .from('users')
      .upsert(testProfile, { 
        onConflict: 'telegram_id',
        ignoreDuplicates: false 
      })
      .select('*')
      .single();

    if (upsertError) {
      console.error('❌ НАЙДЕНА ПРОБЛЕМА! Ошибка upsert:', upsertError);
      
      // Очистка: удаляем тестового пользователя если он создался частично
      try {
        await supabase.from('users').delete().eq('telegram_id', 888888888);
      } catch (cleanupError) {
        console.log('⚠️ Ошибка очистки (не критично):', cleanupError.message);
      }

      return res.status(500).json({
        step: 'UPSERT_FAILED',
        error: 'ВОТ НАСТОЯЩАЯ ПРОБЛЕМА!',
        supabase_error: {
          message: upsertError.message,
          code: upsertError.code,
          details: upsertError.details,
          hint: upsertError.hint
        },
        test_profile: testProfile,
        solutions: {
          'PGRST116': 'Таблица users не существует - создай таблицу в Supabase',
          '42P01': 'Таблица users не существует - создай таблицу в Supabase',
          '42501': 'Нет прав доступа - проверь RLS политики в Supabase',
          '23505': 'Ошибка уникального ключа - возможно проблема с индексом telegram_id'
        }
      });
    }

    console.log('✅ Upsert пользователя работает!', upsertResult);

    // Шаг 6: Очистка
    const { error: deleteError } = await supabase
      .from('users')
      .delete()
      .eq('telegram_id', 888888888);

    return res.status(200).json({
      status: '🎉 ВСЕ РАБОТАЕТ!',
      message: 'База данных полностью функциональна',
      connection_test: 'PASSED',
      upsert_test: 'PASSED',
      cleanup_test: deleteError ? 'FAILED' : 'PASSED',
      created_user: upsertResult,
      timestamp: new Date().toISOString(),
      note: 'Если этот тест прошел, но основной API все еще не работает - проблема в логике аутентификации'
    });

  } catch (criticalError) {
    console.error('💥 КРИТИЧЕСКАЯ ОШИБКА:', criticalError);
    return res.status(500).json({
      step: 'CRITICAL_FAILURE',
      error: criticalError.message,
      stack: criticalError.stack,
      type: criticalError.constructor.name
    });
  }
}