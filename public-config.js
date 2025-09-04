// Public Access Configuration
// Update this file when you get your ngrok URLs

window.PUBLIC_CONFIG = {
  // Local development
  API_URL: 'http://localhost:5001',
  
  // For public access, replace with your ngrok backend URL:
  // API_URL: 'https://your-backend-url.ngrok.io',
  
  ENVIRONMENT: 'development'
};

// Helper function to get API URL
window.getApiUrl = function() {
  return window.PUBLIC_CONFIG.API_URL;
};
