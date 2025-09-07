// ТЕСТИРОВАНИЕ ОСНОВНОГО TELEGRAM API
export default async function handler(req, res) {
  console.log('🧪 ТЕСТИРОВАНИЕ ОСНОВНОГО API /api/auth/telegram-new');

  // Создаем тестовые данные как если бы они пришли от Telegram
  const fakeInitData = 'user=%7B%22id%22%3A123456789%2C%22first_name%22%3A%22Test%22%2C%22last_name%22%3A%22User%22%2C%22username%22%3A%22testuser%22%7D&chat_instance=-123456789&chat_type=private&auth_date=1705123456&hash=fake_hash_for_testing';

  try {
    // Прямо вызываем наш основной API
    const response = await fetch(`${req.headers.origin}/api/auth/telegram-new`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        initData: fakeInitData
      })
    });

    const result = await response.json();
    const status = response.status;

    console.log('📊 Результат тестирования основного API:', {
      status,
      result
    });

    return res.status(200).json({
      test: 'MAIN_API_CALL',
      status_code: status,
      response_body: result,
      analysis: {
        api_reachable: status !== 404,
        telegram_token_ok: !result.error?.includes('TELEGRAM_BOT_TOKEN'),
        supabase_error: result.error?.includes('Supabase'),
        signature_error: result.error?.includes('Bad signature'),
        expected_signature_error: true // С fake hash должна быть ошибка подписи
      },
      interpretation: status === 401 && result.error === 'Bad signature' 
        ? '✅ API работает! Ошибка подписи ожидаема с тестовыми данными'
        : status === 500 && result.error?.includes('Supabase')
        ? '❌ ПРОБЛЕМА: Ошибка базы данных'
        : '❓ Неожиданный результат',
      next_steps: status === 500 && result.error?.includes('Supabase')
        ? 'Проверь /api/debug/supabase-test для диагностики Supabase'
        : 'API работает корректно'
    });

  } catch (error) {
    console.error('💥 Ошибка вызова основного API:', error);
    return res.status(500).json({
      test: 'MAIN_API_CALL_FAILED',
      error: error.message,
      possible_causes: [
        'API endpoint не существует',
        'Сервер не отвечает',
        'Проблема с сетью'
      ]
    });
  }
}