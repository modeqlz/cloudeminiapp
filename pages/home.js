import { useEffect, useState } from 'react'
import { useRouter } from 'next/router'

export default function Home() {
  const [user, setUser] = useState(null)
  const [isSearchOpen, setIsSearchOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState([])
  const [isSearching, setIsSearching] = useState(false)
  const router = useRouter()

  useEffect(() => {
    const userData = localStorage.getItem('telegramUser')
    if (userData) {
      setUser(JSON.parse(userData))
    } else {
      router.push('/')
    }
  }, [])

  const openSearchModal = () => {
    setIsSearchOpen(true)
    setSearchQuery('')
    setSearchResults([])
  }

  const closeSearchModal = () => {
    setIsSearchOpen(false)
    setSearchQuery('')
    setSearchResults([])
  }

  const performSearch = async (query) => {
    if (!query.trim()) {
      setSearchResults([])
      return
    }

    setIsSearching(true)
    try {
      const response = await fetch(`/api/searchUsersDB?q=${encodeURIComponent(query)}`)
      const data = await response.json()
      
      if (data.success) {
        setSearchResults(data.users || [])
      } else {
        setSearchResults([])
      }
    } catch (error) {
      console.error('Search error:', error)
      setSearchResults([])
    } finally {
      setIsSearching(false)
    }
  }

  const handleSearchChange = (e) => {
    const query = e.target.value
    setSearchQuery(query)
    performSearch(query)
  }

  if (!user) {
    return <div>Loading...</div>
  }

  return (
    <div className="container">
      <div className="hero">
        <div className="user-info">
          <img 
            src={user.photo_url || '/placeholder.png'} 
            alt="User" 
            className="user-avatar" 
          />
          <div className="user-details">
            <h1 className="user-name">{user.first_name} {user.last_name}</h1>
            <p className="user-username">@{user.username || 'unknown'}</p>
          </div>
        </div>
      </div>

      <div className="stats">
        <div className="stat-item">
          <div className="stat-value">42</div>
          <div className="stat-label">Skins</div>
        </div>
        <div className="stat-item">
          <div className="stat-value">13</div>
          <div className="stat-label">Trades</div>
        </div>
        <div className="stat-item">
          <div className="stat-value">$1,234</div>
          <div className="stat-label">Value</div>
        </div>
      </div>

      <div className="tiles">
        <div className="tile tile-large">
          <div className="tile-content">
            <img src="/placeholder.png" alt="Skin" className="skin-preview" />
            <div className="skin-info">
              <h3 className="skin-name">AK-47 | Redline</h3>
              <p className="skin-condition">Field-Tested</p>
              <p className="skin-price">$24.50</p>
            </div>
          </div>
        </div>
        
        <div className="tile tile-search" onClick={openSearchModal}>
          <div className="tile-icon">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M21 21L16.514 16.506L21 21ZM19 10.5C19 15.194 15.194 19 10.5 19C5.806 19 2 15.194 2 10.5C2 5.806 5.806 2 10.5 2C15.194 2 19 5.806 19 10.5Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          <h3 className="tile-title">Search People</h3>
          <p className="tile-subtitle">Find users by @username</p>
        </div>
        
        <div className="tile">
          <div className="tile-icon">
            <img src="/plane.svg" alt="Send" width="24" height="24" />
          </div>
          <h3 className="tile-title">Send Gift</h3>
          <p className="tile-subtitle">Share items with friends</p>
        </div>
        
        <div className="tile" onClick={() => router.push('/profile')}>
          <div className="tile-icon">👤</div>
          <h3 className="tile-title">Profile</h3>
          <p className="tile-subtitle">View your stats</p>
        </div>
      </div>

      {/* Search Modal */}
      {isSearchOpen && (
        <div className="modal-overlay" onClick={closeSearchModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Search People</h2>
              <button className="modal-close" onClick={closeSearchModal}>
                ×
              </button>
            </div>
            
            <div className="search-container">
              <input
                type="text"
                className="search-input"
                placeholder="Enter @username..."
                value={searchQuery}
                onChange={handleSearchChange}
                autoFocus
              />
            </div>
            
            <div className="search-results">
              {isSearching && (
                <div className="search-loading">
                  Searching...
                </div>
              )}
              
              {!isSearching && searchQuery && searchResults.length === 0 && (
                <div className="search-empty">
                  No users found for "{searchQuery}"
                </div>
              )}
              
              {!isSearching && searchResults.length > 0 && (
                <div className="user-list">
                  {searchResults.map((resultUser, index) => (
                    <div key={index} className="user-row">
                      <img 
                        src={resultUser.avatar_url || '/placeholder.png'} 
                        alt={resultUser.name} 
                        className="user-avatar"
                      />
                      <div className="user-info">
                        <div className="user-name">
                          {resultUser.name}
                          {resultUser.verified && (
                            <span className="verified-badge">✓</span>
                          )}
                        </div>
                        <div className="user-username">@{resultUser.username}</div>
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
  )
}