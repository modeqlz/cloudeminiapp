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

  const handleSearch = async (query) => {
    if (!query || query.trim().length < 2) {
      setSearchResults([]);
      return;
    }

    setIsSearching(true);
    try {
      const response = await fetch(`/api/searchUsersDB?q=${encodeURIComponent(query.trim())}`);
      const data = await response.json();
      
      if (data.success) {
        setSearchResults(data.users || []);
      } else {
        setSearchResults([]);
      }
    } catch (error) {
      console.error('Search error:', error);
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  };

  const handleSearchChange = (e) => {
    const value = e.target.value;
    setSearchQuery(value);
    handleSearch(value);
  };

  const closeSearch = () => {
    setShowSearch(false);
    setSearchQuery('');
    setSearchResults([]);
  };

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

            {/* Search People */}
            <div className="tile tile-search" onClick={() => setShowSearch(true)} style={{cursor: 'pointer'}}>
              <div className="tile-head">
                <div className="tile-title">Поиск по @никнейму</div>
              </div>
              <div className="tile-desc">
                Найди пользователей, которые входили в приложение.
              </div>
            </div>
          </div>
        </div>

        {/* Search Modal */}
        {showSearch && (
          <div className="overlay" onClick={closeSearch}>
            <div className="overlay-backdrop" />
            <div className="overlay-panel" onClick={(e) => e.stopPropagation()}>
              <div className="brand" style={{justifyContent:'space-between', width:'100%', marginBottom: 16}}>
                <span>Поиск пользователей</span>
                <button className="btn btn-ghost" onClick={closeSearch} style={{padding: '8px'}}>✕</button>
              </div>

              <div style={{marginBottom: 16}}>
                <input
                  type="text"
                  placeholder="Введите @никнейм или имя..."
                  value={searchQuery}
                  onChange={handleSearchChange}
                  autoFocus
                  style={{
                    width: '100%',
                    padding: '12px 16px',
                    border: '1px solid var(--border)',
                    borderRadius: '12px',
                    background: 'var(--card)',
                    color: 'var(--text)',
                    fontSize: '16px',
                    outline: 'none'
                  }}
                />
              </div>

              <div style={{maxHeight: '300px', overflowY: 'auto'}}>
                {isSearching && (
                  <div style={{textAlign: 'center', padding: '20px', color: 'var(--muted)'}}>
                    Поиск...
                  </div>
                )}
                
                {!isSearching && searchQuery.length >= 2 && searchResults.length === 0 && (
                  <div style={{textAlign: 'center', padding: '20px', color: 'var(--muted)'}}>
                    Пользователи не найдены
                  </div>
                )}
                
                {!isSearching && searchResults.length > 0 && (
                  <div>
                    {searchResults.map((user, index) => (
                      <div key={index} style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '12px',
                        padding: '12px',
                        border: '1px solid var(--border)',
                        borderRadius: '12px',
                        marginBottom: '8px',
                        background: 'var(--card)'
                      }}>
                        <img 
                          src={user.avatar_url || '/placeholder.png'} 
                          alt={user.name || user.username} 
                          style={{
                            width: '40px',
                            height: '40px',
                            borderRadius: '50%',
                            objectFit: 'cover'
                          }}
                        />
                        <div style={{flex: 1}}>
                          <div style={{fontWeight: '600', color: 'var(--text)'}}>
                            {user.name || `${user.first_name || ''} ${user.last_name || ''}`.trim() || 'Без имени'}
                            {user.verified && <span style={{color: 'var(--brand)', marginLeft: '6px'}}>✓</span>}
                          </div>
                          <div style={{fontSize: '12px', color: 'var(--muted)'}}>
                            @{user.username}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}