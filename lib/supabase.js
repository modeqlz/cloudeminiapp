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
  console.log('[saveUser] Starting with profile:', userProfile);
  
  if (!userProfile || !userProfile.id) {
    console.error('[saveUser] Invalid user profile:', userProfile);
    return { ok: false, error: 'Invalid user profile' };
  }

  // Проверяем подключение к Supabase
  if (!supabaseUrl || !supabaseAnonKey) {
    console.error('[saveUser] Supabase not configured:', { supabaseUrl, hasKey: !!supabaseAnonKey });
    return { ok: false, error: 'Supabase not configured' };
  }

  try {
    // Проверяем существует ли пользователь
    const { data: existingUser } = await supabase
      .from('users')
      .select('id')
      .eq('telegram_id', userProfile.id)
      .single();

    const userData = {
      telegram_id: userProfile.id,
      username: userProfile.username || null,
      first_name: userProfile.first_name || null,
      last_name: userProfile.last_name || null,
      name: `${userProfile.first_name || ''} ${userProfile.last_name || ''}`.trim() || 'Без имени',
      avatar_url: userProfile.photo_url || '/placeholder.png',
      updated_at: new Date().toISOString()
    };

    if (existingUser) {
      // Обновляем существующего пользователя
      console.log('[saveUser] Updating existing user:', existingUser.id);
      const { error } = await supabase
        .from('users')
        .update(userData)
        .eq('telegram_id', userProfile.id);

      if (error) {
        console.error('[saveUser] Error updating user:', error);
        return { ok: false, error: 'Failed to update user' };
      }
      console.log('[saveUser] User updated successfully');
    } else {
      // Создаем нового пользователя
      console.log('[saveUser] Creating new user with data:', userData);
      const { data, error } = await supabase
        .from('users')
        .insert([userData])
        .select();

      if (error) {
        console.error('[saveUser] Error creating user:', error);
        return { ok: false, error: 'Failed to create user' };
      }
      console.log('[saveUser] User created successfully:', data);
    }

    console.log('[saveUser] Operation completed successfully');
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