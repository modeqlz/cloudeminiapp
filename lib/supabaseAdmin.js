import { createClient } from '@supabase/supabase-js';

export const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { persistSession: false } }
);

export async function upsertUser(profile) {
  const { error } = await supabaseAdmin
    .from('users')
    .upsert(profile, { onConflict: 'telegram_id' });
  if (error) throw error;
}

export async function getUserByTelegramId(telegram_id) {
  const { data, error } = await supabaseAdmin
    .from('users')
    .select('*')
    .eq('telegram_id', telegram_id)
    .single();
  if (error) throw error;
  return data;
}