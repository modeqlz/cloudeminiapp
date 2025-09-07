// Mock данные как fallback если база не настроена
let mockUsers = [
  { id: 1, username: 'modelqz', name: 'Model QZ', avatar_url: '/placeholder.png', verified: true },
  { id: 2, username: 'vampi', name: 'Vampi', avatar_url: '/placeholder.png', verified: true },
  { id: 3, username: 'modeqlz', name: 'Mode QLZ', avatar_url: '/placeholder.png', verified: true },
  { id: 4, username: 'john_doe', name: 'John Doe', avatar_url: '/placeholder.png', verified: false },
  { id: 5, username: 'alice_smith', name: 'Alice Smith', avatar_url: '/placeholder.png', verified: true },
  { id: 6, username: 'dev_master', name: 'Dev Master', avatar_url: '/placeholder.png', verified: false },
  { id: 7, username: 'crypto_trader', name: 'Crypto Trader', avatar_url: '/placeholder.png', verified: true },
  { id: 8, username: 'spectra_market', name: 'Spectra Market', avatar_url: '/placeholder.png', verified: true }
];

// Функция для добавления пользователя в mock данные
export function addUserToMockData(userProfile) {
  if (!userProfile || !userProfile.username) return;
  
  const existingIndex = mockUsers.findIndex(u => u.username === userProfile.username);
  const userData = {
    id: existingIndex >= 0 ? mockUsers[existingIndex].id : mockUsers.length + 1,
    username: userProfile.username,
    name: `${userProfile.first_name || ''} ${userProfile.last_name || ''}`.trim() || 'Без имени',
    avatar_url: userProfile.photo_url || '/placeholder.png',
    verified: false
  };

  if (existingIndex >= 0) {
    mockUsers[existingIndex] = { ...mockUsers[existingIndex], ...userData };
  } else {
    mockUsers.push(userData);
  }
  
  console.log(`[mockUsers] Added/updated user: ${userProfile.username}, total users: ${mockUsers.length}`);
}

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ ok: false, error: 'Method not allowed' });
  }

  const searchTerm = req.query.q;
  
  if (!searchTerm || searchTerm.trim().length === 0) {
    return res.status(400).json({ ok: false, error: 'Search term is required' });
  }

  // Проверяем есть ли Supabase настройки
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    console.log('[api/searchUsersDB] Using mock data - Supabase not configured');
    
    const trimmed = searchTerm.trim().toLowerCase().replace(/^@/, '');
    const filtered = mockUsers.filter(user => 
      user.username.toLowerCase().includes(trimmed) || 
      user.name.toLowerCase().includes(trimmed)
    );
    
    return res.status(200).json({ success: true, users: filtered });
  }

  // Динамически импортируем Supabase только если настроен
  try {
    const { searchUsers } = await import('../../lib/supabase');
    console.log('[api/searchUsersDB] Searching for:', searchTerm);
    const users = await searchUsers(searchTerm);
    
    console.log('[api/searchUsersDB] Found users:', users.length);
    return res.status(200).json({ success: true, users: users });
  } catch (e) {
    console.error('[api/searchUsersDB] Supabase query error:', e);
    
    // Fallback к mock данным если Supabase не работает
    console.log('[api/searchUsersDB] Falling back to mock data');
    const trimmed = searchTerm.trim().toLowerCase().replace(/^@/, '');
    const filtered = mockUsers.filter(user => 
      user.username.toLowerCase().includes(trimmed) || 
      user.name.toLowerCase().includes(trimmed)
    );
    
    return res.status(200).json({ success: true, users: filtered });
  }
}