import { useEffect, useState } from 'react';
import Head from 'next/head';
import LoadingCard from '../components/LoadingCard';

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

export default function ProfilePage() {
  const [profile, setProfile] = useState(null);
  const [busy, setBusy] = useState(true);
  const [msg, setMsg] = useState('');
  const [currentSlide, setCurrentSlide] = useState(0);

  useEffect(() => {
    (async () => {
      setBusy(true);
      setMsg('');

      // ⛔ если пользователь нажал «Выйти» — не автологиним
      if (sessionStorage.getItem('logged_out') === '1') {
        setBusy(false);
        setMsg('Вы вышли из аккаунта.');
        return;
      }

      // 1) пробуем взять из local/session storage
      const cached = readStoredProfile();
      if (cached) {
        setProfile(cached);
        setBusy(false);
        return;
      }

      // 2) тихий ре-логин, если есть initData из Telegram
      try {
        const tg = typeof window !== 'undefined' ? window.Telegram?.WebApp : null;
        const initData = tg?.initData || '';
        if (initData) {
          const res = await fetch('/api/auth/telegram', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ initData })
          }).then(r => r.json());

          if (res.ok && res.profile) {
            try { localStorage.setItem('profile', JSON.stringify(res.profile)); } catch {}
            setProfile(res.profile);
            setBusy(false);
            return;
          }
        }
      } catch {}

      // 3) не вышло
      setBusy(false);
      setMsg('Нет данных профиля. Вернитесь на главную и войдите заново.');
    })();
  }, []);

  function handleLogout() {
    try { localStorage.removeItem('profile'); } catch {}
    try { sessionStorage.removeItem('profile'); } catch {}
    try { sessionStorage.setItem('logged_out', '1'); } catch {}
    // уходим на главную так, чтобы нельзя было вернуться «Назад»
    window.location.replace('/');
  }

  const handleScroll = (e) => {
    const container = e.target;
    const cardWidth = 156; // 140px + 16px gap
    const scrollLeft = container.scrollLeft;
    const maxScrollLeft = container.scrollWidth - container.clientWidth;
    
    // Если дошли до конца - показываем последний индикатор
    if (scrollLeft >= maxScrollLeft - 10) {
      setCurrentSlide(3);
    } else {
      const newSlide = Math.min(3, Math.max(0, Math.round(scrollLeft / cardWidth)));
      setCurrentSlide(newSlide);
    }
  };

  const scrollToSlide = (slideIndex) => {
    const container = document.querySelector('.stats-scroll');
    if (container) {
      const cardWidth = 156; // 140px + 16px gap
      const maxScrollLeft = container.scrollWidth - container.clientWidth;
      
      let targetScroll;
      if (slideIndex === 3) {
        // Для последнего слайда - прокручиваем до самого конца
        targetScroll = maxScrollLeft;
      } else {
        targetScroll = slideIndex * cardWidth;
      }
      
      container.scrollTo({
        left: targetScroll,
        behavior: 'smooth'
      });
      setCurrentSlide(slideIndex);
    }
  };

  if (busy) {
    return (
      <>
        <Head><title>Профиль — Spectra Market</title></Head>
        <div className="overlay" aria-hidden>
          <div className="overlay-backdrop" />
          <div className="overlay-panel">
            <LoadingCard
              messages={[
                'Ищем сохранённый профиль…',
                'Проверяем авторизацию…',
                'Восстанавливаем сессию…',
                'Готовим профиль…'
              ]}
              intervalMs={700}
            />
            <div className="overlay-hint">Секунду…</div>
          </div>
        </div>
      </>
    );
  }

  if (!profile) {
    return (
      <>
        <Head><title>Профиль — Spectra Market</title></Head>
        <div className="container">
          <div className="hero" style={{maxWidth:560, textAlign:'center', padding:'32px'}}>
            <p className="lead" style={{marginBottom:16}}>{msg || 'Нет данных профиля.'}</p>
            <div className="row" style={{justifyContent:'center'}}>
              <a className="btn btn-primary" href="/">На главную</a>
            </div>
          </div>
        </div>
      </>
    );
  }

  const name = [profile.first_name, profile.last_name].filter(Boolean).join(' ') || 'Без имени';
  const at = profile.username ? '@' + profile.username : 'без username';
  const avatar = profile.photo_url || '/placeholder.png';

  return (
    <>
      <Head><title>Профиль — Spectra Market</title></Head>
      <div className="container">
        <div className="hero" style={{maxWidth:560}}>
          {/* Header */}
          <div className="brand" style={{justifyContent:'space-between', width:'100%', marginBottom: 24}}>
            <span style={{fontSize: '20px', fontWeight: '700'}}>🎨 Мой профиль</span>
            <button className="btn btn-ghost" onClick={handleLogout} style={{
              background: 'rgba(255,77,77,0.1)',
              color: '#ff4d4d',
              border: '1px solid rgba(255,77,77,0.2)',
              borderRadius: '12px',
              padding: '8px 16px',
              fontSize: '14px'
            }}>
              🚪 Выйти
            </button>
          </div>

          {/* Profile Card */}
          <div style={{
            background: 'linear-gradient(135deg, var(--card) 0%, rgba(var(--brand-rgb), 0.05) 100%)',
            border: '1px solid var(--border)',
            borderRadius: '24px',
            padding: '32px',
            marginBottom: '24px',
            position: 'relative',
            overflow: 'hidden'
          }}>
            {/* Background decoration */}
            <div style={{
              position: 'absolute',
              top: '-50%',
              right: '-50%',
              width: '200%',
              height: '200%',
              background: 'radial-gradient(circle, rgba(var(--brand-rgb), 0.03) 0%, transparent 70%)',
              pointerEvents: 'none'
            }} />
            
            {/* Profile info */}
            <div style={{position: 'relative', zIndex: 1}}>
              <div style={{display:'flex', alignItems:'center', gap: 20, marginBottom: 24}}>
                <div style={{position: 'relative'}}>
                  <img
                    src={avatar}
                    alt="avatar"
                    style={{
                      width: 80, 
                      height: 80, 
                      borderRadius: '20px',
                      objectFit:'cover', 
                      border:'3px solid var(--brand)',
                      boxShadow: '0 8px 32px rgba(0,0,0,0.1)'
                    }}
                  />
                  {/* Verified badge */}
                  <div style={{
                    position: 'absolute',
                    bottom: '-4px',
                    right: '-4px',
                    background: 'var(--brand)',
                    borderRadius: '50%',
                    width: '24px',
                    height: '24px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    border: '2px solid var(--card)',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.2)'
                  }}>
                    <span style={{color: 'white', fontSize: '12px', fontWeight: 'bold'}}>✓</span>
                  </div>
                </div>
                
                <div style={{flex: 1}}>
                  <div style={{
                    fontSize: '24px', 
                    fontWeight: '700', 
                    color: 'var(--text)',
                    marginBottom: '4px',
                    letterSpacing: '-0.5px'
                  }}>
                    {name}
                  </div>
                  <div style={{
                    fontSize: '16px', 
                    color: 'var(--brand)',
                    fontWeight: '600',
                    marginBottom: '8px'
                  }}>
                    {at}
                  </div>
                  <div style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    background: 'rgba(var(--brand-rgb), 0.1)',
                    color: 'var(--brand)',
                    padding: '4px 12px',
                    borderRadius: '20px',
                    fontSize: '12px',
                    fontWeight: '600'
                  }}>
                    💎 NFT Коллекционер
                  </div>
                </div>
              </div>

              {/* Stats - Horizontal Scroll */}
              <div style={{
                marginBottom: '24px'
              }}>
                <div 
                  className="stats-scroll" 
                  onScroll={handleScroll}
                  style={{
                    display: 'flex',
                    gap: '16px',
                    overflowX: 'auto',
                    paddingBottom: '8px'
                  }}
                >
                  <div style={{
                    textAlign: 'center',
                    padding: '20px',
                    background: 'rgba(var(--brand-rgb), 0.05)',
                    borderRadius: '20px',
                    border: '1px solid rgba(var(--brand-rgb), 0.1)',
                    minWidth: '140px',
                    flexShrink: 0,
                    cursor: 'pointer',
                    transition: 'all 0.2s ease'
                  }}
                  onMouseEnter={(e) => {
                    e.target.style.transform = 'translateY(-4px)'
                    e.target.style.boxShadow = '0 8px 32px rgba(var(--brand-rgb), 0.2)'
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.transform = 'translateY(0)'
                    e.target.style.boxShadow = 'none'
                  }}
                  >
                    <div style={{fontSize: '24px', fontWeight: '800', color: 'var(--brand)', marginBottom: '8px'}}>
                      12
                    </div>
                    <div style={{fontSize: '13px', color: 'var(--muted)', fontWeight: '600', lineHeight: '1.2'}}>
                      🎁 NFT в<br/>коллекции
                    </div>
                  </div>
                  
                  <div style={{
                    textAlign: 'center',
                    padding: '20px',
                    background: 'rgba(255, 193, 7, 0.05)',
                    borderRadius: '20px',
                    border: '1px solid rgba(255, 193, 7, 0.1)',
                    minWidth: '140px',
                    flexShrink: 0,
                    cursor: 'pointer',
                    transition: 'all 0.2s ease'
                  }}
                  onMouseEnter={(e) => {
                    e.target.style.transform = 'translateY(-4px)'
                    e.target.style.boxShadow = '0 8px 32px rgba(255, 193, 7, 0.2)'
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.transform = 'translateY(0)'
                    e.target.style.boxShadow = 'none'
                  }}
                  >
                    <div style={{fontSize: '24px', fontWeight: '800', color: '#ffc107', marginBottom: '8px'}}>
                      8
                    </div>
                    <div style={{fontSize: '13px', color: 'var(--muted)', fontWeight: '600', lineHeight: '1.2'}}>
                      🚀 Отправлено<br/>друзьям
                    </div>
                  </div>
                  
                  <div style={{
                    textAlign: 'center',
                    padding: '20px',
                    background: 'rgba(40, 167, 69, 0.05)',
                    borderRadius: '20px',
                    border: '1px solid rgba(40, 167, 69, 0.1)',
                    minWidth: '140px',
                    flexShrink: 0,
                    cursor: 'pointer',
                    transition: 'all 0.2s ease'
                  }}
                  onMouseEnter={(e) => {
                    e.target.style.transform = 'translateY(-4px)'
                    e.target.style.boxShadow = '0 8px 32px rgba(40, 167, 69, 0.2)'
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.transform = 'translateY(0)'
                    e.target.style.boxShadow = 'none'
                  }}
                  >
                    <div style={{fontSize: '24px', fontWeight: '800', color: '#28a745', marginBottom: '8px'}}>
                      ⭐
                    </div>
                    <div style={{fontSize: '13px', color: 'var(--muted)', fontWeight: '600', lineHeight: '1.2'}}>
                      Premium<br/>статус
                    </div>
                  </div>

                  <div style={{
                    textAlign: 'center',
                    padding: '20px',
                    background: 'rgba(138, 43, 226, 0.05)',
                    borderRadius: '20px',
                    border: '1px solid rgba(138, 43, 226, 0.1)',
                    minWidth: '140px',
                    flexShrink: 0,
                    cursor: 'pointer',
                    transition: 'all 0.2s ease'
                  }}
                  onMouseEnter={(e) => {
                    e.target.style.transform = 'translateY(-4px)'
                    e.target.style.boxShadow = '0 8px 32px rgba(138, 43, 226, 0.2)'
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.transform = 'translateY(0)'
                    e.target.style.boxShadow = 'none'
                  }}
                  >
                    <div style={{fontSize: '24px', fontWeight: '800', color: '#8a2be2', marginBottom: '8px'}}>
                      24
                    </div>
                    <div style={{fontSize: '13px', color: 'var(--muted)', fontWeight: '600', lineHeight: '1.2'}}>
                      🏆 Рейтинг<br/>в топе
                    </div>
                  </div>

                  <div style={{
                    textAlign: 'center',
                    padding: '20px',
                    background: 'rgba(220, 20, 60, 0.05)',
                    borderRadius: '20px',
                    border: '1px solid rgba(220, 20, 60, 0.1)',
                    minWidth: '140px',
                    flexShrink: 0,
                    cursor: 'pointer',
                    transition: 'all 0.2s ease'
                  }}
                  onMouseEnter={(e) => {
                    e.target.style.transform = 'translateY(-4px)'
                    e.target.style.boxShadow = '0 8px 32px rgba(220, 20, 60, 0.2)'
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.transform = 'translateY(0)'
                    e.target.style.boxShadow = 'none'
                  }}
                  >
                    <div style={{fontSize: '24px', fontWeight: '800', color: '#dc143c', marginBottom: '8px'}}>
                      5.2k
                    </div>
                    <div style={{fontSize: '13px', color: 'var(--muted)', fontWeight: '600', lineHeight: '1.2'}}>
                      💰 Общая<br/>стоимость
                    </div>
                  </div>

                  <div style={{
                    textAlign: 'center',
                    padding: '20px',
                    background: 'rgba(255, 165, 0, 0.05)',
                    borderRadius: '20px',
                    border: '1px solid rgba(255, 165, 0, 0.1)',
                    minWidth: '140px',
                    flexShrink: 0,
                    cursor: 'pointer',
                    transition: 'all 0.2s ease'
                  }}
                  onMouseEnter={(e) => {
                    e.target.style.transform = 'translateY(-4px)'
                    e.target.style.boxShadow = '0 8px 32px rgba(255, 165, 0, 0.2)'
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.transform = 'translateY(0)'
                    e.target.style.boxShadow = 'none'
                  }}
                  >
                    <div style={{fontSize: '24px', fontWeight: '800', color: '#ffa500', marginBottom: '8px'}}>
                      3
                    </div>
                    <div style={{fontSize: '13px', color: 'var(--muted)', fontWeight: '600', lineHeight: '1.2'}}>
                      🔥 Редкие<br/>NFT
                    </div>
                  </div>
                </div>
                
                {/* Scroll indicators */}
                <div style={{
                  display: 'flex',
                  justifyContent: 'center',
                  gap: '8px',
                  marginTop: '12px'
                }}>
                  {[0, 1, 2, 3].map((index) => (
                    <div
                      key={index}
                      onClick={() => scrollToSlide(index)}
                      style={{
                        width: currentSlide === index ? '20px' : '8px',
                        height: '8px',
                        borderRadius: '4px',
                        background: currentSlide === index ? 'var(--brand)' : 'var(--muted)',
                        opacity: currentSlide === index ? 1 : 0.3,
                        cursor: 'pointer',
                        transition: 'all 0.3s ease',
                        transform: currentSlide === index ? 'scale(1.1)' : 'scale(1)'
                      }}
                      onMouseEnter={(e) => {
                        if (currentSlide !== index) {
                          e.target.style.opacity = '0.6'
                          e.target.style.transform = 'scale(1.05)'
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (currentSlide !== index) {
                          e.target.style.opacity = '0.3'
                          e.target.style.transform = 'scale(1)'
                        }
                      }}
                    />
                  ))}
                </div>
              </div>

              {/* Recent Activity */}
              <div style={{
                background: 'var(--card)',
                borderRadius: '16px',
                padding: '20px',
                border: '1px solid var(--border)'
              }}>
                <div style={{
                  fontSize: '16px',
                  fontWeight: '600',
                  color: 'var(--text)',
                  marginBottom: '16px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}>
                  🔥 Последняя активность
                </div>
                
                <div style={{display: 'flex', flexDirection: 'column', gap: '12px'}}>
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    padding: '12px',
                    background: 'rgba(var(--brand-rgb), 0.03)',
                    borderRadius: '12px'
                  }}>
                    <div style={{
                      width: '32px',
                      height: '32px',
                      borderRadius: '8px',
                      background: 'linear-gradient(45deg, #667eea 0%, #764ba2 100%)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '14px'
                    }}>🎨</div>
                    <div style={{flex: 1}}>
                      <div style={{fontSize: '14px', fontWeight: '600', color: 'var(--text)'}}>
                        Получен редкий NFT "Cosmic Cat"
                      </div>
                      <div style={{fontSize: '12px', color: 'var(--muted)'}}>
                        2 часа назад
                      </div>
                    </div>
                  </div>
                  
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    padding: '12px',
                    background: 'rgba(40, 167, 69, 0.03)',
                    borderRadius: '12px'
                  }}>
                    <div style={{
                      width: '32px',
                      height: '32px',
                      borderRadius: '8px',
                      background: 'linear-gradient(45deg, #56ab2f 0%, #a8e6cf 100%)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '14px'
                    }}>🚀</div>
                    <div style={{flex: 1}}>
                      <div style={{fontSize: '14px', fontWeight: '600', color: 'var(--text)'}}>
                        Отправлен NFT @username123
                      </div>
                      <div style={{fontSize: '12px', color: 'var(--muted)'}}>
                        1 день назад
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(2, 1fr)',
            gap: '12px',
            marginBottom: '20px'
          }}>
            <a 
              href="/collection" 
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                padding: '16px',
                background: 'linear-gradient(135deg, var(--brand) 0%, rgba(var(--brand-rgb), 0.8) 100%)',
                color: 'white',
                borderRadius: '16px',
                textDecoration: 'none',
                fontWeight: '600',
                fontSize: '14px',
                transition: 'all 0.2s ease',
                border: 'none',
                boxShadow: '0 4px 16px rgba(var(--brand-rgb), 0.3)'
              }}
              onMouseEnter={(e) => {
                e.target.style.transform = 'translateY(-2px)'
                e.target.style.boxShadow = '0 6px 24px rgba(var(--brand-rgb), 0.4)'
              }}
              onMouseLeave={(e) => {
                e.target.style.transform = 'translateY(0)'
                e.target.style.boxShadow = '0 4px 16px rgba(var(--brand-rgb), 0.3)'
              }}
            >
              💎 Моя коллекция
            </a>
            
            <a 
              href="/home" 
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                padding: '16px',
                background: 'var(--card)',
                color: 'var(--text)',
                borderRadius: '16px',
                textDecoration: 'none',
                fontWeight: '600',
                fontSize: '14px',
                transition: 'all 0.2s ease',
                border: '1px solid var(--border)'
              }}
              onMouseEnter={(e) => {
                e.target.style.transform = 'translateY(-2px)'
                e.target.style.borderColor = 'var(--brand)'
              }}
              onMouseLeave={(e) => {
                e.target.style.transform = 'translateY(0)'
                e.target.style.borderColor = 'var(--border)'
              }}
            >
              🏠 Главное меню
            </a>
          </div>
        </div>
      </div>
    </>
  );
}