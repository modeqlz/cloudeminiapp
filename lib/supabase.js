import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Функция для поиска пользователей
export async function searchUsers(query, limit = 15) {
  try {
    const { data, error } = await supabase
      .from('users')
      .select('id, username, name, avatar_url, verified, created_at')
      .or(`username.ilike.%${query}%,name.ilike.%${query}%`)
      .order('verified', { ascending: false }) // Верифицированные сначала
      .order('created_at', { ascending: false })
      .limit(limit)

    if (error) throw error
    return { data, error: null }
  } catch (error) {
    console.error('Search users error:', error)
    return { data: null, error: error.message }
  }
}

// Функция для добавления/обновления пользователя
export async function upsertUser(userData) {
  try {
    const { data, error } = await supabase
      .from('users')
      .upsert({
        telegram_id: userData.id,
        username: userData.username,
        first_name: userData.first_name,
        last_name: userData.last_name,
        name: `${userData.first_name || ''} ${userData.last_name || ''}`.trim(),
        avatar_url: userData.photo_url,
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'telegram_id'
      })

    if (error) throw error
    return { data, error: null }
  } catch (error) {
    console.error('Upsert user error:', error)
    return { data: null, error: error.message }
  }
}

// Функция для получения пользователя по Telegram ID
export async function getUserByTelegramId(telegramId) {
  try {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('telegram_id', telegramId)
      .single()

    if (error) throw error
    return { data, error: null }
  } catch (error) {
    return { data: null, error: error.message }
  }
}