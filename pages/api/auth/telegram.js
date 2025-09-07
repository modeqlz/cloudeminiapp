// ИСПОЛЬЗУЕМ ВНЕШНИЕ ИМПОРТЫ КАК ТРЕБУЕТСЯ
import { supabaseAdmin } from '../../lib/supabaseAdmin';
import { verifyTelegramAuth } from '../../lib/verifyTelegramAuth';

// Импорты должны работать, функции удаляем (используем из lib/)

export default async function handler(req, res) {
  // Логируем переменные окружения для диагностики
  console.log('ENV OK', {
    URL: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
    SRK: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
    BOT: !!process.env.TELEGRAM_BOT_TOKEN
  });

  // Разрешаем только POST запросы
  if (req.method !== 'POST') {
    return res.status(405).json({ ok: false, error: 'Method not allowed' });
  }

  try {
    const { initData } = req.body;
    console.log('initData length', (initData || '').length);
    
    // Проверяем наличие initData
    if (!initData) {
      return res.status(400).json({ ok: false, error: 'Missing initData' });
    }

    // Получаем токен бота из переменных окружения
    const botToken = process.env.TELEGRAM_BOT_TOKEN;
    if (!botToken) {
      console.error('❌ TELEGRAM_BOT_TOKEN не найден в переменных окружения');
      return res.status(500).json({ ok: false, error: 'Server configuration error' });
    }

    // Проверяем подпись initData через библиотеку
    const validation = verifyTelegramAuth(initData, botToken);
    
    if (!validation.ok) {
      console.log('❌ Проверка initData не прошла:', validation.reason);
      return res.status(401).json({ ok: false, error: 'Bad signature' });
    }

    const userData = validation.user;
    if (!userData || !userData.id) {
      return res.status(400).json({ ok: false, error: 'No user data found in initData' });
    }

    // Парсим telegram_id в число как требуется
    const telegramId = Number(userData.id);
    
    // Подготавливаем данные для сохранения (правильный формат)
    const profile = {
      telegram_id: telegramId,
      username: userData.username ?? null,
      first_name: userData.first_name ?? null,
      last_name: userData.last_name ?? null,
      name: [userData.first_name, userData.last_name].filter(Boolean).join(' ') || userData.username || 'User',
      avatar_url: userData.photo_url ?? '/placeholder.png'
    };

    console.log('🔐 Аутентификация пользователя:', {
      telegram_id: profile.telegram_id,
      username: profile.username,
      name: profile.name
    });

    // Сохраняем/обновляем пользователя в базе данных (Supabase JS v2 синтаксис)
    try {
      const { error } = await supabaseAdmin
        .from('users')
        .upsert(profile, { onConflict: 'telegram_id' });

      if (error) {
        // МАКСИМАЛЬНО ПОДРОБНЫЙ ВЫВОД ОШИБКИ (24h диагностика)
        console.error('❌ ДЕТАЛЬНАЯ ОШИБКА SUPABASE:', {
          code: error.code,
          message: error.message,
          details: error.details,
          hint: error.hint,
          table: 'users',
          operation: 'upsert',
          profile: profile,
          fullError: error
        });
        
        return res.status(500).json({ 
          ok: false, 
          error: 'Supabase upsert failed',
          code: error.code,
          message: error.message,
          details: error.details,
          hint: error.hint
        });
      }

      console.log('✅ Пользователь успешно аутентифицирован и сохранен');
      
      // Возвращаем успешный результат
      return res.status(200).json({
        ok: true,
        profile: profile
      });
    } catch (error) {
      // ДЕТАЛЬНАЯ ДИАГНОСТИКА КРИТИЧЕСКИХ ОШИБОК
      console.error('❌ КРИТИЧЕСКАЯ ОШИБКА UPSERT:', {
        errorType: error.constructor.name,
        message: error.message,
        stack: error.stack,
        profile: profile
      });
      
      return res.status(500).json({ 
        ok: false, 
        error: 'Supabase upsert failed',
        type: error.constructor.name,
        message: error.message
      });
    }

  } catch (error) {
    console.error('❌ Критическая ошибка аутентификации:', error);
    return res.status(500).json({ ok: false, error: 'Authentication failed' });
  }
}
