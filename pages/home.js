import { useEffect, useState } from 'react';
import Head from 'next/head';

function readStoredProfile() {
  try {
    const a = localStorage.getItem('profile');
    if (a) return JSON.parse(a);
  } catch {}
  try {
    const b = sessionStorage.getItem('profile');
    if (b) return JSON.parse(b);
  } catch {}
  return null;
}

export default function HomePage() {
  const [p, setP] = useState(null);
  const [showSearch, setShowSearch] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState(null);

  useEffect(() => {
    // если пользователь вышел — на главную
    if (sessionStorage.getItem('logged_out') === '1') {
      window.location.replace('/');
      return;
    }
    const cached = readStoredProfile();
    if (!cached) {
      // нет профиля — на экран логина
      window.location.replace('/');
      return;
    }
    setP(cached);
  }, []);

  // Функция поиска пользователей через API
  async function handleSearch(query) {
    const trimmed = (query || '').replace(/^@/, '').trim();
    if (!trimmed) { 
      setSearchResults([]); 
      setSearchError(null);
      return; 
    }

    if (trimmed.length < 2) {
      setSearchResults([]);
      setSearchError('Минимум 2 символа для поиска');
      return;
    }

    try {
      setIsSearching(true);
      setSearchError(null);
      
      const response = await fetch(`/api/searchUsers?q=${encodeURIComponent(trimmed)}`);
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Ошибка поиска');
      }

      setSearchResults(data.items || []);
    } catch (error) {
      setSearchError(error.message || 'Ошибка поиска. Попробуйте снова.');
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  }

  // Автопоиск при изменении запроса
  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchQuery.trim()) {
        handleSearch(searchQuery);
      } else {
        setSearchResults([]);
        setSearchError(null);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Открыть модалку поиска
  function openSearch() {
    setShowSearch(true);
    setSearchQuery('');
    setSearchResults([]);
    setSearchError(null);
  }

  // Закрыть модалку поиска
  function closeSearch() {
    setShowSearch(false);
    setSearchQuery('');
    setSearchResults([]);
    setSearchError(null);
  }

  // Обработчик клика на пользователя
  function handleUserClick(user) {
    // Здесь можно добавить логику перехода на профиль пользователя
    // Например, открыть страницу профиля в Telegram или внутри приложения
    const telegramUrl = `https://t.me/${user.username}`;
    
    // Попробуем открыть в Telegram, если доступно
    if (window.Telegram?.WebApp) {
      window.Telegram.WebApp.openTelegramLink(telegramUrl);
    } else {
      // Или просто покажем алерт с информацией
      alert(`Пользователь: ${user.name}\n@${user.username}\n\nОткрыть профиль: ${telegramUrl}`);
    }
    
    closeSearch();
  }

  if (!p) {
    return (
      <div className="container">
        <div className="hero" style={{maxWidth:560, textAlign:'center'}}>Загружаем меню…</div>
      </div>
    );
  }

  const name = [p.first_name, p.last_name].filter(Boolean).join(' ') || 'Гость';
  const avatar = p.photo_url || '/placeholder.png';
  const at = p.username ? '@' + p.username : '';

  return (
    <>
      <Head><title>Главное меню — Spectra Market</title></Head>
      <div className="container">
        <div className="hero" style={{maxWidth:980}}>
          {/* top bar */}
          <div className="topbar">
            <div className="topbar-left">
              <img className="avatar" src={avatar} alt="avatar" />
              <div className="hello">
                <div className="hello-hi">Привет, {name}</div>
                <div className="hello-sub">{at || 'Добро пожаловать!'}</div>
              </div>
            </div>
            <a className="btn btn-ghost" href="/profile" aria-label="Профиль">
              Профиль
            </a>
          </div>

          {/* grid tiles */}
          <div className="grid">
            {/* Auctions */}
            <a className="tile tile-auction" href="/auctions">
              <div className="tile-head">
                <div className="tile-title">Аукционы</div>
                <div className="tile-badge">Live</div>
              </div>
              <div className="tile-desc">
                Делай ставки на редкие подарки в реальном времени.
              </div>
            </a>

            {/* Gifts */}
            <a className="tile tile-gifts" href="/gifts">
              <div className="tile-head">
                <div className="tile-title">Подарки</div>
              </div>
              <div className="tile-desc">
                Каталог наборов и коллекций — отправляй друзьям в один тап.
              </div>
            </a>

            {/* Plans */}
            <a className="tile tile-plans" href="/plans">
              <div className="tile-head">
                <div className="tile-title">Тарифы</div>
              </div>
              <ul className="tile-list">
                <li>Бесплатный — стартуй без рисков</li>
                <li>Plus — расширенная витрина</li>
                <li>Pro — максимум для продавцов</li>
              </ul>
            </a>

            {/* My purchases */}
            <a className="tile tile-orders" href="/orders">
              <div className="tile-head">
                <div className="tile-title">Покупки</div>
              </div>
              <div className="tile-desc">История покупок и статусы отправки.</div>
            </a>

            {/* Search People - ЗАМЕНИЛИ "Создать подарок" */}
            <div className="tile tile-search" onClick={openSearch}>
              <div className="tile-head">
                <div className="tile-title">Поиск человека</div>
                <div className="tile-badge">@</div>
              </div>
              <div className="tile-desc">Найди пользователя по @никнейму и открой его профиль.</div>
            </div>
          </div>
        </div>
      </div>

      {/* Search Modal */}
      {showSearch && (
        <div className="search-overlay" onClick={(e) => e.target === e.currentTarget && closeSearch()}>
          <div className="search-modal">
            <div className="search-header">
              <h2 className="h1" style={{fontSize: '20px', margin: 0}}>Поиск человека</h2>
              <button className="close-btn" onClick={closeSearch}>×</button>
            </div>

            <div className="search-row">
              <span className="at">@</span>
              <input
                className="input"
                placeholder="введите никнейм..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                autoFocus
              />
            </div>

            {isSearching && (
              <div className="foot" style={{textAlign: 'center', marginTop: '16px'}}>
                🔍 Ищем...
              </div>
            )}

            {searchError && (
              <div className="foot" style={{color:'#ffb4b4', marginTop: '16px'}}>
                ⚠️ {searchError}
              </div>
            )}

            {searchResults.length > 0 && (
              <div className="user-list">
                {searchResults.map(user => (
                  <div 
                    key={user.id} 
                    className="user-row" 
                    onClick={() => handleUserClick(user)}
                  >
                    <img src={user.avatar} alt="" />
                    <div className="user-meta">
                      <div className="user-name">
                        {user.name}
                        {user.verified && <span style={{color: 'var(--brand)', marginLeft: '4px'}}>✓</span>}
                      </div>
                      <div className="user-handle">@{user.username}</div>
                    </div>
                    <span className="user-open">Открыть</span>
                  </div>
                ))}
              </div>
            )}

            {!isSearching && !searchError && searchResults.length === 0 && searchQuery.trim() !== '' && searchQuery.trim().length >= 2 && (
              <div className="foot" style={{textAlign: 'center', marginTop: '16px'}}>
                😕 Ничего не найдено по запросу "@{searchQuery.replace(/^@/, '')}"
              </div>
            )}

            {searchQuery.trim() === '' && (
              <div className="foot" style={{textAlign: 'center', marginTop: '16px', opacity: 0.7}}>
                💡 Введите @никнейм для поиска пользователя
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}