import crypto from 'crypto';

// Проверка подписи Telegram WebApp initData
export function verifyTelegramAuth(initData, botToken) {
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