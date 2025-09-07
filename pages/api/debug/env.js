export default function handler(req, res) {
  // Возвращаем булевы значения переменных окружения для диагностики
  return res.status(200).json({
    url: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
    anon: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    service_role: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
    bot: !!process.env.TELEGRAM_BOT_TOKEN,
    node_env: process.env.NODE_ENV || 'unknown'
  });
}