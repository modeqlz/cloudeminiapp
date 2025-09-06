export default function LoadingCard() {
  return (
    <div className="loading-container">
      <div className="loading-card">
        <div className="loading-avatar"></div>
        <div className="loading-text">
          <div className="loading-line loading-line-name"></div>
          <div className="loading-line loading-line-username"></div>
        </div>
      </div>
      <div className="loading-message">Loading your profile...</div>
    </div>
  )
}