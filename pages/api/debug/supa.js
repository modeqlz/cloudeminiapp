// SELF-TEST ENDPOINT ДЛЯ ПРОВЕРКИ SUPABASE ДОСТУПА
import { supabaseAdmin } from '../../../lib/supabaseAdmin';

export default async function handler(req, res) {
  console.log('🧪 TESTING SUPABASE ACCESS...');
  
  try {
    // Простой запрос для проверки доступа к БД
    const { data, error } = await supabaseAdmin
      .from('users')
      .select('id')
      .limit(1);
    
    if (error) {
      console.error('❌ SUPABASE ACCESS FAILED:', error);
      return res.status(500).json({ 
        ok: false, 
        error: error.message,
        code: error.code,
        details: error.details,
        hint: error.hint
      });
    }
    
    console.log('✅ SUPABASE ACCESS SUCCESS');
    return res.status(200).json({ 
      ok: true, 
      message: 'Supabase connection successful',
      recordsFound: data?.length || 0
    });
    
  } catch (error) {
    console.error('❌ CRITICAL SUPABASE ERROR:', error);
    return res.status(500).json({ 
      ok: false, 
      error: error.message,
      type: error.constructor.name,
      stack: error.stack
    });
  }
}