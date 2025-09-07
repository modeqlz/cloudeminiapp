# NFT Gifts Telegram WebApp

Телеграм веб-приложение для отправки и коллекционирования NFT подарков.

## 🚀 Быстрый старт

### 1. Установка зависимостей
```bash
npm install
```

### 2. Настройка окружения

#### Создайте файл `.env.local`:
```bash
cp .env.example .env.local
```

#### Настройте Supabase:
1. Создайте проект на [supabase.com](https://supabase.com)
2. Перейдите в Settings → API
3. Скопируйте Project URL и anon public key
4. Добавьте в `.env.local`:
```bash
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

#### Настройте Telegram бота:
1. Создайте бота через [@BotFather](https://t.me/botfather)
2. Используйте команду `/newbot`
3. Скопируйте токен бота
4. Добавьте в `.env.local`:
```bash
BOT_TOKEN=your_telegram_bot_token
```

### 3. Настройка базы данных

Выполните этот SQL в Supabase SQL Editor:

```sql
-- Создаем таблицу пользователей
CREATE TABLE public.users (
  id SERIAL PRIMARY KEY,
  telegram_id BIGINT UNIQUE NOT NULL,
  username TEXT,
  first_name TEXT,
  last_name TEXT,
  name TEXT,
  avatar_url TEXT,
  verified BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Создаем индексы
CREATE INDEX idx_users_telegram_id ON public.users(telegram_id);
CREATE INDEX idx_users_username ON public.users(username);

-- Функция для автоматического обновления updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Триггер для автоматического обновления updated_at
CREATE TRIGGER update_users_updated_at 
    BEFORE UPDATE ON public.users 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Включаем Row Level Security
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- Политика доступа
CREATE POLICY "Users can view and update own data" ON public.users
    FOR ALL USING (true);
```

### 4. Запуск приложения
```bash
npm run dev
```

Откройте [http://localhost:3000](http://localhost:3000) в браузере.

## 🎨 Функции

- 🔥 **Аукцион NFT** - участие в торгах за редкие NFT
- 🚀 **Отправка NFT** - передача цифровых активов друзьям
- ⭐ **Premium статус** - эксклюзивные возможности
- 💎 **Коллекция** - управление NFT активами
- 🔍 **Поиск друзей** - поиск пользователей по @username
- 🎯 **Красивый профиль** - статистика и активность

## 🛠 Технологии

- **Next.js 14** - React фреймворк
- **Supabase** - база данных и аутентификация
- **Telegram WebApp** - интеграция с Telegram
- **CSS Modules** - стилизация
- **PostgreSQL** - база данных

## 📱 Настройка Telegram WebApp

1. Откройте [@BotFather](https://t.me/botfather)
2. Выберите вашего бота
3. Используйте `/newapp` или `/editapp`
4. Укажите URL: `https://your-domain.com`
5. Загрузите иконку приложения

## 🔒 Безопасность

- Проверка подлинности данных Telegram
- Row Level Security в Supabase
- Защищенные API endpoints
- Валидация всех входящих данных

## 📦 Структура проекта

```
├── components/          # React компоненты
├── lib/                # Утилиты и конфигурация
├── pages/              # Next.js страницы
│   ├── api/           # API endpoints
│   ├── home.js        # Главная страница
│   ├── profile.js     # Профиль пользователя
│   └── index.js       # Страница входа
├── public/             # Статические файлы
├── styles/             # CSS стили
└── .env.example       # Пример конфигурации
```

## 🚀 Деплой

### Vercel (рекомендуется)
1. Подключите GitHub репозиторий к Vercel
2. Добавьте переменные окружения в настройках проекта
3. Деплой произойдет автоматически

### Другие платформы
- Убедитесь что переменные окружения настроены
- Выполните `npm run build`
- Запустите `npm start`

## 🤝 Участие в разработке

1. Форкните репозиторий
2. Создайте ветку для новой функции
3. Внесите изменения
4. Создайте Pull Request

## 📄 Лицензия

MIT License - подробности в файле LICENSE
