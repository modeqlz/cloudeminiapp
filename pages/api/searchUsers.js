// pages/api/searchUsers.js

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', ['GET']);
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    const { q } = req.query;
    
    if (!q || q.trim().length < 2) {
      return res.status(400).json({ error: 'Query must be at least 2 characters long' });
    }

    const searchTerm = q.trim().toLowerCase();

    // Мок данные для демонстрации
    // В реальном приложении здесь был бы запрос к базе данных или внешнему API
    const mockUsers = [
      {
        id: 1,
        username: 'modelqz',
        name: 'Model QZ',
        avatar: '/placeholder.png',
        verified: true
      },
      {
        id: 2,
        username: 'john_doe',
        name: 'John Doe',
        avatar: '/placeholder.png',
        verified: false
      },
      {
        id: 3,
        username: 'alice_smith',
        name: 'Alice Smith',
        avatar: '/placeholder.png',
        verified: true
      },
      {
        id: 4,
        username: 'dev_master',
        name: 'Dev Master',
        avatar: '/placeholder.png',
        verified: false
      },
      {
        id: 5,
        username: 'crypto_trader',
        name: 'Crypto Trader',
        avatar: '/placeholder.png',
        verified: true
      }
    ];

    // Фильтруем пользователей по поисковому запросу
    const filteredUsers = mockUsers.filter(user => 
      user.username.toLowerCase().includes(searchTerm) ||
      user.name.toLowerCase().includes(searchTerm)
    );

    // Ограничиваем результаты до 10
    const results = filteredUsers.slice(0, 10);

    return res.status(200).json({
      items: results,
      total: results.length,
      query: searchTerm
    });

  } catch (error) {
    console.error('[api/searchUsers] error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}