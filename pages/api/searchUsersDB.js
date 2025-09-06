// Mock data for when Supabase is not configured
let mockUsers = [
  {
    id: 1,
    telegram_id: 123456789,
    username: 'johndoe',
    name: 'John Doe',
    avatar_url: '/placeholder.png',
    verified: true
  },
  {
    id: 2,
    telegram_id: 987654321,
    username: 'janesmith',
    name: 'Jane Smith',
    avatar_url: '/placeholder.png',
    verified: false
  },
  {
    id: 3,
    telegram_id: 555666777,
    username: 'alexbrown',
    name: 'Alex Brown',
    avatar_url: '/placeholder.png',
    verified: true
  }
]

// Function to add a user to mock data (called from telegram.js)
export function addUserToMockData(userProfile) {
  // Check if user already exists
  const existingUserIndex = mockUsers.findIndex(u => u.telegram_id === userProfile.telegram_id)
  
  if (existingUserIndex !== -1) {
    // Update existing user
    mockUsers[existingUserIndex] = {
      ...mockUsers[existingUserIndex],
      username: userProfile.username,
      name: userProfile.name,
      avatar_url: userProfile.photo_url,
      updated_at: new Date().toISOString()
    }
  } else {
    // Add new user
    mockUsers.push({
      id: mockUsers.length + 1,
      telegram_id: userProfile.telegram_id,
      username: userProfile.username,
      name: userProfile.name,
      avatar_url: userProfile.photo_url,
      verified: userProfile.verified || false,
      created_at: new Date().toISOString()
    })
  }
}

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const { q: searchTerm } = req.query
    
    if (!searchTerm) {
      return res.status(400).json({ error: 'Search term is required' })
    }

    // Check if Supabase environment variables are available
    if (process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
      try {
        // Use Supabase if configured
        const { searchUsers } = await import('../../lib/supabase')
        const users = await searchUsers(searchTerm)
        return res.status(200).json({ success: true, users })
      } catch (supabaseError) {
        console.error('Supabase search failed, falling back to mock data:', supabaseError)
        // Fall through to mock data search
      }
    }

    // Fallback: search in mock data
    const filteredUsers = mockUsers.filter(user => {
      const searchLower = searchTerm.toLowerCase()
      const username = (user.username || '').toLowerCase()
      const name = (user.name || '').toLowerCase()
      
      return username.includes(searchLower) || name.includes(searchLower)
    })

    res.status(200).json({ 
      success: true, 
      users: filteredUsers.slice(0, 10) // Limit to 10 results
    })
  } catch (error) {
    console.error('Search error:', error)
    res.status(500).json({ error: 'Search failed' })
  }
}