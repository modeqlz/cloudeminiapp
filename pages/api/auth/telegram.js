import { supabaseAdmin, upsertUser } from '../../lib/supabaseAdmin';
import { verifyTelegramAuth } from '../../lib/verifyTelegramAuth';

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

    // Подготавливаем данные для сохранения
    const userProfile = {
      telegram_id: userData.id,
      username: userData.username || null,
      first_name: userData.first_name || null,
      last_name: userData.last_name || null,
      name: `${userData.first_name || ''} ${userData.last_name || ''}`.trim() || 'Без имени',
      avatar_url: userData.photo_url || '/placeholder.png'
    };

    console.log('🔐 Аутентификация пользователя:', {
      telegram_id: userProfile.telegram_id,
      username: userProfile.username,
      name: userProfile.name
    });

    // Сохраняем/обновляем пользователя в базе данных
    try {
      await upsertUser(userProfile);
      console.log('✅ Пользователь успешно аутентифицирован и сохранен');
      
      // Возвращаем успешный результат
      return res.status(200).json({
        ok: true,
        profile: userProfile
      });
    } catch (error) {
      console.error('Supabase upsert error:', error);
      return res.status(500).json({ ok: false, error: 'Supabase upsert failed' });
    }

  } catch (error) {
    console.error('❌ Критическая ошибка аутентификации:', error);
    return res.status(500).json({ ok: false, error: 'Authentication failed' });
  }
}