import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseKey) {
  throw new Error('Missing Supabase environment variables')
}

const supabase = createClient(supabaseUrl, supabaseKey)

// Function to save or update user in database
export async function saveUser(userProfile) {
  try {
    // Check if user already exists
    const { data: existingUser, error: selectError } = await supabase
      .from('users')
      .select('*')
      .eq('telegram_id', userProfile.telegram_id)
      .single()

    if (selectError && selectError.code !== 'PGRST116') {
      throw selectError
    }

    if (existingUser) {
      // Update existing user
      const { data, error } = await supabase
        .from('users')
        .update({
          username: userProfile.username,
          first_name: userProfile.first_name,
          last_name: userProfile.last_name,
          avatar_url: userProfile.photo_url,
          updated_at: new Date().toISOString()
        })
        .eq('telegram_id', userProfile.telegram_id)
        .select()

      if (error) throw error
      return data[0]
    } else {
      // Insert new user
      const { data, error } = await supabase
        .from('users')
        .insert({
          telegram_id: userProfile.telegram_id,
          username: userProfile.username,
          first_name: userProfile.first_name,
          last_name: userProfile.last_name,
          avatar_url: userProfile.photo_url,
          verified: false,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select()

      if (error) throw error
      return data[0]
    }
  } catch (error) {
    console.error('Error saving user:', error)
    throw error
  }
}

// Function to search users
export async function searchUsers(searchTerm) {
  try {
    const { data, error } = await supabase
      .from('users')
      .select('telegram_id, username, first_name, last_name, avatar_url, verified, created_at')
      .or(`username.ilike.%${searchTerm}%, first_name.ilike.%${searchTerm}%, last_name.ilike.%${searchTerm}%`)
      .order('created_at', { ascending: false })
      .limit(10)

    if (error) throw error

    // Transform data to match expected format
    return data.map(user => ({
      id: user.telegram_id,
      telegram_id: user.telegram_id,
      username: user.username,
      name: `${user.first_name} ${user.last_name || ''}`.trim(),
      avatar_url: user.avatar_url,
      verified: user.verified
    }))
  } catch (error) {
    console.error('Error searching users:', error)
    throw error
  }
}