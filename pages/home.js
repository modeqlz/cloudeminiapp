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
                <div className="tile-title">🔥 Горячие аукционы</div>
                <div className="tile-badge">Live</div>
              </div>
              <div className="tile-desc">
                Участвуй в битвах за легендарные скины. Кто больше заплатит — тот и забирает!
              </div>
            </a>

            {/* Gifts */}
            <a className="tile tile-gifts" href="/gifts">
              <div className="tile-head">
                <div className="tile-title">🎁 Магазин скинов</div>
              </div>
              <div className="tile-desc">
                Коллекция эксклюзивных скинов для CS:GO, Valorant, Dota 2. Покупай и дари друзьям!
              </div>
            </a>

            {/* Plans */}
            <a className="tile tile-plans" href="/plans">
              <div className="tile-head">
                <div className="tile-title">⭐ VIP статусы</div>
              </div>
              <ul className="tile-list">
                <li>🆓 Новичок — первые шаги в трейдинге</li>
                <li>🥉 Трейдер — больше возможностей</li>
                <li>🥇 Про-игрок — максимум привилегий</li>
              </ul>
            </a>

            {/* My purchases */}
            <a className="tile tile-orders" href="/orders">
              <div className="tile-head">
                <div className="tile-title">📦 Мои скины</div>
              </div>
              <div className="tile-desc">Твоя коллекция скинов и история всех сделок в одном месте.</div>
            </a>

            {/* Search People */}
            <div className="tile tile-search" onClick={() => setShowSearch(true)} style={{cursor: 'pointer'}}>
              <div className="tile-head">
                <div className="tile-title">🔍 Поиск игроков</div>
              </div>
              <div className="tile-desc">
                Найди других трейдеров и коллекционеров по @никнейму. Начни обмен прямо сейчас!
              </div>
            </div>
          </div>
        </div>

        {/* Search Modal */}
        {showSearch && (
          <div className="overlay" onClick={closeSearch}>
            <div className="overlay-backdrop" />
            <div className="overlay-panel" onClick={(e) => e.stopPropagation()}>
              <div className="brand" style={{justifyContent:'space-between', width:'100%', marginBottom: 20}}>
                <span>🔍 Поиск трейдеров</span>
                <button className="btn btn-ghost" onClick={closeSearch} style={{padding: '8px'}}>✕</button>
              </div>

              <div style={{marginBottom: 20}}>
                <div style={{position: 'relative'}}>
                  <span style={{
                    position: 'absolute',
                    left: '12px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    fontSize: '16px',
                    color: 'var(--muted)'
                  }}>🎮</span>
                  <input
                    type="text"
                    placeholder="Найди игрока по @никнейму или имени..."
                    value={searchQuery}
                    onChange={handleSearchChange}
                    autoFocus
                    style={{
                      width: '100%',
                      padding: '12px 16px 12px 40px',
                      border: '1px solid var(--border)',
                      borderRadius: '12px',
                      background: 'var(--card)',
                      color: 'var(--text)',
                      fontSize: '16px',
                      outline: 'none',
                      transition: 'border-color 0.2s ease'
                    }}
                  />
                </div>
                <div style={{fontSize: '12px', color: 'var(--muted)', marginTop: '8px', textAlign: 'center'}}>
                  💡 Ищи коллекционеров скинов и начинай обмен
                </div>
              </div>

              <div style={{maxHeight: '320px', overflowY: 'auto'}}>
                {isSearching && (
                  <div style={{textAlign: 'center', padding: '30px', color: 'var(--muted)'}}>
                    <div style={{fontSize: '24px', marginBottom: '8px'}}>🔄</div>
                    <div>Ищем игроков...</div>
                  </div>
                )}
                
                {!isSearching && searchQuery.length >= 2 && searchResults.length === 0 && (
                  <div style={{textAlign: 'center', padding: '30px', color: 'var(--muted)'}}>
                    <div style={{fontSize: '24px', marginBottom: '8px'}}>😕</div>
                    <div><strong>Игроки не найдены</strong></div>
                    <div style={{fontSize: '12px', marginTop: '4px'}}>
                      Попробуй другой @никнейм или имя
                    </div>
                  </div>
                )}
                
                {!isSearching && searchResults.length > 0 && (
                  <div>
                    <div style={{fontSize: '12px', color: 'var(--muted)', marginBottom: '12px', textAlign: 'center'}}>
                      🎯 Найдено {searchResults.length} {searchResults.length === 1 ? 'игрок' : 'игроков'}
                    </div>
                    {searchResults.map((user, index) => (
                      <div key={index} style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '14px',
                        padding: '14px',
                        border: '1px solid var(--border)',
                        borderRadius: '16px',
                        marginBottom: '8px',
                        background: 'var(--card)',
                        cursor: 'pointer',
                        transition: 'all 0.2s ease',
                        position: 'relative'
                      }}
                      onMouseEnter={(e) => {
                        e.target.style.transform = 'translateY(-1px)'
                        e.target.style.borderColor = 'var(--brand)'
                      }}
                      onMouseLeave={(e) => {
                        e.target.style.transform = 'translateY(0)'
                        e.target.style.borderColor = 'var(--border)'
                      }}
                      >
                        <div style={{position: 'relative'}}>
                          <img 
                            src={user.avatar_url || '/placeholder.png'} 
                            alt={user.name || user.username} 
                            style={{
                              width: '48px',
                              height: '48px',
                              borderRadius: '50%',
                              objectFit: 'cover',
                              border: '2px solid var(--border)'
                            }}
                          />
                          {user.verified && (
                            <span style={{
                              position: 'absolute',
                              bottom: '-2px',
                              right: '-2px',
                              background: 'var(--brand)',
                              color: 'white',
                              borderRadius: '50%',
                              width: '16px',
                              height: '16px',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              fontSize: '10px',
                              fontWeight: 'bold'
                            }}>✓</span>
                          )}
                        </div>
                        <div style={{flex: 1}}>
                          <div style={{
                            fontWeight: '600', 
                            color: 'var(--text)',
                            fontSize: '15px',
                            marginBottom: '2px'
                          }}>
                            {user.name || `${user.first_name || ''} ${user.last_name || ''}`.trim() || 'Игрок'}
                          </div>
                          <div style={{fontSize: '13px', color: 'var(--muted)'}}>
                            @{user.username}
                          </div>
                        </div>
                        <div style={{
                          background: 'var(--brand)',
                          borderRadius: '8px',
                          padding: '6px 10px',
                          fontSize: '11px',
                          fontWeight: '600',
                          color: 'white'
                        }}>
                          💬 Написать
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