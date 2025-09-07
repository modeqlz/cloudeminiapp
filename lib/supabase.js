import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

/**
 * Сохранение/обновление пользователя в базе данных
 * @param {Object} userProfile - профиль пользователя из Telegram
 * @returns {Object} результат операции
 */
export async function saveUser(userProfile) {
  if (!userProfile || !userProfile.id) {
    return { ok: false, error: 'Invalid user profile' };
  }

  try {
    // Проверяем существует ли пользователь
    const { data: existingUser } = await supabase
      .from('users')
      .select('id')
      .eq('telegram_id', userProfile.telegram_id || userProfile.id)
      .single();

    const userData = {
      telegram_id: userProfile.telegram_id || userProfile.id,
      username: userProfile.username || null,
      first_name: userProfile.first_name || null,
      last_name: userProfile.last_name || null,
      name: `${userProfile.first_name || ''} ${userProfile.last_name || ''}`.trim() || 'Без имени',
      avatar_url: userProfile.photo_url || '/placeholder.png',
      verified: userProfile.verified || false,
      updated_at: new Date().toISOString()
    };

    console.log('💾 Сохранение пользователя в Supabase:', {
      telegram_id: userData.telegram_id,
      username: userData.username,
      name: userData.name
    });

    if (existingUser) {
      // Обновляем существующего пользователя
      const { error } = await supabase
        .from('users')
        .update(userData)
        .eq('telegram_id', userProfile.telegram_id || userProfile.id);

      if (error) {
        console.error('Error updating user:', error);
        return { ok: false, error: 'Failed to update user' };
      }
    } else {
      // Создаем нового пользователя
      const { error } = await supabase
        .from('users')
        .insert([userData]);

      if (error) {
        console.error('Error creating user:', error);
        return { ok: false, error: 'Failed to create user' };
      }
    }

    return { ok: true };
  } catch (e) {
    console.error('Save user error:', e);
    return { ok: false, error: 'Database error' };
  }
}

/**
 * Поиск пользователей по имени пользователя или полному имени
 * @param {string} searchTerm - поисковый запрос
 * @returns {Array} массив найденных пользователей
 */
export async function searchUsers(searchTerm) {
  if (!searchTerm || searchTerm.length < 2) {
    return [];
  }

  // Удаляем @ если он есть в начале
  const cleanSearchTerm = searchTerm.replace(/^@/, '');

  try {
    const { data, error } = await supabase
      .from('users')
      .select('id, telegram_id, username, first_name, last_name, name, avatar_url, verified')
      .or(`username.ilike.%${cleanSearchTerm}%,name.ilike.%${cleanSearchTerm}%`)
      .limit(15)
      .order('verified', { ascending: false }) // Показываем сначала верифицированных
      .order('username');

    if (error) {
      console.error('Supabase search error:', error);
      return [];
    }

    return data || [];
  } catch (e) {
    console.error('Search function error:', e);
    return [];
  }
}
