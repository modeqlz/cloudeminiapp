import crypto from 'crypto'

export function verifyTelegramAuth(initData) {
  try {
    const urlParams = new URLSearchParams(initData)
    const hash = urlParams.get('hash')
    urlParams.delete('hash')
    
    // Create data-check-string
    const dataCheckString = [...urlParams.entries()]
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([key, value]) => `${key}=${value}`)
      .join('\n')
    
    const botToken = process.env.BOT_TOKEN || 'dummy-token-for-dev'
    const secretKey = crypto.createHmac('sha256', 'WebAppData').update(botToken).digest()
    const calculatedHash = crypto.createHmac('sha256', secretKey).update(dataCheckString).digest('hex')
    
    const isValid = hash === calculatedHash
    
    // Parse user data
    const userParam = urlParams.get('user')
    let user = null
    if (userParam) {
      user = JSON.parse(userParam)
    }
    
    return {
      valid: isValid,
      user: user
    }
  } catch (error) {
    console.error('Telegram auth verification error:', error)
    return {
      valid: false,
      user: null
    }
  }
}