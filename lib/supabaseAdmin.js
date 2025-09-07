import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl) {
  throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL environment variable');
}

if (!supabaseServiceRoleKey) {
  throw new Error('Missing SUPABASE_SERVICE_ROLE_KEY environment variable');
}

// Создаем клиент с service role ключом для административных операций
export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

/**
 * Безопасное создание/обновление пользователя с использованием service role
 * @param {Object} userData - данные пользователя из Telegram
 * @returns {Object} результат операции { ok: boolean, profile?: Object, error?: string }
 */
export async function upsertUser(userData) {
  if (!userData || !userData.telegram_id) {
    return { ok: false, error: 'Invalid user data: telegram_id is required' };
  }

  try {
    const userRecord = {
      telegram_id: userData.telegram_id,
      username: userData.username || null,
      first_name: userData.first_name || null,
      last_name: userData.last_name || null,
      name: userData.name || `${userData.first_name || ''} ${userData.last_name || ''}`.trim() || 'Без имени',
      avatar_url: userData.avatar_url || '/placeholder.png',
      updated_at: new Date().toISOString()
    };

    console.log('📝 Upsert пользователя с service role:', {
      telegram_id: userRecord.telegram_id,
      username: userRecord.username,
      name: userRecord.name
    });

    // Используем upsert для автоматического создания или обновления
    const { data, error } = await supabaseAdmin
      .from('users')
      .upsert(userRecord, {
        onConflict: 'telegram_id',
        ignoreDuplicates: false
      })
      .select('*')
      .single();

    if (error) {
      console.error('❌ Ошибка upsert пользователя:', error);
      return { ok: false, error: `Database error: ${error.message}` };
    }

    console.log('✅ Пользователь успешно сохранен/обновлен');
    return { ok: true, profile: data };

  } catch (error) {
    console.error('❌ Критическая ошибка upsert:', error);
    return { ok: false, error: 'Unexpected database error' };
  }
}

/**
 * Получение пользователя по telegram_id
 * @param {number} telegramId - ID пользователя в Telegram
 * @returns {Object} пользователь или null
 */
export async function getUserByTelegramId(telegramId) {
  try {
    const { data, error } = await supabaseAdmin
      .from('users')
      .select('*')
      .eq('telegram_id', telegramId)
      .single();

    if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
      console.error('Ошибка получения пользователя:', error);
      return null;
    }

    return data;
  } catch (error) {
    console.error('Критическая ошибка получения пользователя:', error);
    return null;
  }
}