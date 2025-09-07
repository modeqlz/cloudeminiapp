export default function handler(req, res) {
  // Возвращаем детальную диагностику переменных окружения
  const envCheck = {
    url: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
    url_value: process.env.NEXT_PUBLIC_SUPABASE_URL ? `${process.env.NEXT_PUBLIC_SUPABASE_URL.substring(0, 20)}...` : 'NOT SET',
    anon: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    anon_value: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? `${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY.substring(0, 20)}...` : 'NOT SET',
    service_role: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
    service_role_value: process.env.SUPABASE_SERVICE_ROLE_KEY ? `${process.env.SUPABASE_SERVICE_ROLE_KEY.substring(0, 20)}...` : 'NOT SET',
    bot: !!process.env.TELEGRAM_BOT_TOKEN,
    bot_value: process.env.TELEGRAM_BOT_TOKEN ? `${process.env.TELEGRAM_BOT_TOKEN.substring(0, 20)}...` : 'NOT SET',
    node_env: process.env.NODE_ENV || 'unknown',
    timestamp: new Date().toISOString()
  };

  const missingVars = Object.entries(envCheck)
    .filter(([key, value]) => key.endsWith('_value') && value === 'NOT SET')
    .map(([key]) => key.replace('_value', ''));

  return res.status(200).json({
    ...envCheck,
    status: missingVars.length === 0 ? 'OK' : 'MISSING_VARS',
    missing: missingVars,
    help: missingVars.length > 0 ? 'Add missing env vars in Vercel Dashboard → Settings → Environment Variables' : 'All env vars configured'
  });
}