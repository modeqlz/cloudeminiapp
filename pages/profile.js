import { useEffect, useState } from 'react'
import { useRouter } from 'next/router'

export default function Profile() {
  const [user, setUser] = useState(null)
  const router = useRouter()

  useEffect(() => {
    const userData = localStorage.getItem('telegramUser')
    if (userData) {
      setUser(JSON.parse(userData))
    } else {
      router.push('/')
    }
  }, [])

  if (!user) {
    return <div>Loading...</div>
  }

  return (
    <div className="container">
      <div className="profile-header">
        <img 
          src={user.photo_url || '/placeholder.png'} 
          alt="User" 
          className="profile-avatar" 
        />
        <h1 className="profile-name">{user.first_name} {user.last_name}</h1>
        <p className="profile-username">@{user.username || 'unknown'}</p>
        <p className="profile-id">ID: {user.id}</p>
      </div>

      <div className="profile-stats">
        <div className="stat-card">
          <h3>Inventory Value</h3>
          <p className="stat-value">$1,234.56</p>
        </div>
        <div className="stat-card">
          <h3>Total Trades</h3>
          <p className="stat-value">13</p>
        </div>
        <div className="stat-card">
          <h3>Items Owned</h3>
          <p className="stat-value">42</p>
        </div>
      </div>

      <button 
        className="back-button" 
        onClick={() => router.push('/home')}
      >
        Back to Home
      </button>
    </div>
  )
}