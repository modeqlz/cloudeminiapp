// pages/api/searchUsersDB.js
// Версия с реальной базой данных через Supabase

import { searchUsers } from '../../lib/supabase'

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

    const searchTerm = q.trim();

    // Проверяем наличие переменных окружения Supabase
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
      console.log('Supabase не настроен, используем мок данные...')
      
      // Fallback к мок данным если Supabase не настроен
      const mockUsers = [
        {
          id: 1,
          username: 'modelqz',
          name: 'Model QZ',
          avatar_url: '/placeholder.png',
          verified: true
        },
        {
          id: 2,
          username: 'vampi',
          name: 'Vampi',
          avatar_url: '/placeholder.png',
          verified: true
        },
        {
          id: 3,
          username: 'modeqlz',
          name: 'Modeqlz',
          avatar_url: '/placeholder.png',
          verified: true
        }
      ];

      const filteredUsers = mockUsers.filter(user => 
        user.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.name.toLowerCase().includes(searchTerm.toLowerCase())
      );

      return res.status(200).json({
        items: filteredUsers,
        total: filteredUsers.length,
        query: searchTerm,
        source: 'mock'
      });
    }

    // Используем реальную базу данных
    const { data: users, error } = await searchUsers(searchTerm);

    if (error) {
      throw new Error(error);
    }

    return res.status(200).json({
      items: users || [],
      total: (users || []).length,
      query: searchTerm,
      source: 'database'
    });

  } catch (error) {
    console.error('[api/searchUsersDB] error:', error);
    return res.status(500).json({ 
      error: 'Internal server error',
      details: error.message 
    });
  }
}