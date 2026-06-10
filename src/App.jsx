import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import { AuthProvider } from './contexts/AuthContext'
import JoinPage from './pages/JoinPage'
import TripPage from './pages/TripPage'
import HistoryPage from './pages/HistoryPage'
import NotFoundPage from './pages/NotFoundPage'

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Toaster
          position="top-center"
          toastOptions={{
            style: {
              background: '#0D1A2A',
              color:      '#E0F0FF',
              border:     '1px solid #1A3A5C',
              fontFamily: 'Inter, system-ui, sans-serif',
              fontSize:   13,
              fontWeight: 500,
            },
            success: { iconTheme: { primary: '#00FF88', secondary: '#080C14' } },
            error:   { iconTheme: { primary: '#FF4D6D', secondary: '#080C14' } },
          }}
        />
        <Routes>
          <Route path="/"               element={<JoinPage />} />
          <Route path="/join"           element={<JoinPage />} />
          <Route path="/history"        element={<HistoryPage />} />
          <Route path="/trip/:tripCode" element={<TripPage />} />
          <Route path="*"               element={<NotFoundPage />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}
