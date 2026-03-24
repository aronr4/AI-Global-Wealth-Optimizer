import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'

import { GoogleOAuthProvider } from '@react-oauth/google';

// Use a placeholder client ID if you don't have one perfectly matched right now
const GOOGLE_CLIENT_ID = "333246377708-3f5qj1k5ls4dksd7123p8f3g1aflr9v7.apps.googleusercontent.com"; // Placeholder or generic

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
      <App />
    </GoogleOAuthProvider>
  </StrictMode>
)
