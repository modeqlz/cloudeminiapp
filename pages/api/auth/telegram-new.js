import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';

// CLEAN VERCEL BUILD - NO EXTERNAL IMPORTS
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { persistSession: false } }
);

function verifyTelegramAuth(initData, botToken) {
  const params = new URLSearchParams(initData || '');
  const data = {};
  for (const [k, v] of params.entries()) data[k] = v;

  const hash = data.hash;
  if (!hash) return { ok: false, reason: 'Missing hash' };
  delete data.hash;

  const checkString = Object.keys(data)
    .sort()
    .map((k) => `${k}=${data[k]}`)
    .join('\n');

  const secretKey = crypto.createHmac('sha256', 'WebAppData')
    .update(botToken)
    .digest();

  const computed = crypto.createHmac('sha256', secretKey)
    .update(checkString)
    .digest('hex');

  const ok = computed === hash;
  const user = data.user ? JSON.parse(data.user) : null;
  return { ok, user, reason: ok ? null : 'Bad signature' };
}

async function upsertUser(profile) {
  const { error } = await supabaseAdmin
    .from('users')
    .upsert(profile, { onConflict: 'telegram_id' });
  if (error) throw error;
}

export default async function handler(req, res) {
  console.log('ENV OK', {
    URL: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
    SRK: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
    BOT: !!process.env.TELEGRAM_BOT_TOKEN
  });

  if (req.method !== 'POST') {
    return res.status(405).json({ ok: false, error: 'Method not allowed' });
  }

  try {
    const { initData } = req.body;
    console.log('initData length', (initData || '').length);
    
    if (!initData) {
      return res.status(400).json({ ok: false, error: 'Missing initData' });
    }

    const botToken = process.env.TELEGRAM_BOT_TOKEN;
    if (!botToken) {
      console.error('❌ TELEGRAM_BOT_TOKEN не найден в переменных окружения');
      return res.status(500).json({ ok: false, error: 'Server configuration error' });
    }

    const validation = verifyTelegramAuth(initData, botToken);
    
    if (!validation.ok) {
      console.log('❌ Проверка initData не прошла:', validation.reason);
      return res.status(401).json({ ok: false, error: 'Bad signature' });
    }

    const userData = validation.user;
    if (!userData || !userData.id) {
      return res.status(400).json({ ok: false, error: 'No user data found in initData' });
    }

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

    try {
      await upsertUser(userProfile);
      console.log('✅ Пользователь успешно аутентифицирован и сохранен');
      
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