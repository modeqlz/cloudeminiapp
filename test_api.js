// Автопроверка API роута /api/auth/telegram
const API_BASE = process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3000';

async function testAPI() {
  console.log('🧪 Тестирование API роута /api/auth/telegram\n');

  // Тест 1: POST без тела
  console.log('1️⃣ POST без тела → ожидать Missing initData');
  try {
    const res1 = await fetch(`${API_BASE}/api/auth/telegram`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    });
    const result1 = await res1.json();
    console.log(`   Статус: ${res1.status}, Ответ:`, result1);
    
    if (res1.status === 400 && result1.error === 'Missing initData') {
      console.log('   ✅ Тест пройден\n');
    } else {
      console.log('   ❌ Тест не пройден\n');
    }
  } catch (e) {
    console.log('   ❌ Ошибка сети:', e.message, '\n');
  }

  // Тест 2: POST с пустым initData
  console.log('2️⃣ POST с пустым initData → ожидать Missing initData');
  try {
    const res2 = await fetch(`${API_BASE}/api/auth/telegram`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ initData: '' })
    });
    const result2 = await res2.json();
    console.log(`   Статус: ${res2.status}, Ответ:`, result2);
    
    if (res2.status === 400 && result2.error === 'Missing initData') {
      console.log('   ✅ Тест пройден\n');
    } else {
      console.log('   ❌ Тест не пройден\n');
    }
  } catch (e) {
    console.log('   ❌ Ошибка сети:', e.message, '\n');
  }

  // Тест 3: POST с неверным initData
  console.log('3️⃣ POST с неверным initData → ожидать Bad signature');
  try {
    const res3 = await fetch(`${API_BASE}/api/auth/telegram`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        initData: 'user=%7B%22id%22%3A123%7D&hash=invalid_hash&auth_date=1234567890'
      })
    });
    const result3 = await res3.json();
    console.log(`   Статус: ${res3.status}, Ответ:`, result3);
    
    if (res3.status === 401 && result3.error === 'Bad signature') {
      console.log('   ✅ Тест пройден\n');
    } else {
      console.log('   ❌ Тест не пройден\n');
    }
  } catch (e) {
    console.log('   ❌ Ошибка сети:', e.message, '\n');
  }

  // Тест 4: Проверка переменных окружения
  console.log('4️⃣ Проверка переменных окружения через /api/debug/env');
  try {
    const res4 = await fetch(`${API_BASE}/api/debug/env`);
    const result4 = await res4.json();
    console.log(`   Статус: ${res4.status}, Ответ:`, result4);
    
    const missing = Object.entries(result4).filter(([key, value]) => 
      key !== 'node_env' && !value
    ).map(([key]) => key);
    
    if (missing.length === 0) {
      console.log('   ✅ Все переменные окружения настроены\n');
    } else {
      console.log(`   ⚠️ Отсутствуют переменные: ${missing.join(', ')}\n`);
    }
  } catch (e) {
    console.log('   ❌ Ошибка сети:', e.message, '\n');
  }

  console.log('🏁 Тестирование завершено');
}

// Запуск тестов
if (typeof window === 'undefined') {
  // Node.js окружение
  const fetch = require('node-fetch');
  testAPI();
} else {
  // Браузер
  console.log('Для запуска тестов откройте консоль браузера и выполните testAPI()');
  window.testAPI = testAPI;
}