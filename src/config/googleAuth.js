// OAuth Client ID for jv-tracker.vercel.app domain
// This is safe to expose as it's public by design and domain-restricted
export const GOOGLE_OAUTH_CLIENT_ID = '523179457081-gk0dlj4kr79tjv4md8fqph2o25fhid83.apps.googleusercontent.com';

// 🔧 SETUP REQUIRED: Replace the above with your actual OAuth Client ID
// 
// To get your OAuth Client ID:
// 1. Go to https://console.cloud.google.com
// 2. Select or create a project
// 3. Go to "APIs & Services" → "Credentials"
// 4. Click "Create Credentials" → "OAuth client ID"
// 5. Choose "Web application"
// 6. Add your domain to "Authorized JavaScript origins":
//    - For local development: http://localhost:3000
//    - For production: https://jv-tracker.vercel.app (or your domain)
// 7. Copy the Client ID and replace the placeholder above
//
// ✅ Benefits of hard-coding OAuth Client ID:
// - Users don't need to create their own OAuth apps
// - Simplified setup process (only need Google Sheets API key)
// - Better user experience
// - Domain-restricted security (only works on your configured domains)

export const isOAuthConfigured = () => {
  return GOOGLE_OAUTH_CLIENT_ID && !GOOGLE_OAUTH_CLIENT_ID.includes('123456789012');
};