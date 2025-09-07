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
      console.log('[telegram auth] Checking Supabase configuration...');
      console.log('[telegram auth] SUPABASE_URL:', process.env.NEXT_PUBLIC_SUPABASE_URL ? 'SET' : 'NOT SET');
      console.log('[telegram auth] SUPABASE_ANON_KEY:', process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? 'SET' : 'NOT SET');
      
      // Check if Supabase environment variables are available
      if (process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
        console.log('[telegram auth] Using Supabase database');
        // Dynamic import to prevent errors if Supabase is not configured
        const { saveUser } = await import('../../../lib/supabase')
        const result = await saveUser(userProfile)
        
        if (result.ok) {
          console.log('[telegram auth] User saved to Supabase database successfully')
        } else {
          console.error('[telegram auth] Failed to save user to Supabase:', result.error)
        }
      } else {
        // Fallback: add user to mock data
        console.log('[telegram auth] Using mock data (Supabase not configured)');
        const { addUserToMockData } = await import('../searchUsersDB')
        addUserToMockData(userProfile)
        console.log('[telegram auth] User added to mock data')
      }
    } catch (dbError) {
      console.error('[telegram auth] Database operation failed:', dbError)
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