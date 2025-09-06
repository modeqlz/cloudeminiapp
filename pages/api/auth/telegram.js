import crypto from 'crypto'

function verifyTelegramAuth(initData) {
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

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const { initData } = req.body
    
    if (!initData) {
      return res.status(400).json({ error: 'No init data provided' })
    }

    // Verify the Telegram data
    const verification = verifyTelegramAuth(initData)
    
    if (!verification.valid) {
      return res.status(400).json({ error: 'Invalid Telegram data' })
    }

    const userProfile = {
      id: verification.user.id,
      telegram_id: verification.user.id,
      username: verification.user.username,
      first_name: verification.user.first_name,
      last_name: verification.user.last_name,
      name: `${verification.user.first_name} ${verification.user.last_name || ''}`.trim(),
      photo_url: verification.user.photo_url,
      verified: false // You can set logic for verified users
    }

    // Try to save user to database (Supabase)
    try {
      // Check if Supabase environment variables are available
      if (process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
        // Dynamic import to prevent errors if Supabase is not configured
        const { saveUser } = await import('../../../lib/supabase')
        await saveUser(userProfile)
        console.log('User saved to Supabase database')
      } else {
        // Fallback: add user to mock data
        const { addUserToMockData } = await import('../searchUsersDB')
        addUserToMockData(userProfile)
        console.log('User added to mock data (Supabase not configured)')
      }
    } catch (dbError) {
      console.error('Database operation failed:', dbError)
      // Still continue with login even if DB save fails
    }

    res.status(200).json({
      ok: true,
      profile: userProfile
    })
  } catch (error) {
    console.error('Auth error:', error)
    res.status(500).json({ error: 'Authentication failed' })
  }
}