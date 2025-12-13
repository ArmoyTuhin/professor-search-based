/**
 * Central API Configuration
 * 
 * This is the ONLY place you need to update when your ngrok URL changes.
 * 
 * For GitHub Pages deployment:
 * 1. Update BACKEND_URL below with your current ngrok URL
 * 2. Rebuild and deploy: npm run build
 * 3. Push to GitHub Pages
 * 
 * For local development:
 * - Uses '/api' proxy (configured in vite.config.js)
 * - Or set BACKEND_URL to your ngrok URL for testing
 */

// ============================================
// BACKEND URL CONFIGURATION
// ============================================
// STEP 1: Start ngrok: ngrok http 9787
// STEP 2: Copy the HTTPS URL from ngrok (e.g., https://abc123.ngrok-free.app)
// STEP 3: Paste it below (without /api at the end)
// 
// Example: export const BACKEND_URL = 'https://abc123.ngrok-free.app'
export const BACKEND_URL = 'https://your-ngrok-url.ngrok.io'

// ============================================
// DO NOT MODIFY BELOW THIS LINE
// ============================================

// Determine the API base URL based on environment
export const getApiBaseUrl = () => {
  // In development, check if we want to use ngrok or proxy
  if (import.meta.env.DEV) {
    // Option 1: Use Vite proxy (for local backend without ngrok)
    // return '/api'
    
    // Option 2: Use ngrok URL (for testing with ngrok)
    return BACKEND_URL + '/api'
  }
  
  // In production (GitHub Pages), always use the configured BACKEND_URL
  return BACKEND_URL + '/api'
}

// Export the API base URL
export const API_BASE_URL = getApiBaseUrl()

// Helper to check if backend URL is configured
export const isBackendConfigured = () => {
  return BACKEND_URL !== 'https://your-ngrok-url.ngrok.io' && 
         BACKEND_URL !== '' && 
         !BACKEND_URL.includes('your-ngrok-url')
}

