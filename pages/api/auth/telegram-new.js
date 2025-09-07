import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';

// CLEAN VERCEL BUILD - NO EXTERNAL IMPORTS
// Проверяем переменные окружения при создании клиента
if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
  console.error('❌ NEXT_PUBLIC_SUPABASE_URL отсутствует');
}
if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
  console.error('❌ SUPABASE_SERVICE_ROLE_KEY отсутствует');
}

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { 
    auth: { 
      persistSession: false,
      autoRefreshToken: false 
    },
    db: {
      schema: 'public'
    }
  }
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
  console.log('💾 Попытка upsert пользователя:', {
    telegram_id: profile.telegram_id,
    username: profile.username,
    name: profile.name
  });

  try {
    // Используем профиль как есть (без updated_at если колонки нет)
    const userRecord = {
      ...profile
    };

    const { data, error } = await supabaseAdmin
      .from('users')
      .upsert(userRecord, { 
        onConflict: 'telegram_id',
        ignoreDuplicates: false 
      })
      .select('*')
      .single();

    if (error) {
      console.error('❌ Детальная ошибка Supabase:', {
        message: error.message,
        details: error.details,
        hint: error.hint,
        code: error.code
      });
      throw new Error(`Supabase error: ${error.message} (${error.code})`);
    }

    console.log('✅ Пользователь успешно сохранен:', data?.id);
    return data;
  } catch (err) {
    console.error('❌ Критическая ошибка upsert:', err);
    throw err;
  }
}

export default async function handler(req, res) {
  // Детальная диагностика переменных окружения
  const envStatus = {
    URL: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
    SRK: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
    BOT: !!process.env.TELEGRAM_BOT_TOKEN,
    NODE_ENV: process.env.NODE_ENV
  };
  
  console.log('ENV DETAILED CHECK:', {
    ...envStatus,
    URL_preview: process.env.NEXT_PUBLIC_SUPABASE_URL ? `${process.env.NEXT_PUBLIC_SUPABASE_URL.substring(0, 30)}...` : 'MISSING',
    SRK_preview: process.env.SUPABASE_SERVICE_ROLE_KEY ? `${process.env.SUPABASE_SERVICE_ROLE_KEY.substring(0, 30)}...` : 'MISSING',
    BOT_preview: process.env.TELEGRAM_BOT_TOKEN ? `${process.env.TELEGRAM_BOT_TOKEN.substring(0, 30)}...` : 'MISSING'
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
      console.error('❌ Доступные переменные:', Object.keys(process.env).filter(k => k.includes('TELEGRAM')));
      
      // Возвращаем развернутую ошибку с диагностикой
      return res.status(500).json({ 
        ok: false, 
        error: 'TELEGRAM_BOT_TOKEN not configured in Vercel',
        env_status: envStatus,
        help: 'Add TELEGRAM_BOT_TOKEN in Vercel → Settings → Environment Variables → Production',
        debug_url: '/api/debug/env'
      });
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
      const savedUser = await upsertUser(userProfile);
      console.log('✅ Пользователь успешно аутентифицирован и сохранен');
      
      return res.status(200).json({
        ok: true,
        profile: savedUser || userProfile
      });
    } catch (error) {
      console.error('❌ Подробная ошибка сохранения пользователя:', {
        message: error.message,
        stack: error.stack,
        user_data: userProfile
      });
      
      return res.status(500).json({ 
        ok: false, 
        error: 'Supabase upsert failed',
        details: error.message,
        help: 'Check /api/debug/database for detailed diagnostics'
      });
    }

  } catch (error) {
    console.error('❌ Критическая ошибка аутентификации:', error);
    return res.status(500).json({ ok: false, error: 'Authentication failed' });
  }
}