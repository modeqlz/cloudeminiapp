import { validateInitData, parseInitData } from '../../../lib/verifyTelegramAuth';
import { upsertUser } from '../../../lib/supabaseAdmin';

export default async function handler(req, res) {
  // Разрешаем только POST запросы
  if (req.method !== 'POST') {
    return res.status(405).json({ ok: false, error: 'Method not allowed' });
  }

  try {
    const { initData } = req.body;
    
    // Проверяем наличие initData
    if (!initData) {
      return res.status(400).json({ ok: false, error: 'No initData provided' });
    }

    // Получаем токен бота из переменных окружения
    const botToken = process.env.TELEGRAM_BOT_TOKEN;
    if (!botToken) {
      console.error('❌ TELEGRAM_BOT_TOKEN не найден в переменных окружения');
      return res.status(500).json({ ok: false, error: 'Server configuration error' });
    }

    // Проверяем подпись initData через библиотеку
    const validation = validateInitData(initData, botToken, 86400); // 24 часа
    
    if (!validation.ok) {
      console.log('❌ Проверка initData не прошла:', validation.reason);
      return res.status(400).json({ ok: false, error: `Invalid initData: ${validation.reason}` });
    }

    // Парсим данные пользователя из initData
    const parsedData = parseInitData(initData);
    let userData = null;

    if (parsedData.user) {
      try {
        userData = JSON.parse(parsedData.user);
      } catch (error) {
        console.error('❌ Ошибка парсинга данных пользователя:', error);
        return res.status(400).json({ ok: false, error: 'Invalid user data in initData' });
      }
    }

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
    const result = await upsertUser(userProfile);
    
    if (!result.ok) {
      console.error('❌ Ошибка сохранения пользователя:', result.error);
      return res.status(500).json({ ok: false, error: result.error });
    }

    console.log('✅ Пользователь успешно аутентифицирован и сохранен');

    // Возвращаем успешный результат
    return res.status(200).json({
      ok: true,
      profile: result.profile
    });

  } catch (error) {
    console.error('❌ Критическая ошибка аутентификации:', error);
    return res.status(500).json({ ok: false, error: 'Authentication failed' });
  }
}