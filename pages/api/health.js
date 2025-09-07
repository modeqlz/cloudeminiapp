// Health check endpoint to force redeploy
export default function handler(req, res) {
  res.status(200).json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    build: 'vercel-fix-2024-01-16' 
  });
}